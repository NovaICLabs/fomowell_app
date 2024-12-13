use candid::{CandidType, Deserialize, Nat};

// TokenInfoExt type
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TokenInfoExt {
    pub id: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub fee: Nat,
    pub total_supply: Nat,
}

// PairInfoExt type
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PairInfoExt {
    pub id: String,
    pub token0: String,
    pub token1: String,
    pub creator: Principal,
    pub reserve0: Nat,
    pub reserve1: Nat,
    pub price0_cumulative_last: Nat,
    pub price1_cumulative_last: Nat,
    pub k_last: Nat,
    pub block_timestamp_last: Int,
    pub total_supply: Nat,
    pub lptoken: String,
}

// UserInfo type
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserInfo {
    pub balances: Vec<(Principal, Nat)>,
    pub lp_balances: Vec<(String, Nat)>,
}

// SwapInfo type
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SwapInfo {
    pub owner: Principal,
    pub cycles: Nat,
    pub tokens: Vec<TokenInfoExt>,
    pub pairs: Vec<PairInfoExt>,
}

// TxRecord type
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TxRecord {
    pub caller: Principal,
    pub operation: String,
    pub details: Vec<(String, RootDetailValue)>,
    pub time: u64,
}
