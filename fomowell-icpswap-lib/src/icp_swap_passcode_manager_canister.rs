use candid::{Nat, Principal};

use crate::{
    constants::ICP_LEDGER_FEE,
    types::{ICPSwapResult, PasscodeManagerDepositArgs, RequestPasscodeResult, Token},
};

pub struct ICPSwapPasscodeManager(pub Principal);
impl ICPSwapPasscodeManager {
    pub fn new(icp_swap_passcode_manager_canister: Principal) -> Self {
        Self(icp_swap_passcode_manager_canister)
    }

    pub async fn deposit_creatiton_fee(&self, icp_swap_creation_fee: Nat) -> Result<(), String> {
        let deposit_arg = PasscodeManagerDepositArgs {
            fee: Nat::from(ICP_LEDGER_FEE),
            amount: Nat::from(icp_swap_creation_fee),
        };
        match ic_cdk::call::<(PasscodeManagerDepositArgs,), (ICPSwapResult,)>(
            self.0,
            "deposit",
            (deposit_arg.clone(),),
        )
        .await
        .map_err(|e| format!("Failed to call PasscodeManager deposit: {:?}", e))?
        .0
        {
            ICPSwapResult::Ok(_) => Ok(()),
            ICPSwapResult::Err(e) => {
                return Err(format!(
                    "Failed to call PasscodeManager {:?} deposit with args {:?} return error: {:?}",
                    self.0.to_text(),
                    deposit_arg,
                    e
                ));
            }
        }
    }

    pub async fn reqeust_passcode(
        &self,
        token0: Token,
        token1: Token,
        icp_swap_creation_fee: Nat,
    ) -> Result<(), String> {
        let args = (
            Principal::from_text(token0.address).unwrap(),
            Principal::from_text(token1.address).unwrap(),
            icp_swap_creation_fee,
        );
        match ic_cdk::call::<_, (RequestPasscodeResult,)>(self.0, "requestPasscode", args.clone())
            .await
            .map_err(|e| format!("Failed to call PasscodeManager requestPasscode: {:?}", e))?
            .0
        {
            RequestPasscodeResult::Ok(_) => Ok(()),
            RequestPasscodeResult::Err(e) => {
                let err_msg = format!(
                "Failed to call PasscodeManager {:?} requestPasscode with args {:?} return error: {:?}",
                self.0.to_text(),
                args,
                e
            );
                return Err(err_msg);
            }
        }
    }
}
