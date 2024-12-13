use crate::ic_utils;
use crate::ic_utils::{div_to_f64, nat_to_u64, new_zero, print};
use crate::interface::ioracle::IOracle;
use crate::interface::itoken::{AddrConfig, IToken};
use candid::parser::token::Token::Decimal;
use candid::{Int, Nat, Principal};
use ic_cdk::api::call::CallResult;
use std::ops::{Div, Mul};

use crate::types::common_types::{Operation, SwapTxRecord, TokenTxRecord, TransactionStatus, TX};

pub async fn add_swap_tx(
    pairs: Vec<Principal>,
    directions: u64,
    caller: Principal,
    from_token: Principal,
    to_token: Principal,
    input_amount: f64,
    base_min_return_amount: f64,
    timestamp: u64,
    status: TransactionStatus,
    swap_hash: u64,
) -> CallResult<()> {
    let t = SwapTxRecord {
        pairs: Some(pairs),
        directions: Some(directions),
        caller: Some(caller),
        from_token: Some(from_token),
        to_token: Some(to_token),
        input_amount: Some(input_amount),
        base_min_return_amount: Some(base_min_return_amount),
        receive_amount: None,
        timestamp: timestamp,
        status: status,
        swap_hash: swap_hash,
        swap_hash_str: swap_hash.to_string(),
        price: None,
        volumn: None,
        mt_fee_amount: None,
        mt_fee_volumn: None,
        lp_fee_amount: None,
        lp_fee_volumn: None,
        quote_token_decimals: None,
        fail_msg: None,
        base_price_cumulative_last: None,
        base_reserve: None,
        quote_reserve: None,
        tvl: None,
        pool_version: None,
    };
    add_tx(TX::SwapTx(t)).await
}

pub async fn update_success_swap_tx(
    pairs: Vec<Principal>,
    directions: u64,
    caller: Principal,
    from_token: Principal,
    to_token: Principal,
    input_amount: f64,
    base_min_return_amount: f64,
    swap_hash: u64,
    status: TransactionStatus,
    receive_amount: Option<f64>,
    receive_price: Option<f64>,
    volumn: Option<f64>,
    mt_fee_amount: Option<f64>,
    mt_fee_volumn: Option<f64>,
    lp_fee_amount: Option<f64>,
    lp_fee_volumn: Option<f64>,
    quote_token_decimal: Option<Nat>,
    timestamp: u64,
    fail_msg: Option<String>,
    base_reserve: Option<f64>,
    quote_reserve: Option<f64>,
    base_price_cumulative_last: Option<f64>,
    tvl: Option<f64>,
    pool_version: Option<u8>,
) -> CallResult<()> {
    let t = SwapTxRecord {
        pairs: Some(pairs),
        directions: Some(directions),
        caller: Some(caller),
        from_token: Some(from_token),
        to_token: Some(to_token),
        input_amount: Some(input_amount),
        base_min_return_amount: Some(base_min_return_amount),
        receive_amount: receive_amount,
        timestamp: timestamp,
        status: status,
        swap_hash: swap_hash,
        swap_hash_str: swap_hash.to_string(),
        price: receive_price,
        volumn: volumn,
        mt_fee_amount: mt_fee_amount,
        mt_fee_volumn: mt_fee_volumn,
        lp_fee_amount: lp_fee_amount,
        lp_fee_volumn: lp_fee_volumn,
        quote_token_decimals: quote_token_decimal,
        fail_msg: fail_msg,
        base_price_cumulative_last: base_price_cumulative_last,
        base_reserve: base_reserve,
        quote_reserve: quote_reserve,
        tvl,
        pool_version,
    };
    add_tx(TX::SwapTx(t)).await
}

pub async fn update_swap_tx(
    swap_hash: u64,
    status: TransactionStatus,
    receive_amount: Option<f64>,
    receive_price: Option<f64>,
    volumn: Option<f64>,
    mt_fee_amount: Option<f64>,
    mt_fee_volumn: Option<f64>,
    lp_fee_amount: Option<f64>,
    lp_fee_volumn: Option<f64>,
    quote_token_decimal: Option<Nat>,
    timestamp: u64,
    fail_msg: Option<String>,
) -> CallResult<()> {
    let t = SwapTxRecord {
        pairs: None,
        directions: None,
        caller: None,
        from_token: None,
        to_token: None,
        input_amount: None,
        base_min_return_amount: None,
        receive_amount: receive_amount,
        timestamp: timestamp,
        status: status,
        swap_hash: swap_hash,
        swap_hash_str: swap_hash.to_string(),
        price: receive_price,
        volumn: volumn,
        mt_fee_amount: mt_fee_amount,
        mt_fee_volumn: mt_fee_volumn,
        lp_fee_amount: lp_fee_amount,
        lp_fee_volumn: lp_fee_volumn,
        quote_token_decimals: quote_token_decimal,
        fail_msg: fail_msg,
        base_reserve: None,
        quote_reserve: None,
        base_price_cumulative_last: None,
        tvl: None,
        pool_version: None,
    };
    add_tx(TX::SwapTx(t)).await
}

pub async fn add_token_tx(
    token: Principal,
    caller: Principal,
    op: Operation,
    from: Principal,
    to: Principal,
    amount: Nat,
    timestamp: u64,
    status: TransactionStatus,
    decimals: u8,
    fee: Nat,
) -> CallResult<()> {
    let amount = div_to_f64(amount, decimals);
    let fee = div_to_f64(fee, 18u8);
    let t = TokenTxRecord {
        caller: Some(caller),
        fee,
        from,
        to,
        amount,
        timestamp,
        status,
        operation: op,
        token,
    };
    add_tx(TX::TokenTx(t)).await
}

pub async fn add_tx(tx: TX) -> CallResult<()> {
    let txb: Principal = ic_utils::get_mut::<AddrConfig>().tx_addr;
    let res = ic_cdk::call(txb, "addTx", (tx,)).await;
    match res.clone() {
        Err(v) => {
            print(format!("recored tx faild cause by :{} ", v.1));
        }
        Ok(v) => {
            print("add_tx occured");
        }
    }
    return res;
}
