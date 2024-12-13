use candid::{Nat, Principal};
use ic_cdk::{api::time, id};
use icrc_ledger_types::icrc1::{account::Account, transfer::TransferArg};

use crate::{
    constants::{ICP_LEDGER_CANISTER, ICP_LEDGER_FEE},
    icp_swap_calculator_canister::ICPSwapCalculator,
    icp_swap_factory_canister::ICPSwapFactory,
    icp_swap_passcode_manager_canister::ICPSwapPasscodeManager,
    icp_swap_pool_canister::ICPSwapPool,
    icrc1::{get_sub_account_from_principal, icrc1_transfer},
    types::{Env, ICPSwapConfig, LaunchRequestArg, MintArgs},
};

pub async fn launch(env: Env, launch_arg: LaunchRequestArg) -> Result<Principal, String> {
    // get icp_swap_config
    let (icp_swap_calculator, icp_swap_factory, icp_swap_passcode_manager, icp_swap_creation_fee) =
        get_icp_swap_setting(env);

    //1.create icpspwa pool
    //1.1 transfer creation_fee from the caller to PasscodeManager,Use PasscodeManager.requestPasscode to request a passcode for creating a SwapPool.
    icrc1_transfer(
        Principal::from_text(ICP_LEDGER_CANISTER).unwrap(),
        TransferArg {
            from_subaccount: launch_arg.subaccount,
            to: Account {
                owner: icp_swap_passcode_manager.0,
                subaccount: None,
            },
            fee: Some(Nat::from(ICP_LEDGER_FEE)),
            created_at_time: Some(time()),
            memo: None,
            amount: icp_swap_creation_fee.clone(),
        },
    )
    .await?;
    icp_swap_passcode_manager
        .deposit_creatiton_fee(icp_swap_creation_fee.clone())
        .await?;
    //1.2 PasscodeManager.requestPasscode to request a passcode for creating a SwapPool.
    icp_swap_passcode_manager
        .reqeust_passcode(
            launch_arg.token0.token.clone(),
            launch_arg.token1.token.clone(),
            icp_swap_creation_fee.clone(),
        )
        .await?;
    //1.2 getSqrtPriceX96
    let price = launch_arg.token0.balance as f64 / launch_arg.token1.balance as f64;
    let sqrt_price_x96 = icp_swap_calculator
        .get_sqrt_price_x96(price, launch_arg.token0.decimal, launch_arg.token1.decimal)
        .await?;
    //1.3 create pool
    let pool_canister = icp_swap_factory
        .create_pool(
            launch_arg.token0.token.clone(),
            launch_arg.token1.token.clone(),
            icp_swap_creation_fee.clone(),
            sqrt_price_x96.to_string(),
        )
        .await?;
    let icp_swap_pool = ICPSwapPool::new(pool_canister);

    //2.mint liqidity
    //2.1 transfer token0
    icrc1_transfer(
        Principal::from_text(ICP_LEDGER_CANISTER).unwrap(),
        TransferArg {
            from_subaccount: launch_arg.subaccount,
            to: Account {
                owner: pool_canister,
                subaccount: get_sub_account_from_principal(id()),
            },
            fee: Some(Nat::from(launch_arg.token0.fee)),
            created_at_time: Some(time()),
            memo: None,
            amount: Nat::from(launch_arg.token0.balance - launch_arg.token0.fee),
        },
    )
    .await?;

    //2.2 transfer token1
    icrc1_transfer(
        Principal::from_text(ICP_LEDGER_CANISTER).unwrap(),
        TransferArg {
            from_subaccount: launch_arg.subaccount,
            to: Account {
                owner: pool_canister,
                subaccount: get_sub_account_from_principal(id()),
            },
            fee: Some(Nat::from(launch_arg.token1.fee)),
            created_at_time: Some(time()),
            memo: None,
            amount: Nat::from(launch_arg.token1.balance - launch_arg.token1.fee),
        },
    )
    .await?;
    //2.3 pool_canister metadata
    let metadata = icp_swap_pool.metadata().await?;
    //2.4 tick
    let args = (
        metadata.sqrt_price_x96,
        Nat::from(launch_arg.token0.decimal),
        Nat::from(launch_arg.token1.decimal),
    );
    let price = icp_swap_calculator.get_price(args).await?;
    let price_lower = price / 10.0;
    let tick_lower = icp_swap_calculator
        .get_tick(price_lower, icp_swap_creation_fee.clone())
        .await?;
    let price_upper = price * 10.0;
    let tick_upper = icp_swap_calculator
        .get_tick(price_upper, icp_swap_creation_fee.clone())
        .await?;
    //2.5 swap_calculator getPositionTokenAmount
    let (amount0_desired, amount1_desired) =
        if metadata.token0.address == launch_arg.token0.token.clone().address {
            (
                launch_arg.token0.balance - launch_arg.token0.fee,
                launch_arg.token1.balance - launch_arg.token1.fee,
            )
        } else {
            (
                launch_arg.token1.balance - launch_arg.token1.fee,
                launch_arg.token0.balance - launch_arg.token0.fee,
            )
        };
    let args = (
        sqrt_price_x96,
        metadata.tick,
        tick_lower.clone(),
        tick_upper.clone(),
        Nat::from(amount0_desired),
        Nat::from(amount1_desired),
    );
    let position = icp_swap_calculator.get_position_token_amount(args).await?;
    //2.6 pool_canister mint liquidity position
    let args = MintArgs {
        fee: metadata.fee,
        tick_upper: tick_upper,
        tick_lower: tick_lower,
        token0: metadata.token0.address,
        token1: metadata.token1.address,
        amount0_desired: position.amount0.to_string(),
        amount1_desired: position.amount1.to_string(),
    };
    icp_swap_pool.mint_liqudity(args).await?;
    Ok(pool_canister)
}

fn get_icp_swap_setting(
    env: Env,
) -> (
    ICPSwapCalculator,
    ICPSwapFactory,
    ICPSwapPasscodeManager,
    Nat,
) {
    let config = ICPSwapConfig::new(env);
    (
        ICPSwapCalculator::new(config.icp_swap_calculator_canister),
        ICPSwapFactory::new(config.icp_swap_factory_canister),
        ICPSwapPasscodeManager::new(config.icp_swap_passcode_manager_canister),
        Nat::from(config.icp_swap_creation_fee),
    )
}
