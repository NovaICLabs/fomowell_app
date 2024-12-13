use crate::ic_utils::new_zero;
use crate::token::dip20::Balances;
use candid::{CandidType, Deserialize, Nat, Principal};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct PoolInfo {
    pub owner: Principal,
    pub base_token: Principal,
    pub quote_token: Principal,
    pub base_reserve: Nat,
    pub quote_reserve: Nat,
    pub block_timestamp_last: u64,
    pub base_price_cumulative_last: Nat,
    pub lp_fee_rate: Nat,
    pub mt_fee_rate: Nat,
    pub k: Nat,
    pub i: Nat,
    pub base_user: Nat,
    pub quote_user: Nat,
    pub total_supply: Nat,
    pub is_single_pool: bool,
    pub pool_type: String,
    pub pool_addr: Principal,
    pub lp_amount: Nat,
    pub lp_lock: Nat,
    pub base_token_decimals: u8,
    pub quote_token_decimals: u8,
    //扩展字段
    pub is_my_pool: bool,
    pub pool_status: PoolStatus,
    pub pool_version: Option<u8>,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct UnlockableInfo {
    pub user_pid: Principal,
    pub unlock_time: u64,
    pub unlock_lp: Nat,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct UserLpInfo {
    pub base_reserve: Nat,
    pub quote_reserve: Nat,
    pub total_supply: Nat,
    pub user_lp: Nat,
    pub user_base_amount: Nat,
    pub user_quote_amount: Nat,
}

#[derive(Deserialize, CandidType, Clone, Debug, PartialEq)]
pub enum PoolStatus {
    //已创建
    CREATED,
    CREATE_BASE_INPUT,
    CREATE_QUOTE_INPUT,
    //出错未回滚
    ROLLBACK_UNDONE,
    //已回滚
    ROLLBACK_DONE,
    //已发布
    ONLINE,
    //已下架
    OFFLINE,
}

impl From<String> for PoolStatus {
    fn from(value: String) -> Self {
        match value.as_str() {
            "CREATED" => Self::CREATED,
            "CREATE_BASE_INPUT" => Self::CREATE_BASE_INPUT,
            "CREATE_QUOTE_INPUT" => Self::CREATE_QUOTE_INPUT,
            "ROLLBACK_UNDONE" => Self::ROLLBACK_UNDONE,
            "ROLLBACK_DONE" => Self::ROLLBACK_DONE,
            "ONLINE" => Self::ONLINE,
            "OFFLINE" => Self::OFFLINE,
            _ => panic!("unknown PoolStatus "),
        }
    }
}

impl ToString for PoolStatus {
    fn to_string(&self) -> String {
        match self {
            PoolStatus::CREATED => String::from("CREATED"),
            PoolStatus::CREATE_BASE_INPUT => String::from("CREATE_BASE_INPUT"),
            PoolStatus::CREATE_QUOTE_INPUT => String::from("CREATE_QUOTE_INPUT"),
            PoolStatus::ROLLBACK_UNDONE => String::from("ROLLBACK_UNDONE"),
            PoolStatus::ROLLBACK_DONE => String::from("ROLLBACK_DONE"),
            PoolStatus::ONLINE => String::from("ONLINE"),
            PoolStatus::OFFLINE => String::from("OFFLINE"),
        }
    }
}

impl Eq for PoolStatus {}

impl Default for PoolInfo {
    fn default() -> Self {
        PoolInfo {
            owner: Principal::anonymous(),
            base_token: Principal::anonymous(),
            quote_token: Principal::anonymous(),
            base_reserve: Nat::from(0),
            quote_reserve: Nat::from(0),
            block_timestamp_last: 0,
            base_price_cumulative_last: Nat::from(0),
            lp_fee_rate: Nat::from(0),
            mt_fee_rate: Nat::from(0),
            k: Nat::from(0),
            i: Nat::from(0),
            base_user: Nat::from(0),
            quote_user: Nat::from(0),
            total_supply: Nat::from(0),
            is_single_pool: false,
            pool_type: "".to_string(),
            pool_addr: Principal::anonymous(),
            lp_amount: Nat::from(0),
            base_token_decimals: 0u8,
            quote_token_decimals: 0u8,
            is_my_pool: false,
            pool_status: PoolStatus::CREATED,
            lp_lock: new_zero(),
            pool_version: None,
        }
    }
}

impl ToString for PoolInfo {
    fn to_string(&self) -> String {
        format!("PoolInfo {{ owner:{}  base_token:{} quote_token:{} base_reserve:{} quote_reserve:{} block_timestamp_last:{} base_price_cumulative_last:{} lp_fee_rate:{} mt_fee_rate:{} k:{} i:{} base_user:{} quote_user:{} total_supply:{} is_single_pool:{} pool_type:{} pool_addr: {},lp_amount:{}
 }}",self.owner,self.base_token,self.quote_token,self.base_reserve,self.quote_reserve,self.block_timestamp_last,self.base_price_cumulative_last,self.lp_fee_rate,self.mt_fee_rate,self.k,self.i,self.base_user,self.quote_user,self.total_supply,self.is_single_pool,self.pool_type,self.pool_addr,self.lp_amount)
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct PoolAmountInfo {
    pub pool_address: Principal,
    pub base_token: Principal,
    pub quote_token: Principal,
    pub base_amount: Nat,
    pub quote_amount: Nat,
    pub base_token_price: Nat,
    pub quote_token_price: Nat,
    pub base_token_decimals: Nat,
    pub quote_token_decimals: Nat,
    pub mt_fee_rate: Nat,
    pub lp_fee_rate: Nat,
    pub total_supply: Nat,
    pub lp_lock: Nat,
    pub lp_amount: Nat,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct PoolInfoConfig {
    pub owner: Principal,
    pub pool_addr: Principal,
    pub base_token: Principal,
    pub quote_token: Principal,
    pub base_reserve: Nat,
    pub quote_reserve: Nat,
    pub block_timestamp_last: u64,
    pub base_price_cumulative_last: Nat,
    pub lp_fee_rate: Nat,
    pub mt_fee_rate: Nat,
    pub k: Nat,
    pub i: Nat,
    pub balances: Balances,
    pub base_target: Nat,
    pub quote_target: Nat,
    pub r_state: String,
    pub quote_decimals: u8,
    pub base_decimals: u8,
    pub pool_status: String,
    pub pool_type: String,
}

#[derive(CandidType, Debug, PartialEq, Deserialize)]
pub struct FeeInfo {
    pub flat_fee: bool,
    pub flat_burn_fee: bool,
    pub fee_rate: Nat,
    pub burn_rate: Nat,
    pub total_supply: Nat,
    pub decimals: u8,
}

pub struct InnerPoolInfo {
    //池子的创建者，主要指的是用户
    pub creator: Principal,
    //池子的控制者，目前为router
    pub master: Principal,
}

impl Default for InnerPoolInfo {
    fn default() -> Self {
        InnerPoolInfo {
            creator: Principal::management_canister(),
            master: Principal::management_canister(),
        }
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct PoolOrder {
    pub caller: Principal,
    pub base_token_addr: Principal,
    pub quote_token_addr: Principal,
    pub base_in_amount: Nat,
    pub quote_in_amount: Nat,
    pub fee_rate: Nat,
    pub i: Nat,
    pub k: Nat,
    pub deadline: u64,
    pub relinquish_on: bool,
}

impl Hash for PoolOrder {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.base_token_addr.hash(state);
        self.quote_token_addr.hash(state);
        self.base_in_amount.hash(state);
        self.quote_in_amount.hash(state);
        self.fee_rate.hash(state);
        self.i.hash(state);
        self.k.hash(state);
        self.deadline.hash(state);
    }
}
impl PoolOrder {
    pub fn hash_order(&self) -> u64 {
        let mut hasher = DefaultHasher::new();
        self.hash(&mut hasher);
        let hash_value = hasher.finish();
        hash_value
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct PoolChangeOrder {
    pub caller: Principal,
    pub pool: Principal,
    pub timestamp: u64,
}

impl Hash for PoolChangeOrder {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.caller.hash(state);
        self.pool.hash(state);
        self.timestamp.hash(state);
    }
}
impl PoolChangeOrder {
    pub fn hash_order(&self) -> u64 {
        let mut hasher = DefaultHasher::new();
        self.hash(&mut hasher);
        let hash_value = hasher.finish();
        hash_value
    }
}
