import { getCanisters } from '../../config/env';
import { canisterId as platTokenId } from '@/canisters/icrc2_ledger';

// dfinity environment
export const isProduction: Boolean = process.env.DFX_NETWORK === 'ic';

export const host: string = isProduction ? 'https://icp-api.io' : 'http://localhost:8000';

export const PLAT_TOKEN_CANISTER_ID: string = platTokenId;

export const whitelist: any = getCanisters();
