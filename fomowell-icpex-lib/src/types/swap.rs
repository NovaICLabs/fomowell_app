use std::cell::RefCell;
use std::collections::hash_map::DefaultHasher;
use std::collections::{HashMap, VecDeque};
use std::fmt::format;
use std::hash::{Hash, Hasher};
use std::ops::{Add, Div, Mul};
use std::panic;
use std::ptr::{hash, null};
use std::time::Duration;

use candid::{
    candid_method, encode_args, CandidType, Decode, Deserialize, Encode, Int, Nat, Principal,
};
use ic_cdk::api::call::CallResult;
use ic_cdk::{caller, id, print};

use crate::ic_utils::{nat_18, nat_from, new_zero, throw};
#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct SwapOrder {
    pub swap_caller: Principal,
    pub base_from_token: Principal,
    pub base_to_token: Principal,
    pub base_from_amount: Nat,
    pub base_min_return_amount: Nat,
    pub pairs: Vec<Principal>,
    pub directions: u64,
    pub deadline: u64,
}

impl Hash for SwapOrder {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.base_from_token.hash(state);
        self.base_to_token.hash(state);
        self.base_from_amount.hash(state);
        self.base_min_return_amount.hash(state);
        self.pairs.hash(state);
        self.directions.hash(state);
        self.deadline.hash(state);
    }
}

pub fn hash_order(so: &SwapOrder) -> u64 {
    let mut hasher = DefaultHasher::new();
    so.hash(&mut hasher);
    let hash_value = hasher.finish();
    hash_value
}
