import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AddrConfig {
  router_addr: Principal;
  oracle_addr: Principal;
  tx_addr: Principal;
  backend_addr: Principal;
  icpl_addr: Principal;
}
export interface Context {
  owner: Principal;
  icp_addr: Principal;
  last_create_fomo: CreateFomoSignalVo;
  last_buy_sell_op: RecordSignalVo;
  god_of_wells_idx: bigint;
  fomo_canister_template: Uint8Array | number[];
}
export interface CreateFomoSignalVo {
  user_name: string;
  op_user_pid: Principal;
  user_avatar: string;
  fomo_idx: bigint;
  create_time: bigint;
  token_logo: string;
  fomo_name: string;
}
export interface FomoProject {
  god_of_wells_time: [] | [bigint];
  twitter_link: string;
  sneed_dao_lock: [] | [bigint];
  market_cap: bigint;
  recently_reply_time: bigint;
  ticker: string;
  img_url: string;
  dogmi_dao_lock: [] | [bigint];
  name: string;
  recently_bump_time: bigint;
  create_user_pid: Principal;
  description: string;
  pool_progress_done_time: [] | [bigint];
  telegram_link: string;
  website: string;
  fomo_idx: bigint;
  fomo_pid: Principal;
  create_time: bigint;
  reply_count: bigint;
  token_pid: Principal;
  pool_progress: bigint;
  pool_pid: Principal;
  god_of_wells_progress: bigint;
}
export interface FomoProjectCreate {
  twitter_link: string;
  sneed_dao_lock: [] | [bigint];
  ticker: string;
  img_url: string;
  dogmi_dao_lock: [] | [bigint];
  logo: string;
  name: string;
  description: string;
  telegram_link: string;
  website: string;
}
export interface FomoProjectSearchVo {
  end: bigint;
  start: bigint;
  fomo_vec: Array<FomoProject>;
}
export interface FomoProjectVo {
  start_idx: bigint;
  end_idx: bigint;
  fomo_vec: Array<FomoProject>;
}
export type OrderType = { ASC: null } | { DESC: null };
export interface Page {
  limit: bigint;
  start: bigint;
}
export interface PointHistory {
  idx: bigint;
  user_pid: Principal;
  time: bigint;
  busi_name: string;
  op_type: string;
  amount: [] | [bigint];
}
export interface RecordSignal {
  fomo_idx: bigint;
  buy_sell_op: string;
  icp_amount: bigint;
  swap_hash: bigint;
}
export interface RecordSignalVo {
  user_name: string;
  swap_timestamp: [] | [bigint];
  op_user_pid: Principal;
  user_avatar: string;
  fomo_idx: bigint;
  buy_sell_op: string;
  icp_amount: bigint;
  fomo_ticker: string;
}
export type Result = { Ok: FomoProject } | { Err: string };
export type Result_1 = { Ok: Principal } | { Err: string };
export type Result_2 = { Ok: null } | { Err: string };
export interface SearchParam {
  order: OrderType;
  sort: SortType;
  text: string;
  limit: bigint;
  start: bigint;
}
export type SortType =
  | { CreationTime: null }
  | { ReplyCount: null }
  | { BumpOrder: null }
  | { LastReply: null }
  | { MarketCap: null };
export interface UserEditObj {
  user_name: [] | [string];
  avatar: [] | [string];
}
export interface UserProfile {
  user_name: string;
  user_pid: Principal;
  user_points: [] | [bigint];
  user_pre_reward_points: [] | [bigint];
  last_change_time: bigint;
  user_all_spend_points: [] | [bigint];
  avatar: string;
}
export interface _SERVICE {
  create_fomo: ActorMethod<[FomoProjectCreate], Result>;
  edit_user: ActorMethod<[UserEditObj], Result_1>;
  get_addr_config: ActorMethod<[], AddrConfig>;
  get_buy_or_sell: ActorMethod<[], RecordSignalVo>;
  get_dogmi_dao_addr: ActorMethod<[], Principal>;
  get_fomo_by_create_user_pid: ActorMethod<[Principal], [] | [Array<FomoProject>]>;
  get_fomo_by_fomo_idx: ActorMethod<[bigint], [] | [FomoProject]>;
  get_fomo_by_fomo_pid: ActorMethod<[Principal], [] | [FomoProject]>;
  get_fomo_by_index: ActorMethod<[Page], FomoProjectVo>;
  get_fomo_context: ActorMethod<[], Context>;
  get_god_of_wells: ActorMethod<[], [] | [FomoProject]>;
  get_points_history_by_index: ActorMethod<[bigint, bigint], Array<[bigint, PointHistory]>>;
  get_sneed_dao_addr: ActorMethod<[], Principal>;
  get_user: ActorMethod<[Principal], [] | [UserProfile]>;
  lock_pool: ActorMethod<[Principal], undefined>;
  ownership_transfer: ActorMethod<[Principal, [] | [Principal]], undefined>;
  search_fomos: ActorMethod<[SearchParam], FomoProjectSearchVo>;
  set_buy_or_sell: ActorMethod<[RecordSignal], undefined>;
  spending_points: ActorMethod<[Principal, string], undefined>;
  topup_points: ActorMethod<[bigint], Result_2>;
  update_progress: ActorMethod<[], undefined>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
