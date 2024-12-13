import Big from 'big.js';
import { multiplyAndConvertToBigInt } from './common';

interface FeeParams {
  amount: number;
  isFixed: boolean;
  fee: number;
}

interface TokenNumberParams {
  amount: number;
  isTransferFeeFixed: boolean;
  transferFee: number;
  isBurnFeeFixed: boolean;
  burnFee: number;
}

interface TokenBigintParams {
  amount: number;
  isTransferFeeFixed: boolean;
  transferFee: number;
  isBurnFeeFixed: boolean;
  burnFee: number;
  decimals: number;
}

export function computeFee(params: FeeParams) {
  const { amount, isFixed, fee } = params;
  if (isFixed) return fee;
  const x = Big(amount).times(fee);
  return Number(x.toPrecision(4));
}

export function calculateTotalTokenAmountWithFees(params: TokenNumberParams) {
  const { amount, isTransferFeeFixed, transferFee, isBurnFeeFixed, burnFee } = params;
  // transfer fee
  const transferAmount = computeFee({ amount, isFixed: isTransferFeeFixed, fee: transferFee });
  // burn fee
  const burnAmount = computeFee({ amount, isFixed: isBurnFeeFixed, fee: burnFee });
  return amount + transferAmount + burnAmount;
}

export function calculateTotalTokenAmountWithFeesToBigint(params: TokenBigintParams) {
  const { decimals } = params;
  // return bigint type
  return multiplyAndConvertToBigInt(calculateTotalTokenAmountWithFees(params), decimals);
}
