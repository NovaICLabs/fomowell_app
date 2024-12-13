use candid::{candid_method, CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::call::CallResult;
use ic_cdk::{call, id, print};
use ic_cdk_macros::*;
use std::collections::LinkedList;
use std::fmt::format;

use icpex_lib::ic_utils::{nat_18, new_zero, throw};
use icpex_lib::interface::irouter::IRouter;
use icpex_lib::interface::itoken::{AddrConfig, IToken};
use icpex_lib::interface::itx::add_token_tx;
use icpex_lib::token::dip20::DIP20;
use icpex_lib::types::common_types::{Metadata, Operation, TransactionStatus, TxReceipt};
use icpex_lib::types::pool::{InnerPoolInfo, PoolInfo, UnlockableInfo, UserLpInfo};
use icpex_lib::{ic_utils, pmm};

#[init]
#[candid_method(init)]
fn init(creator: Principal, master: Principal, backend_addr: Principal) {
    let p = ic_utils::get_mut::<InnerPoolInfo>();
    p.creator = creator;
    p.master = master;
    let addr_config = ic_utils::get_mut::<AddrConfig>();
    addr_config.router_addr = master;
    addr_config.backend_addr = backend_addr;
}

#[update(name = "transfer")]
#[candid_method(update, rename = "transfer")]
async fn transfer(token: Principal, to: Principal, amount: Nat) {
    let p = ic_utils::get_mut::<InnerPoolInfo>();
    assert_eq!(ic_cdk::caller().clone(), p.master, "Not Master");
    throw(
        IToken { cid: token }
            .transfer(to, amount, count_meno())
            .await
            .map_err(|e| e.1),
    );
}

#[query(composite = true)]
#[candid_method(query)]
async fn pool_info() -> PoolInfo {
    return IRouter::getPoolInfo(id().clone(), ic_cdk::caller().clone())
        .await
        .unwrap()
        .0;
}

#[query(composite = true)]
#[candid_method(query)]
async fn get_user_lp_info(user_pid: Principal) -> UserLpInfo {
    return IRouter::get_user_lp(user_pid.clone()).await.unwrap().0;
}

#[query(composite = true)]
#[candid_method(query)]
async fn get_unlockable_lock_info() -> LinkedList<UnlockableInfo> {
    return IRouter::get_unlockable_lock_info().await.unwrap().0;
}

#[query(name = "cycles")]
#[candid_method(query, rename = "cycles")]
fn cycles() -> u64 {
    ic_utils::balance()
}

#[cfg(any(target_arch = "wasm32", test))]
fn main() {}

#[cfg(not(any(target_arch = "wasm32", test)))]
fn main() {
    candid::export_service!();
    std::print!("{}", __export_service());
}

#[update(name = "retrieve")]
#[candid_method(update, rename = "retrieve")]
async fn retrieve(token: Principal, amount: Nat, to: Principal) {
    let p = ic_utils::get_mut::<InnerPoolInfo>();
    assert_eq!(ic_cdk::caller().clone(), p.master, "Not Master");
    let itoken = IToken { cid: token };
    let input_amount = itoken.getAmountWithoutFee(amount).await.unwrap();
    throw(
        itoken
            .transfer(to, input_amount, count_meno())
            .await
            .map_err(|e| e.1),
    );
}

#[derive(CandidType, Deserialize, Default)]
struct CounterState {
    count: u16,
}

#[update]
fn count_meno() -> String {
    let state: &mut CounterState = ic_utils::get_mut::<CounterState>();
    if state.count >= 999u16 {
        state.count = 0;
        return format!("{}:{}", "p".to_string(), state.count.to_string());
    }
    state.count += 1;
    return format!("{}:{}", "p".to_string(), state.count.to_string());
}
