use candid::{CandidType, Deserialize, Int, Nat, Principal};
use ic_ledger_types::{AccountIdentifier, Subaccount, Tokens};
use std::collections::HashMap;

use crate::ic_utils::new_zero;
use num_bigint::BigUint;
use serde::Serialize;

#[derive(Serialize, CandidType, Deserialize, Clone, Debug, Copy)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Subaccount>,
}
pub type NumTokens = Nat;
pub type BlockIndex = Nat;
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransferArg {
    pub from_subaccount: Option<Subaccount>,
    pub to: Account,
    pub amount: NumTokens,
    pub fee: Option<NumTokens>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ICRC2TransferArg {
    pub amount: NumTokens,
    pub created_at_time: Option<u64>,
    pub fee: Option<NumTokens>,
    pub from: Account,
    pub memo: Option<Vec<u8>>,
    pub spender_subaccount: Option<Subaccount>,
    pub to: Account,
}
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ICRC2AllowanceResult {
    pub allowance: Nat,
    pub expires_at: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ICRC2AllowanceArg {
    pub account: Account,
    pub spender: Account,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum MetadataICRC1 {
    Nat(Nat),
    Int(Int),
    Text(String),
    Blob(Vec<u8>),
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MintingAccount {
    pub owner: Principal,
    pub subaccount: Option<Subaccount>,
    pub mint_on: bool,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcInitialMints {
    pub account: Account,
    pub amount: Nat,
}
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcFeeInfo {
    pub burn_fee: FeeArg,
    pub transfer_fee: FeeArg,
    pub decimals: u8,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct FeeArg {
    pub fee: Nat,
    pub fixed: bool,
}
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcInitArg {
    pub burn_fee: Nat,
    pub decimals: u8,
    pub token_name: String,
    pub token_symbol: String,
    pub transfer_fee: Nat,
    pub minting_account: MintingAccount,
    pub initial_mints: Vec<IcrcInitialMints>,
    pub logo: String,
    pub principal_owner: Principal,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransferResult {
    Ok(BlockIndex),
    Err(TransferError),
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransferFromResult {
    Ok(BlockIndex),
    Err(TransferFromError),
}

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq)]
pub enum TransferError {
    BadFee { expected_fee: NumTokens },
    BadBurn { min_burn_amount: NumTokens },
    InsufficientFunds { balance: NumTokens },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: BlockIndex },
    GenericError { error_code: Nat, message: String },
}

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq)]
pub enum TransferFromError {
    BadFee { expected_fee: NumTokens },
    BadBurn { min_burn_amount: NumTokens },
    InsufficientFunds { balance: NumTokens },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: BlockIndex },
    GenericError { error_code: Nat, message: String },
    InsufficientAllowance { allowance: Nat },
}

/*impl TransferError {
    fn to_string(&self)->String{
        match self {
            TransferError::BadFee => format!("BadFee expected_fee").to_string(),
            TransferError::BadBurn => write!(f),
            TransferError::InsufficientFunds => write!(f),
            TransferError::TooOld => write!(f),
            TransferError::CreatedInFuture => write!(f),
            TransferError::TemporarilyUnavailable => write!(f),
            TransferError::Duplicate => write!(f),
            TransferError::GenericError => write!(f),

        }
    }
}*/

pub fn NatToToken(num: Nat) -> Tokens {
    if num == new_zero() {
        return Tokens::from_e8s(0);
    }
    let minreturnamout: BigUint = num.clone().into();
    let blocknumvec = minreturnamout.to_u64_digits();
    let blocknum = blocknumvec.get(0).unwrap().clone();
    Tokens::from_e8s(blocknum)
}
pub fn principal_to_subaccount(principal_id: Principal) -> Subaccount {
    let userId = Principal::from(principal_id);
    Subaccount::from(userId)
}

pub fn principal_to_accountidentifier(
    principal_id: Principal,
    canisterId: Principal,
) -> AccountIdentifier {
    let sub = principal_to_subaccount(principal_id);
    AccountIdentifier::new(&Principal::from(canisterId), &sub)
}

pub fn principal_to_account(caller: Principal, owner: Principal) -> Account {
    let sub = principal_to_subaccount(caller);
    Account {
        owner,
        subaccount: Some(sub),
    }
}
pub const DEFAULT_SUBACCOUNT_MY: Subaccount = Subaccount([0; 32]);

pub fn principal_to_account_str(caller: Principal) -> String {
    AccountIdentifier::new(&caller, &DEFAULT_SUBACCOUNT_MY).to_string()
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct SubAccountUser {
    pub sub_account_user: HashMap<Principal, Vec<Principal>>,
}
