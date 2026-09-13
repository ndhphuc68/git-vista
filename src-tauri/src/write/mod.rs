//! Module `write`: Thực hiện thay đổi trạng thái repo qua libgit2 (commit, branch, stash).
//! Luôn tạo ref backup trước các thao tác rủi ro theo mục 6.4 trong đặc tả.

pub mod backup;
pub mod branch;
pub mod commit;
pub mod conflict;
pub mod staging;
pub mod stash;

pub use backup::*;
pub use conflict::*;

