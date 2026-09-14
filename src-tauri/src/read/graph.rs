use crate::error::AppError;
use git2::{Oid, Repository, Sort};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::path::Path;

const NUM_COLORS: usize = 6;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphEdge {
    pub from_col: u32,
    pub to_col: u32,
    pub edge_type: String, // "straight", "fork", "merge"
    pub color_index: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RefBadge {
    pub name: String,
    pub ref_type: String, // "head", "local", "remote", "tag"
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphCommitNode {
    pub id: String,
    pub short_id: String,
    pub summary: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp_sec: f64,
    pub parent_ids: Vec<String>,
    pub col: u32,
    pub color_index: u32,
    pub lines: Vec<GraphEdge>,
    pub refs: Vec<RefBadge>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommitGraphPage {
    pub commits: Vec<GraphCommitNode>,
    pub has_more: bool,
    pub total_count: u32,
}

pub fn get_repo_commit_graph<P: AsRef<Path>>(
    repo_path: P,
    offset: u32,
    limit: u32,
) -> Result<CommitGraphPage, AppError> {
    let offset = offset as usize;
    let limit = limit as usize;
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.is_empty()? {
        return Ok(CommitGraphPage {
            commits: Vec::new(),
            has_more: false,
            total_count: 0,
        });
    }

    // Collect references for badge display
    let mut ref_map: HashMap<Oid, Vec<RefBadge>> = HashMap::new();
    if let Ok(references) = repo.references() {
        for r_res in references.flatten() {
            if let Some(target) = r_res.target() {
                let shorthand = r_res.shorthand().unwrap_or("").to_string();
                let ref_type = if r_res.is_tag() {
                    "tag"
                } else if r_res.is_remote() {
                    "remote"
                } else {
                    "local"
                };
                ref_map.entry(target).or_default().push(RefBadge {
                    name: shorthand,
                    ref_type: ref_type.to_string(),
                });
            }
        }
    }

    let mut revwalk = repo.revwalk()?;
    revwalk.set_sorting(Sort::TOPOLOGICAL | Sort::TIME)?;
    let _ = revwalk.push_head();
    let _ = revwalk.push_glob("refs/heads/*");
    let _ = revwalk.push_glob("refs/remotes/*");

    let all_oids: Vec<Oid> = revwalk.filter_map(|r| r.ok()).collect();
    let total_count = all_oids.len();

    let end = (offset + limit).min(total_count);
    let mut page_commits = Vec::with_capacity(if offset < total_count { end - offset } else { 0 });
    let mut active_lanes: Vec<Option<Oid>> = Vec::new();

    for (idx, oid) in all_oids.iter().enumerate() {
        if idx >= end {
            break;
        }

        let commit = repo.find_commit(*oid)?;
        let parent_oids: Vec<Oid> = commit.parent_ids().collect();

        // 1. Assign column for this commit
        let col = match active_lanes.iter().position(|slot| slot.as_ref() == Some(oid)) {
            Some(idx) => idx,
            None => match active_lanes.iter().position(|slot| slot.is_none()) {
                Some(idx) => {
                    active_lanes[idx] = Some(*oid);
                    idx
                }
                None => {
                    active_lanes.push(Some(*oid));
                    active_lanes.len() - 1
                }
            },
        };

        let color_index = col % NUM_COLORS;
        let mut edges = Vec::new();

        // 2. Converge other lanes that track this commit (merges / branch convergence)
        for (j, slot) in active_lanes.iter_mut().enumerate() {
            if j != col && slot.as_ref() == Some(oid) {
                if idx >= offset {
                    edges.push(GraphEdge {
                        from_col: j as u32,
                        to_col: col as u32,
                        edge_type: "merge".to_string(),
                        color_index: (j % NUM_COLORS) as u32,
                    });
                }
                *slot = None;
            }
        }

        // 3. Pass-through lines from earlier lanes
        if idx >= offset {
            for (i, slot) in active_lanes.iter().enumerate() {
                if i != col && slot.is_some() {
                    edges.push(GraphEdge {
                        from_col: i as u32,
                        to_col: i as u32,
                        edge_type: "straight".to_string(),
                        color_index: (i % NUM_COLORS) as u32,
                    });
                }
            }
        }

        // Connect to parents
        if let Some(first_parent) = parent_oids.first() {
            active_lanes[col] = Some(*first_parent);
            if idx >= offset {
                edges.push(GraphEdge {
                    from_col: col as u32,
                    to_col: col as u32,
                    edge_type: "straight".to_string(),
                    color_index: color_index as u32,
                });
            }

            // Extra merge parents
            for extra_parent in parent_oids.iter().skip(1) {
                let to_col = match active_lanes.iter().position(|s| s.as_ref() == Some(extra_parent)) {
                    Some(slot_idx) => slot_idx,
                    None => match active_lanes.iter().position(|s| s.is_none()) {
                        Some(slot_idx) => {
                            active_lanes[slot_idx] = Some(*extra_parent);
                            slot_idx
                        }
                        None => {
                            active_lanes.push(Some(*extra_parent));
                            active_lanes.len() - 1
                        }
                    },
                };
                if idx >= offset {
                    edges.push(GraphEdge {
                        from_col: col as u32,
                        to_col: to_col as u32,
                        edge_type: "fork".to_string(),
                        color_index: (to_col % NUM_COLORS) as u32,
                    });
                }
            }
        } else {
            // Root commit (no parents)
            active_lanes[col] = None;
        }

        // Clean trailing Nones
        while let Some(None) = active_lanes.last() {
            active_lanes.pop();
        }

        // Only instantiate full commit metadata for requested slice
        if idx >= offset {
            let summary = commit
                .summary()
                .ok()
                .flatten()
                .unwrap_or("No message")
                .to_string();
            let author = commit.author();
            let author_name = author.name().unwrap_or("Unknown").to_string();
            let author_email = author.email().unwrap_or("").to_string();
            let timestamp_sec = commit.time().seconds() as f64;
            let parent_ids: Vec<String> = parent_oids.iter().map(|p| p.to_string()).collect();

            let badges = ref_map.remove(oid).unwrap_or_default();
            let hex = oid.to_string();
            let short_id = hex.chars().take(7).collect();

            page_commits.push(GraphCommitNode {
                id: hex,
                short_id,
                summary,
                author_name,
                author_email,
                timestamp_sec,
                parent_ids,
                col: col as u32,
                color_index: color_index as u32,
                lines: edges,
                refs: badges,
            });
        }
    }

    let commits = page_commits;
    let has_more = end < total_count;

    Ok(CommitGraphPage {
        commits,
        has_more,
        total_count: total_count as u32,
    })
}

