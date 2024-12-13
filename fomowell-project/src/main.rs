mod comment;

use std::cell::RefCell;
use std::collections::{HashMap, HashSet, LinkedList};
use std::fmt::format;
use std::ops::{Deref, DerefMut, Div, Mul};
use std::ptr::null;
use std::str::FromStr;
use std::sync::{Arc, MutexGuard};
use std::thread;
use std::time::Duration;

use candid::{
    candid_method, encode_args, CandidType, Decode, Deserialize, Encode, Int, Nat, Principal,
};
use ic_cdk::api::call::{CallResult, RejectionCode};
use ic_cdk::{call, caller, id, print};
use ic_cdk_macros::*;

use bigdecimal::{BigDecimal, ToPrimitive};
use lazy_static::lazy_static;
use std::sync::Mutex;

use crate::comment::{Comments, CommentsCreate};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{
    BTreeMap, BoundedStorable, DefaultMemoryImpl, StableBTreeMap, Storable,
};
use icpex_lib::ic_utils;
use icpex_lib::ic_utils::nat_to_u128;
use icpex_lib::types::icrc_type::Account;

// use ic_cdk::export::serde::{Deserialize, Serialize};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext,
};
use serde_json::Value;

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static CONTEXT: Arc<Mutex<Context>> = Arc::new(Mutex::new(Context::default()));

    // The memory manager is used for simulating multiple memories. Given a `MemoryId` it can
    // return a memory that can be used by stable structures.
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));


    static COMMENTS: RefCell<StableBTreeMap<u64, Comments, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );
}

#[init]
#[candid_method(init)]
fn init(fm_pj: HashMap<String, String>) {
    // Refresh scheduled tasks on every restart.
    CONTEXT.with(|ctx| {
        let mut ctx = ctx.lock().unwrap();
        ctx.metadata = fm_pj;
        ctx.owner = caller().clone()
    });
    ic_cdk_timers::set_timer_interval(Duration::from_secs(360), || {
        ic_cdk::spawn(update_user_holding_list())
    });

    // let mut addr_config = ic_utils::get_mut::<AddrConfig>();
    // addr_config.oracle_addr = Principal::anonymous();
}

#[derive(Deserialize, CandidType, Clone, Debug)]
struct Context {
    pub metadata: HashMap<String, String>,
    pub owner: Principal,
}

impl Default for Context {
    fn default() -> Self {
        Context {
            metadata: HashMap::new(),
            owner: Principal::anonymous(),
        }
    }
}

impl Context {}

//  CONTEXT  owner
fn get_context() -> Context {
    CONTEXT.with(|ctx| {
        let ctx = ctx.lock().unwrap();
        return ctx.clone();
    })
}

#[derive(Clone, Debug, CandidType, Deserialize)]
struct HoldersBalances {
    max_length: Nat,
    balances: LinkedList<(Account, Nat)>,
}

type Balances = LinkedList<HolderInfo>;

#[derive(Deserialize, CandidType, Clone, Debug)]
struct HolderInfo {
    pub account: Account,
    pub amount: Nat,
    pub holder_percent: f64,
    pub holder_type: String,
}

#[query]
#[candid_method(query)]
async fn get_top10_holders() -> Vec<HolderInfo> {
    let all_balances = ic_utils::get_mut::<Balances>();
    // Convert the LinkedList to a Vec for sorting
    let mut balances_vec: Vec<_> = all_balances.iter().cloned().collect();

    // Sort in descending order based on the value of the second element (Nat)
    balances_vec.sort_by(|a, b| b.amount.cmp(&a.amount));

    // Get the top 10 balances
    let top_10_balances: Vec<_> = balances_vec.into_iter().take(10).collect();
    return top_10_balances.clone();
}

#[update]
#[candid_method(update)]
async fn add_comment(mut comment: CommentsCreate) -> Result<(), String> {
    let idx = count();
    let caller = caller();
    let com_len = comment.content.len();
    comment.content = (&comment.content[..com_len.min(2000)]).to_string();
    let spend_type = match comment.image_url.clone() {
        None => "COMMENT",
        Some(_) => "IMAGE_COMMENT",
    };
    let spend_res: CallResult<()> = call(
        get_context().owner,
        "spending_points",
        (caller.clone(), spend_type),
    )
    .await;
    match spend_res {
        Ok(_) => {}
        Err(v) => {
            return Err(v.1);
        }
    }
    // The points have already been deducted. Please confirm the image upload.
    let new_image_url = match comment.image_url.clone() {
        None => None,
        Some(_) => Some(upload_file(comment.image_url.unwrap()).await),
    };

    let fomo_idx = get_context()
        .clone()
        .metadata
        .get("fomo_idx")
        .unwrap()
        .clone();
    let com = Comments {
        fomo_idx: fomo_idx.clone(),
        comment_idx: idx.clone(),
        user_pid: caller.clone(),
        content: comment.content,
        user_star: HashSet::new(),
        image_url: new_image_url,
        create_time: ic_utils::time(),
        extended: Vec::new(),
    };
    reply_update_async(fomo_idx).await;
    COMMENTS.with(|ctx| {
        let ppp = ctx.borrow_mut().insert(idx, com);
    });
    Ok(())
}

async fn reply_update_async(fomo_idx: String) {
    let mut launcher: Principal = Principal::anonymous();
    CONTEXT.with(|ctx| {
        let ctx = ctx.lock().unwrap();
        launcher = ctx.owner.clone(); // Capture owner outside the async block
    });
    println!("send reply_update fomo");
    let fi: u64 = fomo_idx.parse().unwrap();
    ic_cdk::call::<(u64,), ()>(launcher, "reply_update", (fi,))
        .await
        .expect("Call reply_update failed");
    println!("send reply_update fomo id success");
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct CommentsVo {
    pub fomo_vec: Vec<Comments>,
    pub start_idx: u64,
    pub end_idx: u64,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct Page {
    pub start: u64,
    pub limit: u64,
}

#[query]
#[candid_method(query)]
fn get_comments_by_index(page: Page) -> CommentsVo {
    print(format!(
        "get_fomo_comments_by_index===>:{} {}",
        page.start,
        page.start + page.limit
    ));
    let fps = COMMENTS.with(|p| {
        p.borrow_mut()
            .range(page.start..(page.start + page.limit))
            .collect::<Vec<(u64, Comments)>>()
    });
    match COMMENTS.with(|p| p.borrow_mut().first_key_value()) {
        None => CommentsVo {
            fomo_vec: fps.into_iter().map(|(_, project)| project).collect(),
            start_idx: 0u64,
            end_idx: 0u64,
        },
        Some(v) => {
            let start = v.0;
            let end = COMMENTS
                .with(|p| p.borrow_mut().last_key_value())
                .unwrap()
                .0;
            CommentsVo {
                fomo_vec: fps.into_iter().map(|(_, project)| project).collect(),
                start_idx: start,
                end_idx: end,
            }
        }
    }
}

#[query]
#[candid_method(query)]
fn get_comments_len() -> Nat {
    Nat::from(COMMENTS.with(|p| p.borrow_mut().len()))
}

#[query]
#[candid_method(query)]
fn get_fomo_info() -> HashMap<String, String> {
    get_context().clone().metadata
}

pub fn nat_to_bd(input: Nat) -> BigDecimal {
    let out = input.0.to_u128().unwrap_or(0);
    BigDecimal::from(out)
}

#[query(name = "cycles")]
#[candid_method(query, rename = "cycles")]
fn cycles() -> u64 {
    ic_utils::balance()
}

#[pre_upgrade]
fn pre_upgrade() {
    print("=====end pre_upgrade====");
}

#[post_upgrade]
fn post_upgrade() {
    ic_cdk_timers::set_timer_interval(Duration::from_secs(360), || {
        ic_cdk::spawn(update_user_holding_list())
    });
    // ic_cdk_timers::set_timer_interval(Duration::from_secs(86400), || ic_cdk::spawn(periodic_allocation()));
    print("=====end post_upgrade====");
}

#[cfg(not(any(target_arch = "wasm32", test)))]
fn main() {
    use std::env;
    use std::fs::write;
    use std::path::PathBuf;
    let dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    write(dir.join("fomowell-project.did"), export_candid()).expect("Write failed.");
}

#[cfg(any(target_arch = "wasm32", test))]
fn main() {}

fn export_candid() -> String {
    candid::export_service!();
    __export_service()
}

#[derive(CandidType, Deserialize, Default)]
struct CounterState {
    count: u64,
}

#[update]
fn count() -> u64 {
    let state: &mut CounterState = ic_utils::get_mut::<CounterState>();
    state.count += 1;
    state.count
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
    let url = ic_utils::get::<FileReplaceURI>();
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
    let arg = CanisterHttpRequestArgument {
        url: format!("{}{}", url.uri.clone(), image_url),
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
            url.uri.clone(),
            String::from_utf8(response.body.clone()).unwrap()
        )
    }
    let text = String::from_utf8(response.body).unwrap();
    let sp: BeeRes = serde_json::from_str(&text.clone()).unwrap();
    sp.reference
}

#[update]
#[candid_method(update)]
async fn update_image_replace_uri(image_prefix: String) {
    assert_eq!(caller().clone(), get_context().owner.clone(), "Not Owner");
    let url = ic_utils::get_mut::<FileReplaceURI>();
    url.uri = image_prefix;
}

#[update]
#[candid_method(update)]
async fn update_user_holding_list() {
    let token_pid = get_context().metadata.get("token_pid").unwrap().clone();
    let pool_pid = get_context().metadata.get("pool_pid").unwrap().clone();
    let create_user_pid = get_context()
        .metadata
        .get("create_user_pid")
        .unwrap()
        .clone();
    let token_principal = Principal::from_text(token_pid).unwrap();
    let total_supply_res: CallResult<(Nat,)> =
        call(token_principal.clone(), "icrc1_total_supply", ()).await;
    let total_supply = total_supply_res.unwrap().0;
    let mut start = 0;
    let limit = 1000;
    let mut all_balances: LinkedList<HolderInfo> = LinkedList::new();
    loop {
        let holders_balances: CallResult<(HoldersBalances,)> =
            ic_cdk::call(token_principal, "icrc_plus_holders_balance", (start, limit)).await;
        let balances_res = holders_balances.unwrap().0.balances;
        let length = balances_res.len();
        if length == 0 {
            break;
        }
        for (holder_account, holder_amount) in balances_res.iter() {
            let holder_percent = BigDecimal::from(nat_to_u128(holder_amount.clone()))
                .div(BigDecimal::from(nat_to_u128(total_supply.clone())));
            let mut holder_type = "".to_string();
            if (holder_account.owner.to_text() == pool_pid.clone()) {
                holder_type = "pool".to_string();
            } else if (holder_account.owner.to_text() == create_user_pid.clone()) {
                holder_type = "dev".to_string();
            }
            all_balances.push_back(HolderInfo {
                account: holder_account.clone(),
                amount: holder_amount.clone(),
                holder_percent: holder_percent.to_f64().unwrap(),
                holder_type: holder_type.clone(),
            });
        }
        if length < limit {
            break;
        }
        start += limit;
    }
    let balances = ic_utils::get_mut::<Balances>();
    *balances = all_balances;
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
