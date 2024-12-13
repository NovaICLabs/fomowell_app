use crate::ic_utils;
use crate::interface::itoken::AddrConfig;
use candid::{Nat, Principal};
use ic_cdk::api::call::CallResult;
use ic_cdk_bindgen::{Builder, Config};
use std::collections::HashMap;

pub struct IOracle {}
impl IOracle {
    pub async fn prices_batch(tokens: Vec<Principal>) -> CallResult<(HashMap<Principal, Nat>,)> {
        ic_cdk::call(get_cid(), "pricesBatch", (tokens,)).await
    }

    pub async fn market_cap_batch(
        tokens: Vec<Principal>,
    ) -> CallResult<(HashMap<Principal, Nat>,)> {
        ic_cdk::call(get_cid(), "marketCapBatch", (tokens,)).await
    }

    pub async fn refresh_and_get_icp_price(
        optToken: Option<Principal>,
    ) -> CallResult<(HashMap<Principal, Nat>, Nat, Principal)> {
        ic_cdk::call(get_cid(), "mannualRefreshAndGetPrice", (optToken,)).await
    }
}

pub fn get_cid() -> Principal {
    ic_utils::get::<AddrConfig>().oracle_addr
}
