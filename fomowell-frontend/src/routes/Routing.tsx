import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SetCoin from '@/pages/SetCoin/SetCoin';
import Home from '@/pages/Home/Home';
import UserInfo from '@/pages/User/UserInfo';
import IcpInfo from '@/pages/ICPInfo/ICPInfo';
import { messageInfo } from '@/utils/appType';
import { FomoProject } from '@/canisters/fomowell_launcher/fomowell_launcher.did';
interface RoutingProps {
  onMessageModal: (messageInfo: messageInfo) => void;
  onEditWellOpen: (value: Boolean) => void;
  openSelectWell: Boolean;
}
const Routing: React.FC<RoutingProps> = (props) => {
  const [CurBtnFomoInfo, setCurBtnFomoInfo] = React.useState<FomoProject | undefined>();
  const handleRouteChange = (Params: messageInfo) => {
    props.onMessageModal(Params);
  };
  const hanldWellModal = (value: Boolean) => {
    props.onEditWellOpen(value);
  };
  const setCurBtnFomoInfoFn = (Params: FomoProject) => {
    setCurBtnFomoInfo(Params);
  };
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/board" />} />
      <Route
        path="/board"
        element={<Home onCurBtnFomoInfo={setCurBtnFomoInfoFn} onMessageModal={handleRouteChange} />}
      />
      <Route
        path="/create"
        element={
          <SetCoin
            onRouteChange={handleRouteChange}
            onWellModal={hanldWellModal}
            openSelectWell={props.openSelectWell}
          />
        }
      />
      <Route path="/profile/:user_pid" element={<UserInfo onMessageModal={handleRouteChange}></UserInfo>}></Route>
      <Route
        path="/:fomo_pid"
        element={
          <IcpInfo
            onRouteChange={handleRouteChange}
            onWellModal={hanldWellModal}
            openSelectWell={props.openSelectWell}
            CurBtnFomoInfo={CurBtnFomoInfo}
          ></IcpInfo>
        }
      ></Route>
    </Routes>
  );
};

export default Routing;
