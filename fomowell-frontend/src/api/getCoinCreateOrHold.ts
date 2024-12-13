import request from '@/utils/request/request';
export type amountType = Array<{
  symbol: string;
  tokenid: string;
  userid: string;
  balance: number;
  icp_estimated: number;
  fomoidx: number;
  poolpid: string;
  fomopid: string;
}>;
export type amountItem = {
  symbol: string;
  tokenid: string;
  userid: string;
  balance: number;
  icp_estimated: number;
  fomoidx: number;
  poolpid: string;
  fomopid: string;
};
export const getHold = (userid: string): Promise<amountType> => {
  return request.get<amountType>({
    url: '/fomo/user/amount',
    config: {
      params: { userid },
    },
  });
};
// export const getHoldImg = (token_pid: string): Promise<amountType> => {
//   return request.get<amountType>({
//     url: `/images/${token_pid}.png`,
//   });
// };
