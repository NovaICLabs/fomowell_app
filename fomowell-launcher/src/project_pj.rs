use crate::commons::LinkedHashMap;
use candid::{CandidType, Decode, Deserialize, Encode, Nat, Principal};
use ic_stable_structures::{BoundedStorable, Storable};
use std::borrow::Cow;
use std::collections::{HashMap, LinkedList};

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct FomoProjectCreate {
    pub name: String,
    pub ticker: String,
    pub description: String,
    pub img_url: String,
    // For token logo
    pub logo: String,

    //social
    pub twitter_link: String,
    pub telegram_link: String,
    pub website: String,

    pub sneed_dao_lock: Option<Nat>,
    pub dogmi_dao_lock: Option<Nat>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct FomoProjectOld {
    pub fomo_idx: u64,
    pub name: String,
    pub ticker: String,
    pub description: String,
    pub img_url: String,

    //social
    pub twitter_link: String,
    pub telegram_link: String,
    pub website: String,

    pub token_pid: Principal,
    pub pool_pid: Principal,
    pub fomo_pid: Principal,

    //decimals:4
    pub pool_progress: Nat,
    pub god_of_wells_progress: Nat,
    //usdt decimals:18
    pub market_cap: Nat,

    pub create_time: u64,
    pub create_user_pid: Principal,

    pub reply_count: u64,
    pub recently_reply_time: u64,
    pub recently_bump_time: u64,
}
#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct FomoProject {
    pub fomo_idx: u64,
    pub name: String,
    pub ticker: String,
    pub description: String,
    pub img_url: String,

    //social
    pub twitter_link: String,
    pub telegram_link: String,
    pub website: String,

    pub token_pid: Principal,
    pub pool_pid: Principal,
    pub fomo_pid: Principal,

    //decimals:4
    pub pool_progress: Nat,
    pub pool_progress_done_time: Option<u64>,
    pub god_of_wells_progress: Nat,
    pub god_of_wells_time: Option<u64>,
    //usdt decimals:18
    pub market_cap: Nat,

    pub create_time: u64,
    pub create_user_pid: Principal,

    pub reply_count: u64,
    pub recently_reply_time: u64,
    pub recently_bump_time: u64,

    pub sneed_dao_lock: Option<Nat>,
    pub dogmi_dao_lock: Option<Nat>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct PointHistory {
    pub time: u64,
    pub idx: u64,
    pub user_pid: Principal,
    //add,deduct
    pub op_type: String,
    pub busi_name: String,
    pub amount: Option<Nat>,
}

impl BoundedStorable for PointHistory {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for PointHistory {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

impl FomoProject {
    // Convert FomoProject to HashMap<String, String>
    pub fn to_hashmap(&self) -> HashMap<String, String> {
        let mut hashmap = HashMap::new();
        hashmap.insert(String::from("fomo_idx"), self.fomo_idx.to_string());
        hashmap.insert(String::from("name"), self.name.clone());
        hashmap.insert(String::from("ticker"), self.ticker.clone());
        hashmap.insert(String::from("description"), self.description.clone());
        hashmap.insert(String::from("img_url"), self.img_url.clone());
        hashmap.insert(String::from("twitter_link"), self.twitter_link.clone());
        hashmap.insert(String::from("telegram_link"), self.telegram_link.clone());
        hashmap.insert(String::from("website"), self.website.clone());
        hashmap.insert(String::from("token_pid"), self.token_pid.to_string());
        hashmap.insert(String::from("pool_pid"), self.pool_pid.to_string());
        hashmap.insert(String::from("fomo_pid"), self.fomo_pid.to_string());
        hashmap.insert(
            String::from("pool_progress"),
            self.pool_progress.to_string(),
        );
        hashmap.insert(
            String::from("god_of_wells_progress"),
            self.god_of_wells_progress.to_string(),
        );
        hashmap.insert(String::from("create_time"), self.create_time.to_string());
        hashmap.insert(
            String::from("create_user_pid"),
            self.create_user_pid.to_string(),
        );
        hashmap.insert(String::from("market_cap"), self.market_cap.to_string());
        hashmap
    }
}

const MAX_VALUE_SIZE: u32 = 4096;

impl BoundedStorable for FomoProject {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for FomoProject {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}
