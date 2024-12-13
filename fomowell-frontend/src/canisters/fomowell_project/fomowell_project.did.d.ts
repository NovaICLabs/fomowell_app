import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface Comments {
  'user_star' : Array<Principal>,
  'user_pid' : Principal,
  'content' : string,
  'image_url' : [] | [string],
  'fomo_idx' : string,
  'create_time' : bigint,
  'comment_idx' : bigint,
  'extended' : Array<[string, string]>,
}
export interface CommentsCreate {
  'content' : string,
  'image_url' : [] | [string],
  'extended' : Array<[string, string]>,
}
export interface CommentsVo {
  'start_idx' : bigint,
  'end_idx' : bigint,
  'fomo_vec' : Array<Comments>,
}
export interface HolderInfo {
  'holder_type' : string,
  'account' : Account,
  'amount' : bigint,
  'holder_percent' : number,
}
export interface Page { 'limit' : bigint, 'start' : bigint }
export type Result = { 'Ok' : null } |
  { 'Err' : string };
export interface _SERVICE {
  'add_comment' : ActorMethod<[CommentsCreate], Result>,
  'cycles' : ActorMethod<[], bigint>,
  'get_comments_by_index' : ActorMethod<[Page], CommentsVo>,
  'get_comments_len' : ActorMethod<[], bigint>,
  'get_fomo_info' : ActorMethod<[], Array<[string, string]>>,
  'get_top10_holders' : ActorMethod<[], Array<HolderInfo>>,
}
