import { Principal } from '@dfinity/principal';
import type { ActorSubclass } from '@dfinity/agent';
import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type {
  _SERVICE as fomowell_project,
  Page,
  CommentsVo,
  CommentsCreate,
  Result,
  HolderInfo,
} from '@/canisters/fomowell_project/fomowell_project.did.js';
import { idlFactory as projectIdlFactory } from '@/canisters/fomowell_project';
//get_comments_len
const cachedActorMap: { [key: string]: ActorSubclass<any> } = {};
export async function get_comments_len(canisterId: string, userId?: Principal): Promise<bigint> {
  if (cachedActorMap[canisterId]) {
    return cachedActorMap[canisterId].get_comments_len();
  }
  cachedActorMap[canisterId] = createActor<fomowell_project>(canisterId, projectIdlFactory);
  const RepliesValue = cachedActorMap[canisterId];
  return RepliesValue.get_comments_len();
}
//get_comments_by_index
export async function get_comments_by_index(canisterId: string, Page: Page, userId?: Principal): Promise<CommentsVo> {
  if (cachedActorMap[canisterId]) {
    return cachedActorMap[canisterId].get_comments_by_index(Page);
  }
  cachedActorMap[canisterId] = createActor<fomowell_project>(canisterId, projectIdlFactory);
  const RepliesValue = cachedActorMap[canisterId];
  return RepliesValue.get_comments_by_index(Page);
}
//add_comment
export async function add_comment(canisterId: string, params: CommentsCreate, userId?: Principal): Promise<Result> {
  // if (cachedActorMap[canisterId]) {
  //   console.log(cachedActorMap[canisterId]);
  //   return cachedActorMap[canisterId].add_comment(params);
  // }
  cachedActorMap[canisterId] = await createWalletActor(canisterId, projectIdlFactory);
  console.log(cachedActorMap[canisterId]);

  const RepliesValue: fomowell_project = cachedActorMap[canisterId];
  return RepliesValue.add_comment(params);
}
// get_top10_holders
export async function get_top10_holders(canisterId: string, userId?: Principal): Promise<Array<HolderInfo>> {
  if (cachedActorMap[canisterId]) {
    return cachedActorMap[canisterId].get_top10_holders();
  }
  cachedActorMap[canisterId] = createActor<fomowell_project>(canisterId, projectIdlFactory);
  const RepliesValue = cachedActorMap[canisterId];
  return RepliesValue.get_top10_holders();
}
export async function cycles(canisterId: string): Promise<bigint> {
  const Actor: fomowell_project = await createActor(canisterId, projectIdlFactory);
  return Actor.cycles();
}
