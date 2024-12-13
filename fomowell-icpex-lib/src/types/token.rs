use crate::ic_utils::new_zero;
use candid::{CandidType, Deserialize, Nat, Principal};
use serde::Serialize;

#[derive(CandidType, Debug, Clone, Deserialize)]
pub enum PlatformTokenType {
    CERTIFICATION,
    CREATETOKEN,
    IMPORT,
    UNKNOWN,
}

impl From<String> for PlatformTokenType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "CERTIFICATION" => Self::CERTIFICATION,
            "CREATETOKEN" => Self::CREATETOKEN,
            "IMPORT" => Self::IMPORT,
            _ => Self::UNKNOWN,
        }
    }
}

impl ToString for PlatformTokenType {
    fn to_string(&self) -> String {
        match self {
            PlatformTokenType::CERTIFICATION => String::from("CERTIFICATION"),
            PlatformTokenType::CREATETOKEN => String::from("CREATETOKEN"),
            PlatformTokenType::IMPORT => String::from("IMPORT"),
            PlatformTokenType::UNKNOWN => String::from("UNKNOWN"),
        }
    }
}

// 1. 平台上我创建的token;owner==caller and is_platform_token
// 2. 平台上预设的token； enable_delete=false
// 3. 用户导入的token外部token is_user_import=true
// 4. 显示add enable_show=false; 显示delete enable_show=false;
#[derive(Deserialize, Serialize, CandidType, Clone, Debug, PartialEq)]
pub struct TokenInfo {
    pub address: Principal,
    pub token_type: String,
    pub symbol: String,
    pub name: String,
    pub decimals: Nat,
    pub owner: Principal,
    pub logo: String,
    pub platform_token_type: String,
    pub flat_fee: bool,
    pub burn_rate: Nat,
    pub fee_rate: Nat,
    pub flat_burn_fee: bool,
    pub total_supply: Nat,
    pub mint_on: bool,
}

#[derive(Deserialize, CandidType, Clone, Debug, PartialEq)]
pub struct TokenSymbolInfo {
    pub token_type: String,
    pub symbol: String,
    pub decimals: Nat,
    pub platform_token_type: String,
    pub logo: String,
}
/*
#[derive(Deserialize, CandidType, Clone, Debug, PartialEq)]
pub struct TokenBaseShowInfo{
    pub address: Principal,
    pub token_type: String,
    pub symbol:String,
    pub name:String,
    pub decimals: Nat,
    pub owner:Principal,
    pub logo:String,
    pub enable_delete: bool,
    pub enable_show:bool
}*/
