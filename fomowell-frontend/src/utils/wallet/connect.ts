import { Artemis } from 'artemis-web3-adapter';
import { host, whitelist } from '@/utils/env';
import appStore, {
  setAppConnect,
  setAppDisconnect,
  setAppConnectType,
  setAccountId,
  setUserName,
  setUserId,
  setUserImg,
  getUserImg,
  setusertoken,
  seticpaccount,
  setlockToken,
} from '@/store/app';
import { getBaseUserInfo, setUserInfo } from '@/api/fomowell_launcher';
import { account_balance, decimals } from '@/api/ledger';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';
import Big from 'big.js';

export const artemisWalletAdapter = new Artemis();
export const STORE_PRINCIPALID = 'principalId';
export const STORE_WALLETTYPE = 'walletType';
export async function requestConnect(type = 'plug') {
  try {
    const publicKey = await artemisWalletAdapter.connect(type, { whitelist, host });
    if (publicKey) {
      localStorage.setItem(STORE_PRINCIPALID, publicKey);
      localStorage.setItem(STORE_WALLETTYPE, type);
      // // set app state
      setAppConnect(publicKey);
      setAppConnectType(publicKey, type);
      setAccountId(publicKey);
      let decimal = (await decimals()).decimals;
      const balance = await account_balance([{ account: AccountIdentifier.fromHex(appStore.accountId).toNumbers() }]);
      await seticpaccount(new Big(Number(balance.e8s)).div(new Big(10).pow(Number(decimal))).toString());
    } else {
      // localStorage.clear();
    }
    return !!publicKey;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return false;
  }
}
export async function disconnect() {
  const timer = new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  let result;
  try {
    // bug: sometimes disconnect always in pending status
    await artemisWalletAdapter.disconnect();
    // const agree_res = localStorage.getItem('agreeRisk')
    localStorage.clear();
    appStore.userId = '';
    // localStorage.setItem('agreeRisk', agree_res ? 'false' : 'true')
    result = await Promise.race([timer, disconnect]);
  } catch (error) {
    console.error(error);
  }
  // set app state
  setAppDisconnect();
  return result;
}
export async function verifyConnectionAndAgent() {
  let principalId = localStorage.getItem(STORE_PRINCIPALID);
  let type: any = localStorage.getItem(STORE_WALLETTYPE);
  if (!!principalId && principalId !== 'false') {
    // console.log(principalId);

    // const userName = localStorage.getItem('userName');
    const name = await getBaseUserInfo(principalId);
    // console.log(name);

    // console.log(name[0]);
    if (name[0]) {
      setUserName(name[0].user_name);
      setUserImg(name[0].avatar);
      setusertoken(name[0].user_points.length == 0 ? null : Number(name[0].user_points));
      setlockToken(name[0].user_pre_reward_points.length != 0 ? Number(name[0].user_pre_reward_points) : null);
    } else {
      await setUserInfo(appStore.userId, { user_name: [], avatar: ['default'] });
      const name = await getBaseUserInfo(principalId);
      if (name[0]) {
        setUserName(name[0].user_name);
        setUserImg(name[0].avatar);
        setusertoken(name[0].user_points.length == 0 ? null : Number(name[0].user_points));
        setlockToken(name[0].user_pre_reward_points.length != 0 ? Number(name[0].user_pre_reward_points) : null);
      }
    }
    await requestConnect(type);
    await setAccountId(principalId);
    let decimal = (await decimals()).decimals;
    const balance = await account_balance([{ account: AccountIdentifier.fromHex(appStore.accountId).toNumbers() }]);
    await seticpaccount(new Big(Number(balance.e8s)).div(new Big(10).pow(Number(decimal))).toString());
    return true;
  } else {
    return false;
  }
}
