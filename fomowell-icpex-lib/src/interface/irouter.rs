use crate::ic_utils;
use crate::interface::itoken::AddrConfig;
use crate::types::common_types::PrincipalSet;
use crate::types::pool::{PoolInfo, UnlockableInfo, UserLpInfo};
use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::call::CallResult;
use std::collections::LinkedList;

// backend interface
#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct IRouter {
    pub cid: Principal,
}
impl IRouter {
    pub async fn getPoolsInfo(caller_addr: Principal) -> CallResult<(Vec<PoolInfo>,)> {
        ic_cdk::call(get_cid(), "getPoolsInfo", (caller_addr,)).await
    }

    pub async fn getPoolInfo(
        pool_addr: Principal,
        query_user: Principal,
    ) -> CallResult<(PoolInfo,)> {
        ic_cdk::call(get_cid(), "getPoolInfo", (pool_addr, query_user)).await
    }

    pub async fn get_user_lp(user_pid: Principal) -> CallResult<(UserLpInfo,)> {
        ic_cdk::call(get_cid(), "get_user_lp", (user_pid,)).await
    }

    pub async fn get_unlockable_lock_info() -> CallResult<(LinkedList<UnlockableInfo>,)> {
        ic_cdk::call(get_cid(), "get_unlockable_lock_info", ()).await
    }

    pub async fn getSubAccountToken(caller_addr: Principal) -> CallResult<(Vec<PoolInfo>,)> {
        ic_cdk::call(get_cid(), "getSubAccountToken", (caller_addr,)).await
    }

    pub async fn createCommonPool(
        base_token: Principal,
        quote_token: Principal,
        base_in_amount: Nat,
        quote_in_amount: Nat,
        fee_rate: Nat,
        i: Nat,
        k: Nat,
        deadline: u64,
        relinquish_on: Option<bool>,
    ) -> CallResult<(Result<(Principal, Nat), String>,)> {
        ic_cdk::call(
            get_cid(),
            "createCommonPool",
            (
                base_token,
                quote_token,
                base_in_amount,
                quote_in_amount,
                fee_rate,
                i,
                k,
                deadline,
                relinquish_on,
            ),
        )
        .await
    }
}

pub fn get_cid() -> Principal {
    ic_utils::get::<AddrConfig>().router_addr
}
