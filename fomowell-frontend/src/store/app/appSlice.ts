import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getSubaccount } from '@/utils/account';
import { Principal } from '@dfinity/principal';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import type { UserToken } from './type';
import { STORE_PRINCIPALID, STORE_WALLETTYPE } from '@/utils/wallet/connect';

interface TransferAccount {
  owner: Principal;
  subaccount: [] | [Uint8Array | number[]];
}

interface AppState {
  userId: string;
  connectType: string;
  accountId: string;
  verified: boolean;
  userName: string;
  platToken?: UserToken;
  useImg: string;
  transferAccount?: TransferAccount;
  curBtnFomoIcpInfo: any;
}

const initialState: AppState = {
  userId: '',
  connectType: '',
  accountId: '',
  verified: false,
  userName: '',
  useImg: '',
  curBtnFomoIcpInfo: null,
};

export const setTransferAccount = createAsyncThunk('app/setTransferAccount', async () => {
  const res = await getSubaccount();
  return res;
});

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setVerified(state, action: PayloadAction<boolean>) {
      state.verified = action.payload;
    },
    setUserId(state, action: PayloadAction<string>) {
      state.userId = action.payload;
      localStorage.setItem('testuserId', action.payload);
    },
    setAccountId(state, action: PayloadAction<string>) {
      const principal = Principal.fromText(action.payload);
      state.accountId = AccountIdentifier.fromPrincipal({ principal }).toHex();
    },
    setUserName(state, action: PayloadAction<string>) {
      state.userName = action.payload;
      localStorage.setItem('userName', action.payload);
    },
    setUserImg(state, action: PayloadAction<string>) {
      state.useImg = action.payload;
      localStorage.setItem('userImg', action.payload);
    },
    setConnectType(state, action: PayloadAction<string>) {
      state.connectType = action.payload;
    },
    setCurBtnFomoIcpInfo(state, action: PayloadAction<any>) {
      state.curBtnFomoIcpInfo = action.payload;
      localStorage.setItem('BtnFomoIcpInfo', JSON.stringify(action.payload));
    },
    setAppDisconnect(state) {
      localStorage.removeItem(STORE_WALLETTYPE);
      localStorage.removeItem(STORE_PRINCIPALID);
      state.userId = '';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setTransferAccount.fulfilled, (state, action) => {
      state.transferAccount = action.payload;
    });
  },
});

export const {
  setVerified,
  setUserId,
  setAccountId,
  setUserName,
  setUserImg,
  setConnectType,
  setCurBtnFomoIcpInfo,
  setAppDisconnect,
} = appSlice.actions;

export default appSlice.reducer;
