import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { getSubaccount } from '@/utils/account';
import { STORE_PRINCIPALID, STORE_WALLETTYPE } from '@/utils/wallet/connect';
import type { UserToken } from './type';
// import PlugController from '@psychedelic/plug-controller'
import { Principal } from '@dfinity/principal';
import { AccountIdentifier } from '@dfinity/ledger-icp';
export class AppStore {
  userId = '';
  connectType = '';
  accountId = '';
  verified = false;
  userName = '';
  platToken?: UserToken;
  useImg = '';
  buyorsell = '';
  icpAccount: string | number = '';
  userToken: null | number | string = null;
  lockToken: null | number | string = null;
  // tokens: UserToken[] = []
  transferAccount?: {
    owner: Principal;
    subaccount: [] | [Uint8Array | number[]];
  };
  curBtnFomoIcpInfo: any;
  constructor() {
    makeObservable(this, {
      verified: observable,
      userId: observable,
      userName: observable,
      useImg: observable,
      platToken: observable,
      icpAccount: observable,
      curBtnFomoIcpInfo: observable,
      // tokens: observable,
      transferAccount: observable,
      setVerified: action.bound,
      setUserId: action.bound,
      buyorsell: observable,
      userToken: observable,
      lockToken: observable,
      // setPlatToken: action.bound,
      // setTokens: action.bound,
      setTransferAccount: action.bound,
    });
  }

  // get accountId() {
  //   if (!this.userId)
  //     return ''
  //   const principal = Principal.fromText(this.userId) as any
  //   return AccountIdentifier.fromPrincipal({principal}).toHex()
  // }
  setVerified(bool: boolean) {
    this.verified = bool;
  }

  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('userId', userId);
    this.notifyObservers();
    // if (userId) {
    //   this.setTransferAccount();
    // }
  }
  setbuyorsell(str: string) {
    this.buyorsell = str;
  }
  setAccountId(userId: string) {
    const principal = Principal.fromText(userId);
    this.accountId = AccountIdentifier.fromPrincipal({ principal }).toHex();
  }
  setUserName(name: string) {
    this.userName = name;
    localStorage.setItem('userName', name);
    runInAction(() => {
      this.userName = name;
      localStorage.setItem('userName', name);
    });
  }
  setUserImg(img: string) {
    this.useImg = img;
    localStorage.setItem('userImg', img);
  }
  setusertoken(num: number | string | null) {
    this.userToken = num;
  }
  setlockToken(num: number | string | null) {
    this.lockToken = num;
  }
  getUserImg(): string {
    return `https://image.fomowell.com/api/files/download/${localStorage.getItem('userImg')!}`;
  }
  getUserName(): string {
    return localStorage.getItem('userName')!;
  }
  getUserId(): string {
    return localStorage.getItem('userId')!;
  }
  // async setPlatToken() {
  //   const token = await getTokenInfo(PLAT_TOKEN_CANISTER_ID);
  //   runInAction(() => {
  //     this.platToken = token;
  //   });
  // }

  setTransferAccount() {
    runInAction(async () => {
      const res = await getSubaccount();
      this.transferAccount = res;
    });
  }
  // setTokens(tokens: UserToken[]) {
  //   this.tokens = tokens
  // }

  setConnectType(connectType: string) {
    this.connectType = connectType;
  }
  setUserNanme(name: string) {
    this.userName = name;
  }
  setCurBtnFomoIcpInfo(Params: any) {
    localStorage.setItem('BtnFomoIcpInfo', JSON.stringify(Params));
    this.curBtnFomoIcpInfo = Params;
  }
  getCurBtnFomoIcpInfo() {
    return localStorage.getItem('BtnFomoIcpInfo');
  }
  observers = new Set();

  addObserver(observer: (userId: string) => void) {
    this.observers.add(observer);
  }

  removeObserver(observer: (userId: string) => void) {
    this.observers.delete(observer);
  }
  seticpAccount(val: number | string) {
    this.icpAccount = val;
  }
  notifyObservers() {
    this.observers.forEach((observer: any) => {
      observer(this.userId);
    });
  }
}

const appStore = new AppStore();
export async function setUserId(params: string) {
  appStore.setUserId(params);
}

export async function setAppConnect(principal: string) {
  if (principal.length > 0)
    // console.log('setAppConnect',principal);
    appStore.setUserId(principal);
}
export async function setAccountId(AccountId: string) {
  if (AccountId.length > 0) appStore.setAccountId(AccountId);
}
export async function setAppConnectType(principal: string, type: string) {
  if (principal.length > 0) appStore.setConnectType(type);
}

export async function setAppDisconnect() {
  localStorage.removeItem(STORE_WALLETTYPE);
  localStorage.removeItem(STORE_PRINCIPALID);
  appStore.setUserId('');
}
export async function setUserName(name: string) {
  appStore.setUserName(name);
}
export async function setCurBtnFomoIcpInfo(params: any) {
  appStore.setCurBtnFomoIcpInfo(params);
}
export async function setUserImg(img: string) {
  appStore.setUserImg(img);
}
export function getUserImg() {
  return appStore.getUserImg();
}
export function getUserName() {
  return appStore.getUserName();
}
export function getUserId() {
  return appStore.getUserId();
}
export function setbuyorsell(str: string) {
  return appStore.setbuyorsell(str);
}
export function setusertoken(num: number | string | null) {
  appStore.setusertoken(num);
}
export function setlockToken(num: number | string | null) {
  appStore.setlockToken(num);
}
export function seticpaccount(val: number | string) {
  appStore.seticpAccount(val);
}
export default appStore;
