export const idlFactory = ({ IDL }) => {
  const CommentsCreate = IDL.Record({
    'content' : IDL.Text,
    'image_url' : IDL.Opt(IDL.Text),
    'extended' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const Page = IDL.Record({ 'limit' : IDL.Nat64, 'start' : IDL.Nat64 });
  const Comments = IDL.Record({
    'user_star' : IDL.Vec(IDL.Principal),
    'user_pid' : IDL.Principal,
    'content' : IDL.Text,
    'image_url' : IDL.Opt(IDL.Text),
    'fomo_idx' : IDL.Text,
    'create_time' : IDL.Nat64,
    'comment_idx' : IDL.Nat64,
    'extended' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  const CommentsVo = IDL.Record({
    'start_idx' : IDL.Nat64,
    'end_idx' : IDL.Nat64,
    'fomo_vec' : IDL.Vec(Comments),
  });
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const HolderInfo = IDL.Record({
    'holder_type' : IDL.Text,
    'account' : Account,
    'amount' : IDL.Nat,
    'holder_percent' : IDL.Float64,
  });
  return IDL.Service({
    'add_comment' : IDL.Func([CommentsCreate], [Result], []),
    'cycles' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_comments_by_index' : IDL.Func([Page], [CommentsVo], ['query']),
    'get_comments_len' : IDL.Func([], [IDL.Nat], ['query']),
    'get_fomo_info' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'get_top10_holders' : IDL.Func([], [IDL.Vec(HolderInfo)], ['query']),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))];
};
