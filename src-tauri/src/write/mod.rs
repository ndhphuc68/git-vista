//! Module `write`: Thực hiện thay đổi trạng thái repo qua libgit2 (commit, branch, stash).
//! Luôn tạo ref backup trước các thao tác rủi ro theo mục 6.4 trong đặc tả.

pub mod backup;
pub mod branch;
pub mod commit;
pub mod config;
pub mod conflict;
pub mod discard;
pub mod staging;
pub mod stash;
pub mod tags;
pub mod undo;

pub use backup::*;
pub use config::*;
pub use conflict::*;
pub use tags::*;
pub use undo::*;
