use candid::parser::token::Token;
use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::call::{performance_counter, CallResult, RejectionCode};
use ic_cdk::print;
use ic_ledger_types::Operation::Approve;
use ic_ledger_types::{AccountIdentifier, Subaccount};
use std::collections::HashMap;
use std::fmt::format;
use std::future::Future;
use std::ops::SubAssign;
use std::str::FromStr;
use std::sync::{LockResult, RwLock};

use crate::ic_utils;
use crate::ic_utils::{min_cycles, nat_18, nat_from, nat_to_u64, nat_to_u8, new_zero};
use crate::interface::ibackend::IBackend;
use crate::interface::itoken::TokenType::UNKOWN;
use crate::pmm::div_floor;
use lazy_static::lazy_static;

use crate::types::common_types::{Metadata, TxError, TxReceipt};
use crate::types::icrc2_approve_types::{ApproveArgs, ApproveError};
use crate::types::icrc_type::{
    principal_to_account, principal_to_subaccount, Account, ICRC2AllowanceArg,
    ICRC2AllowanceResult, ICRC2TransferArg, MetadataICRC1, NatToToken, TransferArg, TransferError,
    TransferFromError, TransferFromResult, TransferResult,
};
use crate::types::pool::FeeInfo;
use crate::types::token::{PlatformTokenType, TokenInfo};

// https://docs.dank.ooo/xtc/getting-started/#
pub static XTC: &str = "aanaa-xaaaa-aaaah-aaeiq-cai";
// https://docs.dank.ooo/wicp/getting-started/
pub static WICP: &str = "utozz-siaaa-aaaam-qaaxq-cai";

pub fn get_xtc_addr() -> Principal {
    Principal::from_str(XTC).unwrap()
}

pub fn get_wicp_addr() -> Principal {
    Principal::from_str(WICP).unwrap()
}

lazy_static! {
    static ref TOKENS_INFO: RwLock<HashMap<Principal, TokenInfo>> = RwLock::new(HashMap::new());
    static ref TOKENS_TIME_OUT: RwLock<HashMap<Principal, u64>> = RwLock::new(HashMap::new());
    static ref NONE_TYPE_TOKEN: RwLock<HashMap<Principal, u64>> = RwLock::new(HashMap::new());
}
pub async fn get_token_by_principal(token_addr: &Principal) -> Option<TokenInfo> {
    if !token_exists(token_addr) {
        refresh_token(token_addr.clone()).await;
    }
    let tokens_info = TOKENS_INFO.read().unwrap().clone();
    match tokens_info.get(token_addr) {
        Some(v) => Some(v.clone()),
        None => None,
    }
}

pub async fn get_token_type_by_principal(token_addr: &Principal) -> TokenType {
    if !token_exists(token_addr) {
        print("refresh token!");
        refresh_token(token_addr.clone()).await;
    } else if token_out(token_addr) {
        print("refresh token2!");
        refresh_token(token_addr.clone()).await;
    }
    match TOKENS_INFO.read() {
        Ok(tokens_info) => {
            if let Some(token_addr_info) = tokens_info.get(token_addr) {
                return TokenType::from(token_addr_info.token_type.clone()).clone();
            }
        }
        Err(e) => {
            panic!("read token error {}", e);
        }
    }
    return UNKOWN;
}

pub fn get_token_type_by_principal_without_refresh(token_addr: &Principal) -> TokenType {
    match TOKENS_INFO.read() {
        Ok(tokens_info) => {
            if let Some(token_addr_info) = tokens_info.get(token_addr) {
                return TokenType::from(token_addr_info.token_type.clone()).clone();
            }
        }
        Err(e) => {
            panic!("read token error {}", e);
        }
    }
    return UNKOWN;
}

pub async fn refresh_token(token: Principal) {
    let res: CallResult<(TokenInfo,)> = IBackend::getToken(token).await;
    match res {
        Ok((token_list,)) => {
            let mut tokens_info = TOKENS_INFO.write().unwrap();
            tokens_info.insert(token_list.address.clone(), token_list.clone());
            let mut token_out_times = TOKENS_TIME_OUT.write().unwrap();
            token_out_times.insert(token_list.address.clone(), ic_utils::time());
            // let mut tokens_info_map: HashMap<Principal, TokenInfo> = HashMap::new();
            // for tbi in token_list {
            //     tokens_info_map.insert(tbi.address.clone(), tbi.clone());
            // }
            // *tokens_info = tokens_info_map;
        }
        Err(e) => {
            print(format!(
                "[itoken] refresh_token error e:{:?}",
                e.1.to_string()
            ));
        }
    }
}

pub fn token_exists(token_addr: &Principal) -> bool {
    match TOKENS_INFO.read() {
        Ok(tokens_info) => {
            return tokens_info.get(token_addr).is_some();
        }
        _ => {}
    }
    false
}

pub fn token_out(token_addr: &Principal) -> bool {
    match TOKENS_TIME_OUT.read() {
        Ok(tokens_info) => {
            let zeor = 0;
            let v = tokens_info.get(token_addr).unwrap_or(&zeor);
            let time = ic_utils::time();
            let outtime = v.clone() + 86_400_000_000_000u64;
            if (time > outtime) {
                return true;
            }
            return false;
        }
        _ => {
            return true;
        }
    }
}

pub fn getFeeInfoDto(tokenInfo: TokenInfo) -> FeeInfo {
    FeeInfo {
        flat_fee: tokenInfo.flat_fee,
        flat_burn_fee: tokenInfo.flat_burn_fee,
        fee_rate: tokenInfo.fee_rate,
        burn_rate: tokenInfo.burn_rate,
        total_supply: tokenInfo.total_supply,
        decimals: nat_to_u8(tokenInfo.decimals),
    }
}

pub fn getTokenBaseInfo(token_addr: &Principal) -> TokenInfo {
    let tokens_info = TOKENS_INFO.read().unwrap();
    let token_addr_info = match tokens_info.get(token_addr) {
        Some(v) => v,
        None => {
            panic!("not have token")
        }
    };
    token_addr_info.clone()
}

pub async fn getTokenBaseInfoSafe(token_addr: &Principal) -> Option<TokenInfo> {
    if !token_exists(token_addr) {
        refresh_token(token_addr.clone()).await;
    } else if token_out(token_addr) {
        refresh_token(token_addr.clone()).await;
    }
    let tokens_info = TOKENS_INFO.read().unwrap().clone();
    match tokens_info.get(token_addr) {
        Some(v) => Some(v.clone()),
        None => None,
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct AddrConfig {
    pub backend_addr: Principal,
    pub router_addr: Principal,
    pub icpl_addr: Principal,
    pub oracle_addr: Principal,
    pub tx_addr: Principal,
}

impl Default for AddrConfig {
    fn default() -> Self {
        AddrConfig {
            backend_addr: Principal::anonymous(),
            router_addr: Principal::anonymous(),
            icpl_addr: Principal::anonymous(),
            oracle_addr: Principal::anonymous(),
            tx_addr: Principal::anonymous(),
        }
    }
}

impl AddrConfig {
    fn setBackendAddr(&mut self, backendAddr: Principal) {
        self.backend_addr = backendAddr;
    }

    fn setRouterAddr(&mut self, routerAddr: Principal) {
        self.router_addr = routerAddr;
    }

    fn setIcplAddr(&mut self, icplAddr: Principal) {
        self.icpl_addr = icplAddr;
    }

    fn setOracleAddr(&mut self, oracleAddr: Principal) {
        self.oracle_addr = oracleAddr;
    }
}

#[derive(Deserialize, CandidType)]
pub struct BurnArguments {
    pub canister_id: Principal,
    pub amount: u64,
}

#[derive(CandidType, Debug, Deserialize)]
pub enum BurnError {
    InsufficientBalance,
    InvalidTokenContract,
    NotSufficientLiquidity,
}

pub type TransactionId = u64;

#[derive(CandidType, Debug, Clone, Deserialize)]
pub enum TokenType {
    DIP20,
    EXT,
    ICRC1,
    ICRC2,
    UNKOWN,
}

impl From<String> for TokenType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "DIP20" => Self::DIP20,
            "EXT" => Self::EXT,
            "ICRC-1" => Self::ICRC1,
            "ICRC-2" => Self::ICRC2,
            _ => Self::UNKOWN,
        }
    }
}

impl ToString for TokenType {
    fn to_string(&self) -> String {
        match self {
            TokenType::DIP20 => String::from("DIP20"),
            TokenType::EXT => String::from("EXT"),
            TokenType::ICRC1 => String::from("ICRC-1"),
            TokenType::ICRC2 => String::from("ICRC-2"),
            TokenType::UNKOWN => String::from("unknown"),
        }
    }
}

// dip20 interface
#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct IToken {
    pub cid: Principal,
}

/***
dip20 interface:
      'allowance' : IDL.Func(
          [IDL.Principal, IDL.Principal],
          [IDL.Nat],
          ['query'],
        ),
      'approve' : IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
      'balanceOf' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
      'burn' : IDL.Func([IDL.Nat], [TxReceipt], []),
      'decimals' : IDL.Func([], [IDL.Nat8], ['query']),
      'getAllowanceSize' : IDL.Func([], [IDL.Nat], ['query']),
      'getHolders' : IDL.Func(
          [IDL.Nat, IDL.Nat],
          [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
          ['query'],
        ),
      'getMetadata' : IDL.Func([], [Metadata], ['query']),
      'getTokenFee' : IDL.Func([], [IDL.Nat], ['query']),
      'getTokenInfo' : IDL.Func([], [TokenInfo], ['query']),
      'getUserApprovals' : IDL.Func(
          [IDL.Principal],
          [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
          ['query'],
        ),
      'historySize' : IDL.Func([], [IDL.Nat], ['query']),
      'logo' : IDL.Func([], [IDL.Text], ['query']),
      'mint' : IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
      'name' : IDL.Func([], [IDL.Text], ['query']),
      'setFee' : IDL.Func([IDL.Nat], [], ['oneway']),
      'setFeeTo' : IDL.Func([IDL.Principal], [], ['oneway']),
      'setLogo' : IDL.Func([IDL.Text], [], ['oneway']),
      'setName' : IDL.Func([IDL.Text], [], ['oneway']),
      'setOwner' : IDL.Func([IDL.Principal], [], ['oneway']),
      'symbol' : IDL.Func([], [IDL.Text], ['query']),
      'totalSupply' : IDL.Func([], [IDL.Nat], ['query']),
      'transfer' : IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
      'transferFrom' : IDL.Func(
          [IDL.Principal, IDL.Principal, IDL.Nat],
          [TxReceipt],
          [],
        )

 ext interface
      'allowance' : IDL.Func([AllowanceRequest], [Result_1], ['query']),
      'approve' : IDL.Func([ApproveRequest], [Result_2], []),
      'balance' : IDL.Func([BalanceRequest], [BalanceResponse], ['query']),
      'cycleAvailable' : IDL.Func([], [Result_6], []),
      'cycleBalance' : IDL.Func([], [Result_6], ['query']),
      'extensions' : IDL.Func([], [IDL.Vec(Extension)], ['query']),
      'getFee' : IDL.Func([], [Result_1], ['query']),
      'getRootBucketId' : IDL.Func([], [IDL.Text], ['query']),
      'holders' : IDL.Func([HoldersRequest], [Result_5], ['query']),
      'logo' : IDL.Func([], [Result_4], ['query']),
      'metadata' : IDL.Func([], [Result_3], ['query']),
      'mint' : IDL.Func([MintRequest], [TransferResponse], []),
      'registry' : IDL.Func(
          [],
          [IDL.Vec(IDL.Tuple(AccountIdentifier__1, Balance__1))],
          ['query'],
        ),
      'setFee' : IDL.Func([Balance__1], [Result_2], []),
      'setFeeTo' : IDL.Func([User__1], [Result_2], []),
      'setLogo' : IDL.Func([IDL.Text], [Result_2], []),
      'supply' : IDL.Func([], [Result_1], ['query']),
      'totalHolders' : IDL.Func([], [Result], ['query']),
      'transfer' : IDL.Func([TransferRequest], [TransferResponse], []),
      'transferFrom' : IDL.Func([TransferRequest], [TransferResponse], []),
      'txSize' : IDL.Func([], [IDL.Nat64], []),
 icrc1 interface
    'icrc1_balance_of' : IDL.Func([Account], [Tokens], ['query']),
    'icrc1_decimals' : IDL.Func([], [IDL.Nat8], ['query']),
    'icrc1_metadata' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, Value))],
        ['query'],
      ),
    'icrc1_name' : IDL.Func([], [IDL.Text], ['query']),
    'icrc1_supported_standards' : IDL.Func(
        [],
        [IDL.Vec(IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text }))],
        ['query'],
      ),
    'icrc1_symbol' : IDL.Func([], [IDL.Text], ['query']),
    'icrc1_total_supply' : IDL.Func([], [Tokens], ['query']),
    'icrc1_transfer' : IDL.Func([TransferArg], [TransferResult], []),
 */

impl IToken {
    pub async fn getLocalTokenInfo(&self) -> CallResult<TokenInfo> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => Ok(getTokenBaseInfo(&self.cid)),
            TokenType::ICRC1 => Ok(getTokenBaseInfo(&self.cid)),
            TokenType::ICRC2 => Ok(getTokenBaseInfo(&self.cid)),
            _ => Err((RejectionCode::Unknown, "unspport token type".to_string())),
        }
    }
    pub async fn balance_of(&self, addr: Principal) -> Nat {
        return match self.balance_of_safe(addr.clone()).await {
            Ok((balance,)) => balance,
            Err(v) => {
                panic!("cant get addr balance {}", addr);
            }
        };
    }
    pub async fn balance_of_safe(&self, addr: Principal) -> CallResult<(Nat,)> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => ic_cdk::call(self.cid, "balanceOf", (addr,)).await,
            TokenType::ICRC1 => {
                let account = Account {
                    owner: addr,
                    subaccount: None,
                };
                ic_cdk::call(self.cid, "icrc1_balance_of", (account,)).await
            }
            TokenType::ICRC2 => {
                let account = Account {
                    owner: addr,
                    subaccount: None,
                };
                ic_cdk::call(self.cid, "icrc1_balance_of", (account,)).await
            }
            _ => Err((RejectionCode::Unknown, "unspport token type".to_string())),
        }
    }
    pub async fn transfer_sub(&self, to: Account, value: Nat) -> CallResult<()> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::ICRC1 => {
                let (fee,): (Nat,) = ic_cdk::call(self.cid, "icrc1_fee", ()).await.unwrap();
                if value <= fee {
                    panic!("not have enough amount!")
                }
                let transferArg = TransferArg {
                    to: to,
                    fee: Some(fee.clone()),
                    memo: None,
                    from_subaccount: None,
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: value - fee,
                };
                let (r,): (TransferResult,) =
                    ic_cdk::call(self.cid, "icrc1_transfer", (transferArg,)).await?;
                match r {
                    TransferResult::Err(e) => {
                        Err((RejectionCode::CanisterError, format!("{:?}", e)))
                    }
                    _ => Ok(()),
                }
            }
            _ => todo!(),
        }
    }

    pub async fn transfer(&self, to: Principal, value: Nat, memo: String) -> CallResult<()> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => {
                let (r,): (TxReceipt,) = ic_cdk::call(self.cid, "transfer", (to, value)).await?;
                match r {
                    Ok(_) => Ok(()),
                    Err(e) => {
                        print(format!("DIP20 Transfer_Failed:{:?}", e));
                        Err((
                            RejectionCode::CanisterError,
                            format!("transfer_failed:{:?}", e),
                        ))
                    }
                }
            }
            TokenType::ICRC1 => {
                let transferArg = TransferArg {
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    fee: None,
                    memo: Some(memo.into_bytes()),
                    from_subaccount: None,
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: value,
                };
                let (r,): (TransferResult,) =
                    ic_cdk::call(self.cid, "icrc1_transfer", (transferArg,)).await?;
                match r {
                    TransferResult::Err(e) => {
                        print(format!("ICRC-1 Transfer_Failed:{:?}", e));
                        Err((
                            RejectionCode::CanisterError,
                            format!("transfer_failed:{:?}", e),
                        ))
                    }
                    _ => Ok(()),
                }
            }
            TokenType::ICRC2 => {
                let transferArg = TransferArg {
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    fee: None,
                    memo: Some(memo.into_bytes()),
                    from_subaccount: None,
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: value,
                };
                let (r,): (TransferResult,) =
                    ic_cdk::call(self.cid, "icrc1_transfer", (transferArg,)).await?;
                match r {
                    TransferResult::Err(e) => {
                        print(format!("ICRC-1 Transfer_Failed:{:?}", e));
                        Err((
                            RejectionCode::CanisterError,
                            format!("transfer_failed:{:?}", e),
                        ))
                    }
                    _ => Ok(()),
                }
            }
            _ => todo!(),
        }
    }

    pub async fn isPlatformToken(&self) -> Result<u64, String> {
        let callResult: CallResult<(Nat,)> = ic_cdk::call(self.cid, "icrc_plus_cycles", ()).await;
        match callResult {
            Ok(v) => Ok(nat_to_u64(v.0)),
            Err(e) => Err("not platform token".to_string()),
        }
    }

    pub async fn checkCycles(&self) -> Result<u64, String> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => {
                let token = getTokenBaseInfo(&self.cid);
                if token.platform_token_type == PlatformTokenType::CREATETOKEN.to_string() {
                    let (cycles,): (u64,) = ic_cdk::call(self.cid, "cycles", ()).await.unwrap();
                    if cycles >= min_cycles() {
                        return Ok(cycles);
                    } else {
                        return Err(format!(
                            "token:{}  {} not have enough cycles {}",
                            &self.cid, token.name, &cycles
                        ));
                    }
                } else {
                    return Ok(0u64);
                }
            }
            TokenType::ICRC1 => {
                let token = getTokenBaseInfo(&self.cid);
                if token.platform_token_type == PlatformTokenType::CREATETOKEN.to_string() {
                    let (cycles,): (u64,) = ic_cdk::call(self.cid, "icrc_plus_cycles", ())
                        .await
                        .unwrap();
                    if cycles >= min_cycles() {
                        print(format!("token :{}  cycles:{}", &self.cid, &cycles));
                        return Ok(cycles);
                    } else {
                        return Err(format!(
                            "token:{}  {} not have enough cycles",
                            &self.cid, token.name
                        ));
                    }
                } else {
                    return Ok(0u64);
                }
            }
            TokenType::ICRC2 => {
                let token = getTokenBaseInfo(&self.cid);
                if token.platform_token_type == PlatformTokenType::CREATETOKEN.to_string() {
                    let (cycles,): (Nat,) = ic_cdk::call(self.cid, "icrc_plus_cycles", ())
                        .await
                        .unwrap();
                    let cycles = nat_to_u64(cycles);
                    if cycles >= min_cycles() {
                        print(format!("token :{}  cycles:{}", &self.cid, &cycles));
                        return Ok(cycles);
                    } else {
                        return Err(format!(
                            "token:{}  {} not have enough cycles",
                            &self.cid, token.name
                        ));
                    }
                } else {
                    return Ok(0u64);
                }
            }
            _ => {
                return Ok(0u64);
            }
        }
    }

    pub fn getAmountWithoutFeeQuery(&self, amount: Nat) -> CallResult<Nat> {
        if (amount == new_zero()) {
            return Ok(new_zero());
        }
        match get_token_type_by_principal_without_refresh(&self.cid) {
            TokenType::DIP20 => {
                let token = getTokenBaseInfo(&self.cid);
                let fee_info = getFeeInfoDto(token.clone());
                let mut molecular = new_zero();
                let mut denominator = new_zero();
                let full_amount = amount.clone();
                if fee_info.flat_fee {
                    let fee_rate = fee_info.fee_rate.clone();
                    if full_amount <= fee_rate.clone() {
                        return Err((RejectionCode::CanisterError, format!("full_amount :{},fee_rate:{} ,transfer fee is above transfer amount", full_amount.clone(), fee_rate.clone()).to_string()));
                    }
                    molecular = full_amount - fee_rate.clone();
                    denominator = nat_18();
                } else {
                    molecular = full_amount;
                    denominator = nat_18() + fee_info.fee_rate.clone();
                };
                if fee_info.burn_rate > new_zero() {
                    if fee_info.flat_burn_fee {
                        let burn_rate = fee_info.burn_rate.clone();
                        if molecular <= burn_rate.clone() {
                            return Err((
                                RejectionCode::CanisterError,
                                format!(
                                    "molecular :{},burn_rate:{} ,burn fee is above transfer amount",
                                    molecular.clone(),
                                    burn_rate.clone()
                                )
                                .to_string(),
                            ));
                        }
                        molecular = molecular - burn_rate.clone();
                    } else {
                        denominator = denominator + fee_info.burn_rate.clone();
                    }
                }
                let actual_amount = div_floor(molecular, denominator);
                let fee = (amount.clone() - actual_amount);

                if amount <= fee {
                    return Err((
                        RejectionCode::CanisterError,
                        format!(
                            "dip20 Receive not have enough amount! cause: amount[{}] <= fee[{}]",
                            amount, fee
                        )
                        .to_string(),
                    ));
                }
                let receive_amount = (amount.clone() - fee);
                Ok(receive_amount)
            }
            TokenType::ICRC1 => {
                let tokenInfo = getTokenBaseInfo(&self.cid);
                let fee = tokenInfo.fee_rate;
                /*let (fee, ): (Nat, ) = ic_cdk::call(self.cid, "icrc1_fee", ()).await.unwrap();*/
                if amount <= fee {
                    return Err((
                        RejectionCode::CanisterError,
                        format!(
                            "ICRC1 Receive not have enough amount! cause: amount[{}] <= fee[{}]",
                            amount, fee
                        )
                        .to_string(),
                    ));
                }
                let receive_amount = (amount.clone() - fee);
                Ok(receive_amount)
            }
            TokenType::ICRC2 => {
                let token = getTokenBaseInfo(&self.cid);
                let fee_info = getFeeInfoDto(token.clone());
                let mut molecular = new_zero();
                let mut denominator = new_zero();
                let full_amount = amount.clone();
                if fee_info.flat_fee {
                    let fee_rate = fee_info.fee_rate.clone();
                    if full_amount <= fee_rate.clone() {
                        return Err((RejectionCode::CanisterError, format!("full_amount :{},fee_rate:{} ,transfer fee is above transfer amount", full_amount.clone(), fee_rate.clone()).to_string()));
                    }
                    molecular = full_amount - fee_rate.clone();
                    denominator = nat_18();
                } else {
                    molecular = full_amount;
                    denominator = nat_18() + fee_info.fee_rate.clone();
                };
                if fee_info.burn_rate > new_zero() {
                    if fee_info.flat_burn_fee {
                        let burn_rate = fee_info.burn_rate.clone();
                        if molecular <= burn_rate.clone() {
                            return Err((
                                RejectionCode::CanisterError,
                                format!(
                                    "molecular :{},burn_rate:{} ,burn fee is above transfer amount",
                                    molecular.clone(),
                                    burn_rate.clone()
                                )
                                .to_string(),
                            ));
                        }
                        molecular = molecular - burn_rate.clone();
                    } else {
                        denominator = denominator + fee_info.burn_rate.clone();
                    }
                }
                let actual_amount = div_floor(molecular, denominator);
                let fee = (amount.clone() - actual_amount);

                if amount <= fee {
                    return Err((
                        RejectionCode::CanisterError,
                        format!(
                            "ICRC2 Receive not have enough amount! cause: amount[{}] <= fee[{}]",
                            amount, fee
                        )
                        .to_string(),
                    ));
                }
                let receive_amount = (amount.clone() - fee);
                Ok(receive_amount)
            }
            _ => todo!(),
        }
    }

    pub async fn getAmountWithoutFee(&self, amount: Nat) -> CallResult<Nat> {
        if (amount == new_zero()) {
            return Ok(new_zero());
        }
        get_token_type_by_principal(&self.cid).await;
        return self.getAmountWithoutFeeQuery(amount);
    }

    pub async fn transfer_from(
        &self,
        from: Principal,
        to: Principal,
        value: Nat,
        memo: String,
    ) -> CallResult<()> {
        // print(format!("transfer_from ==> from:{},to:{},value:{},memo:{}", &from, &to, &value, &memo));
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => {
                let r: CallResult<(TxReceipt,)> =
                    ic_cdk::call(self.cid, "transferFrom", (from, to, value)).await;
                match r {
                    Ok((v,)) => match v {
                        Ok(v) => Ok(()),
                        Err(e) => Err((RejectionCode::CanisterError, format!("{:?}", e))),
                    },
                    Err(e) => Err(e),
                }
            }
            TokenType::ICRC1 => {
                let fromAccount = principal_to_subaccount(from.clone());
                let transferArg = TransferArg {
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    fee: None,
                    memo: Some(memo.into_bytes()),
                    from_subaccount: Some(fromAccount),
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: value,
                };
                let (r,): (TransferResult,) =
                    ic_cdk::call(self.cid, "icrc1_transfer", (transferArg,)).await?;
                match r {
                    TransferResult::Err(e) => {
                        // ic_cdk::print(format!("transferError:{:?}", e.clone()));
                        Err((RejectionCode::CanisterError, format!("{:?}", e)))
                    }
                    _ => Ok(()),
                }
            }
            TokenType::ICRC2 => {
                let transferArg = ICRC2TransferArg {
                    from: Account {
                        owner: from,
                        subaccount: None,
                    },
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    amount: value,
                    fee: None,
                    memo: Some(memo.into_bytes()),
                    created_at_time: Some(ic_cdk::api::time()),
                    spender_subaccount: None,
                };
                let (r,): (TransferFromResult,) =
                    ic_cdk::call(self.cid, "icrc2_transfer_from", (transferArg,)).await?;
                match r {
                    TransferFromResult::Err(e) => {
                        // ic_cdk::print(format!("TransferFromError:{:?}", e.clone()));
                        Err((RejectionCode::CanisterError, format!("{:?}", e)))
                    }
                    _ => Ok(()),
                }
            }
            _ => Err((
                RejectionCode::Unknown,
                format!("{:?}", "unsupport transfer token"),
            )),
        }
    }

    pub async fn approve(&self, spender: Principal, value: Nat) -> CallResult<()> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => {
                let (r,): (TxReceipt,) =
                    ic_cdk::call(self.cid, "approve", (spender, value)).await?;
                match r {
                    Ok(_) => Ok(()),
                    Err(e) => Err((RejectionCode::CanisterError, e.to_string())),
                }
            }
            TokenType::ICRC1 => Err((
                RejectionCode::CanisterError,
                "Approve unsupport for ICRC-1".to_string(),
            )),
            TokenType::ICRC2 => {
                let arg = ApproveArgs {
                    from_subaccount: None,
                    spender: Account {
                        owner: spender.clone(),
                        subaccount: None,
                    },
                    amount: value.clone(),
                    expected_allowance: None,
                    expires_at: None,
                    fee: None,
                    memo: None,
                    created_at_time: None,
                };
                let res: CallResult<(Result<Nat, ApproveError>,)> =
                    ic_cdk::call(self.cid, "icrc2_approve", (arg,)).await;
                match res {
                    Ok(_) => Ok(()),
                    Err(v) => Err(v),
                }
            }
            _ => todo!(),
        }
    }

    pub async fn allowance(&self, owner: Principal, spender: Principal) -> CallResult<(Nat,)> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => ic_cdk::call(self.cid, "allowance", (owner, spender)).await,
            TokenType::ICRC1 => {
                let arg = ICRC2AllowanceArg {
                    account: Account {
                        owner: owner,
                        subaccount: None,
                    },
                    spender: Account {
                        owner: spender,
                        subaccount: None,
                    },
                };
                let res: CallResult<(ICRC2AllowanceResult,)> =
                    ic_cdk::call(self.cid, "icrc2_allowance", (arg,)).await;
                Ok((res.unwrap().0.allowance,))
            }
            TokenType::ICRC2 => {
                let arg = ICRC2AllowanceArg {
                    account: Account {
                        owner: owner,
                        subaccount: None,
                    },
                    spender: Account {
                        owner: spender,
                        subaccount: None,
                    },
                };
                let res: CallResult<(ICRC2AllowanceResult,)> =
                    ic_cdk::call(self.cid, "icrc2_allowance", (arg,)).await;
                Ok((res.unwrap().0.allowance,))
            }

            _ => todo!(),
        }
    }

    pub async fn deposit(&self, to: Principal, caller: Principal) -> CallResult<()> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => {
                let (allowanceReceipt,): (TxReceipt,) =
                    ic_cdk::call(self.cid, "allowance", (caller, ic_cdk::api::id())).await?;
                match allowanceReceipt {
                    Ok(allowanceNum) => {
                        if allowanceNum <= new_zero() {
                            return Err((
                                RejectionCode::CanisterError,
                                TxError::InsufficientAllowance.to_string(),
                            ));
                        }
                        let (r,): (TxReceipt,) =
                            ic_cdk::call(self.cid, "transferFrom", (caller, to, allowanceNum))
                                .await?;
                        match r {
                            Ok(_) => Ok(()),
                            Err(e) => Err((RejectionCode::CanisterError, e.to_string())),
                        }
                    }
                    Err(e) => Err((RejectionCode::CanisterError, e.to_string())),
                }
            }
            /*TokenType::ICRC1=> {
                let canister_id = ic::id();
                let account=principal_to_account(caller.clone(),canister_id);
                let (balance,):(Nat,) =ic_cdk::call(self.cid, "icrc1_balance_of", (account, )).await.unwrap();
                let transferArg=TransferArg{
                    to:Account {
                        owner:to,
                        subaccount:None
                    },
                    fee:None,
                    memo:None,
                    from_subaccount:Some(principal_to_subaccount(caller)),
                    created_at_time:Some(ic_cdk::api::time()),
                    amount:NatToToken(balance),
                    // amount:balance
                };
                let (r, ): (TxReceipt, ) = ic_cdk::call(self.cid, "icrc1_transfer", (transferArg,)).await?;
                match r {
                    Ok(_) => { Ok(()) }
                    Err(e) => { Err((RejectionCode::CanisterError, e.to_string())) }
                }

            }*/
            _ => todo!(),
        }
        /*if self.cid == get_xtc_addr() {
            let (r, ): (TxReceipt, ) = ic_cdk::call_with_payment(self.cid, "mint", (to, nat_from(value.clone())), value).await?;
            match r {
                Ok(_) => { Ok(()) }
                Err(e) => { Err((RejectionCode::CanisterError, e.to_string())) }
            }
        } else if self.cid == get_wicp_addr() {
            Err((RejectionCode::CanisterError, "WICP Not support for `deposit`".to_string()))
        } else {
            ic_cdk::call_with_payment(self.cid, "deposit", (), value).await
        }*/
    }

    pub async fn withdraw(&self, to: Principal, value: Nat) -> CallResult<()> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::ICRC1 => {
                let (fee,): (Nat,) = ic_cdk::call(self.cid, "icrc1_fee", ()).await.unwrap();
                ic_cdk::print(format!("withdraw fee:{}", fee.clone()));
                if value <= fee {
                    panic!("not have enough amount!")
                }
                let account = principal_to_subaccount(to.clone());
                let transferArg = TransferArg {
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    fee: Some(fee.clone()),
                    memo: None,
                    from_subaccount: Some(account),
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: value - fee,
                };
                let (r,): (TransferResult,) =
                    ic_cdk::call(self.cid, "icrc1_transfer", (transferArg,)).await?;
                match r {
                    TransferResult::Err(e) => {
                        Err((RejectionCode::CanisterError, format!("{:?}", e)))
                    }
                    _ => Ok(()),
                }
            }
            _ => todo!(),
        }
    }

    pub async fn decimals(&self) -> CallResult<(u8,)> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => ic_cdk::call(self.cid, "decimals", ()).await,
            TokenType::ICRC1 => ic_cdk::call(self.cid, "icrc1_decimals", ()).await,
            TokenType::ICRC2 => ic_cdk::call(self.cid, "icrc1_decimals", ()).await,
            TokenType::EXT => {
                panic!("unsupport ext call ")
            }
            _ => {
                todo!()
            }
        }
    }

    pub async fn total_supply(&self) -> CallResult<(Nat,)> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => ic_cdk::call(self.cid, "totalSupply", ()).await,
            TokenType::ICRC1 => ic_cdk::call(self.cid, "icrc1_total_supply", ()).await,
            TokenType::ICRC2 => ic_cdk::call(self.cid, "icrc1_total_supply", ()).await,
            TokenType::EXT => {
                panic!("unsupport ext call ")
            }
            _ => {
                Err((
                    RejectionCode::CanisterError,
                    format!(
                        "get_token_type_by_principal not have token id :{}",
                        self.cid.clone()
                    ),
                ))
                // panic!("get_token_type_by_principal error id: {}", self.cid.clone());
            }
        }
    }

    pub async fn symbol(&self) -> CallResult<(String,)> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => ic_cdk::call(self.cid, "symbol", ()).await,
            TokenType::ICRC1 => ic_cdk::call(self.cid, "icrc1_symbol", ()).await,
            TokenType::ICRC2 => ic_cdk::call(self.cid, "icrc1_symbol", ()).await,
            TokenType::EXT => {
                panic!("unsupport ext call ")
            }
            _ => todo!(),
        }
    }

    pub async fn name(&self) -> CallResult<(String,)> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => ic_cdk::call(self.cid, "name", ()).await,
            TokenType::ICRC1 => ic_cdk::call(self.cid, "icrc1_name", ()).await,
            TokenType::ICRC2 => ic_cdk::call(self.cid, "icrc1_name", ()).await,
            TokenType::EXT => {
                panic!("unsupport ext call ")
            }
            _ => todo!(),
        }
    }

    pub async fn getMetadata(&self) -> CallResult<(Metadata,)> {
        match get_token_type_by_principal(&self.cid).await {
            TokenType::DIP20 => ic_cdk::call(self.cid, "getMetadata", ()).await,
            TokenType::ICRC1 => ic_cdk::call(self.cid, "icrc1_metadata", ()).await,
            TokenType::ICRC2 => ic_cdk::call(self.cid, "icrc1_metadata", ()).await,
            TokenType::EXT => {
                panic!("unsupport ext call ")
            }
            _ => todo!(),
        }
    }

    pub async fn getTokenInfo(&self, tokenType: String) -> TokenInfo {
        match tokenType.into() {
            TokenType::DIP20 => {
                let (m,): (Metadata,) = ic_cdk::call(self.cid, "getMetadata", ()).await.unwrap();
                let token = TokenInfo {
                    address: self.cid,
                    token_type: TokenType::DIP20.to_string(),
                    symbol: m.symbol,
                    name: m.name,
                    decimals: Nat::from(m.decimals),
                    owner: m.owner,
                    logo: m.logo,
                    flat_fee: true,
                    burn_rate: Nat::from(0),
                    fee_rate: m.fee,
                    flat_burn_fee: true,
                    total_supply: m.totalSupply,
                    mint_on: false,
                    platform_token_type: PlatformTokenType::UNKNOWN.to_string(),
                };
                token
            }
            TokenType::ICRC1 => {
                let (totalSupply,): (Nat,) = ic_cdk::call(self.cid, "icrc1_total_supply", ())
                    .await
                    .unwrap();
                let mut token = TokenInfo {
                    address: self.cid,
                    token_type: TokenType::ICRC1.to_string(),
                    symbol: "".to_string(),
                    name: "".to_string(),
                    decimals: Nat::from(0),
                    owner: Principal::management_canister(),
                    logo: "".to_string(),
                    flat_fee: true,
                    burn_rate: Nat::from(0),
                    fee_rate: Nat::from(0),
                    flat_burn_fee: true,
                    total_supply: totalSupply,
                    mint_on: false,
                    platform_token_type: PlatformTokenType::UNKNOWN.to_string(),
                };
                let (m,): (Vec<(String, MetadataICRC1)>,) =
                    ic_cdk::call(self.cid, "icrc1_metadata", ()).await.unwrap();
                for v in &m {
                    let name = v.clone().0;
                    let v2 = v.clone().1;
                    match v2 {
                        MetadataICRC1::Int(v) => {
                            let vu = match v.to_string().parse::<u8>() {
                                Ok(int_val) => int_val,
                                Err(e) => 0u8,
                            };
                            if name == "icrc1:fee".to_string() {
                                token.fee_rate = Nat::from(vu);
                            } else if name == "icrc1:decimals".to_string() {
                                token.decimals = Nat::from(vu);
                            }
                        }
                        MetadataICRC1::Nat(v) => {
                            if name == "icrc1:fee".to_string() {
                                token.fee_rate = v;
                            } else if name == "icrc1:decimals".to_string() {
                                match v.to_string().parse::<u8>() {
                                    Ok(int_val) => {
                                        token.decimals = Nat::from(int_val);
                                    }
                                    Err(e) => println!("Error: {}", e),
                                };
                            }
                        }
                        MetadataICRC1::Blob(v) => {}
                        MetadataICRC1::Text(v) => {
                            if name == "icrc1:symbol".to_string() {
                                token.symbol = v;
                            } else if name == "icrc1:name".to_string() {
                                token.name = v;
                            } else if name == "icrc1:logo".to_string() {
                                token.logo = v;
                            }
                        }
                    }
                }
                token
            }
            TokenType::EXT => {
                panic!("unsupport ext call ")
            }
            _ => todo!(),
        }
    }

    pub async fn checkToken(&self, tokenType: TokenType) -> String {
        match tokenType {
            TokenType::DIP20 => {
                let (symbol,): (String,) = ic_cdk::call(self.cid, "symbol", ()).await.unwrap();
                symbol
            }
            TokenType::ICRC1 => {
                let (symbol,): (String,) =
                    ic_cdk::call(self.cid, "icrc1_symbol", ()).await.unwrap();
                symbol
            }
            TokenType::EXT => {
                panic!("unsupport ext call ")
            }
            _ => todo!(),
        }
    }

    pub async fn getFeeInfo(&self) -> CallResult<(FeeInfo,)> {
        return ic_cdk::call(self.cid, "getFeeInfo", ()).await;
    }

    pub async fn owner(&self) -> CallResult<(Principal,)> {
        return ic_cdk::call(self.cid, "owner", ()).await;
    }

    pub async fn mint(&self, to: Principal, amount: Nat, tokenType: TokenType) -> CallResult<()> {
        match tokenType {
            TokenType::DIP20 => {
                let (r,): (TxReceipt,) = ic_cdk::call(self.cid, "mint", (to, amount)).await?;
                match r {
                    Ok(_) => Ok(()),
                    Err(e) => {
                        print(format!("DIP20 mint failed:{:?}", e));
                        Err((
                            RejectionCode::CanisterError,
                            format!("DIP20 mint failed:{:?}", e),
                        ))
                    }
                }
            }
            TokenType::ICRC2 => {
                let transferArg = TransferArg {
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    fee: None,
                    memo: None,
                    from_subaccount: None,
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: amount,
                };
                let (r,): (TransferResult,) =
                    ic_cdk::call(self.cid, "icrc1_transfer", (transferArg,)).await?;
                match r {
                    TransferResult::Err(e) => {
                        print(format!("ICRC-1 Transfer_Failed:{:?}", e));
                        Err((
                            RejectionCode::CanisterError,
                            format!("transfer_failed:{:?}", e),
                        ))
                    }
                    _ => Ok(()),
                }
            }
            _ => todo!(),
        }
    }

    pub async fn get_holders_num(&self) -> CallResult<(usize,)> {
        return ic_cdk::call(self.cid, "getHoldersNum", ()).await;
    }
}

// Calculate the fee rate based on the total payment amount.
// For fixed values, subtract from the numerator; for rate values, divide the denominator.
// For example, if the transfer fee is a ratio and the burn_fee is a fixed value, the calculation is:
// actual_amount = (full_amount - burn_fee_rate) / (1 + trans_fee_rate)
pub fn cal_fee_with_full_amount(full_amount: Nat, fee_info: FeeInfo) -> Nat {
    let mut molecular = new_zero();
    let mut denominator = new_zero();
    if fee_info.flat_fee {
        let fee_rate = fee_info.fee_rate.clone();
        if full_amount <= fee_rate.clone() {
            panic!(
                "full_amount :{},fee_rate:{} ,transfer fee is above transfer amount",
                full_amount.clone(),
                fee_rate.clone()
            )
        }
        molecular = full_amount - fee_rate.clone();
        denominator = nat_18();
    } else {
        molecular = full_amount;
        denominator = nat_18() + fee_info.fee_rate.clone();
    };
    if fee_info.burn_rate > new_zero() {
        if fee_info.flat_burn_fee {
            let burn_rate = fee_info.burn_rate.clone();
            if molecular <= burn_rate.clone() {
                panic!("burn fee is above transfer amount")
            }
            molecular = molecular - burn_rate.clone();
        } else {
            denominator = denominator + fee_info.burn_rate.clone();
        }
    }
    div_floor(molecular, denominator)
}
