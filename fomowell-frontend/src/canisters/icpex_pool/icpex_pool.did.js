export const idlFactory = ({ IDL }) => {
  const UnlockableInfo = IDL.Record({
    user_pid: IDL.Principal,
    unlock_time: IDL.Nat64,
    unlock_lp: IDL.Nat,
  });
  const UserLpInfo = IDL.Record({
    user_base_amount: IDL.Nat,
    base_reserve: IDL.Nat,
    user_quote_amount: IDL.Nat,
    user_lp: IDL.Nat,
    quote_reserve: IDL.Nat,
    total_supply: IDL.Nat,
  });
  const PoolStatus = IDL.Variant({
    CREATE_BASE_INPUT: IDL.Null,
    CREATE_QUOTE_INPUT: IDL.Null,
    OFFLINE: IDL.Null,
    ROLLBACK_UNDONE: IDL.Null,
    CREATED: IDL.Null,
    ROLLBACK_DONE: IDL.Null,
    ONLINE: IDL.Null,
  });
  const PoolInfo = IDL.Record({
    i: IDL.Nat,
    k: IDL.Nat,
    base_reserve: IDL.Nat,
    owner: IDL.Principal,
    block_timestamp_last: IDL.Nat64,
    pool_addr: IDL.Principal,
    lp_amount: IDL.Nat,
    pool_type: IDL.Text,
    lp_lock: IDL.Nat,
    quote_user: IDL.Nat,
    lp_fee_rate: IDL.Nat,
    base_token_decimals: IDL.Nat8,
    quote_token_decimals: IDL.Nat8,
    base_user: IDL.Nat,
    quote_token: IDL.Principal,
    base_price_cumulative_last: IDL.Nat,
    quote_reserve: IDL.Nat,
    base_token: IDL.Principal,
    pool_status: PoolStatus,
    mt_fee_rate: IDL.Nat,
    is_single_pool: IDL.Bool,
    total_supply: IDL.Nat,
    is_my_pool: IDL.Bool,
  });
  return IDL.Service({
    cycles: IDL.Func([], [IDL.Nat64], ['query']),
    get_unlockable_lock_info: IDL.Func([], [IDL.Vec(UnlockableInfo)], ['query']),
    get_user_lp_info: IDL.Func([IDL.Principal], [UserLpInfo], ['query']),
    pool_info: IDL.Func([], [PoolInfo], ['query']),
    transfer: IDL.Func([IDL.Principal, IDL.Principal, IDL.Nat], [], []),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal, IDL.Principal, IDL.Principal];
};
