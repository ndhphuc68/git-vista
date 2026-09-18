#![allow(dead_code)]

use git2::{Commit, IndexAddOption, Oid, Repository, Signature};
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use tempfile::TempDir;

/// Tạo signature chuẩn cho test commits
pub fn test_signature() -> Signature<'static> {
    Signature::now("Tester", "tester@visualgit.dev").expect("Failed to create signature")
}

/// Tạo một commit đơn giản với message và các file hiện tại trong index
pub fn commit_index<'a>(
    repo: &'a Repository,
    message: &str,
    parents: &[&Commit<'a>],
) -> Result<Oid, git2::Error> {
    let mut index = repo.index()?;
    let tree_oid = index.write_tree()?;
    let tree = repo.find_tree(tree_oid)?;
    let sig = test_signature();

    repo.commit(Some("HEAD"), &sig, &sig, message, &tree, parents)
}

pub struct TestRepoFixture {
    pub dir: TempDir,
    pub repo: Repository,
}

impl TestRepoFixture {
    pub fn new() -> Self {
        let (dir, repo) = create_clean_repo().expect("Failed to create clean repo");
        let file_path = dir.path().join("file1.txt");
        fs::write(&file_path, "initial content for file1\n").expect("Failed to write file1.txt");
        let mut index = repo.index().expect("Failed to get index");
        index
            .add_path(Path::new("file1.txt"))
            .expect("Failed to add file1.txt");
        index.write().expect("Failed to write index");
        {
            let head = repo
                .head()
                .expect("Failed to get HEAD")
                .peel_to_commit()
                .expect("Failed to peel HEAD");
            commit_index(&repo, "Add file1.txt", &[&head]).expect("Failed to commit file1.txt");
        }

        Self { dir, repo }
    }

    pub fn path(&self) -> &Path {
        self.dir.path()
    }

    pub fn repo(&self) -> &Repository {
        &self.repo
    }
}

/// 1. Tạo repo tạm sạch với 1 commit ban đầu
pub fn create_clean_repo() -> Result<(TempDir, Repository), Box<dyn std::error::Error>> {
    let dir = TempDir::new()?;
    let repo = Repository::init(dir.path())?;

    // Cấu hình git config cục bộ trong repo tạm
    let mut config = repo.config()?;
    config.set_str("user.name", "Tester")?;
    config.set_str("user.email", "tester@visualgit.dev")?;

    // Tạo file README.md
    let readme_path = dir.path().join("README.md");
    let mut file = File::create(&readme_path)?;
    writeln!(file, "# Test Repository\nKhởi tạo cho kiểm thử Visual Git.")?;

    let mut index = repo.index()?;
    index.add_all(["*"].iter(), IndexAddOption::DEFAULT, None)?;
    index.write()?;

    let _commit_oid = commit_index(&repo, "Initial commit", &[])?;

    Ok((dir, repo))
}

/// 2. Tạo repo với số lượng commit chỉ định
pub fn create_repo_with_commits(
    count: usize,
) -> Result<(TempDir, Repository), Box<dyn std::error::Error>> {
    let (dir, repo) = create_clean_repo()?;

    let mut parent_oid = {
        let head = repo.head()?;
        let commit = head.peel_to_commit()?;
        commit.id()
    };

    for i in 1..count {
        let file_name = format!("file_{}.txt", i);
        let file_path = dir.path().join(&file_name);
        fs::write(&file_path, format!("Nội dung file số {}", i))?;

        let mut index = repo.index()?;
        index.add_path(Path::new(&file_name))?;
        index.write()?;

        let commit_oid = {
            let parent_commit = repo.find_commit(parent_oid)?;
            commit_index(
                &repo,
                &format!("Commit #{} - Thêm {}", i, file_name),
                &[&parent_commit],
            )?
        };

        parent_oid = commit_oid;
    }

    Ok((dir, repo))
}

/// 3. Tạo repo có MERGE CONFLICT thật
pub fn create_conflict_repo() -> Result<(TempDir, Repository), Box<dyn std::error::Error>> {
    let (dir, repo) = create_clean_repo()?;

    // File chung sẽ bị conflict
    let target_file = dir.path().join("conflict.txt");
    fs::write(&target_file, "Dòng 1: gốc\nDòng 2: gốc\nDòng 3: gốc\n")?;

    let base_oid = {
        let mut index = repo.index()?;
        index.add_path(Path::new("conflict.txt"))?;
        index.write()?;
        let head = repo.head()?;
        let head_commit = head.peel_to_commit()?;
        commit_index(&repo, "Base version conflict.txt", &[&head_commit])?
    };

    // Tạo nhánh 'feature-branch' từ base_commit
    {
        let base_commit = repo.find_commit(base_oid)?;
        repo.branch("feature-branch", &base_commit, false)?;
    }

    // Trên nhánh feature: sửa dòng 2
    repo.set_head("refs/heads/feature-branch")?;
    repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))?;
    fs::write(
        &target_file,
        "Dòng 1: gốc\nDòng 2: sửa bởi nhánh FEATURE\nDòng 3: gốc\n",
    )?;

    {
        let mut index = repo.index()?;
        index.add_path(Path::new("conflict.txt"))?;
        index.write()?;
        let feature_head = repo.head()?.peel_to_commit()?;
        let _ = commit_index(&repo, "Feature modification", &[&feature_head])?;
    }

    // Quay lại nhánh main/master: sửa dòng 2 khác đi
    repo.set_head("refs/heads/master")
        .or_else(|_| repo.set_head("refs/heads/main"))?;
    repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))?;
    fs::write(
        &target_file,
        "Dòng 1: gốc\nDòng 2: sửa bởi nhánh MAIN\nDòng 3: gốc\n",
    )?;

    {
        let mut index = repo.index()?;
        index.add_path(Path::new("conflict.txt"))?;
        index.write()?;
        let main_head = repo.head()?.peel_to_commit()?;
        let _ = commit_index(&repo, "Main modification", &[&main_head])?;
    }

    // Tiến hành merge feature-branch vào main -> gây ra conflict!
    {
        let feature_branch = repo.find_branch("feature-branch", git2::BranchType::Local)?;
        let feature_target = feature_branch.get().target().unwrap();
        let annotated = repo.find_annotated_commit(feature_target)?;
        repo.merge(&[&annotated], None, None)?;
    }

    Ok((dir, repo))
}

/// 4. Tạo repo ở trạng thái DETACHED HEAD
pub fn create_detached_head_repo() -> Result<(TempDir, Repository), Box<dyn std::error::Error>> {
    let (dir, repo) = create_clean_repo()?;

    // Tạo thêm 1 commit
    let file_path = dir.path().join("detached_test.txt");
    fs::write(&file_path, "Detached test")?;

    let commit_oid = {
        let mut index = repo.index()?;
        index.add_path(Path::new("detached_test.txt"))?;
        index.write()?;
        let initial_head = repo.head()?.peel_to_commit()?;
        commit_index(&repo, "Second commit", &[&initial_head])?
    };

    // Detach HEAD về commit ban đầu
    repo.set_head_detached(commit_oid)?;

    Ok((dir, repo))
}
