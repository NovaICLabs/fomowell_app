mod commons;
mod config;
mod project_pj;
mod user_pj;

use core::time;
use std::borrow::{Borrow, BorrowMut};
use std::cell::RefCell;
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::fmt::format;
use std::ops::{Deref, DerefMut, Div, Mul};
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;

use candid::{
    candid_method, encode_args, CandidType, Decode, Deserialize, Encode, Int, Nat, Principal,
};
use ic_cdk::api::call::{CallResult, RejectionCode};
use ic_cdk::{call, caller, id, print};
use ic_cdk_macros::*;

use bigdecimal::{BigDecimal, ToPrimitive};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext,
};
use ic_cdk::api::management_canister::main::{
    canister_status, create_canister, install_code, update_settings, CanisterIdRecord,
    CanisterInstallMode, CanisterSettings, CreateCanisterArgument, InstallCodeArgument,
    UpdateSettingsArgument,
};
use icpex_lib::types::icrc2_approve_types::{ApproveArgs, ApproveResult};
use lazy_static::lazy_static;
use std::sync::Mutex;

use crate::commons::substring;
use crate::config::ENV;
use crate::project_pj::{FomoProject, FomoProjectCreate, FomoProjectOld, PointHistory};
use crate::user_pj::UserProfile;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{
    BTreeMap, BoundedStorable, DefaultMemoryImpl, StableBTreeMap, Storable,
};
use icpex_lib::ic_utils;
use icpex_lib::ic_utils::{nat_18, nat_8, nat_from, new_zero, throw, throw_call_res};
use icpex_lib::interface::ibackend::IBackend;
use icpex_lib::interface::ioracle::IOracle;
use icpex_lib::interface::irouter::IRouter;
use icpex_lib::interface::itoken::{AddrConfig, IToken};
use icpex_lib::types::common_types::{KeyPrincipal, SwapTxRecord, TransactionStatus};
use icpex_lib::types::icrc2_type::LedgerArgument;
use icpex_lib::types::icrc_type::{Account, TransferArg, TransferResult};
use icpex_lib::types::pool::PoolInfo;
use serde_json::Value;

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static CONTEXT: Arc<Mutex<Context>> = Arc::new(Mutex::new(Context::default()));

    // The memory manager is used for simulating multiple memories. Given a `MemoryId` it can
    // return a memory that can be used by stable structures.
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static USER_PROFILE_MAP: RefCell<StableBTreeMap<KeyPrincipal, UserProfile, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    static FOMO_PROJECT_MAP: RefCell<StableBTreeMap<u64, FomoProject, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );
    static POINT_HISTORY_MAP: RefCell<StableBTreeMap<u64, PointHistory, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );
}

#[init]
#[candid_method(init)]
fn init(addrConfig: AddrConfig, icp_addr: Principal) {
    // Refresh scheduled tasks on every restart.
    CONTEXT.with(|ctx| {
        let mut ctx = ctx.lock().unwrap();
        ctx.owner = caller().clone();
        ctx.fomo_canister_template =
            include_bytes!("../../wasm/fomowell-project-opt-did.wasm.gz").to_vec();
        ctx.icp_addr = icp_addr;
        ctx.god_of_wells_idx = 1u64;
    });
    let mut config_addr = ic_utils::get_mut::<AddrConfig>();
    config_addr.tx_addr = addrConfig.tx_addr;
    config_addr.backend_addr = addrConfig.backend_addr;
    config_addr.router_addr = addrConfig.router_addr;
    config_addr.icpl_addr = addrConfig.icpl_addr;
    config_addr.oracle_addr = addrConfig.oracle_addr;
    ic_cdk_timers::set_timer_interval(Duration::from_secs(60), || ic_cdk::spawn(update_progress()));
}

#[derive(Deserialize, CandidType, Clone, Debug)]
struct Context {
    owner: Principal,
    fomo_canister_template: Vec<u8>,
    icp_addr: Principal,
    god_of_wells_idx: u64,
    // First ad slot
    last_buy_sell_op: RecordSignalVo,
    // Second ad slot
    last_create_fomo: CreateFomoSignalVo,
}

impl Default for Context {
    fn default() -> Self {
        Context {
            owner: Principal::from_text("aaaaa-aa").unwrap(),
            fomo_canister_template: Vec::new(),
            icp_addr: Principal::anonymous(),
            god_of_wells_idx: 1u64,
            last_buy_sell_op: RecordSignalVo {
                fomo_idx: 0,
                fomo_ticker: "".to_string(),
                icp_amount: new_zero(),
                buy_sell_op: "buy".to_string(),
                op_user_pid: Principal::anonymous(),
                user_name: "anonymous".to_string(),
                user_avatar: "".to_string(),
                swap_timestamp: None,
            },
            last_create_fomo: CreateFomoSignalVo {
                fomo_idx: 0,
                fomo_name: "".to_string(),
                token_logo: "".to_string(),
                op_user_pid: Principal::anonymous(),
                user_name: "anonymous".to_string(),
                user_avatar: "".to_string(),
                create_time: ic_utils::time(),
            },
        }
    }
}

impl Context {}

fn get_context() -> Context {
    CONTEXT.with(|ctx| {
        let ctx = ctx.lock().unwrap();
        return ctx.clone();
    })
}
// Get the value of owner in CONTEXT
fn get_owner() -> Principal {
    CONTEXT.with(|ctx| {
        let ctx = ctx.lock().unwrap();
        ctx.owner.clone()
    })
}

// Retrieve user information;
// if the user does not exist, call edit_user to create it
#[query]
#[candid_method(query)]
fn get_user(user_pid: Principal) -> Option<UserProfile> {
    let key_pid = KeyPrincipal {
        principal: user_pid,
    };
    return USER_PROFILE_MAP.with(|ctx| {
        return ctx.borrow().get(&key_pid);
    });
}

#[query]
#[candid_method(query)]
fn get_addr_config() -> AddrConfig {
    let mut config_addr = ic_utils::get_mut::<AddrConfig>();
    return config_addr.clone();
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct RecordSignal {
    fomo_idx: u64,
    icp_amount: Nat,
    buy_sell_op: String,
    swap_hash: u64,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct RecordSignalVo {
    fomo_idx: u64,
    fomo_ticker: String,
    icp_amount: Nat,
    buy_sell_op: String,
    op_user_pid: Principal,
    user_name: String,
    user_avatar: String,
    swap_timestamp: Option<u64>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct CreateFomoSignalVo {
    fomo_idx: u64,
    fomo_name: String,
    token_logo: String,
    op_user_pid: Principal,
    user_name: String,
    user_avatar: String,
    create_time: u64,
}

// Used to record the amount of ICP involved in buy or sell transactions.
// It is called after a successful ICPEX transaction on the frontend for display purposes.
#[update]
#[candid_method(update)]
async fn set_buy_or_sell(mut record_signal: RecordSignal) {
    let caller = caller().clone();
    let (user_name, user_avatar) =
        USER_PROFILE_MAP.with(
            |upm| match upm.borrow().get(&KeyPrincipal { principal: caller }) {
                None => (
                    substring(caller.to_string().as_mut_str(), 0..5)
                        .parse()
                        .unwrap(),
                    "".to_string(),
                ),
                Some(v) => (v.user_name, v.avatar),
            },
        );
    let k = record_signal.fomo_idx.clone();
    let fomo: Option<FomoProject> = get_fomo_by_fomo_idx(k);
    let addr_config = ic_utils::get::<AddrConfig>().clone();
    let swap_result: CallResult<(Vec<SwapTxRecord>,)> = ic_cdk::call(
        addr_config.tx_addr,
        "querySwapStatus",
        (record_signal.swap_hash,),
    )
    .await;
    let swap_record_vec = swap_result.unwrap().0.clone();
    let swap_record = swap_record_vec[0].clone();
    match swap_record.status {
        TransactionStatus::Succeeded => {}
        _ => {
            panic!("invalid transaction!")
        }
    }
    CONTEXT.with(|ctx| {
        let mut context = ctx.lock().unwrap();
        if context.last_buy_sell_op.swap_timestamp != None
            && context.last_buy_sell_op.swap_timestamp.unwrap() > swap_record.timestamp
        {
            panic!("invalid swap_timestamp!")
        }
    });
    print("1");
    match fomo {
        None => {
            panic!("fomo is not exists")
        }
        Some(mut v) => {
            let item = get_fomo_by_fomo_idx(record_signal.fomo_idx.clone()).unwrap();
            let pool_res: CallResult<(PoolInfo,)> = ic_cdk::call(
                addr_config.router_addr.clone(),
                "getPoolInfo",
                (item.pool_pid, Principal::anonymous()),
            )
            .await;
            let pool_info = pool_res.unwrap().0;
            let icp_price_res: CallResult<(Nat, Nat)> =
                call(addr_config.oracle_addr.clone(), "getICPPrice", ()).await;
            let total_balance = IToken {
                cid: item.token_pid,
            }
            .total_supply()
            .await
            .unwrap()
            .0;
            let icp_price = icp_price_res.unwrap().1;
            let market_cap = pool_info
                .base_price_cumulative_last
                .mul(icp_price)
                .mul(total_balance)
                .div(nat_8())
                .div(nat_8());
            print("3");
            let mut pool_progress = market_cap
                .clone()
                .mul(Nat::from(10_000u64))
                .div(Nat::from(5000u64))
                .div(nat_18());
            CONTEXT.with(|ctx| {
                let mut context = ctx.lock().unwrap();
                context.last_buy_sell_op = RecordSignalVo {
                    fomo_idx: record_signal.fomo_idx,
                    fomo_ticker: v.ticker.clone(),
                    icp_amount: record_signal.icp_amount,
                    buy_sell_op: record_signal.buy_sell_op,
                    op_user_pid: caller.clone(),
                    user_name: user_name.clone(),
                    user_avatar: user_avatar.clone(),
                    swap_timestamp: Some(swap_record.timestamp),
                };
                print("4");

                let god_fomo = FOMO_PROJECT_MAP.with(|p| p.borrow().get(&context.god_of_wells_idx));
                let mut max_market_cap = match god_fomo {
                    None => new_zero(),
                    Some(f) => {
                        print("5");
                        f.market_cap
                    }
                };
                print("6");
                if market_cap > max_market_cap
                    && pool_progress <= Nat::from(10_000u64)
                    && v.pool_progress_done_time == None
                {
                    context.god_of_wells_idx = record_signal.fomo_idx.clone();
                } else if market_cap > max_market_cap
                    && pool_progress >= Nat::from(10_000u64)
                    && item.god_of_wells_time == None
                {
                    context.god_of_wells_idx = record_signal.fomo_idx.clone();
                }
                print("7");
                if max_market_cap == new_zero() {
                    v.god_of_wells_progress = new_zero();
                } else if v.god_of_wells_progress < Nat::from(10_000u64) {
                    v.god_of_wells_progress = market_cap
                        .clone()
                        .mul(Nat::from(10_000u64))
                        .div(max_market_cap.clone());
                    if v.god_of_wells_progress >= Nat::from(10_000u64) {
                        v.god_of_wells_progress = Nat::from(10_000u64);
                        v.god_of_wells_time = Some(ic_utils::time());
                    }
                } else if v.god_of_wells_progress > Nat::from(10_000u64) {
                    v.god_of_wells_progress = Nat::from(10_000u64);
                } else if v.god_of_wells_progress == Nat::from(10_000u64)
                    && v.god_of_wells_time == None
                {
                    v.god_of_wells_time = Some(ic_utils::time());
                }
                if pool_progress > Nat::from(10_000u64) {
                    pool_progress = Nat::from(10_000u64);
                }
                // This only affects the progress and does not trigger the pool lock or change the pool_progress_done_time operation
                // ensuring that the progress completion and the pool lock happen simultaneously
            });
            print("9");
            FOMO_PROJECT_MAP.with(|p| {
                print("10");
                p.borrow_mut().insert(
                    k,
                    FomoProject {
                        fomo_idx: v.fomo_idx,
                        name: v.name,
                        ticker: v.ticker,
                        description: v.description,
                        img_url: v.img_url,
                        twitter_link: v.twitter_link,
                        telegram_link: v.telegram_link,
                        website: v.website,
                        token_pid: v.token_pid,
                        pool_pid: v.pool_pid,
                        fomo_pid: v.fomo_pid,
                        pool_progress: pool_progress.clone(),
                        pool_progress_done_time: v.pool_progress_done_time,
                        god_of_wells_progress: v.god_of_wells_progress,
                        god_of_wells_time: v.god_of_wells_time,
                        create_time: v.create_time,
                        create_user_pid: v.create_user_pid,
                        market_cap: market_cap.clone(),
                        reply_count: v.reply_count,
                        recently_reply_time: v.recently_reply_time,
                        recently_bump_time: ic_utils::time(),
                        sneed_dao_lock: v.sneed_dao_lock.clone(),
                        dogmi_dao_lock: v.dogmi_dao_lock.clone(),
                    },
                );
            });
        }
    }
}

#[query]
#[candid_method(query)]
async fn get_buy_or_sell() -> RecordSignalVo {
    return get_context().last_buy_sell_op;
}

#[update]
#[candid_method(update)]
async fn update_progress() {
    let mut list = Vec::new();
    let mut lock_fomo_idx_list = Vec::new();

    let mut map: HashMap<u64, (Nat, Nat)> = HashMap::new();

    let mut max_market_cap = new_zero();
    let mut max_market_cap_fomo_idx = 0u64;
    let addr_config = ic_utils::get::<AddrConfig>().clone();

    FOMO_PROJECT_MAP.with(|mut ctx| {
        for (fomo_idx, fomo_project) in ctx.borrow().iter() {
            list.push(fomo_project);
        }
    });
    for item in list {
        let mc_res = IOracle::market_cap_batch(vec![item.token_pid]).await;
        let market_cap = match mc_res {
            Ok(v) => v.0.get(&item.token_pid).unwrap_or(&new_zero()).clone(),
            Err(err) => {
                print(format!("error:{}", err.1));
                new_zero()
            }
        };
        let mut pool_progress = market_cap
            .clone()
            .mul(Nat::from(10_000u64))
            .div(Nat::from(5000u64))
            .div(nat_18());
        print(format!(
            "token_id:{},market cap :{},pool_progress:{}",
            item.token_pid, market_cap, pool_progress
        ));
        if market_cap > max_market_cap
            && pool_progress <= Nat::from(10_000u64)
            && item.pool_progress_done_time == None
        {
            max_market_cap = market_cap.clone();
            max_market_cap_fomo_idx = item.fomo_idx.clone();
        } else if market_cap > max_market_cap
            && pool_progress >= Nat::from(10_000u64)
            && item.god_of_wells_time == None
        {
            max_market_cap = market_cap.clone();
            max_market_cap_fomo_idx = item.fomo_idx.clone();
        }

        if pool_progress > Nat::from(10_000u64) {
            pool_progress = Nat::from(10_000u64);
        }
        map.insert(item.fomo_idx, (pool_progress, market_cap));
    }

    CONTEXT.with(|ctx| {
        let mut context = ctx.lock().unwrap();
        context.god_of_wells_idx = max_market_cap_fomo_idx.clone();
        print(format!(
            "god_of_wells_idx:{},max_market_cap_fomo_idx :{}",
            context.god_of_wells_idx, max_market_cap_fomo_idx
        ));
    });
    FOMO_PROJECT_MAP.with(|mut ctx| {
        for (fomo_idx, (pool_progress, market_cap)) in map.iter() {
            let mut fomo_project_map = ctx.borrow_mut();
            match fomo_project_map.get(&fomo_idx) {
                None => {}
                Some(mut pj) => {
                    pj.pool_progress = pool_progress.clone();
                    pj.market_cap = market_cap.clone();
                    if max_market_cap == new_zero() {
                        pj.god_of_wells_progress = new_zero();
                    } else if pj.god_of_wells_progress < Nat::from(10_000u64) {
                        pj.god_of_wells_progress = market_cap
                            .clone()
                            .mul(Nat::from(10_000u64))
                            .div(max_market_cap.clone());
                        if pj.god_of_wells_progress >= Nat::from(10_000u64) {
                            pj.god_of_wells_progress = Nat::from(10_000u64);
                            pj.god_of_wells_time = Some(ic_utils::time());
                        }
                    } else if pj.god_of_wells_progress > Nat::from(10_000u64) {
                        pj.god_of_wells_progress = Nat::from(10_000u64);
                    } else if pj.god_of_wells_progress == Nat::from(10_000u64)
                        && pj.god_of_wells_time == None
                    {
                        pj.god_of_wells_time = Some(ic_utils::time());
                    }
                    if pool_progress.clone() == Nat::from(10_000u64)
                        && pj.pool_progress_done_time == None
                    {
                        lock_fomo_idx_list.push(pj.fomo_idx.clone());
                        pj.pool_progress_done_time = Some(ic_utils::time());
                    }
                    fomo_project_map.insert(fomo_idx.clone(), pj.clone());
                }
            };
        }
    });
    for fomo_pid in lock_fomo_idx_list {
        let project_pj = get_fomo_by_fomo_idx(fomo_pid);
        match project_pj {
            Some(v) => {
                let lock_pool_pid = v.pool_pid.clone();
                if v.sneed_dao_lock.is_some() {
                    let transfer_lp = v.sneed_dao_lock.unwrap();
                    print(format!("transfer lp:{}", transfer_lp.clone()));
                    let sneed_pid = get_sneed_dao_addr();
                    let r: CallResult<(Result<(), String>,)> = call(
                        addr_config.router_addr,
                        "transferLiquidity",
                        (lock_pool_pid.clone(), sneed_pid, transfer_lp),
                    )
                    .await;
                    throw_call_res(r, "transfer_liquidity error");
                }
                if v.dogmi_dao_lock.is_some() {
                    let transfer_lp = v.dogmi_dao_lock.unwrap();
                    print(format!("transfer lp:{}", transfer_lp.clone()));
                    let dogmi_pid = get_dogmi_dao_addr();
                    let r: CallResult<(Result<(), String>,)> = call(
                        addr_config.router_addr,
                        "transferLiquidity",
                        (lock_pool_pid.clone(), dogmi_pid, transfer_lp),
                    )
                    .await;
                    throw_call_res(r, "transfer_liquidity error");
                }
                print(format!("lock_pool_pid:{}", lock_pool_pid));
                let res: CallResult<(Result<(), String>,)> = call(
                    addr_config.router_addr,
                    "lockLiquidity",
                    (lock_pool_pid.clone(), nat_18(), 0u64),
                )
                .await;
            }
            None => {
                panic!("fomo does not exist:{}", fomo_pid)
            }
        }
    }
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct UserEditObj {
    user_name: Option<String>,
    avatar: Option<String>,
}

#[update]
#[candid_method(update)]
async fn topup_points(points_amount: Nat) -> Result<(), String> {
    let user_pid = caller().clone();
    if points_amount.clone() < Nat::from(10) {
        return Err("Top-up failed; users need to top up a minimum of 10 points.".to_string());
    }
    let res = edit_user(UserEditObj {
        user_name: None,
        avatar: None,
    })
    .await;
    if res.is_err() {
        return Err("Invalid user".to_string());
    }
    let usd_amount = points_amount.clone().mul(nat_18()).div(10);
    let mut spend_icp_amount = new_zero();
    let icp_addr = get_icp_addr();
    match get_icp_platform_fee(IToken { cid: icp_addr }, user_pid, usd_amount).await {
        Ok(fee) => {
            spend_icp_amount = fee;
        }
        Err(e) => {
            return Err(e);
        }
    };
    throw(
        IToken { cid: icp_addr }
            .transfer_from(
                user_pid.clone(),
                ic_cdk::id(),
                spend_icp_amount,
                "points".to_string(),
            )
            .await
            .map_err(|e| e.1),
    );
    //one point = 0.1 USD
    init_points(user_pid.clone());
    add_points(points_amount, user_pid.clone(), "TOPUP".to_string());
    Ok(())
}

fn init_points(user_pid: Principal) {
    let key_pid = KeyPrincipal {
        principal: user_pid.clone(),
    };
    USER_PROFILE_MAP.with(|mut ctx| {
        let mut mut_tree = ctx.borrow_mut();
        match mut_tree.get(&key_pid) {
            None => {
                panic!("invalid user ,user PID:{}", user_pid.clone())
            }
            Some(mut user_profile) => {
                print(format!(
                    "user points need init,user_pid: {}",
                    user_pid.to_text()
                ));
                if user_profile.user_points.is_none() {
                    let user_pre_reward_points = match user_profile.user_pre_reward_points.clone() {
                        Some(result) => result,
                        None => new_zero(),
                    };
                    print(format!(
                        "init user points with extra points:{}",
                        user_pre_reward_points.clone()
                    ));
                    user_profile.user_points = Some(Nat::from(20) + user_pre_reward_points);
                }
                mut_tree.insert(key_pid.clone(), user_profile.clone());
            }
        };
    });
    POINT_HISTORY_MAP.with(|p| {
        let point_idx = count_point();
        p.borrow_mut().insert(
            point_idx.clone(),
            PointHistory {
                time: ic_utils::time(),
                idx: point_idx.clone(),
                user_pid: user_pid.clone(),
                op_type: "INIT".to_string(),
                busi_name: "INIT".to_string(),
                amount: Some(Nat::from(20)),
            },
        );
    });
}
fn add_points(amount: Nat, user_pid: Principal, busi_name: String) {
    let key_pid = KeyPrincipal {
        principal: user_pid.clone(),
    };
    USER_PROFILE_MAP.with(|mut ctx| {
        let mut mut_tree = ctx.borrow_mut();
        match mut_tree.get(&key_pid) {
            None => {
                panic!("invalid user ,user PID:{}", user_pid.clone())
            }
            Some(mut user_profile) => {
                match user_profile.user_points.clone() {
                    Some(user_amount) => {
                        user_profile.user_points = Some(user_amount.clone() + amount.clone());
                    }
                    None => match user_profile.user_pre_reward_points {
                        Some(pre_reward) => {
                            user_profile.user_pre_reward_points =
                                Some(pre_reward.clone() + amount.clone())
                        }
                        None => user_profile.user_pre_reward_points = Some(amount.clone()),
                    },
                }
                mut_tree.insert(key_pid.clone(), user_profile.clone());
            }
        };
    });
    POINT_HISTORY_MAP.with(|p| {
        let point_idx = count_point();
        p.borrow_mut().insert(
            point_idx.clone(),
            PointHistory {
                time: ic_utils::time(),
                idx: point_idx.clone(),
                user_pid: user_pid.clone(),
                op_type: "ADD".to_string(),
                busi_name: busi_name.clone(),
                amount: Some(amount.clone()),
            },
        );
    });
}

fn deduct_points(amount: Nat, user_pid: Principal, busi_name: String) {
    let key_pid = KeyPrincipal {
        principal: user_pid.clone(),
    };
    USER_PROFILE_MAP.with(|mut ctx| {
        let mut mut_tree = ctx.borrow_mut();
        match mut_tree.get(&key_pid) {
            None => {
                panic!("invalid user ,user PID:{}", user_pid.clone())
            }
            Some(mut user_profile) => {
                if user_profile.user_points == None {
                    panic!("Insufficient FOMO points balance");
                }
                let user_points_amount = user_profile.user_points.unwrap();
                if user_points_amount.clone() < amount {
                    panic!(
                        "Insufficient FOMO points balance:{}",
                        user_points_amount.clone()
                    )
                }
                if user_profile.user_all_spend_points == None {
                    user_profile.user_all_spend_points = Some(new_zero());
                }
                user_profile.user_points = Some(user_points_amount.clone() - amount.clone());
                user_profile.user_all_spend_points =
                    Some(user_profile.user_all_spend_points.clone().unwrap() + amount.clone());
                mut_tree.insert(key_pid.clone(), user_profile.clone());
                POINT_HISTORY_MAP.with(|p| {
                    let point_idx = count_point();
                    p.borrow_mut().insert(
                        point_idx.clone(),
                        PointHistory {
                            time: ic_utils::time(),
                            idx: point_idx.clone(),
                            user_pid: user_pid.clone(),
                            op_type: "DEDUCT".to_string(),
                            busi_name: busi_name.clone(),
                            amount: Some(amount.clone()),
                        },
                    );
                });
            }
        };
    });
}

#[update]
#[candid_method(update)]
async fn edit_user(user_info: UserEditObj) -> Result<Principal, String> {
    let caller = caller().clone();
    if caller == Principal::anonymous() {
        return Err("Please connect wallet".to_string());
    }
    let key_pid = KeyPrincipal {
        principal: caller.clone(),
    };
    let mut skip_point = false;

    USER_PROFILE_MAP.with(|mut ctx| {
        let init_points = Some(new_zero());
        let mut mut_tree = ctx.borrow_mut();
        match mut_tree.get(&key_pid) {
            None => {
                skip_point = true;
            }
            Some(mut user_profile) => {
                if user_profile.user_points == None && user_profile.user_all_spend_points == None {
                    user_profile.user_all_spend_points = Some(new_zero());
                }
                if user_info.user_name.is_none() && user_info.avatar.is_none() {
                    skip_point = true;
                }
                mut_tree.insert(key_pid.clone(), user_profile.clone());
            }
        };
    });
    if !skip_point {
        let spend_res: CallResult<()> = call(
            id().clone(),
            "spending_points",
            (caller.clone(), "EDIT_AVATAR"),
        )
        .await;
        match spend_res {
            Ok(_) => {}
            Err(v) => {
                return Err(v.1);
            }
        }
    }
    let mut image_url = String::new();
    match user_info.avatar {
        None => {}
        Some(ref avatar) => {
            if avatar != "default" {
                image_url = upload_file(avatar.clone()).await;
            }
        }
    };
    USER_PROFILE_MAP.with(|mut ctx| {
        let init_points = Some(new_zero());
        let mut mut_tree = ctx.borrow_mut();
        match mut_tree.get(&key_pid) {
            None => {
                mut_tree.insert(
                    key_pid.clone(),
                    UserProfile {
                        user_pid: key_pid.principal,
                        user_name: substring(caller.to_string().as_mut_str(), 0..5)
                            .parse()
                            .unwrap(),
                        avatar: user_info.avatar.unwrap_or("".to_string()).to_string(),
                        last_change_time: ic_utils::time(),
                        user_points: None,
                        user_all_spend_points: Some(new_zero()),
                        user_pre_reward_points: Some(new_zero()),
                    },
                );
            }
            Some(mut user_profile) => {
                if user_profile.user_points == None {
                    user_profile.user_all_spend_points = Some(new_zero());
                }
                if user_profile.user_all_spend_points == None {
                    user_profile.user_all_spend_points = Some(new_zero());
                }
                if user_profile.user_pre_reward_points == None {
                    user_profile.user_pre_reward_points = Some(new_zero());
                }
                match user_info.user_name {
                    None => {}
                    Some(v) => {
                        user_profile.user_name = v;
                        user_profile.last_change_time = ic_utils::time();
                    }
                };
                match user_info.avatar {
                    None => {}
                    Some(avatar) => {
                        // todo: HTTP out call to confirm avatar change
                        user_profile.avatar = image_url;
                        user_profile.last_change_time = ic_utils::time();
                    }
                };
                mut_tree.insert(key_pid.clone(), user_profile.clone());
            }
        };
    });

    Ok(caller.clone())
}

fn get_icp_addr() -> Principal {
    let canister_ids = match ENV {
        "local" => include_str!("../../canisterId/local/canister_ids.json"),
        "test" => include_str!("../../canisterId/test/canister_ids.json"),
        "prod" => include_str!("../../canisterId/prod/canister_ids.json"),
        _ => panic!("Unknown environment"),
    };
    print(canister_ids);
    let v: Value = serde_json::from_str(canister_ids).expect("JSON was not well-formatted");
    let mut icp_addr = Principal::anonymous();
    if (ENV == "local") {
        icp_addr = Principal::from_text(v["icp_ledger"]["local"].as_str().unwrap()).unwrap();
    } else {
        icp_addr = Principal::from_text(v["icp_ledger"]["ic"].as_str().unwrap()).unwrap();
    }
    return icp_addr.clone();
}

#[update]
#[candid_method(update)]
fn get_sneed_dao_addr() -> Principal {
    let canister_ids = match ENV {
        "local" => include_str!("../../canisterId/local/canister_ids.json"),
        "test" => include_str!("../../canisterId/test/canister_ids.json"),
        "prod" => include_str!("../../canisterId/prod/canister_ids.json"),
        _ => panic!("Unknown environment"),
    };
    print(canister_ids);
    let v: Value = serde_json::from_str(canister_ids).expect("JSON was not well-formatted");
    let mut icp_addr = Principal::anonymous();
    if (ENV == "local") {
        icp_addr = Principal::from_text(v["sneed"]["local"].as_str().unwrap()).unwrap();
    } else {
        icp_addr = Principal::from_text(v["sneed"]["ic"].as_str().unwrap()).unwrap();
    }
    return icp_addr.clone();
}

#[update]
#[candid_method(update)]
fn get_dogmi_dao_addr() -> Principal {
    let canister_ids = match ENV {
        "local" => include_str!("../../canisterId/local/canister_ids.json"),
        "test" => include_str!("../../canisterId/test/canister_ids.json"),
        "prod" => include_str!("../../canisterId/prod/canister_ids.json"),
        _ => panic!("Unknown environment"),
    };
    print(canister_ids);
    let v: Value = serde_json::from_str(canister_ids).expect("JSON was not well-formatted");
    let mut icp_addr = Principal::anonymous();
    if (ENV == "local") {
        icp_addr = Principal::from_text(v["dogmi"]["local"].as_str().unwrap()).unwrap();
    } else {
        icp_addr = Principal::from_text(v["dogmi"]["ic"].as_str().unwrap()).unwrap();
    }
    return icp_addr.clone();
}

#[update]
#[candid_method(update)]
async fn create_fomo(mut fomo_create: FomoProjectCreate) -> Result<FomoProject, String> {
    let caller = caller().clone();
    if caller == Principal::anonymous() {
        return Err("Please connect wallet".to_string());
    }
    if get_user(caller.clone()).is_none() {
        return Err("Please init user".to_string());
    }
    if (fomo_create.name.trim().len() == 0 || fomo_create.name.trim().len() > 64) {
        return Err(
            "Name input should contain at least one character or less then 64 character."
                .to_string(),
        );
    }
    if (fomo_create.ticker.trim().len() == 0 || fomo_create.ticker.trim().len() > 16) {
        return Err(
            "Ticker input should contain at least one character or less then 16 character."
                .to_string(),
        );
    }
    if (fomo_create.img_url.trim().len() > 100) {
        return Err("img_url input should contain less then 100 character.".to_string());
    }
    if (fomo_create.twitter_link.trim().len() > 100) {
        return Err("twitter_link input should contain less then 100 character.".to_string());
    }
    if (fomo_create.telegram_link.trim().len() > 100) {
        return Err("telegram_link input should contain less then 100 character.".to_string());
    }
    if (fomo_create.website.trim().len() > 100) {
        return Err("website input should contain less then 100 character.".to_string());
    }
    if fomo_create.sneed_dao_lock.is_some() {
        let lock_percent = fomo_create.sneed_dao_lock.clone().unwrap();
        if lock_percent < nat_18() / 10 || lock_percent > nat_18() / 2 {
            return Err("You can choose to lock 10%-50% of the LP into Sneed DAO".to_string());
        }
    }
    if fomo_create.dogmi_dao_lock.is_some() {
        let lock_percent = fomo_create.dogmi_dao_lock.clone().unwrap();
        if lock_percent < nat_18() / 10 || lock_percent > nat_18() / 2 {
            return Err("You can choose to lock 10%-50% of the LP into DOGMI DAO".to_string());
        }
    }
    let desc_len = fomo_create.description.len();
    fomo_create.description = (&fomo_create.description[..desc_len.min(2000)]).to_string();
    let mut fomo_create_fee = new_zero();
    let icp_addr = get_icp_addr();
    // USD amount
    match get_icp_platform_fee(IToken { cid: icp_addr }, caller.clone(), nat_18() * 6).await {
        Ok(fee) => {
            fomo_create_fee = fee;
        }
        Err(e) => {
            panic!("Your ICP balance is insufficient to pay the service fee.");
        }
    };
    let icp_addr = get_icp_addr();
    throw(
        IToken { cid: icp_addr }
            .transfer_from(
                caller.clone(),
                ic_cdk::id(),
                fomo_create_fee,
                "fomo".to_string(),
            )
            .await
            .map_err(|e| e.1),
    );
    let config_addr = ic_utils::get_mut::<AddrConfig>();
    let idx = count();

    // todo: ICP fee
    // todo: createToken
    // let token_pid = Principal::anonymous();
    // Total supply: 1 billion
    let token_init_balance = Nat::from(100_000_000_000_000_000u64);
    let token_pid = IBackend::createToken(
        fomo_create.name.clone(),
        fomo_create.logo.clone(),
        fomo_create.ticker.clone(),
        8u8,
        token_init_balance.clone(),
        Nat::from(100_000_000u64),
        false,
        new_zero(),
        true,
        true,
        "ICRC-2".to_string(),
        Some(caller.clone()),
    )
    .await
    .unwrap()
    .0
    .unwrap();
    // todo: createPool
    // let pool_pid = Principal::anonymous();
    // base in amount 1B ,k:1,( i = 1/3000w icp, k = 1),fee_rate: 0.3%
    throw_call_res(
        IToken { cid: token_pid }
            .approve(config_addr.router_addr, token_init_balance.clone())
            .await,
        "Fomo approve failed",
    );
    let pool_pid = IRouter::createCommonPool(
        token_pid,
        get_context().icp_addr,
        Nat::from(99999999900000000u64),
        new_zero(),
        nat_from(10_000_000_000_000_000u64),
        nat_from(33333333333u64),
        nat_from(500_000_000_000_000_000u64),
        ic_utils::time() + 10 * 60 * 1000000000,
        Some(true),
    )
    .await
    .unwrap()
    .0
    .unwrap()
    .0;
    let (cid,) = throw(
        create_canister(
            CreateCanisterArgument {
                settings: Some(CanisterSettings {
                    controllers: Some(vec![id()]),
                    compute_allocation: None,
                    memory_allocation: None,
                    freezing_threshold: None,
                }),
            },
            900_000_000_000,
        )
        .await
        .map_err(|e| "Create fomo failed:".to_string() + &*e.1),
    );
    let tid = cid.canister_id;
    let fomo_project = FomoProject {
        fomo_idx: idx,
        name: fomo_create.name,
        ticker: fomo_create.ticker,
        description: fomo_create.description,
        img_url: upload_file(fomo_create.img_url).await,
        twitter_link: fomo_create.twitter_link,
        telegram_link: fomo_create.telegram_link,
        website: fomo_create.website,
        token_pid: token_pid,
        pool_pid: pool_pid,
        fomo_pid: tid.clone(),
        pool_progress: new_zero(),
        pool_progress_done_time: None,
        god_of_wells_progress: new_zero(),
        god_of_wells_time: None,
        create_time: ic_utils::time(),
        create_user_pid: caller.clone(),
        market_cap: new_zero(),
        reply_count: 0,
        recently_reply_time: 0,
        recently_bump_time: 0,
        sneed_dao_lock: fomo_create.sneed_dao_lock,
        dogmi_dao_lock: fomo_create.dogmi_dao_lock,
    };
    print("create fomo id success");
    let (status,) = throw(canister_status(cid).await.map_err(|e| e.1));
    assert!(!status.module_hash.is_some(), "Create fomo Failed");

    let wasm_module = get_context().fomo_canister_template;
    let args = throw(
        encode_args((fomo_project.to_hashmap(),)).map_err(|_e| "Encode args failed".to_string()),
    );
    throw(
        install_code(InstallCodeArgument {
            mode: CanisterInstallMode::Install,
            canister_id: tid,
            wasm_module: wasm_module,
            arg: args,
        })
        .await
        .map_err(|e: (RejectionCode, String)| e.1),
    );

    FOMO_PROJECT_MAP.with(|mut ctx| {
        let mut mut_tree = ctx.borrow_mut();
        mut_tree.insert(idx.clone(), fomo_project.clone())
    });
    let (user_name, user_avatar) =
        USER_PROFILE_MAP.with(
            |upm| match upm.borrow().get(&KeyPrincipal { principal: caller }) {
                None => (
                    substring(caller.to_string().as_mut_str(), 0..5)
                        .parse()
                        .unwrap(),
                    "".to_string(),
                ),
                Some(v) => (v.user_name, v.avatar),
            },
        );
    //2
    CONTEXT.with(|ctx| {
        let mut context = ctx.lock().unwrap();
        context.last_create_fomo = CreateFomoSignalVo {
            fomo_idx: idx.clone(),
            fomo_name: fomo_project.name.clone(),
            token_logo: fomo_create.logo.clone(),
            op_user_pid: caller.clone(),
            user_name: user_name.clone(),
            user_avatar: user_avatar.clone(),
            create_time: fomo_project.create_time.clone(),
        };
    });

    let key_pid = KeyPrincipal {
        principal: caller.clone(),
    };
    let busi_name = "CREATEFOMO".to_string();

    init_points(caller.clone());
    add_points(Nat::from(10), caller.clone(), busi_name);

    return Ok(fomo_project);
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct FomoProjectVo {
    pub fomo_vec: Vec<FomoProject>,
    pub start_idx: u64,
    pub end_idx: u64,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct Page {
    pub start: u64,
    pub limit: u64,
}

//fomo 
#[query]
#[candid_method(query)]
fn get_fomo_by_index(page: Page) -> FomoProjectVo {
    print(format!(
        "get_fomo_by_index===>:{} {}",
        page.start,
        page.start + page.limit
    ));
    let fps = FOMO_PROJECT_MAP.with(|p| {
        p.borrow_mut()
            .range(page.start..(page.start + page.limit))
            .collect::<Vec<(u64, FomoProject)>>()
    });
    let start = FOMO_PROJECT_MAP
        .with(|p| p.borrow_mut().first_key_value())
        .unwrap()
        .0;
    let end = FOMO_PROJECT_MAP
        .with(|p| p.borrow_mut().last_key_value())
        .unwrap()
        .0;
    FomoProjectVo {
        fomo_vec: fps.into_iter().map(|(_, project)| project).collect(),
        start_idx: start,
        end_idx: end,
    }
}

// Get FOMO information based on fomo_idx
#[query]
#[candid_method(query)]
fn get_fomo_by_fomo_idx(fomo_idx: u64) -> Option<FomoProject> {
    return FOMO_PROJECT_MAP.with(|p| p.borrow_mut().get(&fomo_idx));
}

// Get FOMO information based on fomo_idx
#[query]
#[candid_method(query)]
fn get_fomo_by_fomo_pid(fomo_pid: Principal) -> Option<FomoProject> {
    let fps: Vec<(u64, FomoProject)> = FOMO_PROJECT_MAP.with(|p| {
        p.borrow_mut()
            .iter()
            .filter(|(_, fp)| fp.fomo_pid == fomo_pid)
            .collect::<Vec<(u64, FomoProject)>>()
    });
    if fps.len() == 0 {
        return None;
    } else {
        match fps.get(0) {
            None => None,
            Some(v) => Some(v.clone().1),
        }
    }
}

#[query]
#[candid_method(query)]
fn get_fomo_by_create_user_pid(user_pid: Principal) -> Option<Vec<FomoProject>> {
    let fps: Vec<(u64, FomoProject)> = FOMO_PROJECT_MAP.with(|p| {
        p.borrow_mut()
            .iter()
            .filter(|(_, fp)| fp.create_user_pid == user_pid)
            .collect::<Vec<(u64, FomoProject)>>()
    });
    if fps.len() == 0 {
        return None;
    } else {
        // Use map to transform the vector, only taking the FomoProject part from each tuple
        let vec_of_fomo_projects: Vec<FomoProject> = fps
            .into_iter() // Convert vec_of_tuples into an iterator
            .map(|(_, project)| project.clone())
            .collect(); // Collect the result into a new Vec<FomoProject>
        return Some(vec_of_fomo_projects);
    }
}

#[query]
#[candid_method(query)]
fn get_god_of_wells() -> Option<FomoProject> {
    let wells_idx = get_context().god_of_wells_idx;
    print(format!("well_idx:{}", wells_idx));
    let fps = FOMO_PROJECT_MAP.with(|p| p.borrow().get(&wells_idx));
    return fps;
}

#[query]
#[candid_method(query)]
fn get_fomo_context() -> Context {
    let mut ctx = get_context().clone();
    ctx.fomo_canister_template = vec![];
    return ctx;
}

pub fn nat_to_bd(input: Nat) -> BigDecimal {
    let out = input.0.to_u128().unwrap_or(0);
    BigDecimal::from(out)
}

async fn get_icp_platform_fee(
    itoken: IToken,
    caller: Principal,
    usd_amount: Nat,
) -> Result<Nat, String> {
    let total_balance = itoken.balance_of(caller.clone()).await;
    let allowacne_balance = itoken.allowance(caller, id()).await.unwrap().0;
    let token_id = itoken.cid.clone();
    let (res,): (HashMap<Principal, Nat>,) =
        IOracle::prices_batch(vec![token_id.clone()]).await.unwrap();
    let price = res.get(&token_id).unwrap();
    //3 USDT
    let fee = (usd_amount * nat_8()).div(price.clone()) + Nat::from(10_000);
    let max_fee = fee.clone() + fee.clone() / 100;
    let min_fee = fee.clone() - fee.clone() / 100;
    print(format!("create Fomo,fee address:{}, total_balance:{} allowacne_balance caller:{},fee:{},price:{},caller:{}", &token_id, &total_balance, &allowacne_balance, &fee, &price, &caller));

    if allowacne_balance < min_fee {
        let err_str = format!(
            "allowance balance {} not enough {}",
            allowacne_balance, min_fee
        );
        print(&err_str);
        return Err(err_str);
    }
    let result_fee = if allowacne_balance > max_fee {
        max_fee
    } else if allowacne_balance > fee {
        fee
    } else {
        min_fee
    };
    if total_balance < result_fee {
        let err_str = format!("total balance {} not enough {}", total_balance, result_fee);
        print(&err_str);
        return Err(err_str);
    } else {
        return Ok(result_fee);
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    let user_profile = USER_PROFILE_MAP.with(|user_prof| {
        let vec: Vec<(KeyPrincipal, UserProfile)> = user_prof.borrow().iter().into_iter().collect();
        return vec;
    });
    let fomo_project = FOMO_PROJECT_MAP.with(|fomo_proj| {
        let vec: Vec<(u64, FomoProject)> = fomo_proj.borrow().iter().into_iter().collect();
        return vec;
    });
    let history_project = POINT_HISTORY_MAP.with(|his_info| {
        let vec: Vec<(u64, PointHistory)> = his_info.borrow().iter().into_iter().collect();
        return vec;
    });
    ic_cdk::storage::stable_save((
        get_context().clone(),
        ic_utils::get::<AddrConfig>().clone(),
        ic_utils::get::<CounterState>().clone(),
        user_profile,
        fomo_project,
        history_project,
    ))
    .unwrap();
    print("=====end pre_upgrade====");
}

#[post_upgrade]
fn post_upgrade(opt_addr_config: Option<AddrConfig>) {
    let (context, addrConfig, counterState, userProfiles, fomoList, history_project): (
        Context,
        AddrConfig,
        CounterState,
        Vec<(KeyPrincipal, UserProfile)>,
        Vec<(u64, FomoProject)>,
        Vec<(u64, PointHistory)>,
    ) = ic_cdk::storage::stable_restore().unwrap();
    USER_PROFILE_MAP.with(|mut ctx| {
        let mut mut_tree = ctx.borrow_mut();
        for (key_pid, user_pj) in userProfiles {
            mut_tree.insert(key_pid, user_pj);
        }
    });
    FOMO_PROJECT_MAP.with(|mut ctx| {
        let mut mut_tree = ctx.borrow_mut();
        for (fomo_id, fomo_proj) in fomoList {
            mut_tree.insert(
                fomo_id,
                FomoProject {
                    fomo_idx: fomo_proj.fomo_idx,
                    name: fomo_proj.name,
                    ticker: fomo_proj.ticker,
                    description: fomo_proj.description,
                    img_url: fomo_proj.img_url,
                    twitter_link: fomo_proj.twitter_link,
                    telegram_link: fomo_proj.telegram_link,
                    website: fomo_proj.website,
                    token_pid: fomo_proj.token_pid,
                    pool_pid: fomo_proj.pool_pid,
                    fomo_pid: fomo_proj.fomo_pid,
                    pool_progress: fomo_proj.pool_progress,
                    pool_progress_done_time: fomo_proj.pool_progress_done_time,
                    god_of_wells_progress: fomo_proj.god_of_wells_progress,
                    god_of_wells_time: fomo_proj.god_of_wells_time,
                    market_cap: fomo_proj.market_cap,
                    create_time: fomo_proj.create_time,
                    create_user_pid: fomo_proj.create_user_pid,
                    reply_count: fomo_proj.reply_count,
                    recently_reply_time: fomo_proj.recently_reply_time,
                    recently_bump_time: fomo_proj.recently_bump_time,
                    sneed_dao_lock: fomo_proj.sneed_dao_lock,
                    dogmi_dao_lock: fomo_proj.dogmi_dao_lock,
                },
            );
        }
    });

    POINT_HISTORY_MAP.with(|mut ctx| {
        let mut mut_tree = ctx.borrow_mut();
        for (his_id, points_record) in history_project {
            mut_tree.insert(his_id, points_record);
        }
    });
    CONTEXT.with(|ctx| {
        let mut ctx = ctx.lock().unwrap();
        ctx.owner = context.owner;
        ctx.fomo_canister_template =
            include_bytes!("../../wasm/fomowell-project-opt-did.wasm.gz").to_vec();
        ctx.icp_addr = context.icp_addr;
        // Temporarily set the default to 1
        ctx.god_of_wells_idx = context.god_of_wells_idx;
        ctx.last_create_fomo = context.last_create_fomo;
        // reload buy or sell fomo
        ctx.last_buy_sell_op = context.last_buy_sell_op;
    });

    let mut config_addr = ic_utils::get_mut::<AddrConfig>();
    match opt_addr_config {
        None => {
            *config_addr = addrConfig;
        }
        Some(_) => {
            *config_addr = opt_addr_config.unwrap();
        }
    }

    let mut cs = ic_utils::get_mut::<CounterState>();
    *cs = counterState;

    ic_cdk_timers::set_timer_interval(Duration::from_secs(90), || ic_cdk::spawn(update_progress()));

    print("=====end post_upgrade====");
}

#[derive(CandidType, Clone, Debug, Deserialize)]
enum SortType {
    BumpOrder,
    LastReply,
    ReplyCount,
    MarketCap,
    CreationTime,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
enum OrderType {
    ASC,
    DESC,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct SearchParam {
    pub text: String,
    pub start: u64,
    pub limit: u64,
    pub order: OrderType,
    pub sort: SortType,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct FomoProjectSearchVo {
    pub fomo_vec: Vec<FomoProject>,
    pub start: u64,
    pub end: u64,
}

#[query]
#[candid_method(query)]
fn search_fomos(param: SearchParam) -> FomoProjectSearchVo {
    let p: Principal = caller();
    print("-------------------------------");
    print(p.to_text());
    print("-------------------------------");
    let fps: Vec<(u64, FomoProject)> = FOMO_PROJECT_MAP.with(|p| {
        p.borrow_mut()
            .iter()
            .filter(|(_, fp)| {
                let text = param.text.as_str();
                (fp.name.contains(text)
                    || fp.ticker.contains(text)
                    || fp.token_pid.to_text().contains(text)
                    || fp.pool_pid.to_text().contains(text)
                    || fp.fomo_pid.to_text().contains(text)
                    || fp.create_user_pid.to_text().contains(text))
                    && fp.fomo_idx >= 6
            })
            .collect::<Vec<(u64, FomoProject)>>()
    });

    let mut temp: Vec<FomoProject> = fps.into_iter().map(|(_, project)| project).collect();
    let size = (&temp).len() as u64;
    let start = 0;
    let end: u64 = size as u64;
    if param.start > size {
        return FomoProjectSearchVo {
            fomo_vec: Vec::new(),
            start,
            end,
        };
    }
    let left = param.start as usize;
    let right = (param.start + param.limit) as usize;
    let list;

    temp.sort_by(|a: &FomoProject, b: &FomoProject| {
        let mut l: &FomoProject;
        let mut r: &FomoProject;
        match param.order {
            OrderType::ASC => {
                l = a;
                r = b;
            }
            OrderType::DESC => {
                l = b;
                r = a;
            }
        }
        match param.sort {
            SortType::BumpOrder => (&l).recently_bump_time.cmp(&r.recently_bump_time),
            SortType::LastReply => (&l).recently_reply_time.cmp(&r.recently_reply_time),
            SortType::ReplyCount => (&l).reply_count.cmp(&r.reply_count),
            SortType::MarketCap => (&l).market_cap.cmp(&r.market_cap),
            SortType::CreationTime => (&l).create_time.cmp(&r.create_time),
        }
    });

    if right as u64 > size {
        list = &temp[left..];
    } else {
        list = &temp[left..right];
    }
    FomoProjectSearchVo {
        fomo_vec: list.to_vec(),
        start,
        end,
    }
}

#[update]
fn reply_update(fomo_idx: u64) -> () {
    let fomo: Option<FomoProject> = get_fomo_by_fomo_idx(fomo_idx);
    match fomo {
        None => {
            panic!("fomo is not exists")
        }
        Some(v) => {
            FOMO_PROJECT_MAP.with(|p| {
                p.borrow_mut().insert(
                    fomo_idx,
                    FomoProject {
                        fomo_idx: v.fomo_idx,
                        name: v.name,
                        ticker: v.ticker,
                        description: v.description,
                        img_url: v.img_url,
                        twitter_link: v.twitter_link,
                        telegram_link: v.telegram_link,
                        website: v.website,
                        token_pid: v.token_pid,
                        pool_pid: v.pool_pid,
                        fomo_pid: v.fomo_pid,
                        pool_progress: v.pool_progress,
                        pool_progress_done_time: v.pool_progress_done_time,
                        god_of_wells_progress: v.god_of_wells_progress,
                        god_of_wells_time: v.god_of_wells_time,
                        create_time: v.create_time,
                        create_user_pid: v.create_user_pid,
                        market_cap: v.market_cap,
                        reply_count: v.reply_count + 1,
                        recently_reply_time: ic_utils::time(),
                        recently_bump_time: v.recently_bump_time,
                        sneed_dao_lock: v.sneed_dao_lock,
                        dogmi_dao_lock: v.dogmi_dao_lock,
                    },
                );
            });
        }
    }
}

#[query]
#[candid_method(query)]
fn get_points_history_by_index(start: u64, limit: u64) -> Vec<(u64, PointHistory)> {
    let tx = POINT_HISTORY_MAP.with(|p| {
        p.borrow_mut()
            .range(start..(start + limit))
            .collect::<Vec<(u64, PointHistory)>>()
    });
    print("end");
    tx
}

#[update]
#[candid_method(update)]
async fn ownership_transfer(fomo_pid: Principal, to_new_controller_pid: Option<Principal>) {
    let fomo = get_fomo_by_fomo_pid(fomo_pid);
    let caller = caller().clone();
    if fomo.is_none() {
        panic!("Transfer token controller does not exist!")
    } else if fomo.clone().unwrap().create_user_pid != caller.clone() {
        panic!("Current user does not the dev!")
    }
    let token_pid = fomo.unwrap().token_pid.clone();
    let icp_addr = get_icp_addr();
    let mut fomo_ownership_transfer_fee = new_zero();
    //2 USD amount
    match get_icp_platform_fee(IToken { cid: icp_addr }, caller.clone(), nat_18() * 2).await {
        Ok(fee) => {
            fomo_ownership_transfer_fee = fee;
        }
        Err(e) => {
            panic!("Your ICP balance is insufficient to pay the service fee.");
        }
    };
    let backend_addr = get_addr_config().backend_addr;
    let approve_args = ApproveArgs {
        from_subaccount: None,
        spender: Account {
            owner: backend_addr,
            subaccount: None,
        },
        amount: Nat::from(10_00_000_000),
        expected_allowance: None,
        expires_at: None,
        fee: None,
        memo: None,
        created_at_time: None,
    };
    let approve_res: CallResult<(ApproveResult,)> =
        call(icp_addr, "icrc2_approve", (approve_args,)).await;
    throw_call_res(approve_res, "approve error");
    let transfer_controller_res: CallResult<()> = call(
        backend_addr,
        "removeTokensControllers",
        (token_pid.clone(), to_new_controller_pid),
    )
    .await;
    throw_call_res(transfer_controller_res, "transfer controller error");
    throw(
        IToken { cid: icp_addr }
            .transfer_from(
                caller.clone(),
                ic_cdk::id(),
                fomo_ownership_transfer_fee,
                "fomo_ot".to_string(),
            )
            .await
            .map_err(|e| e.1),
    );
}

#[cfg(not(any(target_arch = "wasm32", test)))]
fn main() {
    use std::env;
    use std::fs::write;
    use std::path::PathBuf;
    let dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    write(dir.join("fomowell-launcher.did"), export_candid()).expect("Write failed.");
}

#[cfg(any(target_arch = "wasm32", test))]
fn main() {}

#[update]
#[candid_method(update)]
async fn spending_points(user_pid: Principal, busi_name: String) {
    let caller = caller().clone();
    if caller.clone() != id().clone() {
        match get_fomo_by_fomo_pid(caller.clone()) {
            None => {
                panic!("invalid fomo {}", caller.clone());
            }
            Some(v) => {}
        }
    }

    let amount = if busi_name == "COMMENT" {
        Nat::from(6)
    } else if busi_name == "IMAGE_COMMENT" {
        Nat::from(6)
    } else if busi_name == "EDIT_AVATAR" {
        Nat::from(8)
    } else {
        panic!("invalid business name: {}", busi_name.clone())
    };
    deduct_points(amount, user_pid.clone(), busi_name.clone());
}

#[update]
#[candid_method(update)]
async fn lock_pool(lock_pool_pid: Principal) {
    let addr_config = ic_utils::get::<AddrConfig>().clone();
    let caller = caller().clone();
    if caller.clone() != get_owner().clone() {
        panic!("Not owner")
    }

    let res: CallResult<(Result<(), String>,)> = call(
        addr_config.router_addr,
        "lockLiquidity",
        (lock_pool_pid.clone(), nat_18(), 0u64),
    )
    .await;
    throw_call_res(res, "lock_pool error");
}

fn export_candid() -> String {
    candid::export_service!();
    __export_service()
}

#[query]
#[candid_method(query)]
fn cycles() -> u64 {
    ic_utils::balance()
}

#[update]
#[candid_method(update)]
fn airdrop_points(user_pid: Principal, amount: Nat, busi_name: String) {
    let addr_config = ic_utils::get::<AddrConfig>().clone();
    let caller = caller().clone();
    if caller.clone() != get_owner().clone() {
        panic!("Not owner")
    }
    add_points(amount, user_pid, busi_name);
}

#[derive(CandidType, Deserialize, Default)]
struct CounterState {
    count: u64,
    point_count: u64,
}
#[derive(CandidType, Deserialize, Default)]
struct CounterStateOld {
    count: u64,
}

#[update]
fn count() -> u64 {
    let state: &mut CounterState = ic_utils::get_mut::<CounterState>();
    state.count += 1;
    state.count
}

#[update]
fn count_point() -> u64 {
    let state: &mut CounterState = ic_utils::get_mut::<CounterState>();
    state.point_count += 1;
    state.point_count
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct BeeRes {
    pub reference: String,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct FileReplaceURI {
    pub uri: String,
}

impl Default for FileReplaceURI {
    fn default() -> Self {
        FileReplaceURI {
            uri: "https://image.fomowell.com/api/files/replace?file=".to_string(),
        }
    }
}

async fn upload_file(image_url: String) -> String {
    let request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "Idempotency-Key".to_string(),
            value: image_url.clone(),
        },
    ];
    let str = FileReplaceURI::default().uri;
    let arg = CanisterHttpRequestArgument {
        url: format!("{}{}", str.clone(), image_url),
        max_response_bytes: Some(5000),
        method: HttpMethod::POST,
        headers: request_headers,
        body: None,
        transform: Some(TransformContext::from_name(
            "__transform_json_rpc".to_string(),
            vec![],
        )),
    };
    // todo cycles
    let response = http_request(arg, 120_912_000).await.unwrap().0.clone();
    if response.status.clone() != Nat::from(200) {
        panic!(
            "Http out call panic! url:{},response body:{}",
            str.clone(),
            String::from_utf8(response.body.clone()).unwrap()
        )
    }
    let text = String::from_utf8(response.body).unwrap();
    let sp: BeeRes = serde_json::from_str(&text.clone()).unwrap();
    sp.reference
}

pub fn do_transform_http_request(args: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: args.response.status,
        body: canonicalize_json(&args.response.body).unwrap_or(args.response.body),
        // Remove headers (which may contain a timestamp) for consensus
        headers: vec![],
    }
}

pub fn canonicalize_json(text: &[u8]) -> Option<Vec<u8>> {
    let json = serde_json::from_slice::<Value>(text).ok()?;
    serde_json::to_vec(&json).ok()
}

#[query(name = "__transform_json_rpc")]
fn transform(args: TransformArgs) -> HttpResponse {
    do_transform_http_request(args)
}

#[update]
async fn add_token_controllers(token: Principal, user: Principal) {
    let c = get_context().clone();
    let caller = ic_cdk::caller();
    assert_eq!(caller, c.owner, "Not Owner");
    let cv = if user.clone() == id() {
        vec![id()]
    } else {
        vec![id(), user]
    };

    let org_settings = canister_status(CanisterIdRecord {
        canister_id: token.clone(),
    })
    .await
    .unwrap()
    .0
    .settings;
    let mut new_settings = CanisterSettings {
        controllers: Some(cv),
        compute_allocation: Some(org_settings.compute_allocation.clone()),
        memory_allocation: Some(org_settings.memory_allocation.clone()),
        freezing_threshold: Some(org_settings.freezing_threshold.clone()),
    };

    match update_settings(UpdateSettingsArgument {
        canister_id: token.clone(),
        settings: new_settings,
    })
    .await
    {
        Ok(_) => {
            print("update success");
        }
        Err(e) => {
            panic!("update setting error: {:?}", e);
        }
    }
}
