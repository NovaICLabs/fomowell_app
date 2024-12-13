// // @ts-ignore
// import devCanisters from './development_canister_ids.json';
// // @ts-ignore
// import prodCanisters from './production_canister.ids.json';

import devCanisters from '../../canisterId/local/canister_ids.json';
import prodCanisters from './production_canister.ids.json';
export function initCanisterEnv() {
  const network = process.env.DFX_NETWORK ?? 'local';
  // console.log(network);

  const canisterConfig: {
    [key: string]: {
      [key: string]: string;
    };
  } = network === 'local' ? devCanisters : prodCanisters;
  // console.log(
  //   Object.entries(canisterConfig).reduce(
  //     (prev, current) => {
  //       const [canisterName, canisterDetails] = current;
  //       prev[`process.env.CANISTER_ID_${canisterName.toUpperCase()}`] = JSON.stringify(`${canisterDetails[network]}`);
  //       return prev;
  //     },
  //     {} as { [key: string]: string },
  //   ),
  // );

  return Object.entries(canisterConfig).reduce(
    (prev, current) => {
      const [canisterName, canisterDetails] = current;
      prev[`process.env.CANISTER_ID_${canisterName.toUpperCase()}`] = JSON.stringify(`${canisterDetails[network]}`);
      return prev;
    },
    {} as { [key: string]: string },
  );
}

export function getCanisters() {
  const network = process.env.DFX_NETWORK ?? 'local';
  const canisterConfig: {
    [key: string]: {
      [key: string]: string;
    };
  } = network === 'local' ? devCanisters : prodCanisters;
  return Object.keys(canisterConfig).map((canisterName) => {
    return canisterConfig[canisterName][network];
  });
}
