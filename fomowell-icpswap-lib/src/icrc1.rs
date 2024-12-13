use candid::{Nat, Principal};
use icrc_ledger_types::icrc2::approve::ApproveArgs;
use icrc_ledger_types::{
    icrc1::{
        account::{Account, Subaccount},
        transfer::{TransferArg, TransferError},
    },
    icrc2::approve::ApproveError,
};

pub async fn icrc1_balance_of(ledger: Principal, account: Account) -> Result<u128, String> {
    ic_cdk::call::<(Account,), (u128,)>(ledger, "icrc1_balance_of", (account,))
        .await
        .map(|(balance,)| balance)
        .map_err(|e| format!("Failed to call ledger icrc1_balance_of: {:?}", e))
}

pub async fn icrc1_transfer(ledger: Principal, arg: TransferArg) -> Result<Nat, String> {
    if arg.amount == Nat::from(0u8) {
        return Ok(Nat::from(0u8));
    };
    match ic_cdk::call::<(TransferArg,), (Result<Nat, TransferError>,)>(
        ledger,
        "icrc1_transfer",
        (arg.clone(),),
    )
    .await
    .map_err(|e| format!("Failed to call ledger icrc1_transfer: {:?}", e))?
    .0
    {
        Ok(tx_id) => Ok(tx_id),
        Err(e) => {
            let err_msg = format!(
                "Failed to call Ledger {:?} icrc1_transfer with arg {:?} return error: {:?}",
                ledger.to_text(),
                arg,
                e
            );
            Err(err_msg)?
        }
    }
}

pub async fn icrc2_approve(ledger: Principal, arg: ApproveArgs) -> Result<(), String> {
    match ic_cdk::call::<(ApproveArgs,), (Result<Nat, ApproveError>,)>(
        ledger,
        "icrc2_approve",
        (arg.clone(),),
    )
    .await
    .map_err(|e| format!("Failed to call ledger icrc2_approve: {:?}", e))?
    .0
    {
        Ok(_) => Ok(()),
        Err(e) => {
            let err_msg = format!(
                "Ledger {:?} failed to call icrc2_approve with arg {:?} return error: {:?}",
                ledger.to_text(),
                arg,
                e
            );

            Err(err_msg)
        }
    }
}

pub fn get_sub_account_from_principal(principal_id: Principal) -> Option<Subaccount> {
    let mut subaccount = [0; std::mem::size_of::<Subaccount>()];
    let principal_id = principal_id.as_slice();
    subaccount[0] = principal_id.len().try_into().unwrap();
    subaccount[1..1 + principal_id.len()].copy_from_slice(principal_id);
    Some(subaccount)
}
