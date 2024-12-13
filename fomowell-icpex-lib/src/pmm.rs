use std::any::Any;
use std::fmt::format;
use std::ops::{Add, Div, Mul};
use std::str::FromStr;

use candid::{CandidType, Deserialize, Nat};
use ic_cdk::print;
use num_bigint::BigUint;

use crate::ic_utils::{nat_18, nat_36, nat_from, new_zero};

#[derive(PartialEq, CandidType, Deserialize, Clone, Debug)]
pub enum RState {
    ONE,
    AboveOne,
    BelowOne,
}

impl From<String> for RState {
    fn from(value: String) -> Self {
        match value.as_str() {
            "ONE" => Self::ONE,
            "AboveOne" => Self::AboveOne,
            "BelowOne" => Self::BelowOne,
            _ => panic!("RState from error!"),
        }
    }
}

impl std::fmt::Display for RState {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(CandidType, Deserialize, Clone)]
pub struct PMMState {
    pub i: Nat,
    pub k: Nat,
    pub b: Nat,
    pub q: Nat,
    pub b0: Nat,
    pub q0: Nat,
    pub r: RState,
    pub base_decimal: u8,
    pub quote_decimal: u8,
}

impl ToString for PMMState {
    fn to_string(&self) -> String {
        format!(
            "PMMState {{ i:{},k:{},b:{},q:{},b0:{},q0:{},r:{}  }}",
            self.i, self.k, self.b, self.q, self.b0, self.q0, self.r
        )
    }
}

pub fn d_div_ceil(a: Nat, b: Nat) -> Nat {
    let quotient = a.clone() / b.clone();
    let remainder = a - quotient.clone() * b;
    return if remainder > new_zero() {
        quotient + Nat::from(1u8)
    } else {
        quotient
    };
}

pub fn mul_floor(target: Nat, d: Nat) -> Nat {
    target * d / nat_18()
}

pub fn mul_floor36(target: Nat, d: Nat) -> Nat {
    target * d / nat_36()
}

pub fn mul_floor54(target: Nat, d: Nat) -> Nat {
    target * d / nat_36() / nat_18()
}

pub fn mul_ceil(target: Nat, d: Nat) -> Nat {
    d_div_ceil(target * d, nat_18())
}

pub fn div_floor(target: Nat, d: Nat) -> Nat {
    target * nat_18() / d
}

pub fn div_floor36(target: Nat, d: Nat) -> Nat {
    target * nat_36() / d
}

pub fn div_ceil(target: Nat, d: Nat) -> Nat {
    d_div_ceil(target * nat_18(), d)
}

pub fn reciprocal_floor(target: Nat) -> Nat {
    nat_36() / target
}

pub fn reciprocal_ceil(target: Nat) -> Nat {
    d_div_ceil(nat_36(), target)
}

pub fn pow_floor(target: Nat, e: Nat) -> Nat {
    return if e == new_zero() {
        nat_18()
    } else if e == Nat::from(1u8) {
        target
    } else {
        let mut p = pow_floor(target.clone(), e.clone() / Nat::from(2u8));
        p = p.clone() * p / nat_18();
        if e % Nat::from(2u8) == Nat::from(1u8) {
            p = p * target / nat_18();
        }
        p
    };
}

fn _general_integrate(v0: Nat, v1: Nat, v2: Nat, i: Nat, k: Nat) -> Nat {
    assert!(v0 > new_zero(), "TARGET_IS_ZERO");
    let fair_amount = i * (v1.clone() - v2.clone());
    if k == new_zero() {
        return fair_amount / nat_18();
    }
    let v0v0v1v2 = div_floor(v0.clone() * v0.clone() / v1.clone(), v2.clone());
    let penalty = mul_floor(k.clone(), v0v0v1v2);
    (nat_18() - k + penalty) * fair_amount / nat_36()
}

fn _solve_quadratic_function_for_target(v1: Nat, delta: Nat, i: Nat, k: Nat) -> Nat {
    if k == new_zero() {
        return v1 + mul_floor(i, delta);
    }
    // V0 = V1*(1+(sqrt-1)/2k)
    // sqrt = √(1+4kidelta/V1)
    // premium = 1+(sqrt-1)/2k
    // uint256 sqrt = (4 * k).mul(i).mul(delta).div(V1).add(DecimalMath.ONE2).sqrt();

    let sqrt;
    let ki = Nat::from(4u8) * k.clone() * i.clone();
    if ki == new_zero() {
        sqrt = nat_18();
    } else if ki.clone() * delta.clone() / ki.clone() == delta {
        print("equal");
        sqrt = Nat::from(BigUint::from(ki.clone() * delta.clone() / v1.clone() + nat_36()).sqrt());
    } else {
        print("not equal");
        sqrt = Nat::from(BigUint::from(ki.clone() / v1.clone() * delta.clone() + nat_36()).sqrt());
    }
    let premium = div_floor(sqrt.clone() - nat_18(), k.clone() * Nat::from(2u8)) + nat_18();
    print(format!(
        "v1:{},delta:{},i:{},k:{},ki:{},sqrt:{},premium:{}",
        v1, delta, i, k, ki, sqrt, premium
    ));
    mul_floor(v1, premium)
}

/*
    Follow the integration expression above, we have:
    i*deltaB = (Q2-Q1)*(1-k+kQ0^2/Q1/Q2)
    Given Q1 and deltaB, solve Q2
    This is a quadratic function and the standard version is
    aQ2^2 + bQ2 + c = 0, where
    a=1-k
    -b=(1-k)Q1-kQ0^2/Q1+i*deltaB
    c=-kQ0^2
    and Q2=(-b+sqrt(b^2+4(1-k)kQ0^2))/2(1-k)
    note: another root is negative, abondan

    if deltaBSig=true, then Q2>Q1, user sell Q and receive B
    if deltaBSig=false, then Q2<Q1, user sell B and receive Q
    return |Q1-Q2|

    as we only support sell amount as delta, the deltaB is always negative
    the input ideltaB is actually -ideltaB in the equation

    i is the price of delta-V trading pair

    support k=1 & k=0 case

    [round down]
*/
fn _solve_quadratic_function_for_trade(v0: Nat, v1: Nat, delta: Nat, i: Nat, k: Nat) -> Nat {
    assert!(v0 > new_zero(), "TARGET_IS_ZERO");
    if delta == new_zero() {
        return new_zero();
    }

    if k == new_zero() {
        let t = mul_floor(i, delta);
        return if t > v1 { v1 } else { t };
    }

    // if k==1
    // Q2=Q1/(1+ideltaBQ1/Q0/Q0)
    // temp = ideltaBQ1/Q0/Q0
    // Q2 = Q1/(1+temp)
    // Q1-Q2 = Q1*(1-1/(1+temp)) = Q1*(temp/(1+temp))
    // uint256 temp = i.mul(delta).mul(V1).div(V0.mul(V0));
    if k == nat_18() {
        let temp;
        let i_delta = i.clone().mul(delta.clone());
        if i_delta == new_zero() {
            temp = new_zero().clone();
        } else if i_delta.clone().mul(v1.clone()).div(i_delta.clone()) == v1.clone() {
            temp = i_delta
                .clone()
                .mul(v1.clone())
                .div(v0.clone().mul(v0.clone()));
        } else {
            temp = delta
                .clone()
                .mul(v1.clone())
                .div(v0.clone())
                .mul(i.clone())
                .div(v0.clone());
        }
        return v1.clone().mul(temp.clone()).div(temp.clone().add(nat_18()));
    }

    let part2 = k.clone() * v0.clone() / v1.clone() * v0.clone() + i.clone() * delta.clone();
    let mut b_abs = (nat_18() - k.clone()) * v1.clone();
    let b_sig;
    if b_abs >= part2 {
        b_abs = b_abs - part2;
        b_sig = false;
    } else {
        b_abs = part2 - b_abs;
        b_sig = true;
    }
    b_abs = b_abs.clone() / nat_18();
    let mut square_root = mul_floor(
        (nat_18() - k.clone()) * Nat::from(4u8),
        mul_floor(k.clone(), v0.clone()) * v0.clone(),
    );
    square_root = Nat::from(BigUint::from(b_abs.clone() * b_abs.clone() + square_root).sqrt());
    let denominator = (nat_18() - k.clone()) * Nat::from(2u8);
    let numerator = if b_sig {
        square_root - b_abs.clone()
    } else {
        b_abs.clone() + square_root
    };
    let v2 = div_ceil(numerator, denominator);
    return if v2 > v1 { new_zero() } else { v1.clone() - v2 };
}

pub fn sell_base_token(state: PMMState, pay_base_amount: Nat) -> (Nat, RState) {
    let adjust = DecimalAdjust {
        before_decimals: state.base_decimal,
        after_decimals: state.quote_decimal,
    };
    return if state.r == RState::ONE {
        let receive_quote_amount = _solve_quadratic_function_for_trade(
            state.q0.clone(),
            state.q0.clone(),
            adjust.adjust_decimal(pay_base_amount),
            state.i,
            state.k,
        );
        (receive_quote_amount, RState::BelowOne)
    } else if state.r == RState::AboveOne {
        print(format!(
            "sell_base_token b0:{},b:{},q:{},qo:{}",
            state.b0.clone(),
            state.b.clone(),
            state.q.clone(),
            state.q0.clone()
        ));
        let back_to_one_pay_base = state.b0.clone() - state.b.clone();
        let back_to_one_receive_quote = state.q.clone() - state.q0.clone();
        let mut receive_quote_amount;
        let new_r;
        print(format!(
            "pay_base_amount:{},back_to_one_pay_base:{},back_to_one_receive_quote:{}",
            pay_base_amount, back_to_one_pay_base, back_to_one_receive_quote
        ));
        if pay_base_amount < back_to_one_pay_base {
            print(format!(
                "adjust b0:{}",
                adjust.adjust_decimal(state.b0.clone())
            ));
            receive_quote_amount = _general_integrate(
                adjust.adjust_decimal(state.b0.clone()),
                adjust.adjust_decimal(state.b.clone())
                    + adjust.adjust_decimal(pay_base_amount.clone()),
                adjust.adjust_decimal(state.b.clone()),
                state.i,
                state.k,
            );
            if receive_quote_amount > back_to_one_receive_quote {
                receive_quote_amount = back_to_one_receive_quote;
            }
            new_r = RState::AboveOne
        } else if pay_base_amount == back_to_one_pay_base {
            receive_quote_amount = back_to_one_receive_quote;
            new_r = RState::ONE;
        } else {
            receive_quote_amount = back_to_one_receive_quote
                + _solve_quadratic_function_for_trade(
                    state.q0.clone(),
                    state.q0.clone(),
                    adjust.adjust_decimal(pay_base_amount.clone())
                        - adjust.adjust_decimal(back_to_one_pay_base),
                    state.i,
                    state.k,
                );
            new_r = RState::BelowOne;
        }
        (receive_quote_amount, new_r)
    } else {
        let receive_quote_amount = _solve_quadratic_function_for_trade(
            state.q0.clone(),
            state.q.clone(),
            adjust.adjust_decimal(pay_base_amount),
            state.i,
            state.k,
        );
        (receive_quote_amount, RState::BelowOne)
    };
}

pub fn sell_quote_token(state: PMMState, pay_quote_amount: Nat) -> (Nat, RState) {
    let adjust = DecimalAdjust {
        before_decimals: state.quote_decimal,
        after_decimals: state.base_decimal,
    };
    return if state.r == RState::ONE {
        let mut receive_base_amount = _solve_quadratic_function_for_trade(
            state.b0.clone(),
            state.b0.clone(),
            adjust.adjust_decimal(pay_quote_amount),
            reciprocal_floor(state.i),
            state.k,
        );
        (receive_base_amount, RState::AboveOne)
    } else if state.r == RState::AboveOne {
        let receive_base_amount = _solve_quadratic_function_for_trade(
            state.b0.clone(),
            state.b.clone(),
            adjust.adjust_decimal(pay_quote_amount),
            reciprocal_floor(state.i),
            state.k,
        );
        (receive_base_amount, RState::AboveOne)
    } else {
        let back_to_one_pay_quote = state.q0.clone() - state.q.clone();
        let back_to_one_receive_base = state.b.clone() - state.b0.clone();
        let mut receive_base_amount;
        let new_r;
        print(format!(
            "back_to_one_pay_quote:{},back_to_one_receive_base:{}",
            back_to_one_pay_quote, back_to_one_receive_base
        ));
        if pay_quote_amount < back_to_one_pay_quote {
            print(format!("q0:{}", state.q0.clone()));
            receive_base_amount = _general_integrate(
                adjust.adjust_decimal(state.q0.clone()),
                adjust.adjust_decimal(state.q.clone().clone())
                    + adjust.adjust_decimal(pay_quote_amount.clone()),
                adjust.adjust_decimal(state.q.clone().clone()),
                reciprocal_floor(state.i),
                state.k,
            );
            if receive_base_amount > back_to_one_receive_base {
                receive_base_amount = back_to_one_receive_base;
            }
            new_r = RState::BelowOne;
        } else if pay_quote_amount == back_to_one_receive_base {
            receive_base_amount = back_to_one_receive_base;
            new_r = RState::ONE;
        } else {
            receive_base_amount = back_to_one_receive_base
                + _solve_quadratic_function_for_trade(
                    state.b0.clone(),
                    state.b0.clone(),
                    adjust.adjust_decimal(pay_quote_amount)
                        - adjust.adjust_decimal(back_to_one_pay_quote.clone()),
                    reciprocal_floor(state.i),
                    state.k,
                );
            new_r = RState::AboveOne;
        }
        (receive_base_amount, new_r)
    };
}

pub fn adjusted_target(state: &mut PMMState) {
    if state.r == RState::BelowOne {
        let ad = DecimalAdjust {
            before_decimals: state.base_decimal,
            after_decimals: state.quote_decimal,
        };
        let q0_before = state.q0.clone();
        print(format!(
            "adjusted_target b:{} b0:{}",
            state.b.clone(),
            state.b0.clone()
        ));
        state.q0 = _solve_quadratic_function_for_target(
            state.q.clone(),
            ad.adjust_decimal(state.b.clone() - state.b0.clone()),
            state.i.clone(),
            state.k.clone(),
        );
        print(format!("q0 adjust from {} to {}", q0_before, state.q0));
    } else if state.r == RState::AboveOne {
        let ad = DecimalAdjust {
            before_decimals: state.quote_decimal,
            after_decimals: state.base_decimal,
        };
        let b0_before = state.b0.clone();
        print(format!(
            "adjusted_target q:{} q0:{}",
            state.q.clone(),
            state.q0.clone()
        ));
        state.b0 = _solve_quadratic_function_for_target(
            state.b.clone(),
            ad.adjust_decimal(state.q.clone() - state.q0.clone()),
            reciprocal_floor(state.i.clone()),
            state.k.clone(),
        );
        print(format!("b0 adjust from {} to {}", b0_before, state.b0));
    }
}

pub fn get_mid_price(state: PMMState, decimals: u8) -> Nat {
    return if state.r == RState::BelowOne {
        print(format!(" Below ,state:{}", state.to_string()));
        if state.q == new_zero() {
            return new_zero();
        }
        let mut r = div_floor(
            state.q0.clone() * state.q0.clone() / state.q.clone(),
            state.q.clone(),
        );
        print(format!("r1:{}", r));
        r = nat_18() - state.k.clone() + mul_floor(state.k.clone(), r);
        print(format!("r2:{}", r));
        mul_floor36(Nat::from(10u128.pow(decimals as u32)) * state.i.clone(), r)
    } else {
        print(format!("Not Below ,state:{}", state.to_string()));
        if state.b == new_zero() {
            return new_zero();
        }
        let mut r = div_floor(
            state.b0.clone() * state.b0.clone() / state.b.clone(),
            state.b.clone(),
        );
        print(format!("r1:{}", r));
        r = nat_18() - state.k.clone() + mul_floor(state.k.clone(), r);
        print(format!("r2:{}", r));
        mul_floor36(Nat::from(10u128.pow(decimals as u32)) * state.i.clone(), r)
    };
}

pub fn sell_base_token_v1(state: PMMState, pay_base_amount: Nat) -> (Nat, RState) {
    return if state.r == RState::ONE {
        let receive_quote_amount = _solve_quadratic_function_for_trade(
            state.q0.clone(),
            state.q0.clone(),
            pay_base_amount.clone(),
            state.i,
            state.k,
        );
        (receive_quote_amount, RState::BelowOne)
    } else if state.r == RState::AboveOne {
        let back_to_one_pay_base = state.b0.clone() - state.b.clone();
        let back_to_one_receive_quote = state.q.clone() - state.q0.clone();
        let mut receive_quote_amount;
        let new_r;
        print(format!(
            "back_to_one_pay_base:{},back_to_one_receive_quote:{}",
            back_to_one_pay_base, back_to_one_receive_quote
        ));
        if pay_base_amount < back_to_one_pay_base {
            receive_quote_amount = _general_integrate(
                state.b0.clone(),
                state.b.clone() + pay_base_amount.clone(),
                state.b.clone(),
                state.i,
                state.k,
            );
            if receive_quote_amount > back_to_one_receive_quote {
                receive_quote_amount = back_to_one_receive_quote;
            }
            new_r = RState::AboveOne
        } else if pay_base_amount == back_to_one_pay_base {
            receive_quote_amount = back_to_one_receive_quote;
            new_r = RState::ONE;
        } else {
            receive_quote_amount = back_to_one_receive_quote
                + _solve_quadratic_function_for_trade(
                    state.q0.clone(),
                    state.q0.clone(),
                    pay_base_amount.clone() - back_to_one_pay_base,
                    state.i,
                    state.k,
                );
            new_r = RState::BelowOne;
        }
        (receive_quote_amount, new_r)
    } else {
        let receive_quote_amount = _solve_quadratic_function_for_trade(
            state.q0.clone(),
            state.q.clone(),
            pay_base_amount.clone(),
            state.i,
            state.k,
        );
        (receive_quote_amount, RState::BelowOne)
    };
}

pub fn sell_quote_token_v1(state: PMMState, pay_quote_amount: Nat) -> (Nat, RState) {
    return if state.r == RState::ONE {
        let receive_base_amount = _solve_quadratic_function_for_trade(
            state.b0.clone(),
            state.b0.clone(),
            pay_quote_amount,
            reciprocal_floor(state.i),
            state.k,
        );
        (receive_base_amount, RState::AboveOne)
    } else if state.r == RState::AboveOne {
        let receive_base_amount = _solve_quadratic_function_for_trade(
            state.b0.clone(),
            state.b.clone(),
            pay_quote_amount,
            reciprocal_floor(state.i),
            state.k,
        );
        (receive_base_amount, RState::AboveOne)
    } else {
        let back_to_one_pay_quote = state.q0.clone() - state.q.clone();
        let back_to_one_receive_base = state.b.clone() - state.b0.clone();
        let mut receive_base_amount;
        let new_r;
        print(format!(
            "back_to_one_pay_quote:{},back_to_one_receive_base:{}",
            back_to_one_pay_quote, back_to_one_receive_base
        ));
        if pay_quote_amount < back_to_one_pay_quote {
            print(format!("q0:{}", state.q0.clone()));
            receive_base_amount = _general_integrate(
                state.q0.clone(),
                state.q.clone() + pay_quote_amount,
                state.q.clone(),
                reciprocal_floor(state.i),
                state.k,
            );
            if receive_base_amount > back_to_one_receive_base {
                receive_base_amount = back_to_one_receive_base;
            }
            new_r = RState::BelowOne;
        } else if pay_quote_amount == back_to_one_receive_base {
            receive_base_amount = back_to_one_receive_base;
            new_r = RState::ONE;
        } else {
            receive_base_amount = back_to_one_receive_base
                + _solve_quadratic_function_for_trade(
                    state.b0.clone(),
                    state.b0.clone(),
                    pay_quote_amount - back_to_one_pay_quote,
                    reciprocal_floor(state.i),
                    state.k,
                );
            new_r = RState::AboveOne;
        }
        (receive_base_amount, new_r)
    };
}

pub fn adjusted_target_v1(state: &mut PMMState) {
    if state.r == RState::BelowOne {
        let q0_before = state.q0.clone();
        state.q0 = _solve_quadratic_function_for_target(
            state.q.clone(),
            state.b.clone() - state.b0.clone(),
            state.i.clone(),
            state.k.clone(),
        );
        print(format!("q0 adjust from {} to {}", q0_before, state.q0));
    } else if state.r == RState::AboveOne {
        let b0_before = state.b0.clone();
        state.b0 = _solve_quadratic_function_for_target(
            state.b.clone(),
            state.q.clone() - state.q0.clone(),
            reciprocal_floor(state.i.clone()),
            state.k.clone(),
        );
        print(format!("b0 adjust from {} to {}", b0_before, state.b0));
    }
}

pub fn get_mid_price_v1(state: PMMState, decimals: u8) -> Nat {
    return if state.r == RState::BelowOne {
        print(format!(" Below ,state:{}", state.to_string()));
        if state.q == new_zero() {
            return new_zero();
        }
        let mut r = div_floor(
            state.q0.clone() * state.q0.clone() / state.q.clone(),
            state.q.clone(),
        );
        print(format!("r1:{}", r));
        r = nat_18() - state.k.clone() + mul_floor(state.k.clone(), r);
        print(format!("r2:{}", r));
        div_floor(
            Nat::from(10u128.pow((state.base_decimal + decimals) as u32)) * state.i.clone(),
            r,
        )
        .div(nat_18())
    } else {
        print(format!("Not Below ,state:{}", state.to_string()));
        if state.b == new_zero() {
            return new_zero();
        }
        let mut r = div_floor(
            state.b0.clone() * state.b0.clone() / state.b.clone(),
            state.b.clone(),
        );
        print(format!("r1:{}", r));
        r = nat_18() - state.k.clone() + mul_floor(state.k.clone(), r);
        print(format!("r2:{}", r));
        mul_floor(
            Nat::from(10u128.pow((state.base_decimal + decimals) as u32)) * state.i.clone(),
            r,
        )
        .div(nat_18())
    };
}

pub fn slippage_check(
    base_in_amount: Nat,
    quote_in_amount: Nat,
    input_base_amount: Nat,
    input_quote_amount: Nat,
    slippage: Nat,
) {
    // print(format!("base_in_amount:{},input_base_amount:{},quote_in_amount:{},input_quote_amount:{},slippage:{}", &base_in_amount, &input_base_amount, &quote_in_amount, &input_quote_amount, &slippage));
    if base_in_amount > new_zero() {
        let min_base_amount = mul_floor(base_in_amount.clone(), nat_18() - slippage.clone());
        let max_base_amount = mul_floor(base_in_amount.clone(), nat_18() + slippage.clone());
        // print(format!("min_base_amount:{},max_base_amount:{}",&min_base_amount,&max_base_amount));
        if input_base_amount < min_base_amount {
            panic!("slippage check failed: fell below the minimum slippage limit({}) for the base token amount.", min_base_amount.to_string())
        }
        if input_base_amount > max_base_amount {
            panic!("slippage check failed: exceeded the maximum slippage limit{}) for the base token amount.", max_base_amount.to_string())
        }
    }
    if quote_in_amount > new_zero() {
        let min_quote_amount = mul_floor(quote_in_amount.clone(), nat_18() - slippage.clone());
        let max_quote_amount = mul_floor(quote_in_amount.clone(), nat_18() + slippage.clone());
        // print(format!("min_quote_amount:{},max_quote_amount:{}",&min_quote_amount,&max_quote_amount));
        if input_quote_amount < min_quote_amount {
            panic!("slippage check failed: fell below the minimum slippage limit{}) for the quote token amount.", min_quote_amount.to_string())
        }
        if input_quote_amount > max_quote_amount {
            panic!("slippage check failed: exceeded the maximum slippage limit{}) for the quote token amount.", max_quote_amount.to_string())
        }
    }
}

pub struct DecimalAdjust {
    pub before_decimals: u8,
    pub after_decimals: u8,
}

impl DecimalAdjust {
    pub fn adjust_decimal(&self, amount: Nat) -> Nat {
        print(format!(
            "amount:{},before:{},after:{}",
            amount, self.before_decimals, self.after_decimals
        ));
        if (self.after_decimals >= self.before_decimals) {
            amount * (10u64.pow(u32::from(self.after_decimals - self.before_decimals)))
        } else {
            amount / (10u64.pow(u32::from(self.before_decimals - self.after_decimals)))
        }
    }
}

//#[tokio::test]
async fn my_test() {
    let res = _solve_quadratic_function_for_trade(
        Nat::from(1_978_021_978_021_978_021_978u128),
        Nat::from(1_978_021_978_021_978_021_978u128),
        Nat::from(22_00000000u64),
        nat_36().div(1_000_000_000_000_000_000u64),
        Nat::from(1_000_000_000_000_000_000u64),
    );
    println!("res:{}", res);
}
