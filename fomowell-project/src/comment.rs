use candid::{CandidType, Decode, Deserialize, Encode, Nat, Principal};
use ic_stable_structures::{BoundedStorable, Storable};
use std::borrow::Cow;
use std::collections::{HashSet, LinkedList};

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct CommentsCreate {
    pub content: String,
    pub image_url: Option<String>,
    pub extended: Vec<(String, String)>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct Comments {
    pub fomo_idx: String,
    pub comment_idx: u64,
    pub user_pid: Principal,
    pub content: String,
    // User stars
    pub user_star: HashSet<Principal>,
    pub image_url: Option<String>,
    pub create_time: u64,
    pub extended: Vec<(String, String)>,
}

const MAX_VALUE_SIZE: u32 = 2048;

impl BoundedStorable for Comments {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for Comments {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}
