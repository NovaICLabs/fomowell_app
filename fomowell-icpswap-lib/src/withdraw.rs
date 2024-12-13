use candid::{Nat, Principal};
use ic_cdk::id;

use crate::types::{ICPSwapResult, UserUnusedBalanceResult, WithdrawArgs};

pub async fn withdraw_from_pool(
    args: WithdrawArgs,
    pool_canister: Principal,
) -> Result<Nat, String> {
    match ic_cdk::call::<(WithdrawArgs,), (ICPSwapResult,)>(
        pool_canister,
        "withdraw",
        (args.clone(),),
    )
    .await
    .map_err(|e| format!("Failed to call SwapPool withdraw: {:?}", e))?
    .0
    {
        ICPSwapResult::Ok(balance) => return Ok(balance),
        ICPSwapResult::Err(e) => {
            return Err(format!(
                "Failed to call SwapPool {:?} withdraw with args {:?} return error: {:?}",
                pool_canister.to_text(),
                args,
                e
            ))
        }
    }
}

pub async fn get_unused_balance_from_pool(
    pool_canister: Principal,
    user: Option<Principal>,
) -> Result<Nat, String> {
    let user = match user {
        Some(user) => user,
        None => id(),
    };
    let balance = match ic_cdk::call::<(Principal,), (UserUnusedBalanceResult,)>(
        pool_canister,
        "getUserUnusedBalance",
        (user,),
    )
    .await
    .map_err(|err| format!("Failed to call SwapPool getUserUnusedBalance: {:?}", err))?
    .0
    {
        UserUnusedBalanceResult::Ok(user_unused_balance) => user_unused_balance.balance0,
        UserUnusedBalanceResult::Err(error) => {
            return Err(format!("Get unused balance err: {:?}", error))
        }
    };
    Ok(balance)
}
