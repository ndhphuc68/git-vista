use crate::error::AppError;
use git2::{Oid, Repository, Sort};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::path::Path;

const NUM_COLORS: usize = 6;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GraphEdge {
    pub from_col: usize,
    pub to_col: usize,
    pub edge_type: String, // "straight", "fork", "merge"
    pub color_index: usize,
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
    pub timestamp_sec: i64,
    pub parent_ids: Vec<String>,
    pub col: usize,
    pub color_index: usize,
    pub lines: Vec<GraphEdge>,
    pub refs: Vec<RefBadge>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommitGraphPage {
    pub commits: Vec<GraphCommitNode>,
    pub has_more: bool,
    pub total_count: usize,
}

pub fn get_repo_commit_graph<P: AsRef<Path>>(
    repo_path: P,
    offset: usize,
    limit: usize,
) -> Result<CommitGraphPage, AppError> {
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
    revwalk.push_glob("refs/heads/*").or_else(|_| revwalk.push_head())?;

    let all_oids: Vec<Oid> = revwalk.filter_map(|r| r.ok()).collect();
    let total_count = all_oids.len();

    let mut active_lanes: Vec<Option<Oid>> = Vec::new();
    let mut all_nodes = Vec::with_capacity(total_count);

    for oid in &all_oids {
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

        // Pass-through lines from earlier lanes
        for (i, slot) in active_lanes.iter().enumerate() {
            if i != col && slot.is_some() {
                edges.push(GraphEdge {
                    from_col: i,
                    to_col: i,
                    edge_type: "straight".to_string(),
                    color_index: i % NUM_COLORS,
                });
            }
        }

        // Connect to parents
        if let Some(first_parent) = parent_oids.first() {
            active_lanes[col] = Some(*first_parent);
            edges.push(GraphEdge {
                from_col: col,
                to_col: col,
                edge_type: "straight".to_string(),
                color_index,
            });

            // Extra merge parents
            for extra_parent in parent_oids.iter().skip(1) {
                let to_col = match active_lanes.iter().position(|s| s.as_ref() == Some(extra_parent)) {
                    Some(idx) => idx,
                    None => match active_lanes.iter().position(|s| s.is_none()) {
                        Some(idx) => {
                            active_lanes[idx] = Some(*extra_parent);
                            idx
                        }
                        None => {
                            active_lanes.push(Some(*extra_parent));
                            active_lanes.len() - 1
                        }
                    },
                };
                edges.push(GraphEdge {
                    from_col: col,
                    to_col,
                    edge_type: "fork".to_string(),
                    color_index: to_col % NUM_COLORS,
                });
            }
        } else {
            // Root commit (no parents)
            active_lanes[col] = None;
        }

        // Clean trailing Nones
        while let Some(None) = active_lanes.last() {
            active_lanes.pop();
        }

        let summary = commit.summary().unwrap_or("No message").to_string();
        let author = commit.author();
        let author_name = author.name().unwrap_or("Unknown").to_string();
        let author_email = author.email().unwrap_or("").to_string();
        let timestamp_sec = commit.time().seconds();
        let parent_ids: Vec<String> = parent_oids.iter().map(|p| p.to_string()).collect();

        let badges = ref_map.remove(oid).unwrap_or_default();
        let hex = oid.to_string();
        let short_id = hex.chars().take(7).collect();

        all_nodes.push(GraphCommitNode {
            id: hex,
            short_id,
            summary,
            author_name,
            author_email,
            timestamp_sec,
            parent_ids,
            col,
            color_index,
            lines: edges,
            refs: badges,
        });
    }

    let end = (offset + limit).min(total_count);
    let commits = if offset < total_count {
        all_nodes[offset..end].to_vec()
    } else {
        Vec::new()
    };
    let has_more = end < total_count;

    Ok(CommitGraphPage {
        commits,
        has_more,
        total_count,
    })
}

