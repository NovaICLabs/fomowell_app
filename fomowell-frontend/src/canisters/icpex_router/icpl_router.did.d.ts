import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface AddrConfig {
  'router_addr' : Principal,
  'oracle_addr' : Principal,
  'tx_addr' : Principal,
  'backend_addr' : Principal,
  'icpl_addr' : Principal,
}
export interface CPool {
  'i' : bigint,
  'k' : bigint,
  'base_reserve' : bigint,
  'owner' : Principal,
  'block_timestamp_last' : bigint,
  'pool_addr' : Principal,
  'lp_fee_rate' : bigint,
  'shares_ledger' : DIP20,
  'quote_token' : IToken,
  'expired_lock_ledger' : Array<[Principal, bigint, bigint]>,
  'base_price_cumulative_last' : bigint,
  'quote_reserve' : bigint,
  'base_token' : IToken,
  'base_decimals' : number,
  'pool_status' : PoolStatus,
  'mt_fee_rate' : bigint,
  'quote_decimals' : number,
}
export interface DIP20 {
  'decimals' : number,
  'flat_fee' : boolean,
  'fee_to' : Principal,
  'owner' : Principal,
  'logo' : string,
  'name' : string,
  'mint_on' : boolean,
  'burn_rate' : bigint,
  'fee_rate' : bigint,
  'burn_on' : boolean,
  'allowances' : Array<[Principal, Array<[Principal, bigint]>]>,
  'flat_burn_fee' : boolean,
  'total_supply' : bigint,
  'symbol' : string,
  'balances' : Array<[Principal, bigint]>,
}
export interface IToken { 'cid' : Principal }
export type Operation = { 'AddLiquidity' : null } |
  { 'Approve' : null } |
  { 'RemoveTokenController' : null } |
  { 'CreateToken' : null } |
  { 'Burn' : null } |
  { 'Mint' : null } |
  { 'Swap' : null } |
  { 'CanisterCreated' : null } |
  { 'CreatePool' : null } |
  { 'CanisterCalled' : null } |
  { 'Transfer' : null } |
  { 'TransferFrom' : null } |
  { 'RemoveLiquidity' : null };
export interface PPool {
  'i' : bigint,
  'k' : bigint,
  'r_state' : RState,
  'base_reserve' : bigint,
  'owner' : Principal,
  'block_timestamp_last' : bigint,
  'pool_addr' : Principal,
  'lp_fee_rate' : bigint,
  'quote_target' : bigint,
  'base_target' : bigint,
  'quote_token' : IToken,
  'base_price_cumulative_last' : bigint,
  'quote_reserve' : bigint,
  'base_token' : IToken,
  'base_decimals' : number,
  'pool_status' : PoolStatus,
  'mt_fee_rate' : bigint,
  'quote_decimals' : number,
}
export interface PoolAmountInfo {
  'base_token_price' : bigint,
  'lp_amount' : bigint,
  'lp_lock' : bigint,
  'lp_fee_rate' : bigint,
  'base_token_decimals' : bigint,
  'quote_token_decimals' : bigint,
  'quote_token' : Principal,
  'base_token' : Principal,
  'quote_token_price' : bigint,
  'quote_amount' : bigint,
  'base_amount' : bigint,
  'pool_address' : Principal,
  'mt_fee_rate' : bigint,
  'total_supply' : bigint,
}
export type PoolExecuteType = { 'PPOOL' : PPool } |
  { 'UNKNOWN' : null } |
  { 'CPOOL' : CPool } |
  { 'SPOOL' : StablePool };
export interface PoolInfo {
  'i' : bigint,
  'k' : bigint,
  'base_reserve' : bigint,
  'owner' : Principal,
  'block_timestamp_last' : bigint,
  'pool_addr' : Principal,
  'lp_amount' : bigint,
  'pool_type' : string,
  'lp_lock' : bigint,
  'quote_user' : bigint,
  'lp_fee_rate' : bigint,
  'base_token_decimals' : number,
  'quote_token_decimals' : number,
  'base_user' : bigint,
  'quote_token' : Principal,
  'base_price_cumulative_last' : bigint,
  'quote_reserve' : bigint,
  'base_token' : Principal,
  'pool_status' : PoolStatus,
  'mt_fee_rate' : bigint,
  'is_single_pool' : boolean,
  'total_supply' : bigint,
  'is_my_pool' : boolean,
}
export interface PoolInfoConfig {
  'i' : bigint,
  'k' : bigint,
  'r_state' : string,
  'base_reserve' : bigint,
  'owner' : Principal,
  'block_timestamp_last' : bigint,
  'pool_addr' : Principal,
  'pool_type' : string,
  'lp_fee_rate' : bigint,
  'quote_target' : bigint,
  'base_target' : bigint,
  'quote_token' : Principal,
  'base_price_cumulative_last' : bigint,
  'quote_reserve' : bigint,
  'base_token' : Principal,
  'base_decimals' : number,
  'pool_status' : string,
  'mt_fee_rate' : bigint,
  'quote_decimals' : number,
  'balances' : Array<[Principal, bigint]>,
}
export interface PoolOrder {
  'i' : bigint,
  'k' : bigint,
  'base_in_amount' : bigint,
  'quote_in_amount' : bigint,
  'deadline' : bigint,
  'fee_rate' : bigint,
  'quote_token_addr' : Principal,
  'caller' : Principal,
  'base_token_addr' : Principal,
}
export type PoolStatus = { 'CREATE_BASE_INPUT' : null } |
  { 'CREATE_QUOTE_INPUT' : null } |
  { 'OFFLINE' : null } |
  { 'ROLLBACK_UNDONE' : null } |
  { 'CREATED' : null } |
  { 'ROLLBACK_DONE' : null } |
  { 'ONLINE' : null };
export interface PoolTxRecord {
  'to' : Principal,
  'status' : TransactionStatus,
  'base_reserve' : [] | [number],
  'pool' : [] | [Principal],
  'quote_price' : number,
  'base_price' : number,
  'quote_token' : Principal,
  'operation' : Operation,
  'timestamp' : bigint,
  'base_price_cumulative_last' : [] | [number],
  'quote_reserve' : [] | [number],
  'base_token' : Principal,
  'quote_amount' : number,
  'caller' : [] | [Principal],
  'base_amount' : number,
  'tx_hash' : bigint,
  'tx_hash_str' : string,
  'fail_msg' : string,
}
export type RState = { 'ONE' : null } |
  { 'AboveOne' : null } |
  { 'BelowOne' : null };
export type Result = { 'Ok' : [Principal, bigint] } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : number } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : null } |
  { 'Err' : string };
export type Result_3 = {
    'Ok' : [bigint, Array<Principal>, number, bigint, bigint]
  } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : bigint } |
  { 'Err' : string };
export interface Router {
  'fee_token' : IToken,
  'owner' : Principal,
  'user_pools' : Array<[Principal, Array<Principal>]>,
  'icpex_wasm' : Uint8Array | number[],
  'default_mt_fee_rate' : bigint,
}
export interface StablePool {
  'i' : bigint,
  'k' : bigint,
  'r_state' : RState,
  'base_reserve' : bigint,
  'owner' : Principal,
  'block_timestamp_last' : bigint,
  'pool_addr' : Principal,
  'lp_fee_rate' : bigint,
  'quote_target' : bigint,
  'shares_ledger' : DIP20,
  'base_target' : bigint,
  'quote_token' : IToken,
  'expired_lock_ledger' : Array<[Principal, bigint, bigint]>,
  'base_price_cumulative_last' : bigint,
  'quote_reserve' : bigint,
  'base_token' : IToken,
  'base_decimals' : number,
  'pool_status' : PoolStatus,
  'mt_fee_rate' : bigint,
  'quote_decimals' : number,
}
export interface SwapOrder {
  'base_from_token' : Principal,
  'base_from_amount' : bigint,
  'directions' : bigint,
  'swap_caller' : Principal,
  'deadline' : bigint,
  'base_min_return_amount' : bigint,
  'base_to_token' : Principal,
  'pairs' : Array<Principal>,
}
export type TransactionStatus = { 'Failed' : null } |
  { 'Succeeded' : null } |
  { 'BaseTrans' : null } |
  { 'QuoteTrans' : null } |
  { 'Rollback' : null } |
  { 'Pending' : null };
export interface _SERVICE {
  'addInnerLiquidity' : ActorMethod<
    [Principal, bigint, bigint, bigint, bigint, PoolTxRecord],
    [bigint, bigint, bigint]
  >,
  'addLiquidity' : ActorMethod<
    [Principal, bigint, bigint, bigint, bigint],
    [bigint, bigint, bigint]
  >,
  'addPrivateLiquidity' : ActorMethod<
    [Principal, bigint, bigint, bigint],
    [bigint, bigint]
  >,
  'addStableLiquidity' : ActorMethod<
    [Principal, bigint, bigint, bigint, bigint],
    [bigint, bigint, bigint]
  >,
  'adminData' : ActorMethod<
    [],
    [Router, AddrConfig, Array<[Principal, PoolExecuteType]>]
  >,
  'adminUpdateCanister' : ActorMethod<[], undefined>,
  'adminUpdateLp' : ActorMethod<[Principal, bigint, Principal], undefined>,
  'adminUpdatePoolParam' : ActorMethod<[Principal, bigint, bigint], undefined>,
  'adminUpdateTokenCache' : ActorMethod<[Principal], undefined>,
  'createCommonPool' : ActorMethod<
    [Principal, Principal, bigint, bigint, bigint, bigint, bigint, bigint],
    Result
  >,
  'createPrivatePool' : ActorMethod<
    [Principal, Principal, bigint, bigint, bigint, bigint, bigint, bigint],
    Result
  >,
  'createStablePool' : ActorMethod<
    [Principal, Principal, bigint, bigint, bigint, bigint, bigint, bigint],
    Result
  >,
  'cycles' : ActorMethod<[], bigint>,
  'getAllPoolInfo' : ActorMethod<[], Array<PoolInfoConfig>>,
  'getLp' : ActorMethod<
    [Principal, Principal],
    [bigint, bigint, bigint, bigint, bigint, bigint]
  >,
  'getMidPrice' : ActorMethod<[Principal], bigint>,
  'getPoolInfo' : ActorMethod<[Principal, Principal], PoolInfo>,
  'getPoolsAmountInfo' : ActorMethod<[], [Array<PoolAmountInfo>, bigint]>,
  'getPoolsAmountInfoUncache' : ActorMethod<
    [],
    [Array<PoolAmountInfo>, bigint]
  >,
  'getPoolsInfo' : ActorMethod<[Principal], Array<PoolInfo>>,
  'getSubaccount' : ActorMethod<[], Account>,
  'getSubaccountAdmin' : ActorMethod<[Principal], Account>,
  'getTimePrice' : ActorMethod<[Principal], bigint>,
  'get_deviation_rate' : ActorMethod<
    [bigint, bigint, Principal, bigint],
    Result_1
  >,
  'initAddrConfig' : ActorMethod<[Principal, Principal], undefined>,
  'innerAddPrivateLiquidity' : ActorMethod<
    [Principal, bigint, bigint, bigint, PoolTxRecord],
    [bigint, bigint]
  >,
  'innerAddStableLiquidity' : ActorMethod<
    [Principal, bigint, bigint, bigint, bigint, PoolTxRecord],
    [bigint, bigint, bigint]
  >,
  'innerCreateCommonPool' : ActorMethod<
    [PoolOrder, PoolTxRecord],
    [Principal, bigint]
  >,
  'innerCreatePrivatePool' : ActorMethod<
    [PoolOrder, PoolTxRecord],
    [Principal, bigint]
  >,
  'innerCreateStablePool' : ActorMethod<
    [PoolOrder, PoolTxRecord],
    [Principal, bigint]
  >,
  'innerSellShares' : ActorMethod<
    [bigint, Principal, bigint, bigint, bigint, bigint, PoolTxRecord],
    [bigint, bigint]
  >,
  'innerSwapTokenToToken' : ActorMethod<[SwapOrder], bigint>,
  'lockLiquidity' : ActorMethod<[Principal, bigint, bigint], Result_2>,
  'markIcrc1SubWallet' : ActorMethod<[Principal, Principal], undefined>,
  'platformWithdraw' : ActorMethod<[bigint, Principal, Principal], Result_2>,
  'queryAddShareBase' : ActorMethod<
    [bigint, Principal],
    [bigint, bigint, bigint, bigint]
  >,
  'queryAddShareQuote' : ActorMethod<
    [bigint, Principal],
    [bigint, bigint, bigint, bigint]
  >,
  'querySellBase' : ActorMethod<
    [Principal, bigint],
    [bigint, bigint, bigint, RState, bigint]
  >,
  'querySellQuote' : ActorMethod<
    [Principal, bigint],
    [bigint, bigint, bigint, RState, bigint]
  >,
  'querySellShares' : ActorMethod<
    [bigint, Principal, Principal],
    [bigint, bigint, bigint, bigint]
  >,
  'quote' : ActorMethod<[Principal, Principal, bigint, bigint], Result_3>,
  'resetParamPrivatePool' : ActorMethod<
    [Principal, bigint, bigint, bigint],
    undefined
  >,
  'routerPoolInfo' : ActorMethod<[], Array<[Principal, Array<Principal>]>>,
  'sellShares' : ActorMethod<
    [bigint, Principal, bigint, bigint, bigint, bigint],
    [bigint, bigint]
  >,
  'setFeeToken' : ActorMethod<[Principal], undefined>,
  'setTxBucket' : ActorMethod<[Principal], undefined>,
  'swapTokenToToken' : ActorMethod<
    [Principal, Principal, bigint, bigint, Array<Principal>, bigint, bigint],
    Result_4
  >,
  'transferOwnShip' : ActorMethod<[Principal], undefined>,
  'updatePool' : ActorMethod<[Principal], bigint>,
  'updatePoolControllers' : ActorMethod<[Principal, Principal], undefined>,
  'withdrawPoolToken' : ActorMethod<
    [Principal, Principal, Principal, bigint],
    undefined
  >,
  'withdrawSubAccountToken' : ActorMethod<[Principal, bigint], Result_2>,
}
