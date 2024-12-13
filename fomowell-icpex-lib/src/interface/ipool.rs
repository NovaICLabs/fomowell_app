use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::call::CallResult;

// pmm pool interface
#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct IPMMPool {
    pub cid: Principal,
}

impl IPMMPool {
    pub async fn retrieve(&self, token: Principal, amount: Nat, to: Principal) -> CallResult<()> {
        ic_cdk::call(self.cid, "retrieve", (token, amount, to)).await
    }
    
    pub async fn transfer(&self, token: Principal, to: Principal, amount: Nat) -> CallResult<()> {
        ic_cdk::call(self.cid, "transfer", (token, to, amount)).await
    }
}
