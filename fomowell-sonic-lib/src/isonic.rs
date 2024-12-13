use icpex_lib::interface::itoken::AddrConfig;
use crate::types::types::TxReceipt;
use candid::{CandidType, Deserialize, Int, Nat, Principal};
use ic_cdk::api::call::CallResult;

// Sonic interface
#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Sonic {
    pub cid: Principal,
}

impl Sonic {
    pub async fn add_token(token_id: Principal, token_type: String) -> CallResult<(TxReceipt,)> {
        ic_cdk::call(get_sonic_cid(), "addToken", (token_id, token_type)).await
    }

    pub async fn create_pair(token0: Principal, token1: Principal) -> CallResult<(TxReceipt,)> {
        ic_cdk::call(get_sonic_cid(), "createPair", (token0, token1)).await
    }

    pub async fn deposit(token_id: Principal, value: Nat) -> CallResult<(TxReceipt,)> {
        ic_cdk::call(get_sonic_cid(), "deposit", (token_id, value)).await
    }

    pub async fn add_liquidity(
        token0: Principal,
        token1: Principal,
        amount0_desired: Nat,
        amount1_desired: Nat,
        amount0_min: Nat,
        amount1_min: Nat,
        deadline: Int,
    ) -> CallResult<(TxReceipt,)> {
        ic_cdk::call(
            get_sonic_cid(),
            "addLiquidity",
            (
                token0,
                token1,
                amount0_desired,
                amount1_desired,
                amount0_min,
                amount1_min,
                deadline,
            ),
        )
        .await
    }

    pub async fn remove_liquidity(
        token0: Principal,
        token1: Principal,
        lp_amount: Nat,
        amount0_min: Nat,
        amount1_min: Nat,
        deadline: Int,
    ) -> CallResult<(TxReceipt,)> {
        ic_cdk::call(
            get_sonic_cid(),
            "removeLiquidity",
            (token0, token1, lp_amount, amount0_min, amount1_min, deadline),
        )
        .await
    }

    pub async fn withdraw(token_id: Principal, value: Nat) -> CallResult<(TxReceipt,)> {
        ic_cdk::call(get_sonic_cid(), "withdraw", (token_id, value)).await
    }
}

pub fn get_sonic_cid() -> Principal {
    ic_utils::get::<AddrConfig>().sonic_addr
}
