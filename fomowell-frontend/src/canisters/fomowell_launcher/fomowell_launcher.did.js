export const idlFactory = ({ IDL }) => {
  const AddrConfig = IDL.Record({
    router_addr: IDL.Principal,
    oracle_addr: IDL.Principal,
    tx_addr: IDL.Principal,
    backend_addr: IDL.Principal,
    icpl_addr: IDL.Principal,
  });
  const FomoProjectCreate = IDL.Record({
    twitter_link: IDL.Text,
    sneed_dao_lock: IDL.Opt(IDL.Nat),
    ticker: IDL.Text,
    img_url: IDL.Text,
    dogmi_dao_lock: IDL.Opt(IDL.Nat),
    logo: IDL.Text,
    name: IDL.Text,
    description: IDL.Text,
    telegram_link: IDL.Text,
    website: IDL.Text,
  });
  const FomoProject = IDL.Record({
    god_of_wells_time: IDL.Opt(IDL.Nat64),
    twitter_link: IDL.Text,
    sneed_dao_lock: IDL.Opt(IDL.Nat),
    market_cap: IDL.Nat,
    recently_reply_time: IDL.Nat64,
    ticker: IDL.Text,
    img_url: IDL.Text,
    dogmi_dao_lock: IDL.Opt(IDL.Nat),
    name: IDL.Text,
    recently_bump_time: IDL.Nat64,
    create_user_pid: IDL.Principal,
    description: IDL.Text,
    pool_progress_done_time: IDL.Opt(IDL.Nat64),
    telegram_link: IDL.Text,
    website: IDL.Text,
    fomo_idx: IDL.Nat64,
    fomo_pid: IDL.Principal,
    create_time: IDL.Nat64,
    reply_count: IDL.Nat64,
    token_pid: IDL.Principal,
    pool_progress: IDL.Nat,
    pool_pid: IDL.Principal,
    god_of_wells_progress: IDL.Nat,
  });
  const Result = IDL.Variant({ Ok: FomoProject, Err: IDL.Text });
  const UserEditObj = IDL.Record({
    user_name: IDL.Opt(IDL.Text),
    avatar: IDL.Opt(IDL.Text),
  });
  const Result_1 = IDL.Variant({ Ok: IDL.Principal, Err: IDL.Text });
  const RecordSignalVo = IDL.Record({
    user_name: IDL.Text,
    swap_timestamp: IDL.Opt(IDL.Nat64),
    op_user_pid: IDL.Principal,
    user_avatar: IDL.Text,
    fomo_idx: IDL.Nat64,
    buy_sell_op: IDL.Text,
    icp_amount: IDL.Nat,
    fomo_ticker: IDL.Text,
  });
  const Page = IDL.Record({ limit: IDL.Nat64, start: IDL.Nat64 });
  const FomoProjectVo = IDL.Record({
    start_idx: IDL.Nat64,
    end_idx: IDL.Nat64,
    fomo_vec: IDL.Vec(FomoProject),
  });
  const CreateFomoSignalVo = IDL.Record({
    user_name: IDL.Text,
    op_user_pid: IDL.Principal,
    user_avatar: IDL.Text,
    fomo_idx: IDL.Nat64,
    create_time: IDL.Nat64,
    token_logo: IDL.Text,
    fomo_name: IDL.Text,
  });
  const Context = IDL.Record({
    owner: IDL.Principal,
    icp_addr: IDL.Principal,
    last_create_fomo: CreateFomoSignalVo,
    last_buy_sell_op: RecordSignalVo,
    god_of_wells_idx: IDL.Nat64,
    fomo_canister_template: IDL.Vec(IDL.Nat8),
  });
  const PointHistory = IDL.Record({
    idx: IDL.Nat64,
    user_pid: IDL.Principal,
    time: IDL.Nat64,
    busi_name: IDL.Text,
    op_type: IDL.Text,
    amount: IDL.Opt(IDL.Nat),
  });
  const UserProfile = IDL.Record({
    user_name: IDL.Text,
    user_pid: IDL.Principal,
    user_points: IDL.Opt(IDL.Nat),
    user_pre_reward_points: IDL.Opt(IDL.Nat),
    last_change_time: IDL.Nat64,
    user_all_spend_points: IDL.Opt(IDL.Nat),
    avatar: IDL.Text,
  });
  const OrderType = IDL.Variant({ ASC: IDL.Null, DESC: IDL.Null });
  const SortType = IDL.Variant({
    CreationTime: IDL.Null,
    ReplyCount: IDL.Null,
    BumpOrder: IDL.Null,
    LastReply: IDL.Null,
    MarketCap: IDL.Null,
  });
  const SearchParam = IDL.Record({
    order: OrderType,
    sort: SortType,
    text: IDL.Text,
    limit: IDL.Nat64,
    start: IDL.Nat64,
  });
  const FomoProjectSearchVo = IDL.Record({
    end: IDL.Nat64,
    start: IDL.Nat64,
    fomo_vec: IDL.Vec(FomoProject),
  });
  const RecordSignal = IDL.Record({
    fomo_idx: IDL.Nat64,
    buy_sell_op: IDL.Text,
    icp_amount: IDL.Nat,
    swap_hash: IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  return IDL.Service({
    create_fomo: IDL.Func([FomoProjectCreate], [Result], []),
    edit_user: IDL.Func([UserEditObj], [Result_1], []),
    get_addr_config: IDL.Func([], [AddrConfig], ['query']),
    get_buy_or_sell: IDL.Func([], [RecordSignalVo], ['query']),
    get_dogmi_dao_addr: IDL.Func([], [IDL.Principal], []),
    get_fomo_by_create_user_pid: IDL.Func([IDL.Principal], [IDL.Opt(IDL.Vec(FomoProject))], ['query']),
    get_fomo_by_fomo_idx: IDL.Func([IDL.Nat64], [IDL.Opt(FomoProject)], ['query']),
    get_fomo_by_fomo_pid: IDL.Func([IDL.Principal], [IDL.Opt(FomoProject)], ['query']),
    get_fomo_by_index: IDL.Func([Page], [FomoProjectVo], ['query']),
    get_fomo_context: IDL.Func([], [Context], ['query']),
    get_god_of_wells: IDL.Func([], [IDL.Opt(FomoProject)], ['query']),
    get_points_history_by_index: IDL.Func(
      [IDL.Nat64, IDL.Nat64],
      [IDL.Vec(IDL.Tuple(IDL.Nat64, PointHistory))],
      ['query'],
    ),
    get_sneed_dao_addr: IDL.Func([], [IDL.Principal], []),
    get_user: IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
    lock_pool: IDL.Func([IDL.Principal], [], []),
    ownership_transfer: IDL.Func([IDL.Principal, IDL.Opt(IDL.Principal)], [], []),
    search_fomos: IDL.Func([SearchParam], [FomoProjectSearchVo], ['query']),
    set_buy_or_sell: IDL.Func([RecordSignal], [], []),
    spending_points: IDL.Func([IDL.Principal, IDL.Text], [], []),
    topup_points: IDL.Func([IDL.Nat], [Result_2], []),
    update_progress: IDL.Func([], [], []),
  });
};
export const init = ({ IDL }) => {
  const AddrConfig = IDL.Record({
    router_addr: IDL.Principal,
    oracle_addr: IDL.Principal,
    tx_addr: IDL.Principal,
    backend_addr: IDL.Principal,
    icpl_addr: IDL.Principal,
  });
  return [AddrConfig, IDL.Principal];
};
