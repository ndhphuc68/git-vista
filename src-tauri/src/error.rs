use serde::{Deserialize, Serialize};
use specta::Type;
use thiserror::Error;

#[derive(Debug, Error, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    #[error("Git error: {0}")]
    Git(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Command execution failed ({code}): {stderr}")]
    CommandFailed { code: i32, stderr: String },

    #[error("Invalid operation: {0}")]
    InvalidOperation(String),
}

impl From<git2::Error> for AppError {
    fn from(err: git2::Error) -> Self {
        AppError::Git(err.message().to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}
