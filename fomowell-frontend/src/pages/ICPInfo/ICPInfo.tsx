import styles from "./index.module.less";
import Usericon from "@/assets/icpInfo/usericon.png";
import X from "@/assets/home/X.png";
import buy from "@/assets/icpInfo/BuyIcon.png";
import linkIcon from "@/assets/icpInfo/linkIcon.png";
import pennding from "@/assets/icpInfo/pending.png";
import success from "@/assets/icpInfo/success.png";
import LinearProgress, {
	LinearProgressProps,
} from "@mui/material/LinearProgress";
import {
	Box,
	Button,
	CircularProgress,
	ClickAwayListener,
	Divider,
	Drawer,
	Fade,
	IconButton,
	Input,
	InputAdornment,
	InputBase,
	InputLabel,
	Modal,
	Popover,
	Snackbar,
	Tooltip,
	Typography,
} from "@mui/material";
import React, { ReactEventHandler, useEffect, useRef, useState } from "react";
import { Principal } from "@dfinity/principal";
import type { swapTokenToTokenType } from "@/api/icpex_router";
import {
	add_comment,
	get_comments_by_index,
	get_top10_holders,
	cycles as fomowell_project_cycles,
} from "@/api/fomowell_project";
import {
	icrc1_metadata,
	icrc1balance,
	canisterId as icrc2_ledgercanisterId,
	icrc_plus_cycles,
} from "@/api/icrc2_ledger";
import {
	getPoolInfo,
	swapTokenToToken,
	querySellQuote,
	querySellBase,
} from "@/api/icpex_router";
import dayjs from "dayjs";
import { BatchTransact } from "artemis-web3-adapter";
import {
	canisterId as icrc2CanisterId,
	idlFactory as icrc2IdlFactory,
} from "@/canisters/icrc2_ledger";
import tokenStore from "@/store/token";
import { messageInfo } from "@/utils/appType";
import { artemisWalletAdapter } from "@/utils/wallet/connect";
import CheckIcon from "@mui/icons-material/Check";
import { querySwapStatusStr } from "@/api/icpex_transactions";
import CloseIcon from "@mui/icons-material/Close";
import {
	Comments,
	CommentsCreate,
	HolderInfo,
} from "@/canisters/fomowell_project/fomowell_project.did";
import {
	getBaseUserInfo,
	getFomoUserInfo,
	get_fomo_by_fomo_idx,
	get_fomo_by_fomo_pid,
	get_god_of_wells,
	ownership_transfer,
	search_fomos,
	set_buy_or_sell,
} from "@/api/fomowell_launcher";
import {
	FomoProject,
	UserProfile,
} from "@/canisters//fomowell_launcher/fomowell_launcher.did";
import type { PoolInfo } from "@/canisters//icpex_router/icpl_router.did";
import chooseFile from "@/assets/home/ChooseFile.png";
import { LoadingButton } from "@mui/lab";
import appStore, {
	setbuyorsell,
	setlockToken,
	setusertoken,
} from "@/store/app";
import Message from "@/components/Snackbar/message";
import classNames from "classnames";
import { debounce, throttle } from "lodash";
import { formatAmountByUnit, formatAmountByUnitToT } from "@/utils/common";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { QeqImg } from "@/api/img_request";
import { getImgUrl } from "@/utils/getImgUrl";
import Big from "big.js";
import { observer } from "mobx-react-lite";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { truncateString } from "@/utils/principal";
import { ContentCopy, Launch, Lock } from "@mui/icons-material";
import wellToken from "@/assets/welltoken.png";
import {
	deposit,
	icrc1_balance_of,
	icrc1_fee,
	withdraw,
	withdraw_from,
} from "@/api/cycles_ledger";
import {
	DepositArgs,
	Account,
	WithdrawArgs,
	WithdrawFromArgs,
} from "@/canisters/cycles_ledger/cycles_ledger.did";
import { icpex_pool_cycles } from "@/api/icpex_pool";
import SnackbarProgress, {
	SnackbarModalHandles,
} from "@/components/SnackbarProgress/SnackbarProgress";
import ImagePreview from "@/components/PicturePreview";
import addcycles from "@/assets/icpInfo/addcycles.png";
import addcyclesArr from "@/assets/icpInfo/addcyclesArr.jpg";
import addcyclesArrpre from "@/assets/icpInfo/addcyclespre.png";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { HttpAgent } from "@dfinity/agent";
import { request } from "@dfinity/agent/lib/cjs/canisterStatus";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import SNEED from "@/assets/SNEED.png";
interface UserInfoProps {
	//message under components/Snackbar is no longer used
	onRouteChange: (Params: messageInfo) => void;
	onWellModal: (Param: Boolean) => void;
	openSelectWell: Boolean;
	CurBtnFomoInfo: FomoProject | undefined;
}
type curFomoInfoType = {
	create_time: number;
	create_user_pid: string;
	description: string;
	fomo_idx: number;
	fomo_pid: string;
	god_of_wells_progress: number;
	img_url: string;
	market_cap: number;
	name: string;
	pool_pid: string;
	pool_progress: number;
	recently_bump_time: number;
	recently_reply_time: number;
	reply_count: number;
	telegram_link: string;
	ticker: string;
	token_pid: string;
	twitter_link: string;
	website: string;
};
const icpInfo = observer((props: UserInfoProps) => {
	const navigate = useNavigate();
	const [curFomoInfo, setFomoInfo] = React.useState<FomoProject[]>([]);
	// const curFomoInfo: curFomoInfoType = JSON.parse(appStore.getCurBtnFomoIcpInfo() as any);
	// const fomo_pid: string = new URLSearchParams(useLocation().search).get('fomo_pid')!;
	const { fomo_pid } = useParams();
	const tabRefBuy = useRef<HTMLDivElement>(null);
	const tabRefSell = useRef<HTMLDivElement>(null);
	const [openStep, setOpenStep] = React.useState(false);
	const [isStepApprove, setIsStepApprove] = React.useState(true);
	const [isStepCreateFomo, setIsStepCreateFomo] = React.useState(false);
	const [StepApproveSuccess, setStepApproveSuccess] = React.useState(false);
	const [StepCreateFomoSuccess, setStepCreateFomoSuccess] =
		React.useState(false);
	const [InputSlippage, setInputSlippage] = React.useState<string>("3");
	const [isLodingBalance, setIsLodingBalance] = React.useState<boolean>(false);
	function LinearProgressWithLabel(
		props: LinearProgressProps & { value: number },
	) {
		return (
			<Box sx={{ display: "flex", alignItems: "center" }}>
				<Box sx={{ width: "100%", mr: 1, marginTop: "10px" }}>
					<LinearProgress
						variant="determinate"
						{...props}
						sx={{
							".css-buamxv-MuiLinearProgress-bar1": {
								backgroundColor: "#00CF26",
								borderRadius: "8px",
							},
						}}
						style={{
							height: "10px",
							background: "#47494b",
							borderRadius: "8px",
						}}
					/>
				</Box>
			</Box>
		);
	}
	const [CurBuyOrSell, setCurBuyOrSell] = React.useState<swapTokenToTokenType>({
		base_from_token: Principal.fromText(icrc2_ledgercanisterId),
		base_to_token: Principal.fromText("aaaaa-aa"),
		base_min_return_amount: BigInt(0),
		base_from_amount: BigInt(0),
		pairs: [Principal.fromText("aaaaa-aa")],
		directions: BigInt(1),
		deadline: BigInt(0),
	});
	const ModolStyle = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		backgroundColor: "#262939",
		borderRadius: "8px",
		borderColor: "#262939",
		// width: '400px',
		pt: 2,
		px: 4,
		pb: 3,
		// '.MuiBackdrop-root': {
		//   touchAction: 'none',
		// },
	};
	const addCyclesModalStyles = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		backgroundColor: "#232634",
		borderRadius: "8px",
		width: "350px",
		padding: "20px",
		outline: "none",
	};
	const CanisterDevelopersModalStyles = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		backgroundColor: "#232634",
		borderRadius: "8px",
		width: "410px",
		padding: "20px",
		outline: "none",
	};
	const btnBuy = () => {
		setCurBuyOrSell({
			...CurBuyOrSell,
			directions: BigInt(1),
			base_from_token: Principal.fromText(icrc2_ledgercanisterId),
			base_to_token: curFomoInfo[0]?.token_pid,
		});
		if (tabRefBuy.current && tabRefSell.current) {
			tabRefBuy.current.style.background =
				"linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)";
			tabRefSell.current.style.background = "";
			tabRefSell.current.style.backgroundColor = "#34384B";
		}
	};

	const btnSell = () => {
		setCurBuyOrSell({
			...CurBuyOrSell,
			directions: BigInt(0),
			base_from_token: curFomoInfo[0]?.token_pid,
			base_to_token: Principal.fromText(icrc2_ledgercanisterId),
		});
		if (tabRefBuy.current && tabRefSell.current) {
			tabRefSell.current.style.background = "#f77170";
			tabRefBuy.current.style.background = "";
			tabRefBuy.current.style.backgroundColor = "#34384B";
		}
	};
	const [BuyMetadata, setBuyMetadata] = React.useState<number>(0);
	const [SellMetadata, setSellMetadata] = React.useState<number>(0);
	const btnPlaceTrade = async () => {
		const amount = new Big(CurBuyOrSell.base_from_amount.toString());
		// console.log(BigInt(amount.toString()), CurBuyOrSell.base_from_amount, amount.plus(1).toString());
		// const amount = Number(CurBuyOrSell.base_from_amount);
		if (!CurBuyOrSell.base_from_amount) {
			Message.error("Please enter the amount");
			return;
		}
		if (appStore.userId) {
			setOpenStep(true);
			setopenRightBox(true);
			new BatchTransact(
				[
					{
						idl: icrc2IdlFactory,
						canisterId:
							CurBuyOrSell.directions == BigInt(1)
								? icrc2CanisterId
								: curFomoInfo[0].token_pid.toString(),
						methodName: "icrc2_approve",
						args: [
							{
								amount: BigInt(amount.plus(1).toString()),
								created_at_time: [],
								expected_allowance: [],
								expires_at: [],
								fee: [],
								from_subaccount: [],
								memo: [],
								spender: {
									owner: Principal.fromText(
										process.env.CANISTER_ID_ICPL_ROUTER!,
									),
									subaccount: [],
								},
							},
						],
						onSuccess: async () => {
							try {
								setIsStepApprove(false);
								setStepApproveSuccess(true);
								setopenRightBox(true);
								getswapTokenToToken();
							} catch (err: any) {
								Message.error(err.toString());
								setTimeout(() => {
									setOpenStep(false);
								}, 800);
								setopenRightBox(false);
							} finally {
							}
						},
						onFail: (err: any) => {
							Message.error("place trade failed");
							setopenRightBox(false);
							setTimeout(() => {
								setOpenStep(false);
							}, 800);
						},
					} as any,
				],
				artemisWalletAdapter,
			).execute();
		} else {
			props.onWellModal(true);
		}
	};
	const [CurswitchIcp, setCurswitchIcp] = React.useState("0");
	const switchIcp = async (
		value: FomoProject[],
		base_from_amount: string,
		directions: string,
		Slippage: string,
		SellMetadata: number,
		BuyMetadata: number,
	) => {
		// console.log(value[0].pool_pid.toString(), process.env.CANISTER_ID_ICPL_ROUTER, value[0].token_pid.toString());
		// console.log(value[0], base_from_amount);
		// console.log(value,BuyMetadata, SellMetadata);
		setIsLodingBalance(true);
		if (Number(directions) == 1) {
			const res = await querySellQuote([
				value[0]?.pool_pid,
				BigInt(base_from_amount),
			]);
			setCurswitchIcp(
				String(
					Math.floor(
						(Number(res[0]) * (1 - Number(Slippage) / 100)) /
							10 ** SellMetadata,
					),
				),
			);
		} else if (Number(directions) == 0) {
			// console.log(base_from_amount, 'base_from_amount');
			const res = await querySellBase([
				value[0]?.pool_pid,
				BigInt(base_from_amount),
			]);

			setCurswitchIcp(
				String(
					(Number(res[0]) * (1 - Number(Slippage) / 100)) / 10 ** BuyMetadata,
				),
			);
		}
		setIsLodingBalance(false);
	};
	const getswapTokenToToken = async () => {
		// console.log(CurBuyOrSell);

		setIsStepCreateFomo(true);
		let receive_amount: bigint | string = "";
		if (Number(CurBuyOrSell.directions) == 1) {
			const res = await querySellQuote([
				curFomoInfo[0]?.pool_pid,
				BigInt(CurBuyOrSell.base_from_amount),
			]);
			receive_amount = res[0];
			if (isExpertMode) {
				setCurBuyOrSell({ ...CurBuyOrSell, base_min_return_amount: BigInt(0) });
			} else {
				setCurBuyOrSell({
					...CurBuyOrSell,
					base_min_return_amount: BigInt(
						Math.floor(
							Number(receive_amount) * (1 - Number(InputSlippage) / 100),
						),
					),
				});
			}
		} else if (Number(CurBuyOrSell.directions) == 0) {
			try {
				const res = await querySellBase([
					curFomoInfo[0]?.pool_pid,
					BigInt(CurBuyOrSell.base_from_amount),
				]);
				receive_amount = res[0];
				if (isExpertMode) {
					setCurBuyOrSell({
						...CurBuyOrSell,
						base_min_return_amount: BigInt(0),
					});
				} else {
					setCurBuyOrSell({
						...CurBuyOrSell,
						base_min_return_amount: BigInt(
							Math.floor(
								Number(receive_amount) * (1 - Number(InputSlippage) / 100),
							),
						),
					});
				}
			} catch (error: any) {
				console.log(error);
				Message.error(error.result.reject_message);
				setOpenStep(false);
				// setIsStepCreateFomo(false);
				// setStepCreateFomoSuccess(true);
				setTimeout(() => {
					setOpenStep(false);
					setStepCreateFomoSuccess(false);
					setIsStepApprove(true);
					setIsStepCreateFomo(false);
					setStepApproveSuccess(false);
					setStepCreateFomoSuccess(false);
				}, 800);
				return;
			}
		}
		try {
			const res = await swapTokenToToken({
				...CurBuyOrSell,
				pairs: [curFomoInfo[0].pool_pid],
				base_min_return_amount: isExpertMode
					? BigInt(0)
					: BigInt(
							Math.floor(
								Number(receive_amount) * (1 - Number(InputSlippage) / 100),
							),
						),
			});
			if ("Err" in res) {
				// props.onRouteChange({ type: 'error', content: res['Err'] });
				Message.error(res["Err"]);
				setStepCreateFomoSuccess(false);
				setopenRightBox(false);
				setTimeout(() => {
					setIsStepApprove(true);
					setIsStepCreateFomo(false);
					setStepApproveSuccess(false);
					setOpenStep(false);
				}, 800);
			} else if (res["Ok"]) {
				let state = false;
				const time = setInterval(async () => {
					const status = await querySwapStatusStr(String(res["Ok"]));
					if ("Succeeded" in status[0].status) {
						state = true;
						clearInterval(time);
						setStepCreateFomoSuccess(true);
						setIsStepCreateFomo(false);
						setopenRightBox(false);
						Message.success("place trade success");
						getBuyicrc1_metadata().then((res) => {
							getUserBalance(res);
						});
						geticrc1_metadata().then((res) => {
							getBuyUserBalance(res);
						});
						await set_buy_or_sell({
							fomo_idx: curFomoInfo[0].fomo_idx,
							buy_sell_op:
								CurBuyOrSell.directions == BigInt(1) ? "buy" : "sell",
							icp_amount:
								CurBuyOrSell.directions == BigInt(1)
									? BigInt(
											Math.floor(
												status[0].input_amount[0]! * 10 ** BuyMetadata,
											),
										)
									: BigInt(
											Math.floor(
												status[0].receive_amount[0]! * 10 ** SellMetadata,
											),
										),
							swap_hash: BigInt(res["Ok"]),
						});
						setbuyorsell(String(res["Ok"]));
						//success updata
						getTop10Holders();
						search_fomosReq();
						get_god_of_wellsReq();
						getPoolInfoFn();
						setTimeout(() => {
							setStepCreateFomoSuccess(false);
							setOpenStep(false);
							setIsStepApprove(true);
							setIsStepCreateFomo(false);
							setStepApproveSuccess(false);
						}, 800);
					} else if ("Failed" in status[0].status) {
						Message.error("place trade failed");
						state = true;
						clearInterval(time);
						setStepCreateFomoSuccess(false);
						setTimeout(() => {
							setIsStepApprove(true);
							setIsStepCreateFomo(false);
							setStepApproveSuccess(false);
							setOpenStep(false);
							setopenRightBox(false);
						}, 800);
					}
				}, 1000);
				if (state) {
					clearInterval(time);
				}
				tabRefSell.current!.style.pointerEvents = "auto";
			}
		} catch (err) {
			console.log(err);
			setStepCreateFomoSuccess(false);
			setTimeout(() => {
				setIsStepApprove(true);
				setIsStepCreateFomo(false);
				setStepApproveSuccess(false);
				setOpenStep(false);
			}, 800);
			Message.error("place trade failed");
			setopenRightBox(false);
		}
	};
	const [buyTokenName, setbuyTokenName] = React.useState<string>();
	const [sellTokenName, setsellTokenName] = React.useState<string>();
	const [CurUserBalance, setGetUserBalance] = React.useState<number | string>(
		0,
	);
	const [CurUserBuyBalance, setCurUserBuyBalance] = React.useState<number>(0);
	const getUserBalance = async (decimals: number) => {
		const balance = await icrc1balance(
			[{ owner: Principal.fromText(appStore.getUserId()), subaccount: [] }],
			curFomoInfo[0].token_pid.toString(),
		);
		// console.log(balance);

		setGetUserBalance(
			new Big(balance.toString())
				.div(new Big(10).pow(Number(decimals)))
				.toString(),
		);
	};
	const getBuyUserBalance = async (decimals: number) => {
		// console.log([{ owner: appStore.getUserId(), subaccount: [] }]);

		const balance = await icrc1balance([
			{ owner: Principal.fromText(appStore.getUserId()), subaccount: [] },
		]);
		setCurUserBuyBalance(
			new Big(Number(balance))
				.div(new Big(10).pow(Number(decimals)))
				.toNumber(),
		);
	};
	const geticrc1_metadata = async () => {
		const metadataVal = await icrc1_metadata();
		let curdecimals: number = 1;
		metadataVal.forEach((item) => {
			if (item[0] == "icrc1:decimals") {
				//@ts-ignore
				setSellMetadata(Number(item[1].Nat));
				//@ts-ignore
				curdecimals = Number(item[1].Nat);
			} else if (item[0] == "icrc1:symbol") {
				// @ts-ignore
				setsellTokenName(item[1].Text);
			}
		});
		return curdecimals;
	};
	const getBuyicrc1_metadata = async () => {
		const metadataVal = await icrc1_metadata(
			curFomoInfo[0].token_pid.toString(),
		);
		let curdecimals: number = 1;
		metadataVal.forEach((item) => {
			if (item[0] == "icrc1:decimals") {
				//@ts-ignore
				setBuyMetadata(Number(item[1].Nat));
				//@ts-ignore
				curdecimals = Number(item[1].Nat);
			} else if (item[0] == "icrc1:symbol") {
				// @ts-ignore
				setbuyTokenName(item[1].Text);
			}
		});
		return curdecimals;
	};
	const handleCloseStep = () => {
		setOpenStep(false);
		setStepCreateFomoSuccess(false);
		setIsStepApprove(true);
		setIsStepCreateFomo(false);
		setStepApproveSuccess(false);
		setStepCreateFomoSuccess(false);
	};
	const selectHandle = (type: string) => {
		if (type == "reset") {
			setCurBuyOrSell({ ...CurBuyOrSell, base_from_amount: "" });
			setInputValue("");
		} else if (typeof Number(type) == "number") {
			// console.log(CurUserBalance * Number(type) * 10 ** SellMetadata);
			setCurBuyOrSell({
				...CurBuyOrSell,
				base_from_amount:
					CurBuyOrSell.directions == BigInt(1)
						? BigInt(Math.floor(Number(type) * 10 ** BuyMetadata))
						: Number(type) != 1
							? BigInt(
									new Big(Number(type))
										.times(CurUserBalance)
										.times(Math.pow(10, SellMetadata))
										.toFixed(0, 0),
								)
							: BigInt(
									new Big(Number(type))
										.times(CurUserBalance)
										.minus(1)
										.times(Math.pow(10, SellMetadata))
										.toFixed(0, 0),
								),
			});
			// console.log(Math.floor(Number(type) * 10 ** BuyMetadata));
			// console.log(new Big(CurUserBalance).times(type).minus(1).toString());

			CurBuyOrSell.directions == BigInt(1)
				? setInputValue(type)
				: Number(type) == 1
					? setInputValue(
							new Big(CurUserBalance).times(type).minus(1).toString(),
						)
					: setInputValue(new Big(CurUserBalance).times(type).toString());
		} else {
			Message.error("The entered value is incorrect");
		}
	};
	const debounceSwitchIcp = React.useCallback(
		debounce(
			(
				value,
				base_from_amount,
				directions,
				InputSlippage,
				SellMetadata,
				BuyMetadata,
			) => {
				switchIcp(
					value,
					base_from_amount,
					directions,
					InputSlippage,
					SellMetadata,
					BuyMetadata,
				);
			},
			500,
		),
		[],
	);
	useEffect(() => {
		if (curFomoInfo[0]) {
			debounceSwitchIcp(
				curFomoInfo,
				CurBuyOrSell.base_from_amount,
				CurBuyOrSell.directions,
				InputSlippage,
				SellMetadata,
				BuyMetadata,
			);
		}
	}, [CurBuyOrSell.base_from_amount, InputSlippage, CurBuyOrSell.directions]);
	useEffect(() => {
		if (curFomoInfo[0]) {
			getBuyicrc1_metadata().then((res: number) => {
				if (appStore.userId) {
					getUserBalance(res);
				}
			});
			geticrc1_metadata().then((res: number) => {
				if (appStore.userId) {
					getBuyUserBalance(res);
				}
			});
			if (CurBuyOrSell.directions == BigInt(1)) {
				setCurBuyOrSell({
					...CurBuyOrSell,
					base_to_token: curFomoInfo[0].token_pid,
				});
			} else {
				setCurBuyOrSell({
					...CurBuyOrSell,
					base_from_token: curFomoInfo[0].token_pid,
				});
			}
		}
	}, [curFomoInfo, appStore.userId]);
	const [inputValue, setInputValue] = React.useState<number | string>("");
	const InputAmountChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (
			typeof Number(e.target.value) == "number" &&
			!isNaN(Number(e.target.value))
		) {
			setInputValue(e.target.value);
			setCurBuyOrSell({
				...CurBuyOrSell,
				base_from_amount:
					CurBuyOrSell.directions == BigInt(1)
						? BigInt(Math.floor(Number(e.target.value) * 10 ** BuyMetadata))
						: BigInt(Math.floor(Number(e.target.value) * 10 ** SellMetadata)),
			});
		} else {
			// props.onRouteChange({ type: 'error', content: 'The entered value is incorrect' });
			Message.error("The entered value is incorrect");
		}
	};
	const [LeftFomoContentList, setLeftFomoContentList] = React.useState<
		Array<Comments>
	>([]);
	const [currentPage, setCurrentPage] = React.useState<number>(1);
	const [loading, setLoading] = React.useState<boolean>(false);
	// UserProfile
	const [userInfoList, setUserInfoList] = React.useState<
		Record<string, UserProfile>
	>({});
	const Usercomments = useRef<HTMLDivElement>(null);
	const [isnull, setisnull] = React.useState(true);
	const getCommentsByIndex = async (start: number) => {
		setLoading(true);
		if (!curFomoInfo[0]) {
			setLoading(false);
			return;
		}
		const res = await get_comments_by_index(
			curFomoInfo[0]?.fomo_pid.toString(),
			{
				limit: BigInt(15),
				start: BigInt(start),
			},
		);
		if (res.fomo_vec.length === 0) {
			setLoading(false);
			setisnull(false);
			// console.log(res.fomo_vec);

			return;
		}
		setLeftFomoContentList((prevItems) => {
			const existingIds = new Set(
				prevItems.map((item) => {
					return item.comment_idx.toString();
				}),
			);
			// Filter the newly retrieved data for elements that did not exist in the original list
			const uniqueItems = res.fomo_vec.filter(
				(item) => !existingIds.has(item.comment_idx.toString()),
			);
			// Adds non-duplicate elements to the original list
			// setUserInfoList
			return [...prevItems, ...uniqueItems];
		});

		// setLeftFomoContentList(res.fomo_vec);
		setLoading(false);
	};
	const setUserInfo = async () => {
		const updatedUserNames: Record<string, any> = {};
		for (const fomoItem of LeftFomoContentList) {
			const userName = await getUserFomoName(fomoItem.user_pid);
			updatedUserNames[fomoItem.user_pid.toString()] = userName!;
		}
		setUserInfoList(updatedUserNames);
	};
	useEffect(() => {
		setUserInfo();
	}, [LeftFomoContentList]);
	const getUserFomoName = async (pid: Principal) => {
		try {
			const name = await getFomoUserInfo(pid);
			return name[0] ? name[0] : "";
		} catch (error) {
			console.log(error);
			// props.onMessageModal({ type: 'error', content: 'getFomoUserInfo error' });
			Message.error("getFomoUserInfo error");
		}
	};
	const loadData = React.useCallback(() => {
		const addStart = 15 * currentPage - 15;
		//Prevents errors when loading currentPage=1 twice, and gets it right the second time
		if (currentPage == 1 && LeftFomoContentList.length != 0) {
			return;
		}
		if (isnull) {
			getCommentsByIndex(addStart).then(() => {
				setCurrentPage((prevPage) => {
					return prevPage + 1;
				});
			});
		}
	}, [currentPage]);
	useEffect(() => {
		const handleScroll = debounce(() => {
			if (Usercomments.current && !loading && LeftFomoContentList.length != 0) {
				const threshold =
					window.innerHeight + document.documentElement.scrollTop - 50;
				if (threshold > Usercomments.current.scrollHeight) {
					// Scroll to the bottom of the page to load more data
					window.removeEventListener("scroll", handleScroll);
					loadData();
				}
			}
		}, 1000);
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [loading, loadData]);
	const handlTimeFn = (Time: bigint | undefined, type?: string) => {
		if (Time) {
			const milliseconds = Time / 1000000n;
			if (type) {
				return dayjs(Number(milliseconds)).utc().format("YYYY/MM/DD HH:mm:ss");
			} else {
				return dayjs(Number(milliseconds)).utc().format("MM/DD/YY hh:mm:ss a");
			}
		} else {
			return "";
		}
	};
	const [LeftUsername, setLeftUsername] = React.useState<UserProfile>();
	const getuserName = async (userID: string, type: string) => {
		try {
			const res = await getBaseUserInfo(userID);
			if (type != "top") {
				setLeftUsername(res[0]);
			}
			return res[0];
		} catch (error) {
			console.log(error);
			// props.onRouteChange({ type: 'error', content: 'getuserName error' });
			Message.error("getuserName error");
		}
	};
	const [addComment, setAddComment] = React.useState(false);
	const handleaddComment = () => {
		setAddComment(false);
	};
	const [addCommentParams, setAddCommentParams] =
		React.useState<CommentsCreate>({
			// user_pid: Principal.fromText('drv6s-haaaa-aaaag-albcq-cai'),
			content: "",
			image_url: [""],
			extended: [],
		});
	const [EditImg, setEditImg] = React.useState<File>();
	const CheckInputValue = () => {
		for (let key in addCommentParams) {
			if (
				addCommentParams[key as keyof CommentsCreate] == "" &&
				key != "extended"
			) {
				// props.onRouteChange({ type: 'error', content: `Please enter your ${key}` });
				Message.error(`Please enter your ${key}`);
				return false;
			}
		}
		return true;
	};
	const [fileName, setFileName] = React.useState("No file chosen");
	const BtnPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) {
			Message.error("file error");
			return;
		}
		if (e.target.files[0].size > 5 * 1024 * 1024) {
			Message.error(
				"Image must smaller than 5MB! and You can only upload JPG/PNG/GIF file!",
			);
			return;
		} else if (
			![
				"JPG",
				"PNG",
				"GIF",
				"image/jpeg",
				"image/png",
				"image/gif",
				"image/jpg",
			].includes(e.target.files[0].type)
		) {
			Message.error(
				"Image must smaller than 5MB! and You can only upload JPG/PNG/GIF file!",
			);
			return;
		}
		let reader: any = new FileReader();
		reader.readAsDataURL(e.target.files[0]);
		reader.onload = function () {
			let newUrl = this.result;
			let canvas = document.createElement("canvas");
			let ctx = canvas.getContext("2d");
			let img = new Image();
			img.src = newUrl;
			let data = "";
			img.onload = function () {
				if (!e.target.files) {
					Message.error("file error");
					return;
				}
				// let width = img.width;
				canvas.width = 100;
				canvas.height = 100;
				ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
				// Convert to base64 quality to image compression quality. The smaller the value between 0 and 1, the larger the compression, the poorer the image quality
				data = canvas.toDataURL(e.target.files[0].type, 0.3);
				setFileName(e.target?.files[0].name);
				// setEditImg(data);
			};
		};
		setEditImg(e.target.files[0]);
		return () => {};
	};
	const BtnPostreply = async () => {
		if (!addCommentParams.content) {
			// Message.error(`Please enter your comment`);
			return;
		}
		if (EditImg) {
			try {
				const res = await QeqImg(EditImg!);
				setAddCommentParams({
					...addCommentParams,
					image_url: [res.reference],
				});
				setInitialized(true);
			} catch (error) {
				setEditImg(undefined);
				setFileName("");
				setIspostreply(false);
				Message.error("Upload failure");
			}
		} else {
			setAddCommentParams({ ...addCommentParams, image_url: [] });
			ReqAddComment("");
		}
	};
	const ReqAddComment = async (img: string) => {
		if (appStore.userId) {
			setIspostreply(true);
			try {
				const res = await add_comment(
					curFomoInfo[0]?.fomo_pid.toString(),
					img ? addCommentParams : { ...addCommentParams, image_url: [] },
				);
				if ("Ok" in res) {
					// props.onRouteChange({ type: 'success', content: 'success' });
					Message.success("Success!");
					setEditImg(undefined);
					setFileName("");
					getCommentsByIndex(0);
					const name = await getBaseUserInfo(appStore.userId);

					setusertoken(name[0] ? Number(name[0].user_points) : "");
					setlockToken(name[0] ? Number(name[0].user_pre_reward_points) : null);
				} else {
					// props.onRouteChange({ type: 'success', content: 'error' });
					Message.error("error");
				}
				setIspostreply(false);
				setTimeout(() => {
					setAddComment(false);
				}, 800);
			} catch (error: any) {
				console.log(error);
				if (error && error.message) {
					const match = error.message.match(/Reject text: (.*)/);
					if (match && match[1]) {
						Message.error(match[1]);
					} else {
						Message.error("error");
					}
				}
				setTimeout(() => {
					setAddComment(false);
					setIspostreply(false);
				}, 800);
			}
		} else {
			props.onWellModal(true);
		}
	};
	const [initialized, setInitialized] = React.useState(false);
	useEffect(() => {
		if (initialized && addCommentParams?.image_url[0]) {
			if (CheckInputValue()) {
				ReqAddComment("img");
			} else {
				setIspostreply(false);
			}
		}
	}, [addCommentParams?.image_url[0], initialized]);
	const BtnCloseAddModal = () => {
		setAddComment(false);
	};
	const BtnRightReply = () => {
		setAddComment(true);
	};
	const [PoolInfo, setPoolInfo] = React.useState<PoolInfo>();
	const getPoolInfoFn = async () => {
		const res = await getPoolInfo([
			curFomoInfo[0]?.pool_pid,
			Principal.fromText("aaaaa-aa"),
		]);
		if (Number(res.quote_reserve) == 0) {
			tabRefSell.current!.style.pointerEvents = "none";
		}
		setPoolInfo(res);
	};
	const [topTen, setTopTen] = React.useState<Array<HolderInfo>>();
	const [topTenUserName, setTopTenUserName] = React.useState<
		Record<string, string>
	>({});
	const getTop10Holders = async () => {
		const devNames: Record<string, string> = {};
		const res = await get_top10_holders(curFomoInfo[0]?.fomo_pid.toString());
		for (const item of res) {
			if (item.holder_type == "dev") {
				const UserName = await getuserName(
					item.account.owner.toString(),
					"top",
				);
				devNames[item.account.owner.toString()] = UserName
					? UserName.user_name
					: "";
			}
		}
		setTopTenUserName(devNames);
		setTopTen(res);
	};
	const onBtnCloseStep = () => {
		setOpenStep(false);
		setStepCreateFomoSuccess(false);
		setIsStepApprove(true);
		setIsStepCreateFomo(false);
		setStepApproveSuccess(false);
		setStepCreateFomoSuccess(false);
	};
	const [ispostreply, setIspostreply] = React.useState(false);
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
		null,
	);
	const open = Boolean(anchorEl);
	const id = open ? "simple-popover" : undefined;
	const handleClick = (event: any) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};
	const [isExpertMode, setIsExpertMode] = React.useState(false);
	const handleMode = (value: boolean) => {
		setIsExpertMode(value);
	};
	const hanldString = (text: string) => {
		if (text) {
			if (text.length > 3) {
				return text.slice(0, 3) + "...";
			} else {
				return text;
			}
		} else {
			return "";
		}
	};
	const [macketcap, setMacketcap] = React.useState<number>();
	const get_god_of_wellsReq = async () => {
		const res = await get_god_of_wells();
		if (res[0]?.market_cap != undefined) {
			// formatAmountByUnit
			setMacketcap(
				Big(Number(res[0]?.market_cap.toString()))
					.div(10 ** 18)
					.toNumber(),
			);
		}
	};
	const [searchFomosInit, setSearchFomosInit] = React.useState(true);
	const search_fomosReq = async () => {
		const res = await get_fomo_by_fomo_pid(Principal.fromText(fomo_pid!));
		reqIcrc1_balance_of(res[0]);
		setSearchFomosInit(false);
		setCurBuyOrSell({
			...CurBuyOrSell,
			base_to_token: res[0]?.token_pid,
			pairs: [res[0]?.pool_pid],
		});
		setFomoInfo(res);
	};
	useEffect(() => {
		if (curFomoInfo.length != 0) {
			getStatus();
			getPoolInfoFn();
			getTop10Holders();
			get_god_of_wellsReq();
			getCommentsByIndex(0);
			getuserName(curFomoInfo[0]?.create_user_pid.toString(), "");
			setCurBuyOrSell({ ...CurBuyOrSell, pairs: [curFomoInfo[0].pool_pid] });
			btnBuy();
		}
	}, [curFomoInfo]);
	const btnToWeb = (url: string) => {
		window.open(url);
	};
	const BtnGoback = () => {
		if (window.history.length > 1) {
			navigate(-1);
		} else {
			navigate("/");
		}
	};
	const BtnGoUserInfo = (pid: string) => {
		navigate(`/profile/${pid}`);
	};

	useEffect(() => {
		const fetchData = async () => {
			geticrc1_metadata();
			setLoading(true);
			if (fomo_pid == "undefined") {
				setFomoInfo([]);
				setSearchFomosInit(false);
			} else {
				await search_fomosReq();
				btnBuy();
			}
		};
		fetchData();
		setCurUserBuyBalance(0);
		setGetUserBalance(0);
	}, [fomo_pid]);
	const [openRightBox, setopenRightBox] = React.useState(false);
	const closeRightBox = () => {
		setopenRightBox(false);
	};
	const getIdDashboardURL = (Id: string) =>
		window.open(`https://dashboard.internetcomputer.org/canister/${Id}`);
	const getPoolDashboardURL = (Id: string) =>
		window.open(`https://icpex.org/pool/detail/${Id}`);
	const getICPExPoolURL = (Id: string) =>
		window.open(`https://icpex.org/pool/detail/${Id}`);
	const CanisterCopyBtnFn = (copyText: string) => {
		navigator.clipboard.writeText(copyText).then(
			() => {
				// props.onMessageModal({ type: 'success', content: 'success' });
				Message.success("Success!");
			},
			() => {
				// props.onMessageModal({ type: 'error', content: 'clipboard write failed' });
				Message.error("clipboard write failed");
			},
		);
	};
	const [canisterInfos, setCanisterInfos] = React.useState<{
		fomo: string | number;
		pool: string | number;
		token: string | number;
	}>({
		fomo: 0,
		pool: 0,
		token: 0,
	});
	const [addCycles, setAddCycles] = React.useState(false);
	const [amount, setamount] = React.useState<string>("");
	const [openbuyAmountLoding, setopenbuyAmountLoding] = React.useState(false);
	const [isshow, setisshow] = React.useState(true);
	const [btnfomoText, setbtnfomoText] = React.useState("Enter cycles amount");
	const [curBtnId, setcurBtnId] = React.useState<Principal>();
	const [cyclesdecimals, setcyclesdecimals] = React.useState<number>();
	const [cyclesfee, setcyclesfee] = React.useState<number | string>();
	const [displayValue, setDisplayValue] = React.useState<string>("");
	const [openRightcyclesBox, setopenRightcyclesBox] = React.useState(false);
	const handleaddaddCycles = () => {
		setAddCycles(false);
		setamount("");
	};
	const [curCyclesBalance, setcurCyclesBalance] = React.useState<bigint>();
	const openAddCyclesModal = async (id: Principal) => {
		// Message.error('Opening Soon...');
		if (appStore.userId) {
			getCuruserBalance();
			setcurBtnId(id);
			setAddCycles(true);
		} else {
			props.onWellModal(true);
		}
	};
	const Cyclesfee = async () => {
		const res = await icrc1_fee();
		setcyclesfee(res.toString());
		// console.log(res);
	};
	function formatUnitToT(
		num: string | number | null | undefined,
		decimalPlaces = 4,
		isneedT: boolean = true,
	) {
		const T = 1000000000000; // 1 T

		if (!num) return "0.0";
		if (typeof num === "string") {
			num = Number.parseFloat(num);
		}

		// '0.0'
		if (isNaN(num) || num === 0) {
			return "0.0";
		}

		// T
		const numInT = new Big(num).div(T).toNumber();

		//
		if (isneedT) {
			return numInT.toFixed(decimalPlaces).replace(/\.?0+$/, "") + "T";
		} else {
			return numInT.toFixed(decimalPlaces).replace(/\.?0+$/, "");
		}
	}
	function parseTUnitToCycles(value: string | number) {
		const T = 1000000000000; // 1 T

		if (typeof value === "string") {
			value = Number.parseFloat(value);
		}

		if (isNaN(value)) {
			throw new Error("Invalid T unit value");
		}

		return value * T;
	}
	const btnBuyamount = async () => {
		setopenbuyAmountLoding(true);
		setopenRightcyclesBox(true);
		// const withdraw_fromArgs: WithdrawFromArgs = {
		//   to: curBtnId!,
		//   from: {
		//     owner: Principal.fromText(appStore.userId),
		//     subaccount: [],
		//   },
		//   spender_subaccount: [],
		//   created_at_time: [],
		//   amount: BigInt(new Big(amount).round(0, 0).toString()),
		// };
		const withdrawArgs: WithdrawArgs = {
			to: curBtnId!,
			created_at_time: [],
			from_subaccount: [],
			amount: BigInt(new Big(amount).round(0, 0).toString()),
		};
		console.log(withdrawArgs);
		try {
			const res = await withdraw([withdrawArgs]);
			if ("Ok" in res) {
				Message.success("Add cycles successfully!");
				getCuruserBalance();
				// const fomo = await fomowell_project_cycles('ziwr5-eaaaa-aaaag-alela-cai');
				// console.log(fomo, 'fomo');
				setAddCycles(false);
				setamount("");
				setDisplayValue("");
			} else {
				console.log(res.Err);
				Message.error("Add cycles failed!");
			}
			setopenbuyAmountLoding(false);
			setopenRightcyclesBox(false);
			// const res = await withdraw_from([withdraw_fromArgs])
			// console.log(res);
		} catch (err) {
			console.log(err);
			Message.error("Add cycles failed!");
			setopenbuyAmountLoding(false);
			setopenRightcyclesBox(false);
		}
	};
	const [showaddcylesimg, setshowaddcylesimg] = React.useState({
		fomo: false,
		token: false,
		pool: false,
		isWindow: true,
	});
	let tempshowaddcylesimg = {
		fomo: false,
		token: false,
		pool: false,
		isWindow: true,
	};
	let target = document.getElementById("addcycles");
	const [isShowArrPre, setisShowArrPre] = useState(false);
	//addcyclesArrpre
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				// console.log(111, entry.isIntersecting, (tempshowaddcylesimg.fomo || tempshowaddcylesimg.pool || tempshowaddcylesimg.token));
				if (entry.isIntersecting) {
					tempshowaddcylesimg.isWindow = true;
					setshowaddcylesimg((pre) => ({ ...pre, isWindow: true }));
				} else {
					const boundingRect = entry.boundingClientRect;
					const viewportHeight = window.innerHeight;
					if (
						tempshowaddcylesimg.fomo ||
						tempshowaddcylesimg.pool ||
						tempshowaddcylesimg.token
					) {
						tempshowaddcylesimg.isWindow = false;
						setshowaddcylesimg((pre) => ({ ...pre, isWindow: false }));
					} else {
						// console.log(tempshowaddcylesimg);
						tempshowaddcylesimg.isWindow = true;
						setshowaddcylesimg((pre) => ({ ...pre, isWindow: true }));
					}
					if (boundingRect.bottom < 0) {
						setisShowArrPre(true);
						// console.log('');
					} else if (boundingRect.top > viewportHeight) {
						// console.log('');
						setisShowArrPre(false);
					} else {
						// console.log('');
					}
				}
			});
		},
		{
			root: null, //
			rootMargin: "0px",
			threshold: 0.1, // 10%
		},
	);
	const reqIcrc1_balance_of = async (params: FomoProject) => {
		const results = await Promise.allSettled([
			fomowell_project_cycles(params.fomo_pid.toString()),
			icrc_plus_cycles(params.token_pid.toString()),
			icpex_pool_cycles(params.pool_pid.toString()),
		]);
		const fomo = results[0].status === "fulfilled" ? results[0].value : 0;
		const token = results[1].status === "fulfilled" ? results[1].value : 0;
		const pool = results[2].status === "fulfilled" ? results[2].value : 0;
		setCanisterInfos({
			...canisterInfos,
			fomo: formatAmountByUnit(Number(fomo)),
			token: formatAmountByUnit(Number(token)),
			pool: formatAmountByUnit(Number(pool)),
		});
		if (new Big(Number(fomo)).lt(new Big(100000000000))) {
			tempshowaddcylesimg.fomo = true;
			setshowaddcylesimg(() => ({ ...tempshowaddcylesimg }));
		} else if (new Big(Number(token)).lt(new Big(100000000000))) {
			tempshowaddcylesimg.token = true;
			setshowaddcylesimg(() => ({ ...tempshowaddcylesimg }));
		} else if (new Big(Number(pool)).lt(new Big(100000000000))) {
			tempshowaddcylesimg.pool = true;
			setshowaddcylesimg(() => ({ ...tempshowaddcylesimg }));
		} else {
			tempshowaddcylesimg = {
				fomo: false,
				token: false,
				pool: false,
				isWindow: true,
			};
			setshowaddcylesimg(() => ({ ...tempshowaddcylesimg }));
		}
		if (target) {
			observer.observe(target);
		}
	};
	const getCuruserBalance = async () => {
		const balance = await icrc1_balance_of([
			{ owner: Principal.fromText(appStore.userId), subaccount: [] },
		]);
		setcurCyclesBalance(balance);
	};
	const snackbarRef = useRef<SnackbarModalHandles>(null);
	const handleButtonClick = (RightBox: boolean) => {
		if (snackbarRef.current) {
			snackbarRef.current.openSnackbar("Cycles transfer in progress", RightBox);
			snackbarRef.current.setViewProgress(true);
		}
	};
	const btnMax = () => {
		if (
			curCyclesBalance &&
			curCyclesBalance.toString() != "0" &&
			Number(curCyclesBalance) != 0
		) {
			setDisplayValue(
				formatAmountByUnitToT(
					new Big(curCyclesBalance?.toString()!)
						.minus(cyclesfee?.toString()!)
						.toString(),
					4,
					false,
				),
			);
			setamount(
				new Big(curCyclesBalance?.toString()!)
					.minus(cyclesfee?.toString()!)
					.toString(),
			);
		} else {
			setDisplayValue("");
			setamount("");
		}
	};
	const inputamountchange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (
			typeof Number(e.target.value) == "number" &&
			!isNaN(Number(e.target.value))
		) {
			const { value } = e.target;
			setDisplayValue(value);
			if (value === "" || value === "0.0") {
				setamount("");
			} else {
				setamount(parseTUnitToCycles(value).toString());
			}
			// setamount(value.replace(/,/g, '')); //
		} else {
			// props.onRouteChange({ type: 'error', content: 'The entered value is incorrect' });
			Message.error("The entered value is incorrect");
		}
		// console.log(e);
	};
	const btntoaddcanisters = () => {
		// let target = document.getElementById('addcycles');
		// target?.scrollIntoView({ behavior: 'smooth' })
		smoothScrollToElement("addcycles", 90);
	};
	function smoothScrollToElement(elementId: string, offset: number): void {
		const element = document.getElementById(elementId);
		if (!element) {
			console.error(`Element with id ${elementId} not found.`);
			return;
		}

		const elementPosition =
			element.getBoundingClientRect().top + window.scrollY;
		const targetPosition = elementPosition - offset;
		const startPosition = window.scrollY;
		const distance = targetPosition - startPosition;
		const duration = 600;
		let startTime: number | null = null;

		function animation(currentTime: number): void {
			if (startTime === null) startTime = currentTime;
			const timeElapsed = currentTime - startTime;
			const run = ease(timeElapsed, startPosition, distance, duration);
			window.scrollTo(0, run);
			if (timeElapsed < duration) requestAnimationFrame(animation);
		}

		function ease(t: number, b: number, c: number, d: number): number {
			// ease-in-out
			t /= d / 2;
			if (t < 1) return (c / 2) * t * t + b;
			t--;
			return (-c / 2) * (t * (t - 2) - 1) + b;
		}

		requestAnimationFrame(animation);
	}
	const [openOwnership, setopenOwnership] = React.useState(false);
	const [isSneedDAO, setisSneedDAO] = React.useState(true);
	const openOwnershipFn = (option: string) => {
		setopenOwnership(true);
		if (option == "SneedDAO") {
			setisSneedDAO(true);
		} else if (option == "BalckHole") {
			setisSneedDAO(false);
		}
	};
	const handleopenOwnership = () => {
		setopenOwnership(false);
	};
	const [ownershipLoding, setownershipLoding] = React.useState(false);
	const [issneedicon, setissneedicon] = React.useState(false);
	const [isfireicon, setisfireicon] = React.useState(false);
	const btnremoveownership = async () => {
		if (snackbarRef.current) {
			//Token ownership relinquished failed
			snackbarRef.current.openSnackbar("Token ownership relinquishing..", true);
			snackbarRef.current.setViewProgress(true);
			setownershipLoding(true);
		}
		try {
			setownershipLoding(true);
			const amount = Math.ceil(
				Number(tokenStore.dollar2ICP) * 10 ** 8 * 1.3 * 2,
			);
			await new BatchTransact(
				[
					{
						idl: icrc2IdlFactory,
						canisterId: icrc2CanisterId,
						methodName: "icrc2_approve",
						args: [
							{
								amount,
								created_at_time: [],
								expected_allowance: [],
								expires_at: [],
								fee: [],
								from_subaccount: [],
								memo: [],
								spender: {
									owner: Principal.fromText(
										process.env.CANISTER_ID_FOMOWELL_LAUNCHER!,
									),
									subaccount: [],
								},
							},
						],
						onSuccess: async () => {},
						onFail: (err: any) => {
							setownershipLoding(false);
							setopenOwnership(false);
							snackbarRef!.current!.openSnackbar(
								"Token ownership relinquished failed",
								false,
							);
							Message.error("Token ownership relinquished failed");
						},
					} as any,
				],
				artemisWalletAdapter,
			).execute();
			if (isSneedDAO) {
				await ownership_transfer([
					curFomoInfo[0].fomo_pid,
					[Principal.fromText("fp274-iaaaa-aaaaq-aacha-cai")],
				]);
				snackbarRef!.current!.openSnackbar("", false);
				Message.success("Token ownership relinquished successfully");
			} else {
				await ownership_transfer([curFomoInfo[0].fomo_pid, []]);
				snackbarRef!.current!.openSnackbar("", false);
				Message.success("Token ownership relinquished successfully");
			}
			console.log("remove success");
		} catch (err) {
			snackbarRef!.current!.openSnackbar("", false);
			Message.error("Token ownership relinquished failed");
			throw err;
		} finally {
			setownershipLoding(false);
			snackbarRef!.current!.openSnackbar("", false);
			setopenOwnership(false);
			getStatus();
		}
	};
	const getStatus = async () => {
		setissneedicon(false);
		setisfireicon(false);
		try {
			//  HttpAgent
			const agent = new HttpAgent({ host: "https://icp-api.io" });
			const res = await request({
				canisterId: curFomoInfo[0].token_pid,
				paths: ["controllers"],
				agent,
			});
			if (res instanceof Map) {
				const controllers = res.get("controllers") || [];
				console.log("controllers", res.get("controllers")?.toString());
				if (
					Array.isArray(controllers) &&
					controllers.every((item) => item instanceof Principal)
				) {
					//  controllers  Principal
					controllers.forEach((item) => {
						if (item.toString() == "fp274-iaaaa-aaaaq-aacha-cai") {
							setissneedicon(true);
						} else if (item.toString() == "aaaaa-aa") {
							setisfireicon(true);
						}
					});
				} else {
					return "";
				}
			}
		} catch (error) {
			console.error(error);
			return "";
		}
	};
	const welldiggingtext = () => {
		if (!curFomoInfo[0]) {
			return "When the market cap reaches $5,000, all liquidity in the well will be migrated to ICPEx and locked into the black hole address(aaaaa-aa). ";
		}
		if (
			curFomoInfo[0].sneed_dao_lock.length == 0 &&
			curFomoInfo[0].dogmi_dao_lock.length == 0
		) {
			return "When the market cap reaches $5,000, all liquidity in the well will be migrated to ICPEx and locked into the black hole address(aaaaa-aa). ";
		} else {
			if (curFomoInfo[0].sneed_dao_lock.length != 0) {
				return `When the market cap reaches $5,000, all liquidity in the well will be migrated to ICPEx, with ${new Big(100).minus(new Big(curFomoInfo[0].sneed_dao_lock[0].toString()).div(10 ** 16)).toString()}% locked into the black hole address(aaaaa-aa) and ${new Big(curFomoInfo[0].sneed_dao_lock[0].toString()).div(10 ** 16).toString()}% locked into Sneed DAO.`;
			} else if (curFomoInfo[0].dogmi_dao_lock.length != 0) {
				return `When the market cap reaches $5,000, all liquidity in the well will be migrated to ICPEx, with ${new Big(100).minus(new Big(curFomoInfo[0].dogmi_dao_lock[0].toString()).div(10 ** 16)).toString()}% locked into the black hole address(aaaaa-aa) and ${new Big(curFomoInfo[0].dogmi_dao_lock[0].toString()).div(10 ** 16).toString()}% locked into Dogmi DAO.`;
			}
		}
	};
	useEffect(() => {
		handleButtonClick(openRightcyclesBox);
	}, [openRightcyclesBox]);
	useEffect(() => {
		if (amount && Number(amount) != 0 && !isNaN(Number(amount))) {
			// console.log(amount, new Big(curCyclesBalance?.toString()!).toString());
			if (new Big(amount).gt(new Big(curCyclesBalance?.toString()!))) {
				setisshow(true);
				setbtnfomoText("Insufficient amount");
			} else {
				setisshow(false);
			}
		} else {
			setbtnfomoText("Enter cycles amount");
			setisshow(true);
		}
	}, [amount]);
	useEffect(() => {
		target = document.getElementById("addcycles");
		Cyclesfee();
		const fetchData = async () => {
			geticrc1_metadata();
			setLoading(true);
			if (tabRefBuy.current && tabRefSell.current) {
				tabRefBuy.current.style.background =
					"linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)";
				tabRefSell.current.style.backgroundColor = "#34384B";
			}
			if (fomo_pid == "undefined") {
				setSearchFomosInit(false);
			} else {
				await search_fomosReq();
			}
		};
		fetchData();
	}, []);
	return (
		<div className={styles.icpInfoMain} ref={Usercomments} key={fomo_pid}>
			<div
				className={styles.Back}
				style={{
					color: "#fff",
					cursor: "pointer",
					paddingTop: "10px",
					display: curFomoInfo[0]
						? curFomoInfo[0].fomo_pid
							? ""
							: "none"
						: searchFomosInit
							? ""
							: "none",
				}}
				onClick={(e) => {
					e.stopPropagation();
					if (window.history.length > 1) {
						navigate(-1);
					} else {
						navigate("/");
					}
				}}
			>
				[ go back ]
			</div>
			<div className={styles.Main}>
				<div
					className={styles.FomoId}
					style={{
						display: curFomoInfo[0]
							? curFomoInfo[0].fomo_pid
								? "none"
								: ""
							: searchFomosInit
								? "none"
								: "",
					}}
				>
					Fomo does not exist
				</div>
				<div
					className={styles.Goback}
					style={{
						color: "#fff",
						cursor: "pointer",
						width: "100px",
						display: curFomoInfo[0]
							? curFomoInfo[0].fomo_pid
								? "none"
								: ""
							: searchFomosInit
								? "none"
								: "",
					}}
					onClick={BtnGoback}
				>
					[ go back ]
				</div>
				<div
					className={styles.icpInfoLeft}
					style={{
						visibility: curFomoInfo[0]
							? curFomoInfo[0].fomo_pid
								? "visible"
								: "hidden"
							: searchFomosInit
								? "visible"
								: "hidden",
					}}
				>
					<div className={styles.chartPage}>
						<div className={styles.ChartHeader}>
							<div className={styles.left}>
								<span>{curFomoInfo[0]?.name} </span>
								<span>Ticker: {curFomoInfo[0]?.ticker} </span>
								<span className={styles.Market}>
									{" "}
									Market cap: $
									{curFomoInfo[0]?.market_cap !== undefined
										? formatAmountByUnit(
												Big(curFomoInfo[0]?.market_cap.toString())
													.div(10 ** 18)
													.toNumber(),
											)
										: "0"}
								</span>
							</div>
							<div className={styles.right}>
								<span className={styles.created}>created by</span>
								<img
									src={getImgUrl(LeftUsername?.avatar!)}
									style={{ height: "20px" }}
								/>
								<span
									className={styles.UserName}
									onClick={() =>
										BtnGoUserInfo(LeftUsername?.user_pid.toString()!)
									}
								>
									{LeftUsername?.user_name}
								</span>
							</div>
						</div>
						<iframe
							style={{
								height: "100%",
								width: "100%",
								border: 0,
								marginTop: "8px",
							}}
							src={`https://dexscreener.com/icp/${curFomoInfo[0]?.pool_pid.toString()}?embed=1&theme=dark&trades=1&info=0`}
						></iframe>
					</div>
					<div className={styles.icpInfoBottom}>
						<div className={styles.bottomCard}>
							<div className={styles.RightReply} onClick={BtnRightReply}>
								Post a reply
							</div>
							<div className={styles.top}>
								<div className={styles.UserInfo}>
									<img
										className={styles.UserIcon}
										src={getImgUrl(LeftUsername?.avatar!)}
									/>
									<div
										className={styles.name}
										onClick={() =>
											BtnGoUserInfo(LeftUsername?.user_pid.toString()!)
										}
									>
										{LeftUsername?.user_name}
									</div>
								</div>
								<div className={styles.Time}>
									{handlTimeFn(curFomoInfo[0]?.create_time)}
								</div>
							</div>
							<div className={styles.bottom}>
								{/* <img className={styles.icpItemIcon} src={getImgUrl(curFomoInfo[0]?.img_url)}></img> */}
								<ImagePreview
									className={styles.icpItemIcon}
									src={getImgUrl(curFomoInfo[0]?.img_url)}
									alt=""
								/>
								<div className={styles.bottomAll}>
									<div className={styles.top}>
										{curFomoInfo[0]?.name} (ticker:{curFomoInfo[0]?.ticker}){" "}
										<div
											className={styles.cyleslow}
											style={{ display: showaddcylesimg.fomo ? "" : "none" }}
										>
											<WarningAmberIcon
												style={{ color: "red", marginLeft: "10px" }}
											></WarningAmberIcon>
											<span style={{ color: "red", marginLeft: "5px" }}>
												Running low on cycles, this token risks delisting!
											</span>
										</div>
									</div>
									<div className={styles.bottom}>
										{curFomoInfo[0]?.description}
									</div>
								</div>
							</div>
						</div>

						{LeftFomoContentList?.map((item) => {
							return (
								<div className={styles.contentList} key={item.create_time}>
									<div className={styles.top}>
										<div className={styles.UserNameTime}>
											<img
												src={
													userInfoList[item.user_pid.toString()]?.avatar
														? getImgUrl(
																userInfoList[item.user_pid.toString()]?.avatar,
															)
														: ""
												}
												alt=""
											/>
											<div
												className={styles.name}
												onClick={() => BtnGoUserInfo(item.user_pid.toString())}
											>
												{userInfoList[item.user_pid.toString()]?.user_name}
											</div>
											<div className={styles.time}>
												{handlTimeFn(item.create_time)}
											</div>
										</div>
										<div className={styles.contentOrImg}>
											<ImagePreview
												src={
													item.image_url[0] ? getImgUrl(item.image_url[0]!) : ""
												}
												alt=""
											/>
											{/* <img
                          style={{ display: item.image_url[0] ? '' : 'none' }}
                          src={item.image_url[0] ? getImgUrl(item.image_url[0]!) : ''}
                        /> */}
											<div className={styles.buttom}>{item.content}</div>
										</div>
									</div>
								</div>
							);
						})}
						<CircularProgress
							thickness={4}
							size={20}
							sx={{
								color: "#fff",
								borderRadius: "50%",
								display: loading ? "" : "none",
								marginLeft: "45%",
								translate: "0px 10px",
							}}
						/>
					</div>
				</div>
				<div
					className={styles.icpInfoRight}
					style={{
						visibility: curFomoInfo[0]
							? curFomoInfo[0].fomo_pid
								? "visible"
								: "hidden"
							: searchFomosInit
								? "visible"
								: "hidden",
					}}
				>
					<div className={styles.BuySell}>
						<div className={styles.BuySellTabs}>
							<div className={styles.tabHeader}>
								<div
									ref={tabRefBuy}
									className={styles.tabName}
									onClick={btnBuy}
								>
									Buy
								</div>
								<div
									ref={tabRefSell}
									className={styles.tabName}
									onClick={btnSell}
								>
									Sell
								</div>
							</div>
							<div className={styles.TabContent}>
								<div className={styles.top}>
									<div
										className={styles.Balances}
										// style={{ display: CurBuyOrSell.directions == BigInt(1) ? 'none' : '' }}
									>
										Balance:{" "}
										{CurBuyOrSell.directions == BigInt(1)
											? formatAmountByUnit(CurUserBuyBalance)
											: formatAmountByUnit(CurUserBalance)}{" "}
										{CurBuyOrSell.directions == BigInt(1)
											? hanldString(sellTokenName!)
											: buyTokenName}
									</div>
									<div className={styles.maxSlippage} onClick={handleClick}>
										Set max slippage
									</div>
								</div>
								<div
									className={styles.inputInfo}
									style={{
										width: "90%",
										height: "28px",
										border: "1px solid rgba(87,61,148,1)",
										borderRadius: "4px",
										padding: "10px",
									}}
								>
									<InputBase
										// value="No file chosen"
										style={{ color: "#9EBADF", width: "100%" }}
										placeholder="0.0"
										value={inputValue}
										onChange={(e) => InputAmountChange(e)}
										endAdornment={
											<InputAdornment
												position="end"
												style={{
													fontFamily: "",
													fontSize: "14px",
													color: "#FFFFFF",
													letterSpacing: 0,
													fontWeight: 600,
												}}
											>
												{String(CurBuyOrSell.directions) == "1"
													? `${sellTokenName}`
													: `${buyTokenName}`}
												<img
													src={
														String(CurBuyOrSell.directions) == "1"
															? `https://metrics.icpex.org/images/${process.env.CANISTER_ID_ICRC2_LEDGER}.png`
															: `https://metrics.icpex.org/images/${curFomoInfo[0].token_pid.toString()}.png`
													}
													style={{
														cursor: "pointer",
														width: "30px",
														marginLeft: "10px",
													}}
												></img>
											</InputAdornment>
										}
										className={styles.inputCoin}
									></InputBase>
								</div>
								<div
									className={styles.TypeTag}
									style={{
										display: CurBuyOrSell.directions == BigInt(1) ? "" : "none",
									}}
								>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("reset")}
									>
										reset
									</div>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("1")}
									>
										1 ICP
									</div>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("5")}
									>
										5 ICP
									</div>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("10")}
									>
										10 ICP
									</div>
								</div>
								<div
									className={styles.TypeTag}
									style={{
										display: CurBuyOrSell.directions == BigInt(1) ? "none" : "",
									}}
								>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("reset")}
									>
										reset
									</div>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("0.25")}
									>
										25%
									</div>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("0.50")}
									>
										50%
									</div>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("0.75")}
									>
										75%
									</div>
									<div
										className={styles.TypeTagItem}
										onClick={() => selectHandle("1")}
									>
										100%
									</div>
								</div>
								<div className={styles.icpToSellBase}>
									<div style={{ display: CurswitchIcp == "0" ? "none" : "" }}>
										{CurswitchIcp}{" "}
										{String(CurBuyOrSell.directions) == "1"
											? buyTokenName
											: sellTokenName}
									</div>
									<CircularProgress
										thickness={4}
										size={15}
										sx={{
											color: "#fff",
											borderRadius: "50%",
											display: isLodingBalance ? "" : "none",
											marginLeft: "5px",
										}}
									/>
								</div>
								<LoadingButton
									id="btnPlaceTrade"
									loading={openRightBox}
									className={styles.BtnPlaceTrade}
									style={{
										backgroundImage:
											CurBuyOrSell.directions == BigInt(1)
												? !inputValue ||
													new Big(inputValue ? inputValue : "0").gt(
														new Big(CurUserBuyBalance).minus(0.0001),
													)
													? "linear-gradient(235deg, #4c516c 0%, #4e5082 100%)"
													: "linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)"
												: !inputValue ||
														new Big(inputValue ? inputValue : "0").gt(
															new Big(CurUserBalance).minus(1),
														)
													? "linear-gradient(235deg, #4c516c 0%, #4e5082 100%)"
													: "linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)",
										pointerEvents:
											CurBuyOrSell.directions == BigInt(1)
												? !inputValue ||
													new Big(inputValue ? inputValue : "0").gt(
														new Big(CurUserBuyBalance).minus(0.0001),
													)
													? "none"
													: "unset"
												: !inputValue ||
														new Big(inputValue ? inputValue : "0").gt(
															new Big(CurUserBalance).minus(1),
														)
													? "none"
													: "unset",
									}}
									sx={{
										color:
											CurBuyOrSell.directions == BigInt(1)
												? new Big(inputValue ? inputValue : "0").gt(
														new Big(CurUserBuyBalance).minus(0.0001),
													)
													? "#fff"
													: "#fff"
												: new Big(inputValue ? inputValue : "0").gt(
															new Big(CurUserBalance).minus(1),
														)
													? "#fff"
													: "#fff",
									}}
									onClick={btnPlaceTrade}
								>
									{!inputValue
										? "Enter an amount"
										: CurBuyOrSell.directions == BigInt(1)
											? new Big(inputValue ? inputValue : "0").gt(
													new Big(CurUserBuyBalance).minus(0.0001),
												)
												? "Insufficient balance"
												: "place trade"
											: new Big(inputValue ? inputValue : "0").gt(
														new Big(CurUserBalance).minus(1),
													)
												? "Insufficient balance"
												: "place trade"}
								</LoadingButton>
								{/* <LoadingButton id='btnPlaceTrade' loadingPosition='start' loading={openRightBox} className={styles.BtnPlaceTrade} sx={{
                  color: "#fff", '.MuiLoadingButton-loadingIndicator': {
                    justifyContent: 'space-around',
                    position: 'unset',
                    left: '100px'
                    // color: '#fff'
                  }
                }} onClick={btnPlaceTrade}>
                  <span style={{ marginLeft: '5px' }}>place trade</span>
                </LoadingButton> */}
								{/* <div className={styles.fomoIds}>
                  <div className={styles.fomoIdItem}>
                    <div>Token:{truncateString(curFomoInfo[0]?.token_pid.toString())}</div>
                    <ContentCopy
                      className={styles.Icon}
                      onClick={() => CanisterCopyBtnFn(curFomoInfo[0]?.token_pid.toString())}
                    ></ContentCopy>
                    <Launch
                      className={styles.Icon}
                      onClick={() => getIdDashboardURL(curFomoInfo[0]?.token_pid.toString())}
                    ></Launch>
                  </div>
                  <div className={styles.fomoIdItem}>
                    <div>Pool:{truncateString(curFomoInfo[0]?.pool_pid.toString())}</div>
                    <ContentCopy
                      className={styles.Icon}
                      onClick={() => CanisterCopyBtnFn(curFomoInfo[0]?.pool_pid.toString())}
                    ></ContentCopy>
                    <Launch
                      className={styles.Icon}
                      onClick={() => getPoolDashboardURL(curFomoInfo[0]?.pool_pid.toString())}
                    ></Launch>
                  </div>
                </div> */}
							</div>
						</div>
					</div>
					<div className={styles.UserProgress}>
						<div
							className={styles.icpConnection}
							style={{
								display: curFomoInfo[0]?.twitter_link ? "" : "none",
								cursor: "pointer",
							}}
							onClick={() => btnToWeb(curFomoInfo[0]?.twitter_link)}
						>
							<img className={styles.ConnectionIcon} src={X} />
							<div className={styles.ConnectionName}>
								{curFomoInfo[0]?.twitter_link}
							</div>
						</div>
						<div
							className={styles.icpConnection}
							style={{
								display: curFomoInfo[0]?.telegram_link ? "" : "none",
								cursor: "pointer",
							}}
							onClick={() => btnToWeb(curFomoInfo[0]?.telegram_link)}
						>
							<img className={styles.ConnectionIcon} src={buy} />
							<div className={styles.ConnectionName}>
								{curFomoInfo[0]?.telegram_link}
							</div>
						</div>
						<div
							className={styles.icpConnection}
							style={{
								display: curFomoInfo[0]?.website ? "" : "none",
								cursor: "pointer",
							}}
							onClick={() => btnToWeb(curFomoInfo[0]?.website)}
						>
							<img className={styles.ConnectionIcon} src={linkIcon} />
							<div className={styles.ConnectionName}>
								{curFomoInfo[0]?.website}
							</div>
						</div>
						<div className={styles.poolProgress}>
							<div className={styles.PlooNum}>
								well digging progress:{" "}
								<div className={styles.Num}>
									{Number(curFomoInfo[0]?.pool_progress) / 100}%
								</div>
							</div>
							<LinearProgressWithLabel
								value={
									Number(curFomoInfo[0]?.pool_progress) / 100 > 100
										? 100
										: Number(curFomoInfo[0]?.pool_progress) / 100
								}
							/>
							<div className={styles.Warn}>
								{welldiggingtext()}
								{/* When the market cap of the token reaches $5,000, all liquidity in the well will be permanently locked on
                ICPEx. Well digging progress will accelerate as the token price increases. */}
								<br />
								Well digging progress will accelerate as the token price
								increases.
								<br />
								There are still{" "}
								{PoolInfo?.base_reserve
									? formatAmountByUnit(
											Number(PoolInfo?.base_reserve) /
												10 ** Number(PoolInfo?.base_token_decimals),
										)
									: ""}{" "}
								tokens in the well available for sale, and there are{" "}
								{PoolInfo?.quote_reserve
									? formatAmountByUnit(
											Number(PoolInfo?.quote_reserve) / 10 ** 8,
										)
									: ""}{" "}
								ICP in the well.
							</div>
						</div>
						<div className={styles.kingHillprogress}>
							{curFomoInfo[0]?.god_of_wells_time[0] ? (
								<div
									style={{
										color: "#eab308",
										fontSize: "16px",
										fontWeight: "600",
										marginTop: "5px",
									}}
								>
									Crowned god of wells on{" "}
									{handlTimeFn(curFomoInfo[0]?.god_of_wells_time[0], "wells")}
								</div>
							) : (
								<div>
									<div className={styles.kingHillNum}>
										god of wells progress:{" "}
										<div className={styles.Num}>
											{Number(curFomoInfo[0]?.god_of_wells_progress) / 100}%
										</div>
									</div>
									<LinearProgressWithLabel
										value={
											Number(curFomoInfo[0]?.god_of_wells_progress) / 100 > 100
												? 100
												: Number(curFomoInfo[0]?.god_of_wells_progress) / 100
										}
									/>
									<div className={styles.Warn}>
										dethrone the current god at a $
										{formatAmountByUnit(macketcap!)} mcap
									</div>
								</div>
							)}
							<div className={styles.details}>
								<div className={styles.Header}>Holder distribution</div>
								<div className={styles.AlldetailItem}>
									{topTen?.map((item, index) => {
										return (
											<div className={styles.detailItem} key={index}>
												<div className={styles.left}>
													<div className={styles.sortNum}>{index + 1}.</div>
													<Tooltip
														title={item.account.owner.toString()}
														placement="top"
													>
														<div className={styles.UserName}>
															{item.account.owner.toString().split("-")[0]}
														</div>
													</Tooltip>
													<div className={styles.ItemName}>
														{item.holder_type === "pool"
															? `🏦 (pool)`
															: item.holder_type === "dev"
																? `🤵‍(dev)`
																: ""}
													</div>
												</div>

												{/* <div className={styles.imgIcon}>{item.img}</div> */}

												<div className={styles.Num}>
													{Math.floor(item.holder_percent * 100 * 100) / 100}%
												</div>
											</div>
										);
									})}
									{/* {kingHillDetail.map((item, index) => {
                  return (
                    <div className={styles.detailItem} key={item.name}>
                      <div className={styles.sortNum}>{index + 1}.</div>
                      <div className={styles.ItemName}>{item.name}</div>
                      <div className={styles.imgIcon}>{item.img}</div>
                      <div className={styles.Num}>{item.num}%</div>
                    </div>
                  );
                })} */}
								</div>
							</div>
						</div>
					</div>
					<div className={styles.CanistersOverview}>
						<div className={styles.title} id="addcycles">
							Canisters overview
						</div>
						<div className={styles.CanistersOverviewItem}>
							<div className={styles.left}>
								<Tooltip
									title={curFomoInfo[0]?.fomo_pid.toString()}
									placement="top"
								>
									<span> {`Fomo`}</span>
								</Tooltip>
								<ContentCopy
									className={styles.Icon}
									onClick={() =>
										CanisterCopyBtnFn(curFomoInfo[0]?.fomo_pid.toString())
									}
								></ContentCopy>
								<Launch
									className={styles.Icon}
									onClick={() =>
										getIdDashboardURL(curFomoInfo[0]?.fomo_pid.toString())
									}
								></Launch>
							</div>

							<div className={styles.rightwarp}>
								<Tooltip
									title={
										"The cycles of this canister are lower than 100B. There is a risk of freezing. Freezing will result in loss of all data. Please top up."
									}
									placement="top"
								>
									<img
										className={styles.CanistersOverviewimg}
										src={addcycles}
										style={{ display: showaddcylesimg.fomo ? "" : "none" }}
									/>
								</Tooltip>

								<div className={styles.right}>
									<div className={styles.CyclesNum}>{canisterInfos.fomo}</div>
									<Divider
										orientation="vertical"
										className={styles.verticalline}
										flexItem
									></Divider>
									<div
										onClick={() => openAddCyclesModal(curFomoInfo[0].fomo_pid)}
									>
										+Cycles
									</div>
								</div>
							</div>
						</div>
						<div className={styles.CanistersOverviewItem}>
							<div className={styles.left}>
								<Tooltip
									title={curFomoInfo[0]?.pool_pid.toString()}
									placement="top"
								>
									<span> {`Pool`}</span>
								</Tooltip>
								<ContentCopy
									className={styles.Icon}
									onClick={() =>
										CanisterCopyBtnFn(curFomoInfo[0]?.pool_pid.toString())
									}
								></ContentCopy>
								<Launch
									className={styles.Icon}
									onClick={() =>
										getIdDashboardURL(curFomoInfo[0]?.pool_pid.toString())
									}
								></Launch>
								{curFomoInfo[0]?.pool_progress_done_time.length === 1 && (
									<Lock
										className={styles.Icon}
										onClick={() =>
											getICPExPoolURL(curFomoInfo[0]?.pool_pid.toString())
										}
									/>
								)}
							</div>
							<div className={styles.rightwarp}>
								<Tooltip
									title={
										"The cycles of this canister are lower than 100B. There is a risk of freezing. Freezing will result in loss of all data. Please top up."
									}
									placement="top"
								>
									<img
										className={styles.CanistersOverviewimg}
										src={addcycles}
										style={{ display: showaddcylesimg.pool ? "" : "none" }}
									/>
								</Tooltip>
								<div className={styles.right}>
									<div className={styles.CyclesNum}>{canisterInfos.pool}</div>
									<Divider
										orientation="vertical"
										className={styles.verticalline}
										flexItem
									></Divider>
									<div
										onClick={() => openAddCyclesModal(curFomoInfo[0].pool_pid)}
									>
										+Cycles
									</div>
								</div>
							</div>
						</div>
						<div className={styles.CanistersOverviewItem}>
							<div className={styles.left}>
								<Tooltip
									title={curFomoInfo[0]?.token_pid.toString()}
									placement="top"
								>
									<span> {`Token`}</span>
								</Tooltip>
								<ContentCopy
									className={styles.Icon}
									onClick={() =>
										CanisterCopyBtnFn(curFomoInfo[0]?.token_pid.toString())
									}
								></ContentCopy>
								<Launch
									className={styles.Icon}
									onClick={() =>
										getIdDashboardURL(curFomoInfo[0]?.token_pid.toString())
									}
								></Launch>

								{isfireicon && (
									<LocalFireDepartmentIcon
										className={styles.fireicon}
										onClick={() =>
											getIdDashboardURL(curFomoInfo[0].token_pid.toString())
										}
									/>
								)}
								{issneedicon && (
									<img
										src={SNEED}
										onClick={() =>
											getIdDashboardURL(curFomoInfo[0].token_pid.toString())
										}
										className={styles.Icon}
										style={{ width: "14px", height: "14px" }}
									></img>
								)}
							</div>
							<div className={styles.rightwarp}>
								<Tooltip
									title={
										"The cycles of this canister are lower than 100B. There is a risk of freezing. Freezing will result in loss of all data. Please top up."
									}
									placement="top"
								>
									<img
										className={styles.CanistersOverviewimg}
										src={addcycles}
										style={{ display: showaddcylesimg.token ? "" : "none" }}
									/>
								</Tooltip>
								<div className={styles.right}>
									<div className={styles.CyclesNum}>{canisterInfos.token}</div>
									<Divider
										orientation="vertical"
										className={styles.verticalline}
										flexItem
									></Divider>
									<div
										onClick={() => openAddCyclesModal(curFomoInfo[0].token_pid)}
									>
										+Cycles
									</div>
								</div>
							</div>
						</div>
					</div>
					<div
						className={styles.CanisterDeveloper}
						style={{
							display:
								curFomoInfo[0]?.create_user_pid.toString() == appStore.userId &&
								!issneedicon &&
								!isfireicon
									? ""
									: "none",
						}}
					>
						<div className={styles.title} id="addcycles">
							Developer Options
						</div>
						<div className={styles.token}>Tokens:</div>
						<div className={styles.tokenOption}>
							<div className={styles.Ownership}>Ownership Transfer</div>
							<div className={styles.options}>
								<div
									className={styles.BalckHole}
									onClick={() => openOwnershipFn("BalckHole")}
								>
									Balck Hole
								</div>
								<div
									className={styles.SneedDAO}
									onClick={() => openOwnershipFn("SneedDAO")}
								>
									Sneed DAO
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<Modal
				open={openStep}
				onClose={handleCloseStep}
				style={{ borderColor: "#262939" }}
			>
				<Fade
					in={openStep}
					style={{
						position: "relative",
						width: "300px",
						outline: "none",
					}}
				>
					<Box
						sx={{
							...ModolStyle,
							alignItems: "center",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<div onClick={onBtnCloseStep}>
							<CloseIcon
								sx={{
									color: "#fff",
									position: "absolute",
									right: "10px",
									top: "8px",
									cursor: "pointer",
								}}
							></CloseIcon>
						</div>
						<div
							className="header"
							style={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<div
								className="Title"
								style={{ fontSize: "24px", color: "#fff" }}
							>
								{String(CurBuyOrSell.directions) == "1" ? "Buy" : "Sell"} in
								progress
							</div>
							<div
								className="Title"
								style={{ fontSize: "12px", color: "#fff", marginTop: "5px" }}
							>
								Please wait some time for transactios to finish
							</div>
						</div>
						<div
							style={{
								position: "relative",
								display: "flex",
								justifyContent: "space-around",
								alignItems: "center",
								marginTop: "15px",
							}}
						>
							<div
								style={{
									width: "150px",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Box sx={{ position: "relative", display: "inline-flex" }}>
									<CircularProgress
										thickness={isStepApprove ? 2 : 0}
										size={60}
										sx={{
											color: "#fff",
											background: "#746cec",
											borderRadius: "50%",
										}}
									/>
									<Box
										sx={{
											top: 0,
											left: 0,
											bottom: 0,
											right: 0,
											position: "absolute",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<img
											src={success}
											style={{
												height: "15px",
												position: "absolute",
												right: "3px",
												top: 0,
												visibility: StepApproveSuccess ? "visible" : "hidden",
											}}
										/>
										{StepApproveSuccess ? (
											<CheckIcon sx={{ color: "#fff" }}></CheckIcon>
										) : (
											<CheckIcon sx={{ color: "#fff" }}></CheckIcon>
											// <img style={{ height: '20px' }} src={pennding} />
										)}
									</Box>
								</Box>
								<div
									style={{
										textAlign: "center",
										color: "#fff",
										fontSize: "14px",
									}}
								>
									Approve{" "}
									{CurBuyOrSell.directions == BigInt(1)
										? "ICP"
										: `${curFomoInfo[0]?.ticker}`}
								</div>
							</div>
							<div style={{ color: "#fff" }}>{`>`}</div>
							<div
								style={{
									width: "150px",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Box sx={{ position: "relative", display: "inline-flex" }}>
									<CircularProgress
										thickness={isStepCreateFomo ? 2 : 0}
										size={60}
										sx={{
											color: "#fff",
											background: "#746cec",
											borderRadius: "50%",
										}}
									/>
									<Box
										sx={{
											top: 0,
											left: 0,
											bottom: 0,
											right: 0,
											position: "absolute",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<img
											src={success}
											style={{
												height: "15px",
												position: "absolute",
												right: "3px",
												top: 0,
												visibility: StepCreateFomoSuccess
													? "visible"
													: "hidden",
											}}
										/>
										{StepCreateFomoSuccess ? (
											<CheckIcon sx={{ color: "#fff" }}></CheckIcon>
										) : (
											<img src={pennding} style={{ height: "20px" }}></img>
										)}
									</Box>
								</Box>
								<div
									style={{
										textAlign: "center",
										color: "#fff",
										fontSize: "14px",
									}}
								>
									Swap{" "}
									{CurBuyOrSell.directions == BigInt(1)
										? "ICP"
										: `${curFomoInfo[0]?.ticker}`}{" "}
									to{" "}
									{CurBuyOrSell.directions == BigInt(1)
										? `${curFomoInfo[0]?.ticker}`
										: "ICP"}
								</div>
							</div>
						</div>
					</Box>
				</Fade>
			</Modal>
			<Modal
				className={styles.addCommentMoadl}
				open={addComment}
				onClose={handleaddComment}
				style={{ borderColor: "#262939" }}
			>
				<Fade
					in={addComment}
					style={{
						position: "relative",
						width: "300px",
						outline: "none",
					}}
				>
					<Box
						sx={{
							...ModolStyle,
						}}
					>
						<div className={styles.addComment}>
							<InputLabel required className={styles.LabelCom}>
								add a comment
							</InputLabel>
							<InputBase
								rows="5"
								multiline
								className={styles.inputCoin}
								sx={{
									".css-3b6ca1-MuiInputBase-input": {
										border: "1px soild red",
									},
								}}
								onChange={(e) =>
									setAddCommentParams({
										...addCommentParams,
										content: e.target.value,
									})
								}
								// required
							></InputBase>
						</div>
						<div className={styles.addImg}>
							<InputLabel className={styles.LabelCom}>image</InputLabel>
							<InputBase
								value={fileName}
								required
								style={{ color: "#9EBADF" }}
								// onChange={(e) => setAddCommentParams({ ...addCommentParams, image_url: [e.target.value] })}
								sx={{
									".MuiInputBase-inputAdornedStart": {
										aspectRatio: "0",
										fontSize: "14px",
									},
								}}
								startAdornment={
									<label
										htmlFor="icon-button-file-icpInfo"
										className={styles.UploadBtn}
									>
										<Input
											// accept="image/*"
											id="icon-button-file-icpInfo"
											type="file"
											style={{ display: "none", height: "48px" }}
											inputProps={{
												style: { color: "#fff" },
											}}
											onChange={BtnPhoto}
										/>
										<IconButton
											color="primary"
											aria-label="upload picture"
											component="div"
											style={{ aspectRatio: "0" }}
										>
											<img
												src={chooseFile}
												style={{ cursor: "pointer", width: "120px" }}
											></img>
										</IconButton>
									</label>
									// <Input position="start" accept="image/*" onChange={BtnPhoto} type="file">
									//   <img src={chooseFile} style={{ cursor: 'pointer' }}></img>
									// </Input>
								}
								className={styles.inputCoin}
							></InputBase>
							<LoadingButton
								id="postreply"
								loading={ispostreply}
								className={styles.postreply}
								onClick={BtnPostreply}
								style={{
									pointerEvents: addCommentParams.content ? "unset" : "none",
									backgroundImage: !addCommentParams.content
										? "linear-gradient(235deg, #4c516c 0%, #4e5082 100%)"
										: "linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)",
								}}
							>
								<span style={{ fontSize: "14px" }}>
									{addCommentParams.content ? "post reply" : "Enter a comment"}
								</span>
								<span
									style={{ display: addCommentParams.content ? "" : "none" }}
								>
									Requires: 6
									<img
										src={wellToken}
										style={{ display: ispostreply ? "none" : "" }}
									></img>
								</span>
							</LoadingButton>
							{/* <div className={styles.postreply} onClick={BtnPostreply}>
                post reply
              </div> */}
							<div className={styles.cancel} onClick={BtnCloseAddModal}>
								cancel
							</div>
						</div>
					</Box>
				</Fade>
			</Modal>
			<Modal
				className={styles.addCyclesModal}
				open={addCycles}
				onClose={handleaddaddCycles}
				style={{ borderColor: "#262939" }}
			>
				<Box
					sx={{
						...addCyclesModalStyles,
					}}
				>
					<div className={styles.addCycles}>
						<div onClick={handleaddaddCycles}>
							<CloseIcon
								sx={{
									color: "#fff",
									position: "absolute",
									right: "10px",
									top: "8px",
									cursor: "pointer",
								}}
							></CloseIcon>
						</div>
						<div className={styles.header}>Add cycles for canister</div>
						<div className={styles.balanceInfo}>
							<div className={styles.fee}>
								Fee:{" "}
								<span className={styles.feeNum}>
									{formatUnitToT(cyclesfee?.toString())} cycles
								</span>
							</div>
							<div className={styles.balance}>
								<div>Balance:{formatUnitToT(curCyclesBalance?.toString())}</div>
								<span className={styles.MaxBalance} onClick={btnMax}>
									Max
								</span>
							</div>
						</div>
						<div className={styles.amountInput}>
							<InputBase
								className={styles.amount}
								placeholder="0.0"
								value={displayValue}
								startAdornment={
									<InputAdornment
										position="end"
										style={{
											fontFamily: "",
											fontSize: "14px",
											color: "#FFFFFF",
											fontWeight: 600,
											display: "flex",
											flexDirection: "column",
											justifyContent: "center",
											alignItems: "start",
											marginRight: "5px",
										}}
									></InputAdornment>
								}
								endAdornment={
									<InputAdornment
										position="end"
										style={{
											fontFamily: "",
											fontSize: "14px",
											color: "#FFFFFF",
											fontWeight: 600,
											display: "flex",
											flexDirection: "column",
											justifyContent: "center",
											alignItems: "start",
											marginRight: "5px",
										}}
									>
										<div style={{ color: "#8f9ecd" }}>T Cycles</div>
									</InputAdornment>
								}
								sx={{
									".css-3b6ca1-MuiInputBase-input": {
										border: "1px soild red",
									},
								}}
								// onChange={(e) => setamount(new Big(e.target.value).times(Math.pow(10, cyclesdecimals!)).toFixed(0, 0))}
								onChange={(e) => inputamountchange(e)}
								// required
							></InputBase>
						</div>
						<LoadingButton
							id="openbuyLoding"
							loading={openbuyAmountLoding}
							className={styles.openbuyAmountLoding}
							sx={{
								color: isshow ? "#eef7ff" : "#fff",
								backgroundImage: isshow
									? "linear-gradient(235deg, #4c516c 0%, #4e5082 100%)"
									: "linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)",
								pointerEvents: isshow ? "none" : "",
							}}
							onClick={btnBuyamount}
						>
							<div style={{ display: isshow ? "none" : "" }}>Confirm</div>
							<div
								style={{
									fontSize: isshow ? 14 : 14,
									fontWeight: isshow ? "normal" : "normal",
									display: isshow ? "" : "none",
								}}
							>
								{btnfomoText}
							</div>
						</LoadingButton>
					</div>
				</Box>
			</Modal>
			<Modal
				open={openOwnership}
				className={styles.CanisterDeveloperModal}
				onClose={handleopenOwnership}
			>
				<Box
					sx={{
						...CanisterDevelopersModalStyles,
					}}
				>
					<div className={styles.title}>Ownership Transfer</div>
					<div className={styles.content}>
						<WarningAmberIcon className={styles.WarnIcon}></WarningAmberIcon>
						<div
							className={styles.warnText}
							style={{ display: !isSneedDAO ? "" : "none" }}
						>
							The control of the token canister will be transferred to the{" "}
							<span className={styles.hightText}>black hole (aaaaa-aa)</span>.
							This change is irreversible.
						</div>
						<div
							className={styles.warnText}
							style={{ display: isSneedDAO ? "" : "none" }}
						>
							The control of the token canister will be transferred to{" "}
							<span className={styles.hightText}>
								Sneed DAO (fp274-iaaaa-aaaaq-aacha-cai)
							</span>
							. Any future upgrades to the token canister will be decided
							through Sneed DAO voting.
						</div>
						<div className={styles.serverFee}>
							<div className={styles.left}>Service Fee</div>
							<div className={styles.right}>
								{Number(tokenStore.dollar2ICP) * 2}ICP
							</div>
						</div>
						<LoadingButton
							className={styles.btmConfirm}
							loading={ownershipLoding}
							variant="outlined"
							style={{
								backgroundImage: ownershipLoding
									? "linear-gradient(235deg, #4c516c 0%, #4e5082 100%)"
									: "linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)",
							}}
							onClick={btnremoveownership}
						>
							{ownershipLoding ? "" : "Confirm"}
						</LoadingButton>
						{/* <div className={styles.btmConfirm} style={{ backgroundImage: 'linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)' }} onClick={btnremoveownership}>
              Confirm
            </div> */}
					</div>
				</Box>
			</Modal>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "left",
				}}
			>
				<Box sx={{ p: 2, backgroundColor: "#253052", width: "200px" }}>
					<div className={styles.setting}>
						<div className={styles.header}>Setting</div>
						<div className={styles.SlippageTolerance}>
							<div className={styles.top}>
								<div className={styles.left}>Slippage Tolerance</div>
								<div className={styles.right}>{InputSlippage}%</div>
							</div>
							<div className={styles.buttom}>
								<InputBase
									value={InputSlippage}
									className={styles.inputCoin}
									endAdornment={
										<div style={{ color: "#fff", marginLeft: "3px" }}>%</div>
									}
									onChange={(e) => setInputSlippage(e.target.value)}
									// required
								></InputBase>
								<Button
									className={styles.Auto}
									sx={{ color: "#fff" }}
									onClick={() => setInputSlippage("0.5")}
								>
									Auto
								</Button>
							</div>
						</div>
						<div className={styles.ExpertMode}>
							<div className={styles.ExpertModeLabel}>Expert Mode</div>
							<div className={styles["expert-content"]}>
								<div
									className={classNames(
										styles["expert-item"],
										!isExpertMode ? styles.selected : "",
									)}
									onClick={() => handleMode(false)}
								>
									OFF
								</div>
								<div
									className={classNames(
										styles["expert-item"],
										isExpertMode ? styles.selected : "",
									)}
									onClick={() => handleMode(true)}
								>
									ON
								</div>
							</div>
						</div>
					</div>
				</Box>
			</Popover>
			<div
				style={{
					position: "fixed",
					top: "90px",
					right: "10px",
					display: openRightBox ? "" : "none",
				}}
			>
				<div
					onClick={closeRightBox}
					style={{ position: "absolute", right: "8px", top: "5px" }}
				>
					<CloseIcon
						sx={{ color: "#fff", cursor: "pointer", fontSize: "23px" }}
					></CloseIcon>
				</div>
				<div
					style={{
						padding: "10px 10px 10px 10px",
						backgroundColor: "#1f2946",
						minWidth: "250px",
						maxWidth: "400px",
						borderRadius: "15px",
						display: "flex",
						alignItems: "center",
						justifyContent: "start",
					}}
				>
					<div>
						<div style={{ position: "relative" }}>
							<CircularProgress
								thickness={2}
								size={50}
								sx={{
									color: "#fff",
									background: "#746cec",
									borderRadius: "50%",
								}}
							/>
							<AccessTimeIcon
								sx={{
									color: "#fff",
									position: "absolute",
									top: "9.5px",
									right: "10.5px",
									fontSize: "30px",
								}}
							></AccessTimeIcon>
						</div>
					</div>
					<div
						style={{
							marginLeft: "10px",
							maxWidth: "320px",
							marginRight: "25px",
						}}
					>
						<div style={{ color: "#fff" }}>
							{" "}
							Swap {inputValue}{" "}
							{CurBuyOrSell.directions == BigInt(1)
								? "ICP"
								: `${curFomoInfo[0]?.ticker}`}{" "}
							to{" "}
							{CurBuyOrSell.directions == BigInt(1)
								? `${curFomoInfo[0]?.ticker}`
								: "ICP"}
						</div>
						<div
							style={{ color: "#5f56bf", cursor: "pointer" }}
							onClick={() => setOpenStep(true)}
						>
							View progress
						</div>
					</div>
				</div>
			</div>
			<SnackbarProgress
				ref={snackbarRef}
				onViewProgress={() => console.log(111)}
			></SnackbarProgress>
			<img
				className={styles.addcycles}
				src={isShowArrPre ? addcyclesArrpre : addcyclesArr}
				style={{ display: showaddcylesimg.isWindow ? "none" : "" }}
				onClick={btntoaddcanisters}
			/>
		</div>
	);
});

export default icpInfo;
