use candid::{CandidType, Int, Nat, Principal};
use icrc_ledger_types::icrc1::account::Subaccount;
use serde::{Deserialize, Serialize};

use crate::constants::{
    ICP_SWAP_CALCULATOR, ICP_SWAP_CALCULATOR_TEST, ICP_SWAP_CREATION_FEES,
    ICP_SWAP_CREATION_FEES_TEST, ICP_SWAP_FACTORY, ICP_SWAP_FACTORY_TEST, ICP_SWAP_PASSCODEMANAGER,
    ICP_SWAP_PASSCODEMANAGER_TEST,
};

//icp swap type
#[derive(CandidType, Deserialize, Debug, Serialize)]
pub enum Error {
    CommonError,
    InternalError(String),
    UnsupportedToken(String),
    InsufficientFunds,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Token {
    pub address: String,
    pub standard: String,
}
#[allow(non_snake_case)]
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CreatePoolArgs {
    pub fee: candid::Nat,
    pub sqrtPriceX96: String,
    pub token0: Token,
    pub token1: Token,
}

#[allow(non_snake_case)]
#[derive(CandidType, Deserialize, Serialize)]
pub struct PoolData {
    pub fee: candid::Nat,
    pub key: String,
    pub tickSpacing: candid::Int,
    pub token0: Token,
    pub token1: Token,
    pub canisterId: Principal,
}

#[derive(CandidType, Deserialize, Serialize)]
pub enum CreatePoolResult {
    #[serde(rename = "ok")]
    Ok(PoolData),
    #[serde(rename = "err")]
    Err(Error),
}
#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct PasscodeManagerDepositArgs {
    pub fee: Nat,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SwapPoolDepositArgs {
    pub token: String,
    pub amount: Nat,
    pub fee: Nat,
}

#[derive(CandidType, Deserialize, Serialize)]
pub enum ICPSwapResult {
    #[serde(rename = "ok")]
    Ok(Nat),
    #[serde(rename = "err")]
    Err(Error),
}

#[derive(CandidType, Deserialize, Serialize)]
pub enum RequestPasscodeResult {
    #[serde(rename = "ok")]
    Ok(String),
    #[serde(rename = "err")]
    Err(Error),
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct MintArgs {
    pub fee: Nat,
    #[serde(rename = "tickUpper")]
    pub tick_upper: Int,
    pub token0: String,
    pub token1: String,
    #[serde(rename = "amount0Desired")]
    pub amount0_desired: String,
    #[serde(rename = "amount1Desired")]
    pub amount1_desired: String,
    #[serde(rename = "tickLower")]
    pub tick_lower: Int,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct PoolMetadata {
    pub fee: Nat,
    pub key: String,
    #[serde(rename = "sqrtPriceX96")]
    pub sqrt_price_x96: Nat,
    pub tick: Int,
    pub liquidity: Nat,
    pub token0: Token,
    pub token1: Token,
    #[serde(rename = "maxLiquidityPerTick")]
    pub max_liquidity_per_tick: Nat,
    #[serde(rename = "nextPositionId")]
    pub next_position_id: Nat,
}

#[derive(CandidType, Deserialize, Serialize)]
pub enum PoolMetadataResult {
    #[serde(rename = "ok")]
    Ok(PoolMetadata),
    #[serde(rename = "err")]
    Err(Error),
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct Position {
    pub amount0: Int,
    pub amount1: Int,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct WithdrawArgs {
    pub fee: Nat,
    pub token: String,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct UserUnusedBalance {
    pub balance0: Nat,
    pub balance1: Nat,
}

#[derive(CandidType, Deserialize)]
pub enum UserUnusedBalanceResult {
    #[serde(rename = "ok")]
    Ok(UserUnusedBalance),
    #[serde(rename = "err")]
    Err(Error),
}

#[derive(CandidType, Deserialize)]
pub struct LaunchRequestArg {
    pub token0: TokenInfo,
    pub token1: TokenInfo,
    pub subaccount: Option<Subaccount>,
}

#[derive(CandidType, Deserialize)]
pub struct TokenInfo {
    pub token: Token,
    pub fee: u128,
    pub balance: u128,
    pub decimal: u128,
}

pub enum Env {
    TEST,
    PROD,
}

pub struct ICPSwapConfig {
    pub icp_swap_calculator_canister: Principal,
    pub icp_swap_factory_canister: Principal,
    pub icp_swap_passcode_manager_canister: Principal,
    pub icp_swap_creation_fee: Nat,
}

impl ICPSwapConfig {
    pub fn new(env: Env) -> Self {
        match env {
            Env::TEST => Self {
                icp_swap_calculator_canister: Principal::from_text(ICP_SWAP_CALCULATOR_TEST)
                    .unwrap(),
                icp_swap_factory_canister: Principal::from_text(ICP_SWAP_FACTORY_TEST).unwrap(),
                icp_swap_passcode_manager_canister: Principal::from_text(
                    ICP_SWAP_PASSCODEMANAGER_TEST,
                )
                .unwrap(),
                icp_swap_creation_fee: Nat::from(ICP_SWAP_CREATION_FEES_TEST),
            },
            Env::PROD => Self {
                icp_swap_calculator_canister: Principal::from_text(ICP_SWAP_CALCULATOR).unwrap(),
                icp_swap_factory_canister: Principal::from_text(ICP_SWAP_FACTORY).unwrap(),
                icp_swap_passcode_manager_canister: Principal::from_text(ICP_SWAP_PASSCODEMANAGER)
                    .unwrap(),
                icp_swap_creation_fee: Nat::from(ICP_SWAP_CREATION_FEES),
            },
        }
    }
}
