import { bitfinity } from './bitfinity';
import { dfinity } from './dfinity';
import { plug } from './plug';
import { stoic } from './stoic';
import { astrox } from './astroxme';
import { metaMask } from './msq';
import metaMaskPng from '../../assets/metamask.svg';
import dfinityPng from '../../assets/dfinity.svg';
import plugPng from '../../assets/plug.jpg';
import astroxPng from '../../assets/astroxme.svg';
import bitfinityPng from '../../assets/bitfinity.svg';
import stoicPng from '../../assets/stoic.png';
import nfidPng from '../../assets/nfid.svg';
import { nfid } from './nfid';
export const walletList = [
  {
    id: 'dfinity',
    name: 'Internet Identity',
    icon: dfinityPng,
    adapter: dfinity,
    walletName: 'Internet Identity',
  },
  {
    id: 'plug',
    name: 'Plug Wallet',
    icon: plugPng,
    adapter: plug,
    walletName: 'Plug',
  },
  {
    id: 'astrox',
    name: 'AstroX ME',
    icon: astroxPng,
    adapter: astrox,
    walletName: 'AstroX ME',
  },
  {
    id: 'bitfinity',
    name: 'Bitfinity Wallet',
    icon: bitfinityPng,
    adapter: bitfinity,
    walletName: 'Bitfinity',
  },
  {
    id: 'stoic',
    name: 'Stoic Wallet',
    icon: stoicPng,
    adapter: stoic,
    walletName: 'Stoic',
  },
  {
    id: 'metamask',
    name: 'Meta Mask',
    icon: metaMaskPng,
    adapter: metaMask,
    walletName: 'MetaMask',
  },
  {
    id: 'nfid',
    name: 'NFID',
    icon: nfidPng,
    adapter: nfid,
    walletName: 'Nfid',
  },
];
