export const idlFactory = ({ IDL }) => {
  const TransactionStatus = IDL.Variant({
    'Failed' : IDL.Null,
    'Succeeded' : IDL.Null,
    'BaseTrans' : IDL.Null,
    'QuoteTrans' : IDL.Null,
    'Rollback' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Operation = IDL.Variant({
    'AddLiquidity' : IDL.Null,
    'Approve' : IDL.Null,
    'RemoveTokenController' : IDL.Null,
    'CreateToken' : IDL.Null,
    'Burn' : IDL.Null,
    'Mint' : IDL.Null,
    'Swap' : IDL.Null,
    'CanisterCreated' : IDL.Null,
    'CreatePool' : IDL.Null,
    'CanisterCalled' : IDL.Null,
    'Transfer' : IDL.Null,
    'TransferFrom' : IDL.Null,
    'RemoveLiquidity' : IDL.Null,
  });
  const PoolTxRecord = IDL.Record({
    'to' : IDL.Principal,
    'status' : TransactionStatus,
    'base_reserve' : IDL.Opt(IDL.Float64),
    'pool' : IDL.Opt(IDL.Principal),
    'quote_price' : IDL.Float64,
    'base_price' : IDL.Float64,
    'quote_token' : IDL.Principal,
    'operation' : Operation,
    'timestamp' : IDL.Nat64,
    'base_price_cumulative_last' : IDL.Opt(IDL.Float64),
    'quote_reserve' : IDL.Opt(IDL.Float64),
    'base_token' : IDL.Principal,
    'quote_amount' : IDL.Float64,
    'caller' : IDL.Opt(IDL.Principal),
    'base_amount' : IDL.Float64,
    'tx_hash' : IDL.Nat64,
    'tx_hash_str' : IDL.Text,
    'fail_msg' : IDL.Text,
  });
  const TokenTxRecord = IDL.Record({
    'to' : IDL.Principal,
    'fee' : IDL.Float64,
    'status' : TransactionStatus,
    'token' : IDL.Principal,
    'from' : IDL.Principal,
    'operation' : Operation,
    'timestamp' : IDL.Nat64,
    'caller' : IDL.Opt(IDL.Principal),
    'amount' : IDL.Float64,
  });
  const SwapTxRecord = IDL.Record({
    'to_token' : IDL.Opt(IDL.Principal),
    'status' : TransactionStatus,
    'input_amount' : IDL.Opt(IDL.Float64),
    'from_token' : IDL.Opt(IDL.Principal),
    'directions' : IDL.Opt(IDL.Nat64),
    'base_reserve' : IDL.Opt(IDL.Float64),
    'lp_fee_volumn' : IDL.Opt(IDL.Float64),
    'swap_hash_str' : IDL.Text,
    'volumn' : IDL.Opt(IDL.Float64),
    'receive_amount' : IDL.Opt(IDL.Float64),
    'quote_token_decimals' : IDL.Opt(IDL.Nat),
    'mt_fee_volumn' : IDL.Opt(IDL.Float64),
    'base_min_return_amount' : IDL.Opt(IDL.Float64),
    'timestamp' : IDL.Nat64,
    'base_price_cumulative_last' : IDL.Opt(IDL.Float64),
    'quote_reserve' : IDL.Opt(IDL.Float64),
    'lp_fee_amount' : IDL.Opt(IDL.Float64),
    'caller' : IDL.Opt(IDL.Principal),
    'pairs' : IDL.Opt(IDL.Vec(IDL.Principal)),
    'price' : IDL.Opt(IDL.Float64),
    'swap_hash' : IDL.Nat64,
    'fail_msg' : IDL.Opt(IDL.Text),
    'mt_fee_amount' : IDL.Opt(IDL.Float64),
  });
  const TX = IDL.Variant({
    'PoolTx' : PoolTxRecord,
    'TokenTx' : TokenTxRecord,
    'SwapTx' : SwapTxRecord,
  });
  const OutTx = IDL.Record({ 'tx' : TX, 'index' : IDL.Nat64 });
  const TransactionIndex = IDL.Record({
    'start_idx' : IDL.Nat64,
    'end_idx' : IDL.Nat64,
  });
  return IDL.Service({
    'addTx' : IDL.Func([TX], [], []),
    'cycles' : IDL.Func([], [IDL.Nat64], ['query']),
    'getLastTransactionsByIndex' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [IDL.Vec(IDL.Tuple(IDL.Nat64, TX))],
        ['query'],
      ),
    'getLastTransactionsTxByIndex' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [IDL.Vec(OutTx)],
        ['query'],
      ),
    'get_transaction_idx' : IDL.Func([], [TransactionIndex], ['query']),
    'querySwapStatus' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(SwapTxRecord)],
        ['query'],
      ),
    'querySwapStatusStr' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(SwapTxRecord)],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return [IDL.Principal]; };
