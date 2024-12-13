use candid::{Int, Nat, Principal};

use crate::types::Position;

pub struct ICPSwapCalculator(pub Principal);
impl ICPSwapCalculator {
    pub fn new(icp_swap_calculator: Principal) -> Self {
        Self(icp_swap_calculator)
    }

    pub async fn get_sqrt_price_x96(
        &self,
        price: f64,
        token0_decimal: u128,
        token1_decimal: u128,
    ) -> Result<Int, String> {
        let arg = (price, token0_decimal as f64, token1_decimal as f64); //TODO 传入
        ic_cdk::call::<_, (Int,)>(self.0, "getSqrtPriceX96", arg)
            .await
            .map(|(init_price,)| init_price)
            .map_err(|e| format!("Failed to call SwapCalculator getSqrtPriceX96: {:?}", e))
    }

    pub async fn get_position_token_amount(
        &self,
        args: (Int, Int, Int, Int, Nat, Nat),
    ) -> Result<Position, String> {
        let position = ic_cdk::call::<_, (Position,)>(self.0, "getPositionTokenAmount", args)
            .await
            .map(|(init_price,)| init_price)
            .map_err(|e| {
                format!(
                    "Failed to call SwapCalculator getPositionTokenAmount: {:?}",
                    e
                )
            })?;
        Ok(position)
    }

    pub async fn get_tick(&self, price: f64, icp_swap_pool_fee: Nat) -> Result<Int, String> {
        let args = (price, icp_swap_pool_fee);
        ic_cdk::call::<_, (Int,)>(self.0, "priceToTick", args)
            .await
            .map(|(tick_num,)| tick_num)
            .map_err(|e| format!("Failed to call SwapCalculator priceToTick: {:?}", e))
    }

    pub async fn get_price(&self, args: (Nat, Nat, Nat)) -> Result<f64, String> {
        ic_cdk::call::<_, (f64,)>(self.0, "getPrice", args)
            .await
            .map(|(tick_num,)| tick_num)
            .map_err(|e| format!("Failed to call SwapCalculator getPrice: {:?}", e))
    }
}
