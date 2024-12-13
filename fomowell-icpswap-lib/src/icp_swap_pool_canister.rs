use candid::{Nat, Principal};

use crate::types::{
    ICPSwapResult, MintArgs, PoolMetadata, PoolMetadataResult, SwapPoolDepositArgs, Token,
};

pub struct ICPSwapPool(pub Principal);

impl ICPSwapPool {
    pub fn new(pool_canister: Principal) -> Self {
        Self(pool_canister)
    }

    pub async fn metadata(&self) -> Result<PoolMetadata, String> {
        let metadata = match ic_cdk::call::<_, (PoolMetadataResult,)>(self.0, "metadata", ())
            .await
            .map_err(|e| format!("Failed to call Pool metadata: {:?}", e))?
            .0
        {
            PoolMetadataResult::Ok(pool_metadata) => pool_metadata,
            PoolMetadataResult::Err(error) => {
                let err_msg = format!(
                    "Failed to call SwapPool {:?} metadata with args {:?} return error: {:?}",
                    self.0.to_text(),
                    (),
                    error
                );
                return Err(err_msg);
            }
        };
        Ok(metadata)
    }
    pub async fn mint_liqudity(&self, arg: MintArgs) -> Result<(), String> {
        match ic_cdk::call::<(MintArgs,), (ICPSwapResult,)>(self.0, "mint", (arg.clone(),))
            .await
            .map_err(|e| format!("Failed to call SwapPool mint: {:?}", e))?
            .0
        {
            ICPSwapResult::Ok(_) => (),
            ICPSwapResult::Err(e) => {
                return Err(format!(
                    "Failed to call SwapPool {:?} mint with args {:?} return error: {:?}",
                    self.0.to_text(),
                    arg,
                    e
                ))
            }
        };
        Ok(())
    }

    pub async fn deposit(&self, token: Token, fee: u128, amount: u128) -> Result<(), String> {
        let args = SwapPoolDepositArgs {
            fee: Nat::from(fee),
            token: token.address,
            amount: Nat::from(amount),
        };
        match ic_cdk::call::<(SwapPoolDepositArgs,), (ICPSwapResult,)>(
            self.0,
            "deposit",
            (args.clone(),),
        )
        .await
        .map_err(|e| format!("Failed to call Swappool deposit: {:?}", e))?
        .0
        {
            ICPSwapResult::Ok(_) => Ok(()),
            ICPSwapResult::Err(e) => {
                let err_msg = format!(
                    "Failed to call Swappool {:?} deposit with args {:?} return error: {:?}",
                    self.0.to_text(),
                    args,
                    e
                );
                return Err(err_msg);
            }
        }
    }
}
