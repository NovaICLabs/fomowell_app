import { action, makeObservable, observable } from 'mobx';

// import { makePersistable } from 'mobx-persist-store';
interface BaseToken {
  protocol: 'DIP20' | 'ICRC-1' | 'ICRC-2';
  canisterId: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
}

interface TokenMap {
  [key: string]: BaseToken;
}
export class TokenStore {
  pinTokens: string[] = [];
  addTokens: string[] = [];
  tokenMap: TokenMap = {};
  dollar2ICP: string | number | null = null;

  constructor() {
    makeObservable(this, {
      pinTokens: observable,
      addTokens: observable,
      addPinToken: action.bound,
      addUserToken: action.bound,
      dollar2ICP: observable,
    });
    this.dollar2ICP = '0.1898085';
    // makePersistable(this, {
    //   name: 'tokens',
    //   properties: ['pinTokens', 'addTokens'],
    //   storage: window.localStorage,
    // });
  }

  addPinToken(tokenId: string) {
    if (this.pinTokens.includes(tokenId)) {
      this.pinTokens = this.pinTokens.filter((id) => id !== tokenId);
    } else {
      this.pinTokens = [...new Set([tokenId, ...this.pinTokens])];
    }
  }

  addUserToken(tokenId: string) {
    if (this.addTokens.includes(tokenId)) {
      this.addTokens = this.addTokens.filter((id) => id !== tokenId);
    } else {
      this.addTokens = [...new Set([tokenId, ...this.addTokens])];
    }
  }

  setDollar2ICP(v: string | number) {
    this.dollar2ICP = v;
  }
}

const tokenStore = new TokenStore();

export default tokenStore;
