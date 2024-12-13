use candid::{CandidType, Decode, Deserialize, Encode, Nat, Principal};
use ic_stable_structures::{BoundedStorable, Storable};
use std::borrow::Cow;

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct UserProfile {
    pub user_pid: Principal,
    pub user_name: String,
    pub avatar: String,
    pub last_change_time: u64,
    pub user_points: Option<Nat>,
    pub user_pre_reward_points: Option<Nat>,
    pub user_all_spend_points: Option<Nat>,
}

const MAX_VALUE_SIZE: u32 = 2048;

impl BoundedStorable for UserProfile {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for UserProfile {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}
