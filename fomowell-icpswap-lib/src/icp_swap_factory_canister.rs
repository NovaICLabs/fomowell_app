use candid::{Nat, Principal};

use crate::types::{CreatePoolArgs, CreatePoolResult, Token};

pub struct ICPSwapFactory(Principal);

impl ICPSwapFactory {
    pub fn new(icp_swap_pool_canister: Principal) -> Self {
        Self(icp_swap_pool_canister)
    }

    pub async fn create_pool(
        &self,
        token0: Token,
        token1: Token,
        icp_swap_creation_fee: Nat,
        sqrt_price_x96: String,
    ) -> Result<Principal, String> {
        let arg = CreatePoolArgs {
            fee: Nat::from(icp_swap_creation_fee),
            sqrtPriceX96: sqrt_price_x96,
            token0,
            token1,
        };
        let pool_canister = match ic_cdk::call::<(CreatePoolArgs,), (CreatePoolResult,)>(
            self.0,
            "createPool",
            (arg.clone(),),
        )
        .await
        .map_err(|e| format!("Failed to call SwapFactory createPool: {:?}", e))?
        .0
        {
            CreatePoolResult::Ok(data) => Ok(data.canisterId),
            CreatePoolResult::Err(e) => {
                let err_msg = format!(
                    "Failed to call SwapFactory {:?} createPool with args {:?} return error: {:?}",
                    self.0.to_text(),
                    arg,
                    e
                );
                Err(err_msg)
            }
        }?;
        Ok(pool_canister)
    }
}
