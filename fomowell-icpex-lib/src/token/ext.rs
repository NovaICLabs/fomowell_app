// This is an experimental feature to generate Rust binding from Candid.
// You may want to manually adjust some of the types.

use candid::{CandidType, Deserialize};
use ic_cdk::api::call::CallResult;

#[derive(CandidType, Deserialize)]
struct File {
    data: Vec<Vec<u8>>,
    ctype: String,
}

#[derive(CandidType, Deserialize)]
struct Asset {
    thumbnail: Option<File>,
    metadata: Option<File>,
    name: String,
    highres: Option<File>,
    payload: File,
}

type SubAccount__1 = Vec<u8>;
type TokenIndex = u32;
type AccountIdentifier__1 = String;
#[derive(CandidType, Deserialize)]
struct Settlement {
    subaccount: SubAccount__1,
    seller: candid::Principal,
    buyer: AccountIdentifier__1,
    price: u64,
}

type TokenIdentifier = String;
type AccountIdentifier = String;
#[derive(CandidType, Deserialize)]
enum User {
    principal(candid::Principal),
    address(AccountIdentifier),
}

#[derive(CandidType, Deserialize)]
pub struct BalanceRequest {
    token: TokenIdentifier,
    user: User,
}

type Balance = candid::Nat;
#[derive(CandidType, Deserialize)]
enum CommonError__1 {
    InvalidToken(TokenIdentifier),
    Other(String),
}

#[derive(CandidType, Deserialize)]
enum BalanceResponse {
    ok(Balance),
    err(CommonError__1),
}

type TokenIdentifier__1 = String;
#[derive(CandidType, Deserialize)]
enum CommonError {
    InvalidToken(TokenIdentifier),
    Other(String),
}

#[derive(CandidType, Deserialize)]
enum Result_7 {
    ok(AccountIdentifier__1),
    err(CommonError),
}

type Time = candid::Int;
#[derive(CandidType, Deserialize)]
struct Listing {
    locked: Option<Time>,
    seller: candid::Principal,
    price: u64,
}

#[derive(CandidType, Deserialize)]
enum Result_8 {
    ok(AccountIdentifier__1, Option<Listing>),
    err(CommonError),
}

type Extension = String;

#[derive(CandidType, Deserialize)]
enum Result_4 {
    ok,
    err(String),
}

#[derive(CandidType, Deserialize)]
struct ListRequest {
    token: TokenIdentifier__1,
    from_subaccount: Option<SubAccount__1>,
    price: Option<u64>,
}

#[derive(CandidType, Deserialize)]
enum Result_3 {
    ok,
    err(CommonError),
}

#[derive(CandidType, Deserialize)]
enum Metadata {
    fungible {
        decimals: u8,
        metadata: Option<Vec<u8>>,
        name: String,
        symbol: String,
    },
    nonfungible {
        metadata: Option<Vec<u8>>,
    },
}

#[derive(CandidType, Deserialize)]
enum Result_6 {
    ok(Metadata),
    err(CommonError),
}

#[derive(CandidType, Deserialize)]
enum Result_5 {
    ok(AccountIdentifier__1, u64),
    err(String),
}

#[derive(CandidType, Deserialize)]
struct SaleTransaction {
    time: Time,
    seller: candid::Principal,
    tokens: Vec<TokenIndex>,
    buyer: AccountIdentifier__1,
    price: u64,
}

#[derive(CandidType, Deserialize)]
struct Sale {
    expires: Time,
    subaccount: SubAccount__1,
    tokens: Vec<TokenIndex>,
    buyer: AccountIdentifier__1,
    price: u64,
}

type Balance__1 = candid::Nat;
#[derive(CandidType, Deserialize)]
enum Result_2 {
    ok(Balance__1),
    err(CommonError),
}

#[derive(CandidType, Deserialize)]
enum Result_1 {
    ok(Vec<TokenIndex>),
    err(CommonError),
}

#[derive(CandidType, Deserialize)]
enum Result {
    ok(Vec<(TokenIndex, Option<Listing>, Option<Vec<u8>>)>),
    err(CommonError),
}

#[derive(CandidType, Deserialize)]
struct Transaction {
    token: TokenIdentifier__1,
    time: Time,
    seller: candid::Principal,
    buyer: AccountIdentifier__1,
    price: u64,
}

type Memo = Vec<u8>;
type SubAccount = Vec<u8>;
#[derive(CandidType, Deserialize)]
struct TransferRequest {
    to: User,
    token: TokenIdentifier,
    notify: bool,
    from: User,
    memo: Memo,
    subaccount: Option<SubAccount>,
    amount: Balance,
}

#[derive(CandidType, Deserialize)]
enum TransferResponse_err {
    CannotNotify(AccountIdentifier),
    InsufficientBalance,
    InvalidToken(TokenIdentifier),
    Rejected,
    Unauthorized(AccountIdentifier),
    Other(String),
}

#[derive(CandidType, Deserialize)]
enum TransferResponse {
    ok(Balance),
    err(TransferResponse_err),
}

struct SERVICE(candid::Principal);

#[allow(dead_code)]
impl SERVICE {
    pub async fn acceptCycles(&self) -> CallResult<()> {
        ic_cdk::call(self.0, "acceptCycles", ()).await
    }

    pub async fn addAsset(&self, arg0: Asset) -> CallResult<(candid::Nat,)> {
        ic_cdk::call(self.0, "addAsset", (arg0,)).await
    }

    pub async fn allPayments(&self) -> CallResult<(Vec<(candid::Principal, Vec<SubAccount__1>)>,)> {
        ic_cdk::call(self.0, "allPayments", ()).await
    }

    pub async fn allSettlements(&self) -> CallResult<(Vec<(TokenIndex, Settlement)>,)> {
        ic_cdk::call(self.0, "allSettlements", ()).await
    }

    pub async fn availableCycles(&self) -> CallResult<(candid::Nat,)> {
        ic_cdk::call(self.0, "availableCycles", ()).await
    }

    pub async fn balance(&self, arg0: BalanceRequest) -> CallResult<(BalanceResponse,)> {
        ic_cdk::call(self.0, "balance", (arg0,)).await
    }

    pub async fn bearer(&self, arg0: TokenIdentifier__1) -> CallResult<(Result_7,)> {
        ic_cdk::call(self.0, "bearer", (arg0,)).await
    }

    pub async fn clearPayments(
        &self,
        arg0: candid::Principal,
        arg1: Vec<SubAccount__1>,
    ) -> CallResult<()> {
        ic_cdk::call(self.0, "clearPayments", (arg0, arg1)).await
    }

    pub async fn details(&self, arg0: TokenIdentifier__1) -> CallResult<(Result_8,)> {
        ic_cdk::call(self.0, "details", (arg0,)).await
    }

    pub async fn extensions(&self) -> CallResult<(Vec<Extension>,)> {
        ic_cdk::call(self.0, "extensions", ()).await
    }

    pub async fn failedSales(&self) -> CallResult<(Vec<(AccountIdentifier__1, SubAccount__1)>,)> {
        ic_cdk::call(self.0, "failedSales", ()).await
    }

    pub async fn getMinter(&self) -> CallResult<(candid::Principal,)> {
        ic_cdk::call(self.0, "getMinter", ()).await
    }

    pub async fn getRegistry(&self) -> CallResult<(Vec<(TokenIndex, AccountIdentifier__1)>,)> {
        ic_cdk::call(self.0, "getRegistry", ()).await
    }

    pub async fn getTokens(&self) -> CallResult<(Vec<(TokenIndex, String)>,)> {
        ic_cdk::call(self.0, "getTokens", ()).await
    }

    pub async fn list(&self, arg0: ListRequest) -> CallResult<(Result_3,)> {
        ic_cdk::call(self.0, "list", (arg0,)).await
    }

    pub async fn listings(&self) -> CallResult<(Vec<(TokenIndex, Listing, Metadata)>,)> {
        ic_cdk::call(self.0, "listings", ()).await
    }

    pub async fn lock(
        &self,
        arg0: TokenIdentifier__1,
        arg1: u64,
        arg2: AccountIdentifier__1,
        arg3: SubAccount__1,
    ) -> CallResult<(Result_7,)> {
        ic_cdk::call(self.0, "lock", (arg0, arg1, arg2, arg3)).await
    }

    pub async fn metadata(&self, arg0: TokenIdentifier__1) -> CallResult<(Result_6,)> {
        ic_cdk::call(self.0, "metadata", (arg0,)).await
    }

    pub async fn payments(&self) -> CallResult<(Option<Vec<SubAccount__1>>,)> {
        ic_cdk::call(self.0, "payments", ()).await
    }

    pub async fn retreive(&self, arg0: AccountIdentifier__1) -> CallResult<(Result_4,)> {
        ic_cdk::call(self.0, "retreive", (arg0,)).await
    }

    pub async fn saleTransactions(&self) -> CallResult<(Vec<SaleTransaction>,)> {
        ic_cdk::call(self.0, "saleTransactions", ()).await
    }

    pub async fn salesSettlements(&self) -> CallResult<(Vec<(AccountIdentifier__1, Sale)>,)> {
        ic_cdk::call(self.0, "salesSettlements", ()).await
    }

    pub async fn salesStats(
        &self,
        arg0: AccountIdentifier__1,
    ) -> CallResult<(Time, u64, candid::Nat)> {
        ic_cdk::call(self.0, "salesStats", (arg0,)).await
    }

    pub async fn setMinter(&self, arg0: candid::Principal) -> CallResult<()> {
        ic_cdk::call(self.0, "setMinter", (arg0,)).await
    }

    pub async fn stats(
        &self,
    ) -> CallResult<(u64, u64, u64, u64, candid::Nat, candid::Nat, candid::Nat)> {
        ic_cdk::call(self.0, "stats", ()).await
    }

    pub async fn supply(&self) -> CallResult<(Result_2,)> {
        ic_cdk::call(self.0, "supply", ()).await
    }

    pub async fn tokens(&self, arg0: AccountIdentifier__1) -> CallResult<(Result_1,)> {
        ic_cdk::call(self.0, "tokens", (arg0,)).await
    }

    pub async fn tokens_ext(&self, arg0: AccountIdentifier__1) -> CallResult<(Result,)> {
        ic_cdk::call(self.0, "tokens_ext", (arg0,)).await
    }

    pub async fn transactions(&self) -> CallResult<(Vec<Transaction>,)> {
        ic_cdk::call(self.0, "transactions", ()).await
    }

    pub async fn transfer(&self, arg0: TransferRequest) -> CallResult<(TransferResponse,)> {
        ic_cdk::call(self.0, "transfer", (arg0,)).await
    }
}
