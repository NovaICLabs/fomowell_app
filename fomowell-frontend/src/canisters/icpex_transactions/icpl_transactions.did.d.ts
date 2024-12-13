import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

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
export interface OutTx { 'tx' : TX, 'index' : bigint }
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
export interface SwapTxRecord {
  'to_token' : [] | [Principal],
  'status' : TransactionStatus,
  'input_amount' : [] | [number],
  'from_token' : [] | [Principal],
  'directions' : [] | [bigint],
  'base_reserve' : [] | [number],
  'lp_fee_volumn' : [] | [number],
  'swap_hash_str' : string,
  'volumn' : [] | [number],
  'receive_amount' : [] | [number],
  'quote_token_decimals' : [] | [bigint],
  'mt_fee_volumn' : [] | [number],
  'base_min_return_amount' : [] | [number],
  'timestamp' : bigint,
  'base_price_cumulative_last' : [] | [number],
  'quote_reserve' : [] | [number],
  'lp_fee_amount' : [] | [number],
  'caller' : [] | [Principal],
  'pairs' : [] | [Array<Principal>],
  'price' : [] | [number],
  'swap_hash' : bigint,
  'fail_msg' : [] | [string],
  'mt_fee_amount' : [] | [number],
}
export type TX = { 'PoolTx' : PoolTxRecord } |
  { 'TokenTx' : TokenTxRecord } |
  { 'SwapTx' : SwapTxRecord };
export interface TokenTxRecord {
  'to' : Principal,
  'fee' : number,
  'status' : TransactionStatus,
  'token' : Principal,
  'from' : Principal,
  'operation' : Operation,
  'timestamp' : bigint,
  'caller' : [] | [Principal],
  'amount' : number,
}
export interface TransactionIndex { 'start_idx' : bigint, 'end_idx' : bigint }
export type TransactionStatus = { 'Failed' : null } |
  { 'Succeeded' : null } |
  { 'BaseTrans' : null } |
  { 'QuoteTrans' : null } |
  { 'Rollback' : null } |
  { 'Pending' : null };
export interface _SERVICE {
  'addTx' : ActorMethod<[TX], undefined>,
  'cycles' : ActorMethod<[], bigint>,
  'getLastTransactionsByIndex' : ActorMethod<
    [bigint, bigint],
    Array<[bigint, TX]>
  >,
  'getLastTransactionsTxByIndex' : ActorMethod<[bigint, bigint], Array<OutTx>>,
  'get_transaction_idx' : ActorMethod<[], TransactionIndex>,
  'querySwapStatus' : ActorMethod<[bigint], Array<SwapTxRecord>>,
  'querySwapStatusStr' : ActorMethod<[string], Array<SwapTxRecord>>,
}
