use crate::ic_utils::{new_zero, require};
use candid::{CandidType, Deserialize, Int, Nat, Principal};
use std::collections::HashMap;

use crate::pmm::{div_floor, mul_floor};
use crate::types::common_types::Metadata;
use crate::types::pool::FeeInfo;

pub type Ba = HashMap<String, Int>;
pub type Balances = HashMap<Principal, Nat>;
pub type Allowances = HashMap<Principal, HashMap<Principal, Nat>>;

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct DIP20 {
    pub logo: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: Nat,
    pub owner: Principal,
    pub fee_to: Principal,
    pub fee_rate: Nat,
    pub burn_rate: Nat,
    pub burn_on: bool,
    pub mint_on: bool,
    pub balances: Balances,
    pub allowances: Allowances,
    pub flat_fee: bool,
    pub flat_burn_fee: bool,
}

impl Default for DIP20 {
    fn default() -> Self {
        DIP20 {
            logo: "".to_string(),
            name: "".to_string(),
            symbol: "".to_string(),
            decimals: 0u8,
            burn_on: false,
            mint_on: false,
            owner: Principal::management_canister(),
            fee_to: Principal::anonymous(),
            total_supply: new_zero(),
            fee_rate: new_zero(),
            burn_rate: new_zero(),
            balances: Balances::default(),
            allowances: Allowances::default(),
            flat_fee: false,
            flat_burn_fee: false,
        }
    }
}

impl DIP20 {
    pub fn get_fee_info(&self) -> FeeInfo {
        let f = FeeInfo {
            flat_fee: self.flat_fee.clone(),
            flat_burn_fee: self.flat_burn_fee.clone(),
            fee_rate: self.fee_rate.clone(),
            burn_rate: self.burn_rate.clone(),
            total_supply: self.total_supply.clone(),
            decimals: self.decimals.clone(),
        };
        f
    }
    pub fn balance_of(&self, id: Principal) -> Nat {
        match self.balances.get(&id) {
            Some(balance) => balance.clone(),
            None => new_zero(),
        }
    }

    pub fn _transfer(&mut self, from: Principal, to: Principal, value: Nat) {
        let from_balance = self.balance_of(from);
        let from_balance_new = from_balance - value.clone();
        if from_balance_new != 0 {
            self.balances.insert(from, from_balance_new);
        } else {
            self.balances.remove(&from);
        }
        let to_balance = self.balance_of(to);
        let to_balance_new = to_balance + value;
        if to_balance_new != 0 {
            self.balances.insert(to, to_balance_new);
        }
    }

    pub fn cal_fee(&self, amount: Nat) -> Nat {
        let mut fee = if self.flat_fee {
            self.fee_rate.clone()
        } else {
            mul_floor(self.fee_rate.clone(), amount.clone())
        };

        if self.burn_on {
            fee + self.cal_burn(amount)
        } else {
            fee
        }
    }

    // to dei address
    pub fn cal_burn(&self, amount: Nat) -> Nat {
        if self.flat_burn_fee {
            self.burn_rate.clone()
        } else {
            mul_floor(self.burn_rate.clone(), amount)
        }
    }

    pub fn _charge_fee(&mut self, user: Principal, fee_to: Principal, fee: Nat, amount: Nat) {
        ic_cdk::print(format!(
            "DIP20 _charge_fee user:{}; fee_to:{}; fee:{}",
            &user, fee_to, fee
        ));
        let mut fee_to_user = fee.clone();
        // 有销毁费先算销毁费
        if self.burn_on {
            let burn_fee = self.cal_burn(amount);
            if burn_fee > new_zero() {
                self._transfer(
                    user.clone(),
                    Principal::management_canister(),
                    burn_fee.clone(),
                );
                fee_to_user = fee.clone() - burn_fee;
            }
        }
        // 再算手续费
        if fee_to_user > new_zero() {
            self._transfer(user, fee_to, fee_to_user);
        }
    }

    pub fn _mint(&mut self, to: Principal, value: Nat) {
        self.total_supply += value.clone();
        let to_balance: Nat = self.balance_of(to);
        let to_balance_new = to_balance.clone() + value;
        if to_balance_new > new_zero() {
            self.balances.insert(to, to_balance_new);
        }
    }

    pub fn _burn(&mut self, from: Principal, value: Nat) {
        let from_balance = self.balance_of(from);
        let from_balance_new = from_balance - value.clone();
        if from_balance_new != 0 {
            self.balances.insert(from, from_balance_new);
        } else {
            self.balances.remove(&from);
        }
        self.total_supply -= value.clone();
    }

    pub fn _approve(&mut self, owner: Principal, spender: Principal, value: Nat) {
        let v = value;
        match self.allowances.get(&owner) {
            Some(inner) => {
                let mut temp = inner.clone();
                if v.clone() != 0 {
                    temp.insert(spender, v.clone());
                    self.allowances.insert(owner, temp);
                } else {
                    temp.remove(&spender);
                    if temp.len() == 0 {
                        self.allowances.remove(&owner);
                    } else {
                        self.allowances.insert(owner, temp);
                    }
                }
            }
            None => {
                if v.clone() != 0 {
                    let mut inner = HashMap::new();
                    inner.insert(spender, v.clone());
                    // let allowances = ic::get_mut::<Allowances>();
                    self.allowances.insert(owner, inner);
                }
            }
        }
    }

    pub fn transfer(&mut self, caller: Principal, to: Principal, value: Nat) -> Result<(), String> {
        ic_cdk::print(format!(
            "DIP20 transfer caller:{}; to:{}; value:{}",
            caller, to, value
        ));
        let from = caller;
        let fee = self.cal_fee(value.clone());
        if self.balance_of(from) < value.clone() + fee.clone() {
            return Err("InsufficientBalance".to_string());
        }
        self._charge_fee(from, self.fee_to, fee.clone(), value.clone());
        self._transfer(from, to, value.clone());
        Ok(())
    }

    pub fn transfer_from(
        &mut self,
        caller: Principal,
        from: Principal,
        to: Principal,
        value: Nat,
    ) -> Result<(), String> {
        let owner = caller;
        let from_allowance = self.allowance(from, owner);
        let fee = self.cal_fee(value.clone());
        if from_allowance < value.clone() + fee.clone() {
            return Err(format!(
                "InsufficientAllowance form_allowance:{},value:{},fee:{}",
                from_allowance, value, fee
            ));
        }
        let from_balance = self.balance_of(from);
        if from_balance < value.clone() + fee.clone() {
            return Err(format!(
                "InsufficientBalance from_balance:{},value:{},fee:{}",
                from_balance, value, fee
            ));
        }
        self._charge_fee(from, self.fee_to.clone(), fee.clone(), value.clone());
        self._transfer(from, to, value.clone());
        match self.allowances.get(&from) {
            Some(inner) => {
                let result = inner.get(&owner).unwrap().clone();
                let mut temp = inner.clone();
                if result.clone() - value.clone() - fee.clone() != new_zero() {
                    temp.insert(owner, result.clone() - value.clone() - fee.clone());
                    self.allowances.insert(from, temp);
                } else {
                    temp.remove(&owner);
                    if temp.len() == 0 {
                        self.allowances.remove(&from);
                    } else {
                        self.allowances.insert(from, temp);
                    }
                }
            }
            None => {
                assert!(false);
            }
        }
        Ok(())
    }

    pub fn approve(&mut self, caller: Principal, spender: Principal, value: Nat) {
        self._approve(caller, spender, value)
    }

    pub fn mint(&mut self, caller: Principal, to: Principal, value: Nat) -> Result<(), String> {
        require(self.mint_on, "MintNotOn".to_string())?;
        require(caller == self.owner, "NotOwner".to_string())?;
        self._mint(to, value);
        Ok(())
    }

    pub fn allowance(&self, owner: Principal, spender: Principal) -> Nat {
        match self.allowances.get(&owner) {
            Some(inner) => match inner.get(&spender) {
                Some(value) => value.clone(),
                None => Nat::from(0),
            },
            None => Nat::from(0),
        }
    }

    pub fn get_holders(&self, start: usize, limit: usize) -> Vec<(Principal, Nat)> {
        let mut balance = Vec::new();
        for (k, v) in self.balances.clone() {
            balance.push((k, v));
        }
        balance.sort_by(|a, b| b.1.cmp(&a.1));
        let limit: usize = if start + limit > balance.len() {
            balance.len() - start
        } else {
            limit
        };
        balance[start..start + limit].to_vec()
    }

    pub fn get_holders_num(&self) -> usize {
        self.balances.len()
    }

    pub fn get_allowance_size(&self) -> usize {
        let mut size = 0;
        for (_, v) in self.allowances.iter() {
            size += v.len();
        }
        size
    }

    pub fn get_user_approvals(&self, who: Principal) -> Vec<(Principal, Nat)> {
        return match self.allowances.get(&who) {
            Some(allow) => Vec::from_iter(allow.clone().into_iter()),
            None => Vec::new(),
        };
    }

    pub fn get_metadata(&self) -> Metadata {
        Metadata {
            logo: self.logo.clone(),
            name: self.name.clone(),
            symbol: self.symbol.clone(),
            decimals: self.decimals.clone(),
            totalSupply: self.total_supply.clone(),
            owner: self.owner.clone(),
            fee: self.fee_rate.clone(),
        }
    }

    // pub fn deposit(&mut self) -> OpStatus {
    //     let amount = ic::msg_cycles_available();
    //     if amount <= 0 { return OpStatus::InsufficientInputAmount; }
    //     let accepted = ic::msg_cycles_accept(amount);
    //     self._mint(ic::caller(), Nat::from(accepted));
    //     OpStatus::OK
    // }
    //
    // pub fn withdraw(&mut self, value: Nat) -> OpStatus {
    //     if value <= Nat::from(0u8) { return OpStatus::InsufficientInputAmount; }
    //     if value > self.balance_of(ic::caller()) { return OpStatus::InsufficientBalance; }
    //     if value > Nat::from(ic::balance()) { return OpStatus::CanisterInsufficientBalance; }
    //     self._burn(ic::caller(), value.clone());
    //     let v: u64 = BigUint::from(value).try_into().unwrap();
    //     system::send_cycles(ic::caller(), v);
    //     return OpStatus::OK;
    // }
}
