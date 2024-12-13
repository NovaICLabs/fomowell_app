export interface BaseToken {
  protocol: 'ICRC-2';
  canisterId: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
}
export interface Token extends BaseToken {
  owner: string;
  isTransferFeeFixed: boolean;
  transferFee: number;
  isBurnFeeFixed: boolean;
  burnFee: number;
  totalSupply: number;
  canMint: boolean;
  source: 'CERTIFICATION' | 'CREATETOKEN' | 'IMPORT' | 'UNKNOWN';
}

export interface UserToken extends Token {
  balance: number;
  max: number;
}

export interface UserTokenUse extends UserToken {
  amountToUse: string;
}
