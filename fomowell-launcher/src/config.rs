#[cfg(feature = "local")]
pub const ENV: &str = "local";
#[cfg(feature = "test")]
pub const ENV: &str = "test";
#[cfg(feature = "prod")]
pub const ENV: &str = "prod";
