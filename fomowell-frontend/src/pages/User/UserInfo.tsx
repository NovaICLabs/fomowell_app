import React, { useEffect, useRef } from 'react';
import styles from './index.module.less';
import UserIcon from '@/assets/UserInfo/UserIcon.png';
import { ContentCopy, Launch } from '@mui/icons-material';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  styled,
  Card,
  CardContent,
  Popover,
  Skeleton,
  CircularProgress,
  Button,
} from '@mui/material';
import { getHold, amountType, amountItem } from '@/api/getCoinCreateOrHold';

import appStore, { getUserId } from '@/store/app';
import { icrc1_decimals, icrc1_metadata, icrc1_symbol, icrc1balance } from '@/api/icrc2_ledger';
import { getFomoUserInfo, get_fomo_by_create_user_pid, search_fomos } from '@/api/fomowell_launcher';
import { truncateString } from '@/utils/principal';
import { getMidPrice } from '@/api/icpex_router';
import { Principal } from '@dfinity/principal';
import tokenStore from '@/store/token';
import Big from 'big.js';
import { formatAmountByUnit, getAccountId } from '@/utils/common';
import type { SearchParam, FomoProject, UserProfile } from '@/canisters/fomowell_launcher/fomowell_launcher.did.js';
import { get_comments_len } from '@/api/fomowell_project';
import { throttle, debounce } from 'lodash';
import dayjs from 'dayjs';
import Message from '@/components/Snackbar/message';
import { useNavigate, useParams } from 'react-router-dom';
import { getImgUrl } from '@/utils/getImgUrl';
import SentToken from './sendToken/index'
interface ChildComponentProps {
  //message under components/Snackbar is no longer used
  onMessageModal: (messageInfo: { type: 'error' | 'info' | 'success' | 'warning'; content: string }) => void;
}
const UserInfo: React.FC<ChildComponentProps> = (props) => {
  const navigate = useNavigate();
  const [value, setValue] = React.useState(0);
  const { user_pid } = useParams();
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const [userBalance, setUserBalance] = React.useState<number>(0);
  interface StyledTabsProps {
    children?: React.ReactNode;
    value: number;
    onChange: (event: React.SyntheticEvent, newValue: number) => void;
  }
  const StyledTabs = styled((props: StyledTabsProps) => (
    <Tabs {...props} centered TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }} />
  ))({
    '& .MuiTabs-indicator': {
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    '& .MuiTabs-indicatorSpan': {
      // maxWidth: 40,
      width: '100%',
      backgroundColor: '#B691FF',
    },
  });
  interface StyledTabProps {
    label: string;
  }
  const StyledTab = styled((props: StyledTabProps) => <Tab disableRipple {...props} />)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: theme.typography.pxToRem(16),
    marginRight: theme.spacing(1),
    color: 'rgba(255, 255, 255)',
    '&.Mui-selected': {
      color: '#B691FF',
    },
    '&.Mui-focusVisible': {
      backgroundColor: '#B691FF',
    },
  }));
  const [tHold, setUHold] = React.useState<amountType>([]);
  const updatedMidPric: Record<string, number> = {};
  const [HoldLoding, setHoldLoding] = React.useState(false);
  const getHoldReq = async () => {
    setHoldLoding(true);
    const data = await getHold(user_pid!);
    // console.log(data);

    const getIcrc1_decimals = await icrc1_decimals();
    // for (const user_hold_token_info of data) {
    //   user_hold_token_info.balance = Number(
    //     new Big(Number(user_hold_token_info.balance)).div(new Big(10).pow(Number(getIcrc1_decimals))),
    //   );
    // }
    // for (const user_hold_token_info of data) {
    //   let price = BigInt(0);
    //   try {
    //     price = await getMidPrice(Principal.fromText(user_hold_token_info.poolpid));
    //   } catch (e) {
    //     console.log('getMidPrice error', e);
    //   }
    //   user_hold_token_info.icp_estimated = new Big(user_hold_token_info.balance)
    //     .times(new Big(Number(price)))
    //     .div(new Big(10).pow(Number(getIcrc1_decimals)))
    //     .toNumber();
    // }
    setUHold(data);
    updataprice(data, getIcrc1_decimals)
    setHoldLoding(false);
  };
  const updataprice = async (data: amountType, getIcrc1_decimals: number) => {
    for (const user_hold_token_info of data) {
      user_hold_token_info.balance = Number(
        new Big(Number(user_hold_token_info.balance)).div(new Big(10).pow(Number(getIcrc1_decimals))),
      );
    }
    // console.log(data);

    for (const user_hold_token_info of data) {
      let price = BigInt(0);
      try {
        price = await getMidPrice(Principal.fromText(user_hold_token_info.poolpid));
      } catch (e) {
        console.log('getMidPrice error', e);
      }
      user_hold_token_info.icp_estimated = new Big(user_hold_token_info.balance)
        .times(new Big(Number(price)))
        .div(new Big(10).pow(Number(getIcrc1_decimals)))
        .toNumber();
    }
    setUHold(data);
  }
  const [HoldName, setHoldName] = React.useState<string>();
  const icrc1MetadataName = async () => {
    const res = await icrc1_metadata();
    res.forEach((item) => {
      if (item[0] == 'icrc1:symbol') {
        // @ts-ignore
        setHoldName(item[1].Text);
      }
    });
  };

  const getMidPriceQeq = async (PoolId: Principal) => {
    // console.log(updatedMidPric);
  };
  const CanisterCopyBtnFn = (copyText: string) => {
    navigator.clipboard.writeText(copyText).then(
      () => {
        // props.onMessageModal({ type: 'success', content: 'success' });
        Message.success('Success!');
      },
      () => {
        // props.onMessageModal({ type: 'error', content: 'clipboard write failed' });
        Message.error('clipboard write failed');
      },
    );
  };
  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ paddingTop: '15px', paddingBottom: '10px' }}>
            <div>{children}</div>
          </Box>
        )}
      </div>
    );
  }
  const getAccountDashboardURL = (accountId: string) =>
    window.open(`https://dashboard.internetcomputer.org/account/${accountId}`);
  const getPrincipalDashboardURL = (canisterId: string) =>
    window.open(`https://dashboard.internetcomputer.org/account/${canisterId}`);

  const icrc1balanceReq = async () => {
    const balance = await icrc1balance([{ owner: Principal.fromText(user_pid!), subaccount: [] }]);
    const getIcrc1_decimals = await icrc1_decimals();
    setUserBalance(new Big(Number(balance)).div(new Big(10).pow(Number(getIcrc1_decimals))).toNumber());
  };
  const [coinCrateInfoitems, setCrateInfoitems] = React.useState<FomoProject[]>([]);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [loading, setLoading] = React.useState<boolean>(false);
  const UserInfoMain = useRef<HTMLDivElement>(null);
  const [userNames, setUserNames] = React.useState<Record<string, string>>({});
  const [userReplies, setUserReplies] = React.useState<Record<string, string>>({});
  const updatedUserNames: Record<string, string> = {};
  const updatedUserReplies: Record<string, string> = {};
  const GertSearch_fomos = async (user_pid: Principal, type: string) => {
    setLoading(true);
    const res = await get_fomo_by_create_user_pid(user_pid);
    if (res.length === 0) {
      setLoading(false);
      return;
    }
    console.log(res);

    // console.log(Params);
    updateFomoUserNames(res[0]);

    setCrateInfoitems((prevItems) => {
      const existingIds = new Set(
        prevItems.map((item) => {
          return item.fomo_pid.toString();
        }),
      );
      // Filter the newly retrieved data for elements that did not exist in the original list
      const uniqueItems = res[0].filter((item) => !existingIds.has(item.fomo_pid.toString()));
      // Adds non-duplicate elements to the original list
      return [...prevItems, ...uniqueItems];
    });
    setCurrentPage((prevPage) => {
      return prevPage + 1;
    });
    setLoading(false);
  };
  const updateFomoUserNames = async (fomoVec: FomoProject[]) => {
    for (const fomoItem of fomoVec) {
      const userName = await getUserFomoName(fomoItem.create_user_pid);
      const userReplie = await getCommentsLen(fomoItem.fomo_pid.toString(), fomoItem.create_user_pid);
      updatedUserNames[fomoItem.create_user_pid.toString()] = userName?.user_name!;
      updatedUserReplies[fomoItem.token_pid.toString()] = userReplie;
    }
    setUserReplies(updatedUserReplies);
    setUserNames(updatedUserNames);
  };
  const [CurUserInfo, setCurUserInfo] = React.useState<UserProfile>();
  const getUserFomoName = async (pid: Principal, type?: string) => {
    try {
      const name = await getFomoUserInfo(pid);
      if (type) {
        setCurUserInfo(name[0]);
        return name[0];
      }
      return name[0];
    } catch (error) {
      console.log(error);
      // props.onMessageModal({ type: 'error', content: 'getFomoUserInfo error' });
      Message.error('getFomoUserInfo error');
    }
  };
  const getCommentsLen = async (fomo_pid: string, create_user_pid: Principal) => {
    const userReplie = await get_comments_len(fomo_pid, create_user_pid);
    return userReplie.valueOf().toLocaleString();
  };
  const btnCoinCreated = (fomoid: string) => {
    window.open(window.location.origin + '/' + fomoid);
  };
  const [buyTokenOpen, setbuyTokenOpen] = React.useState(false);
  const OpenTopupRef = useRef<{ openModal: (baseinfo: amountItem) => void; isonpenWellModal: boolean, baseInfo: () => void }>(null);
  const btnOpenTopup = (baseInfo: amountItem) => {
    if (OpenTopupRef.current) {
      OpenTopupRef.current.openModal(baseInfo);
    }
  };
  const loadData = React.useCallback(() => {
    const addStart = 6 * currentPage - 6;
    //Prevents errors when loading currentPage=1 twice, and gets it right the second time
    if (currentPage == 1 && coinCrateInfoitems.length != 0) {
      return;
    }
    if (CurUserInfo) {
      GertSearch_fomos(CurUserInfo.user_pid, '');
    }
  }, [currentPage]);
  useEffect(() => {
    const handleScroll = debounce(() => {
      if (UserInfoMain.current && !loading) {
        const threshold = window.innerHeight + document.documentElement.scrollTop - 50;
        if (threshold > UserInfoMain.current.scrollHeight) {
          // Scroll to the bottom of the page to load more data
          window.removeEventListener('scroll', handleScroll);
          loadData();
        }
      }
    }, 1000);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading, loadData]);
  useEffect(() => {
    getHoldReq();
    icrc1MetadataName();
    icrc1balanceReq();
    setLoading(true);
    getUserFomoName(Principal.fromText(user_pid!), 'Cur').then((res) => {
      GertSearch_fomos(res?.user_pid!, 'one');
    });
  }, []);
  return (
    <div ref={UserInfoMain} className={styles.UserInfoMain}>
      <div
        style={{ color: '#fff', cursor: 'pointer', padding: '10px' }}
        onClick={(e) => {
          e.stopPropagation();
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/board');
          }
        }}
      >
        [ go back ]
      </div>
      <div className={styles.UserInfoHeader}>
        <div className={styles.HeaderTop}>
          <div className={styles.HeaderLeft}>
            <img className={styles.UserIcon} src={getImgUrl(CurUserInfo?.avatar!)} />
            <div className={styles.UserName}>{CurUserInfo?.user_name}</div>
          </div>
          <div className={styles.HeaderRight}>
            <div>{formatAmountByUnit(userBalance)} ICP</div>
          </div>
        </div>
        <div className={styles.HeaderBottom}>
          <div className={styles.UserID}>
            <div>Principle lD : {truncateString(user_pid!)}</div>
            <div onClick={() => CanisterCopyBtnFn(user_pid!)}>
              <ContentCopy className={styles.IconImg}></ContentCopy>
            </div>
            <div onClick={() => getPrincipalDashboardURL(user_pid!)}>
              <Launch className={styles.IconImg}></Launch>
            </div>
          </div>
          <div className={styles.UserID}>
            <div>Account Id : {truncateString(getAccountId(user_pid!))}</div>
            <div>
              <ContentCopy
                className={styles.IconImg}
                onClick={() => CanisterCopyBtnFn(appStore.accountId)}
              ></ContentCopy>
            </div>
            <div>
              <Launch className={styles.IconImg} onClick={() => getAccountDashboardURL(appStore.accountId)}></Launch>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.UserInfoBottom}>
        <Box sx={{ borderColor: 'divider' }}>
          <StyledTabs value={value} onChange={handleChange}>
            <StyledTab label="coin held" />
            <StyledTab label="coin created" />
          </StyledTabs>
        </Box>
        <TabPanel value={value} index={1}>
          {coinCrateInfoitems.map((item, index) => {
            return (
              <Card className={styles.CoinCreatedCard} key={index}>
                <div
                  className={styles.Content}
                  style={{ marginBottom: '10px' }}
                  onClick={() => btnCoinCreated(item.fomo_pid.toString())}
                >
                  <img className={styles.LeftImg} src={getImgUrl(item.img_url)} />
                  <div className={styles.RightContent}>
                    <div className={styles.headerFrom}>
                      Created by <img style={{ height: '20px' }} src={getImgUrl(CurUserInfo?.avatar!)}></img>{' '}
                      {userNames[item.create_user_pid.toString()]}
                    </div>
                    <div className={styles.MarketCap}>
                      market cap: $
                      {item.market_cap !== undefined
                        ? formatAmountByUnit(
                          Big(item.market_cap.toString())
                            .div(10 ** 18)
                            .toNumber(),
                        )
                        : '0'}
                    </div>
                    <div className={styles.replies}>replies: {userReplies[item.token_pid.toString()]}</div>
                    <div className={styles.repliesContent}>{item.description}</div>
                  </div>
                </div>
              </Card>
            );
          })}
          <CircularProgress
            thickness={4}
            size={20}
            sx={{
              color: '#fff',
              borderRadius: '50%',
              display: loading ? '' : 'none',
              marginLeft: '45%',
              translate: '0px -15px',
            }}
          />
        </TabPanel>
        <TabPanel value={value} index={0}>
          {tHold.map((item, index) => {
            return (
              <Card className={styles.CoinHoldCard} key={index}>
                <div className={styles.Content} onClick={() => btnCoinCreated(item.fomopid)}>
                  <img
                    className={styles.LeftCoinHoldImg}
                    src={`https://metrics.icpex.org/images/${item.tokenid}.png`}
                  ></img>
                  <div className={styles.CoinHoldInfo}>
                    <div className={styles.CoinType}>
                      {formatAmountByUnit(item.balance)} {item.symbol}
                    </div>
                    <div className={styles.CoinNum}>
                      <div className={styles.Num}>{formatAmountByUnit(item.icp_estimated)} ICP</div>
                    </div>
                  </div>
                </div>
                <Button sx={{ display: appStore.userId == item.userid ? '' : 'none' }} onClick={() => btnOpenTopup(item)} className={styles.sendtoken}>Send</Button>
              </Card>
            );
          })}
          {/* <CircularProgress
            thickness={4}
            size={20}
            sx={{
              color: '#fff',
              borderRadius: '50%',
              display: HoldLoding ? '' : 'none',
              marginLeft: '45%',
              translate: '0px -15px',
            }}
          /> */}
        </TabPanel>
      </div>
      <SentToken ref={OpenTopupRef} onopen={buyTokenOpen}></SentToken>
    </div>
  );
};
export default UserInfo;
