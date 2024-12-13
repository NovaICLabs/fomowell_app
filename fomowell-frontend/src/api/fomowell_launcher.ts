import { Principal } from '@dfinity/principal';
import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type {
  UserEditObj,
  _SERVICE,
  UserProfile,
  FomoProjectCreate,
  Page,
  FomoProject,
  FomoProjectVo,
  Context,
  SearchParam,
  FomoProjectSearchVo,
  Result,
  RecordSignal,
  Result_2,
} from '@/canisters/fomowell_launcher/fomowell_launcher.did.js';
import { idlFactory } from '@/canisters/fomowell_launcher/fomowell_launcher.did';
let canisterId: string;
if (process.env.CANISTER_ID_FOMOWELL_LAUNCHER) {
  canisterId = process.env.CANISTER_ID_FOMOWELL_LAUNCHER;
  // console.log(canisterId);
} else if (process.env.FOMOWELL_LAUNCHER_CANISTER_ID) {
  canisterId = process.env.FOMOWELL_LAUNCHER_CANISTER_ID;
  // console.log(canisterId);
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
export async function getBaseUserInfo(userId: string) {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.get_user(Principal.fromText(userId));
}
export async function getFomoUserInfo(userId: Principal) {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.get_user(userId);
}
export async function setUserInfo(userId: string, user_info: UserEditObj) {
  // const actor = createActor(canisterId);
  const actor = await createWalletActor(canisterId, idlFactory);
  return actor.edit_user(user_info);
}
//create_fomo
export async function createFomo(userId: string, fomoInfo: FomoProjectCreate): Promise<Result | { Err: string }> {
  // console.log(fomoInfo);
  const actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return actor.create_fomo(fomoInfo);
}
//get_fomo_by_index
export async function get_fomo_by_index(Page: Page): Promise<FomoProjectVo> {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.get_fomo_by_index(Page);
}
//get_god_of_wells
export async function get_god_of_wells() {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.get_god_of_wells();
}
// get_fomo_context
export async function get_fomo_context(): Promise<Context | { Err: string }> {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.get_fomo_context();
}
//search_fomos
export async function search_fomos(Params: SearchParam): Promise<FomoProjectSearchVo> {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.search_fomos(Params);
}
//get_fomo_by_fomo_idx
export async function get_fomo_by_fomo_idx(fomoIdx: bigint): Promise<FomoProject[]> {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.get_fomo_by_fomo_idx(fomoIdx);
}
//get_fomo_by_fomo_pid
export async function get_fomo_by_fomo_pid(fomo_pid: Principal): Promise<FomoProject[]> {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.get_fomo_by_fomo_pid(fomo_pid);
}
//set_buy_or_sell
export async function set_buy_or_sell(params: RecordSignal) {
  const actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return actor.set_buy_or_sell(params);
}
//get_fomo_by_create_user_pid
export async function get_fomo_by_create_user_pid(user_pid: Principal): Promise<[] | [Array<FomoProject>]> {
  const actor: _SERVICE = await createActor(canisterId, idlFactory);
  return actor.get_fomo_by_create_user_pid(user_pid);
}
//topup_points
export async function topup_points(amount: bigint): Promise<Result_2> {
  // console.log(amount);
  const actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return actor.topup_points(amount);
}
//ownership_transfer
export async function ownership_transfer(params: [Principal, [] | [Principal]]): Promise<undefined> {
  // console.log(amount);
  const actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return actor.ownership_transfer(...params);
}
