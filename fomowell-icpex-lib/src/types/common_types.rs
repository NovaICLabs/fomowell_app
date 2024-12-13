use candid::{CandidType, Decode, Deserialize, Encode, Int, Nat, Principal};
use ic_stable_structures::{BoundedStorable, Storable};
use serde::Serialize;
use std::borrow::Cow;
use std::cmp::Ordering;
use std::collections::HashSet;
use std::convert::{TryFrom, TryInto};
use std::fmt;
use std::fmt::Formatter;

#[derive(CandidType, Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TransactionStatus {
    Pending,
    BaseTrans,
    QuoteTrans,
    Rollback,
    Succeeded,
    Failed,
}

impl<'a> TryFrom<&'a str> for TransactionStatus {
    type Error = ();

    fn try_from(value: &'a str) -> Result<Self, Self::Error> {
        Ok(match value {
            "pending" => Self::Pending,
            "baseTrans" => Self::BaseTrans,
            "quoteTrans" => Self::QuoteTrans,
            "rollback" => Self::Rollback,
            "succeeded" => Self::Succeeded,
            "failed" => Self::Failed,
            _ => return Err(()),
        })
    }
}

impl Into<&'static str> for TransactionStatus {
    fn into(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::BaseTrans => "baseTrans",
            Self::QuoteTrans => "quoteTrans",
            Self::Rollback => "rollback",
            Self::Succeeded => "succeeded",
            Self::Failed => "failed",
        }
    }
}

impl TransactionStatus {
    pub fn into_str(self) -> &'static str {
        self.into()
    }
}

type Time = Int;

#[derive(CandidType, Clone, Debug, Deserialize)]
pub enum Operation {
    //token
    Approve,
    Mint,
    Transfer,
    TransferFrom,
    Burn,
    RemoveTokenController,

    //pool
    Swap,
    CreatePool,
    AddLiquidity,
    RemoveLiquidity,

    CreateToken,
    CanisterCalled,
    CanisterCreated,
}

#[allow(non_snake_case)]
#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Metadata {
    pub logo: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub totalSupply: Nat,
    pub owner: Principal,
    pub fee: Nat,
}

#[derive(CandidType, Debug, PartialEq, Deserialize)]
pub enum TxError {
    InsufficientBalance,
    InsufficientAllowance,
    Unauthorized,
    LedgerTrap,
    AmountTooSmall,
    BlockUsed,
    ErrorOperationStyle,
    ErrorTo,
    Other,
}

impl fmt::Display for TxError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

pub type TxReceipt = Result<Nat, TxError>;

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct PoolTxRecord {
    pub tx_hash: u64,
    pub tx_hash_str: String,
    pub fail_msg: String,
    pub caller: Option<Principal>,
    pub pool: Option<Principal>,
    pub to: Principal,
    pub timestamp: u64,
    pub status: TransactionStatus,
    pub operation: Operation,
    pub base_amount: f64,
    pub quote_amount: f64,
    pub base_token: Principal,
    pub quote_token: Principal,
    pub base_price: f64,
    pub quote_price: f64,
    pub base_price_cumulative_last: Option<f64>,
    pub base_reserve: Option<f64>,
    pub quote_reserve: Option<f64>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct TokenTxRecord {
    pub caller: Option<Principal>,
    pub from: Principal,
    pub to: Principal,
    pub amount: f64,
    pub fee: f64,
    pub timestamp: u64,
    pub status: TransactionStatus,
    pub operation: Operation,
    pub token: Principal,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct SwapTxRecord {
    pub pairs: Option<Vec<Principal>>,
    pub directions: Option<u64>,
    pub caller: Option<Principal>,
    pub from_token: Option<Principal>,
    pub to_token: Option<Principal>,
    pub input_amount: Option<f64>,
    pub base_min_return_amount: Option<f64>,
    pub receive_amount: Option<f64>,
    pub timestamp: u64,
    pub status: TransactionStatus,
    pub swap_hash: u64,
    pub swap_hash_str: String,
    pub price: Option<f64>,
    pub volumn: Option<f64>,
    pub lp_fee_amount: Option<f64>,
    pub lp_fee_volumn: Option<f64>,
    pub mt_fee_amount: Option<f64>,
    pub mt_fee_volumn: Option<f64>,
    pub quote_token_decimals: Option<Nat>,
    pub fail_msg: Option<String>,
    pub base_price_cumulative_last: Option<f64>,
    pub base_reserve: Option<f64>,
    pub quote_reserve: Option<f64>,
    pub tvl: Option<f64>,
    pub pool_version: Option<u8>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
pub enum TX {
    TokenTx(TokenTxRecord),
    SwapTx(SwapTxRecord),
    PoolTx(PoolTxRecord),
}

//这个从10万调整成100万，不清楚生产是否会有问题
const MAX_VALUE_SIZE: u32 = 4096;

impl BoundedStorable for TX {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for TX {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

impl BoundedStorable for SwapTxRecord {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for SwapTxRecord {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

impl BoundedStorable for PoolTxRecord {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for PoolTxRecord {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

#[derive(Deserialize, Serialize, CandidType, Clone, Debug, PartialEq)]
pub struct PrincipalSet {
    pub p_set: HashSet<Principal>,
}

impl BoundedStorable for PrincipalSet {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for PrincipalSet {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

#[derive(Deserialize, Serialize, CandidType, Clone, Debug, Eq)]
pub struct KeyPrincipal {
    pub principal: Principal,
}

impl BoundedStorable for KeyPrincipal {
    const MAX_SIZE: u32 = MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for KeyPrincipal {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }
}

impl PartialEq<Self> for KeyPrincipal {
    fn eq(&self, other: &Self) -> bool {
        self.principal == other.principal
    }
}

impl PartialOrd<Self> for KeyPrincipal {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for KeyPrincipal {
    fn cmp(&self, other: &Self) -> Ordering {
        self.principal.to_text().cmp(&other.principal.to_text())
    }
}

//预设版本号
pub type VERSION = String;
