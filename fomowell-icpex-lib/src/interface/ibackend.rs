use crate::ic_utils;
use crate::interface::itoken::AddrConfig;
use crate::types::common_types::PrincipalSet;
use crate::types::token::TokenInfo;
use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::call::CallResult;

// backend interface
#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct IBackend {
    pub cid: Principal,
}
impl IBackend {
    pub async fn getToken(token_id: Principal) -> CallResult<(TokenInfo,)> {
        ic_cdk::call(get_cid(), "getToken", (token_id,)).await
    }
    pub async fn createToken(
        name: String,
        logo: String,
        symbol: String,
        decimals: u8,
        total_supply: Nat,
        fee: Nat,
        mint_on: bool,
        burn_rate: Nat,
        flat_fee: bool,
        flat_burn_fee: bool,
        token_type: String,
        fee_account_pid: Option<Principal>,
    ) -> CallResult<(Result<Principal, String>,)> {
        ic_cdk::call(
            get_cid(),
            "createToken",
            (
                name,
                logo,
                symbol,
                decimals,
                total_supply,
                fee,
                mint_on,
                burn_rate,
                flat_fee,
                flat_burn_fee,
                token_type,
                fee_account_pid,
            ),
        )
        .await
    }

    pub async fn getTokenInfo() -> CallResult<(Vec<TokenInfo>,)> {
        ic_cdk::call(get_cid(), "getTokenInfo", ()).await
    }

    pub async fn markIcrc1SubWallet(token_addr: Principal, cid: Principal) -> CallResult<((),)> {
        ic_cdk::call(get_cid(), "markIcrc1SubWallet", (token_addr, cid)).await
    }

    pub async fn getUserSubWalletForRouter(user: Principal) -> CallResult<(PrincipalSet,)> {
        ic_cdk::call(get_cid(), "getUserSubWalletForRouter", (user,)).await
    }
}

pub fn get_cid() -> Principal {
    ic_utils::get::<AddrConfig>().backend_addr
}
