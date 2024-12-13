import type { ActorConfig, Agent, HttpAgentOptions } from '@dfinity/agent';
import { Actor, HttpAgent } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';
import { host } from '@/utils/env';
import { artemisWalletAdapter } from '@/utils/wallet/connect';

interface Options {
  agent?: Agent;
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
}

export function createWalletActor(canisterId: string, idlFactory: IDL.InterfaceFactory) {
  return artemisWalletAdapter.getCanisterActor(canisterId, idlFactory);
}

export function createActor<T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options: Options = {}) {
  const agent = options.agent || new HttpAgent({ ...options.agentOptions, verifyQuerySignatures: false, host });
  if (options.agent && options.agentOptions) {
    console.warn(
      'Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.',
    );
  }
  if (process.env.DFX_NETWORK !== 'ic') {
    agent.fetchRootKey().catch((err) => {
      console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
      console.error(err);
    });
  }
  return Actor.createActor<T>(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
}
