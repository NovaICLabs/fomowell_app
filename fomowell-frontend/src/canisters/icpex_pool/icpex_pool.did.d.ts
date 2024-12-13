import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface PoolInfo {
  i: bigint;
  k: bigint;
  base_reserve: bigint;
  owner: Principal;
  block_timestamp_last: bigint;
  pool_addr: Principal;
  lp_amount: bigint;
  pool_type: string;
  lp_lock: bigint;
  quote_user: bigint;
  lp_fee_rate: bigint;
  base_token_decimals: number;
  quote_token_decimals: number;
  base_user: bigint;
  quote_token: Principal;
  base_price_cumulative_last: bigint;
  quote_reserve: bigint;
  base_token: Principal;
  pool_status: PoolStatus;
  mt_fee_rate: bigint;
  is_single_pool: boolean;
  total_supply: bigint;
  is_my_pool: boolean;
}
export type PoolStatus =
  | { CREATE_BASE_INPUT: null }
  | { CREATE_QUOTE_INPUT: null }
  | { OFFLINE: null }
  | { ROLLBACK_UNDONE: null }
  | { CREATED: null }
  | { ROLLBACK_DONE: null }
  | { ONLINE: null };
export interface UnlockableInfo {
  user_pid: Principal;
  unlock_time: bigint;
  unlock_lp: bigint;
}
export interface UserLpInfo {
  user_base_amount: bigint;
  base_reserve: bigint;
  user_quote_amount: bigint;
  user_lp: bigint;
  quote_reserve: bigint;
  total_supply: bigint;
}
export interface _SERVICE {
  cycles: ActorMethod<[], bigint>;
  get_unlockable_lock_info: ActorMethod<[], Array<UnlockableInfo>>;
  get_user_lp_info: ActorMethod<[Principal], UserLpInfo>;
  pool_info: ActorMethod<[], PoolInfo>;
  transfer: ActorMethod<[Principal, Principal, bigint], undefined>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
