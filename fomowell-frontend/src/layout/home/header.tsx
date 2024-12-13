import React, { useEffect, useRef } from "react";
import {
	Box,
	Button,
	Modal,
	Fade,
	FormGroup,
	FormControlLabel,
	Checkbox,
	IconButton,
	styled,
	InputBase,
	Skeleton,
	Snackbar,
	Alert,
	Tooltip,
	Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./index.module.less";
import UserIcon from "@/assets/home/UserIcon.png";
import X from "@/assets/home/X.png";
import file from "@/assets/home/file.png";
import buy from "@/assets/home/headerBuy.png";
import ConnectWallet from "@/assets/home/ConnectWallet.png";
import documentIcon from "@/assets/home/document.png";
import FomoWell from "@/assets/home/FomoWell.png";
import StoicWallet from "@/assets/home/StoicWallet.png";
import wellToken from "@/assets/welltoken.png";
import welltokenNull from "@/assets/welltoken_null.png";
import wellpoint from "@/assets/wellpoint.gif";
import wellpointNull from "@/assets/wellpoint_null.gif";
import { useNavigate } from "react-router-dom";
import {
	DriveFileRenameOutline,
	ContentCopy,
	Launch,
} from "@mui/icons-material";
import LoadingButton from "@mui/lab/LoadingButton";
// @ts-ignore
import { walletList } from "../../../artemis-web3-adapter/src/wallets/wallet-list.js";
import {
	disconnect,
	requestConnect,
	verifyConnectionAndAgent,
} from "@/utils/wallet/connect";
import {
	getBaseUserInfo,
	setUserInfo,
	get_fomo_context,
	get_fomo_by_fomo_idx,
} from "@/api/fomowell_launcher";
import classNames from "classnames";
import appStore, {
	getUserImg,
	getUserName,
	setlockToken,
	setUserImg,
	setUserName,
	setusertoken,
} from "@/store/app";
import { truncateString } from "@/utils/principal";
// import { Principal } from '@dfinity/principal';
import {
	UserEditObj,
	Context,
	FomoProject,
} from "@/canisters/fomowell_launcher/fomowell_launcher.did";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Message from "@/components/Snackbar/message";
import HelpIcon from "@mui/icons-material/Help";
import BuyTokenModal from "./buyToken";
import {
	setUserId,
	// setUserName,
	// setUserImg,
	setConnectType,
	setAccountId,
	setCurBtnFomoIcpInfo,
	setTransferAccount,
	setAppDisconnect,
} from "@/store/app/appSlice";
import { AppDispatch, RootState } from "@/store/app/store";
// import { useDispatch, useSelector } from 'react-redux';
import { Principal } from "@dfinity/principal";
import { QeqImg } from "@/api/img_request";
import { getImgUrl } from "@/utils/getImgUrl";
import { observer } from "mobx-react-lite";
import {
	coinbase_icp_price,
	connectWebSocket,
	formatAmountByUnit,
} from "@/utils/common";
import { cache } from "@babel/traverse";
import zIndex from "@mui/material/styles/zIndex";
import { icrc1_decimals, icrc1balance } from "@/api/icrc2_ledger";
import Big from "big.js";
import SentIcp from "./sendICP";
import { account_balance, decimals } from "@/api/ledger";
import { AccountIdentifier } from "@dfinity/ledger-icp";
dayjs.extend(utc);
interface ChildComponentProps {
	//message under components/Snackbar is no longer used
	onMessageModal: (messageInfo: {
		type: "error" | "info" | "success" | "warning";
		content: string;
	}) => void;
	openSelectWell: Boolean;
	editOpenSelectWell: (Param: Boolean) => void;
}
const Header: React.FC<ChildComponentProps> = observer((props) => {
	// const dispatch = useDispatch<AppDispatch>();
	// const { userId, userName, useImg } = useSelector((state: RootState) => state.app);
	const Messagemodal = props.onMessageModal;
	const navigate = useNavigate();
	const [openStep, setOpenStep] = React.useState(false);
	const [openCreateWallet, setOpenCreateWallet] = React.useState(false);
	const [openWalletLoginSuccess, setOpenWalletLoginSuccess] =
		React.useState(false);
	const [openUserEditInfo, setOpenUserEditInfo] = React.useState(false);
	const [editImg, setEditImg] = React.useState("");
	// const [isDisOverflow, setIsDisOverflow] = React.useState(true);
	// const [userId, setUserId] = React.useState('');
	const [AccountId, setAccountID] = React.useState("");
	const [buyTokenOpen, setbuyTokenOpen] = React.useState(false);
	const ModolStyle = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		backgroundColor: "var(--carmodalbgc)",
		borderRadius: "8px",
		borderColor: "#262939",
		pt: 2,
		px: 4,
		pb: 3,
		// '.MuiBackdrop-root': {
		//   touchAction: 'none',
		// },
	};
	const TitleStyle = {
		fontFamily: "",
		fontSize: "22px",
		color: "#FFFFFF",
		letterSpacing: "0",
		fontWeight: "600",
		display: "flex",
		justifyContent: "center",
	};
	const UserEditTitleStyle = {
		fontFamily: "",
		fontSize: "22px",
		color: "#FFFFFF",
		letterSpacing: "0",
		fontWeight: "600",
		// display: 'flex',
		// justifyContent: 'center',
	};
	const stepStyle = {
		fontFamily: "",
		fontSize: "16px",
		color: "#FFFFFF",
		letterSpacing: "0",
		fontWeight: "600",
		marginTop: "18px",
	};
	const readyStyle = {
		backgroundImage: "linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)",
		borderradius: "4px",
		fontFamily: "",
		fontSize: "14px",
		color: "#FFFFFF",
		letterSpacing: 0,
		fontWeight: 600,
		marginLeft: "50%",
		marginTop: "20px",
		transform: "translate(-50%)",
	};
	const ModolWalletStyle = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		// width: 300,
		backgroundColor: "var(--carmodalbgc)",
		borderRadius: "8px",
		borderColor: "#262939",
		overflow: "auto",
		// pt: 2,
		// px: 3,
		// pb: 3,
	};
	const ModolLoginSuccessStyle = {
		position: "absolute",
		top: "20%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		// width: 370,
		backgroundColor: "var(--carmodalbgc)",
		borderRadius: "8px",
		borderColor: "#262939",

		// pt: 2,
		// px: 4,
		// pb: 3,
	};
	const ModolopenUserEditInfoStyle = {
		position: "absolute",
		top: "20%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		// width: 425,
		backgroundColor: "var(--carmodalbgc)",
		borderRadius: "8px",
		borderColor: "#262939",
		pt: 2,
		px: 4,
		pb: 3,
	};
	const LoginUserSuccessBtn = {
		backgroundImage: "linear-gradient(270deg, #d1d6dc 0%, #d1d6dc  100%)",
		borderRadius: "4px",
		fontFamily: "",
		fontSize: "14px",
		color: "#000",
		letterSpacing: 0,
		fontWeight: 600,
		marginTop: "10px",
		marginLeft: "50%",
		transform: "translate(-50%)",
	};
	const Input = styled("input")({
		display: "none",
	});
	const openWalletLoginSuccessClose = () => {
		setOpenWalletLoginSuccess(false);
	};
	const handleOpenStep = () => {
		setOpenStep(true);
	};
	const handleCloseStep = () => {
		setOpenStep(false);
	};
	const handleOpenWallet = () => {
		setOpenCreateWallet(true);
	};
	const handleCloseWallet = () => {
		setOpenCreateWallet(false);
	};
	const [CheckboxVal, setCheckboxVal] = React.useState(true);
	// useEffect(() => {
	//   console.log('User ID has changed:', userId);
	// }, [userId]);
	const BtnSelectWallet = async (type: string) => {
		if (CheckboxVal) {
			await requestConnect(type)
				.then(() => {
					// dispatch(setUserId('1111'));
					// console.log(userId);
					if (appStore.userId) {
						getUserInfo(appStore.userId);
						// setUserId(appStore.userId);
						setOpenCreateWallet(false);
					} else {
						throw Error("error");
					}
				})
				.catch((err) => {
					console.log(err);
					Message.error("Connect error");
					// props.onMessageModal({ type: 'error', content: 'Connect error' });
				})
				.finally(() => {
					props.editOpenSelectWell(false);
				});
		} else {
			// console.log(false);
		}
	};
	const CheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCheckboxVal(e.target.checked);
	};
	const [curEditInfImgUrl, setCurEditInfImgUrl] = React.useState("");
	const openUserEditInfoClose = () => {
		// console.log(111);

		setEditImg("");
		if (getUserImg()) {
			setCurEditInfImgUrl(getUserImg());
		} else {
			setCurEditInfImgUrl("");
		}
		setOpenUserEditInfo(false);
	};
	const openUserEditInfoOpen = () => {
		setOpenWalletLoginSuccess(true);
		if (localStorage.getItem("userName")) {
			setUserName(localStorage.getItem("userName")!);
			setUser_info({
				...user_info,
				user_name: [localStorage.getItem("userName")!],
			});
		} else {
			getUserInfo(appStore.userId);
		}
	};
	const [img, setImg] = React.useState<File>();
	const dataURLtoFile = (dataurl: string, filename: string): File => {
		const arr = dataurl.split(",");
		const mime = arr[0].match(/:(.*?);/)?.[1] || "";
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);

		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}

		return new File([u8arr], filename, { type: mime });
	};
	const BtnPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
		console.log(e);
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
		// setImg(e.target.files[0]);
		let reader = new FileReader();
		reader.readAsDataURL(e.target.files[0]);
		reader.onload = function () {
			let newUrl = this.result;
			let canvas = document.createElement("canvas");
			let ctx = canvas.getContext("2d");
			let img = new Image();
			// @ts-ignore
			img.src = newUrl;
			let data = "";
			img.onload = function () {
				if (!e.target.files) {
					Message.error("file error");
					return;
				}
				// let width = img.width;
				canvas.width = 120;
				canvas.height = 120;
				ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
				// Convert to base64 quality to image compression quality. The smaller the value between 0 and 1, the larger the compression, the poorer the image quality
				data = canvas.toDataURL(e.target.files[0].type, 0.7);
				let file = dataURLtoFile(data, e.target.files[0].name);
				setImg(file);
				setUser_info({ ...user_info, avatar: [data] });
				setEditImg(data);
				// console.log(document.getElementById("icon-button-file")!.value);
				// document.getElementById("icon-button-file")!.value = '';
			};
		};
		return () => {
			// console.log(111);
		};
	};
	const BtnShowUserInfo = () => {
		navigate(`/profile/${appStore.userId}`);
		setOpenWalletLoginSuccess(false);
	};
	const [user_info, setUser_info] = React.useState<UserEditObj>({
		user_name: [],
		avatar: [],
	});
	const [curEditName, setCurEditName] = React.useState(getUserName());
	const BtnUSerEditInfo = async () => {
		setOpenUserEditInfo(true);
	};
	const getUserInfo = async (userId: string) => {
		try {
			const res = await getBaseUserInfo(userId);
			// console.log(res);
			if (res[0]) {
				setUserName(res[0].user_name);
				setUserImg(res[0].avatar);
				setusertoken(
					res[0].user_points.length != 0 ? Number(res[0].user_points) : null,
				);
				setlockToken(
					res[0].user_pre_reward_points.length != 0
						? Number(res[0].user_pre_reward_points)
						: null,
				);
				setUser_info({
					...user_info,
					user_name: [`${res[0].user_name}`],
					avatar: [`${res[0].avatar}`],
				});
				setEditImg("");
				setCurEditInfImgUrl(getUserImg());
			} else {
				await setUserInfo(appStore.userId, {
					user_name: [],
					avatar: ["default"],
				});
				const name = await getBaseUserInfo(appStore.userId);
				if (name[0]) {
					setUserName(name[0].user_name);
					setUserImg(name[0].avatar);
					setusertoken(
						name[0].user_points.length != 0
							? Number(name[0].user_points)
							: null,
					);
					setlockToken(
						name[0].user_pre_reward_points.length != 0
							? Number(name[0].user_pre_reward_points)
							: null,
					);
				}
			}
		} catch (error) {
			console.log(error);
			Message.error("getUserInfo error");
			// props.onMessageModal({ type: 'error', content: '' });
		}
	};
	//Edit User Information
	const editUserInfo = async (userId: string, user_info: UserEditObj) => {
		setIsSave(true);
		let imgStr = {
			reference: "",
		};
		let value;
		if (img) {
			try {
				imgStr = await QeqImg(img!);
				// console.log(imgStr);

				// console.log(value, { ...user_info, avatar: [imgStr.reference] });
				value = await setUserInfo(userId, {
					...user_info,
					avatar: [imgStr.reference],
				});
			} catch (error: any) {
				console.log(error);
				if (error && error.message) {
					const match = error.message.match(/Reject text: (.*)/);
					if (match && match[1]) {
						Message.error(match[1]);
					} else {
						Message.error("save error");
					}
				} else {
					Message.error("save error");
				}
			}
		} else {
			try {
				value = await setUserInfo(userId, { ...user_info, avatar: [] });
			} catch (error: any) {
				console.log(error);
				if (error && error.message) {
					const match = error.message.match(/Reject text: (.*)/);
					if (match && match[1]) {
						Message.error(match[1]);
					} else {
						Message.error("save error");
					}
				} else {
					Message.error("save error");
				}
			}
		}
		if (!value) {
			setIsSave(false);
			return;
		}
		if ("Ok" in value) {
			// console.log(appStore.userId);

			const res = await getBaseUserInfo(appStore.userId);
			// if (user_info.user_name[0] && user_info.avatar[0]) {
			setUserName(res[0]!.user_name);
			setUserImg(res[0]!.avatar);
			setusertoken(res[0] ? Number(res[0].user_points) : null);
			setlockToken(res[0] ? Number(res[0].user_pre_reward_points) : null);

			// }
			openUserEditInfoClose();
			Message.success("Success!");
			setusertoken(res[0] ? Number(res[0].user_points) : null);
			setlockToken(res[0] ? Number(res[0].user_pre_reward_points) : null);
		} else {
			const trimmedErrorMessage = value["Err"].replace(
				/, src\/main\.rs:\d+:\d+$/,
				"",
			);
			console.log("Value is Err: ", value["Err"]);
			Message.error(trimmedErrorMessage);
		}
		setIsSave(false);
	};
	const [isSave, setIsSave] = React.useState(false);
	const SaveUserEditInfo = async () => {
		editUserInfo(appStore.userId, user_info);
	};
	//Unconnect wallet
	const BtnDisconnectWallet = async () => {
		await disconnect();
		setEditImg("");
		setCurEditInfImgUrl("");
		setOpenWalletLoginSuccess(false);
		props.editOpenSelectWell(false);
	};
	//edit input change
	const EditNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCurEditName(event.target.value);
		setUser_info({
			...user_info,
			user_name: [`${event.target.value}`],
		});
	};
	const CanisterCopyBtnFn = (copyText: string) => {
		navigator.clipboard.writeText(copyText).then(
			() => {
				Message.success("Success!");
			},
			() => {
				Message.error("clipboard write failed");
			},
		);
	};
	const getAccountDashboardURL = (accountId: string) =>
		window.open(`https://dashboard.internetcomputer.org/account/${accountId}`);
	const getPrincipalDashboardURL = (canisterId: string) =>
		window.open(`https://dashboard.internetcomputer.org/account/${canisterId}`);
	// const [MessageContent,setMessageContent] = React.useState()
	const [FomContext, setFomContext] = React.useState<Context>();
	const [last_buy_sell_op_img, setlast_buy_sell_op_img] = React.useState("");
	const [last_create_fomo, setlast_create_fomo] = React.useState("");
	const [buyShake, setbuyShake] = React.useState(false);
	const [createShake, setcreateShake] = React.useState(false);
	let curbuyStateIdx = localStorage.getItem("curbuyStateIdx")
		? localStorage.getItem("curbuyStateIdx")
		: "";
	let curcreateStateIdx = localStorage.getItem("createShake")
		? localStorage.getItem("createShake")
		: "";
	const getFomContext = async () => {
		const res = await get_fomo_context();
		if ("Err" in res) {
			props.onMessageModal({ type: "error", content: res["Err"] });
		} else {
			const resIdx = await get_fomo_by_fomo_idx(
				BigInt(res.last_buy_sell_op.fomo_idx),
			);
			const rescreate_fomo = await get_fomo_by_fomo_idx(
				BigInt(res.last_create_fomo.fomo_idx),
			);
			if (curbuyStateIdx != String(res.last_buy_sell_op.swap_timestamp)) {
				curbuyStateIdx = String(res.last_buy_sell_op.swap_timestamp);
				localStorage.setItem(
					"curbuyStateIdx",
					String(res.last_buy_sell_op.swap_timestamp),
				);
				setbuyShake(true);
			} else {
				setbuyShake(false);
			}
			if (curcreateStateIdx != String(res.last_create_fomo.create_time)) {
				curcreateStateIdx = String(res.last_create_fomo.create_time);
				localStorage.setItem(
					"createShake",
					String(res.last_create_fomo.create_time),
				);
				setcreateShake(true);
			} else {
				setcreateShake(false);
			}
			setFomContext(res);
			setlast_buy_sell_op_img(resIdx[0]?.img_url);
			setlast_create_fomo(rescreate_fomo[0]?.img_url);
		}
	};
	useEffect(() => {
		if (buyShake) {
			const timer = setTimeout(() => setbuyShake(false), 500); // 500ms
			return () => clearTimeout(timer);
		}
		if (createShake) {
			const timer = setTimeout(() => setcreateShake(false), 500); // 500ms
			return () => clearTimeout(timer);
		}
	}, [buyShake, createShake]);
	useEffect(() => {
		getFomContext();
	}, [appStore.buyorsell]);
	const handlTimeFn = (Time: bigint | undefined) => {
		if (Time) {
			const milliseconds = Time / 1000000n;
			return dayjs(Number(milliseconds)).utc().format("MM/DD/YY");
		} else {
			return "";
		}
	};
	const btnLogoToHome = () => {
		navigate("/board");
	};
	const BtnLastBuySell = async (FomoPid: string) => {
		const res = await get_fomo_by_fomo_idx(BigInt(FomoPid));
		navigate(`/${res[0]?.fomo_pid.toString()}`);
	};
	const BtnOpenWeb = (web: string) => {
		window.open(web);
	};
	const btnService = () => {
		window.open("https://docs.fomowell.com/legal-and-privacy/terms-of-service");
	};
	const handleOpendocument = () => {
		window.open("https://docs.fomowell.com");
	};
	const OpenTopupRef = useRef<{
		openModal: () => void;
		isonpenWellModal: boolean;
	}>(null);
	const btnOpenTopup = () => {
		if (OpenTopupRef.current) {
			OpenTopupRef.current.openModal();
		}
	};
	const [userBalance, setuserBalance] = React.useState<number | string>();
	const OpensendicpRef = useRef<{
		openModal: () => void;
		isonpenWellModal: boolean;
	}>(null);
	const [senticpOpen, setsenticpOpen] = React.useState(false);
	const icrc1balanceReq = async () => {
		let decimal = (await decimals()).decimals;
		const balance = await account_balance([
			{
				account: AccountIdentifier.fromHex(
					appStore.accountId.toString(),
				).toNumbers(),
			},
		]);
		setuserBalance(
			new Big(Number(balance.e8s))
				.div(new Big(10).pow(Number(decimal)))
				.toString(),
		);
	};
	const btnsend = () => {
		// console.log(111, OpensendicpRef.current);

		if (OpensendicpRef.current) {
			OpensendicpRef.current.openModal();
		}
	};
	// useEffect(() => {
	//   if (OpenTopupRef.current?.isonpenWellModal) {
	//     setOpenCreateWallet(true);
	//   }
	// }, [OpenTopupRef.current?.isonpenWellModal])
	useEffect(() => {
		setTimeout(coinbase_icp_price, 1000);
		connectWebSocket();
		verifyConnectionAndAgent().finally(() => {
			// setUserId(appStore.userId);
			setAccountID(appStore.accountId);
			icrc1balanceReq();
		});
		if (appStore.useImg) {
			setEditImg(getImgUrl(appStore.useImg));
		} else {
			setCurEditInfImgUrl(getUserImg());
		}

		getFomContext();
		setTimeout(() => {
			setInterval(() => {
				getFomContext();
			}, 15000);
		}, 15000);
	}, []);
	useEffect(() => {
		if (props.openSelectWell) {
			setOpenCreateWallet(true);
		} else {
			setOpenCreateWallet(false);
		}
	}, [props.openSelectWell]);
	return (
		<div className={styles.HomeHeader}>
			<div className={styles.headerLeft}>
				<img
					className={styles.HeaderLogo}
					src={FomoWell}
					onClick={btnLogoToHome}
				/>
				{FomContext ? (
					<Button
						className={`${styles.BuyText} ${buyShake ? styles.shake : ""}`}
						style={{
							backgroundColor: FomContext
								? FomContext.last_buy_sell_op.buy_sell_op == "buy"
									? "#289f51"
									: "rgb(180,46,46)"
								: "",
						}}
						variant="contained"
						startIcon={
							<img
								style={{ height: "22px" }}
								src={getImgUrl(FomContext?.last_buy_sell_op.user_avatar!)}
							/>
						}
						onClick={() =>
							BtnLastBuySell(FomContext?.last_buy_sell_op.fomo_idx.toString()!)
						}
					>
						{FomContext
							? `${FomContext?.last_buy_sell_op.user_name} ${FomContext.last_buy_sell_op.buy_sell_op == "buy" ? "bought" : "sold"} ${formatAmountByUnit(Number(Number(FomContext?.last_buy_sell_op.icp_amount) / 10 ** 8))} ICP of `
							: ""}
						{`${FomContext?.last_buy_sell_op.fomo_ticker}`}
						<img
							style={{ height: "22px", marginLeft: "5px" }}
							src={getImgUrl(last_buy_sell_op_img)}
						/>
					</Button>
				) : (
					<Skeleton
						className={styles.BuyText}
						variant="text"
						style={{ backgroundColor: "#655EA7" }}
						sx={{ bgcolor: "#655EA7", height: "50px", width: "300px" }}
					/>
				)}
				{FomContext ? (
					<Button
						className={`${styles.BuyText} ${createShake ? styles.shake : ""}`}
						variant="contained"
						startIcon={
							<img
								style={{ height: "22px" }}
								src={getImgUrl(FomContext?.last_create_fomo.user_avatar!)}
							/>
						}
						onClick={() =>
							BtnLastBuySell(FomContext?.last_create_fomo.fomo_idx.toString()!)
						}
					>
						{`${FomContext?.last_create_fomo.user_name} created ${FomContext?.last_create_fomo.fomo_name}`}
						<img
							style={{ height: "22px", marginLeft: "5px", marginRight: "5px" }}
							src={getImgUrl(last_create_fomo)}
						/>
						{`on ${handlTimeFn(FomContext?.last_create_fomo.create_time)}`}

						{/* smoothie sold 0.0879 ICP of DIANNA */}
					</Button>
				) : (
					<Skeleton
						className={styles.BuyText}
						variant="text"
						style={{ backgroundColor: "#655EA7" }}
						sx={{ bgcolor: "#655EA7", height: "50px", width: "300px" }}
					/>
				)}
			</div>
			<div className={styles.headerRight}>
				<div className={styles.ConnectImg}>
					<img
						className={`${styles.howit}`}
						src={file}
						onClick={handleOpenStep}
					/>
					<img
						className={styles.Right}
						src={buy}
						onClick={() => BtnOpenWeb("https://t.me/fomowell")}
					/>
					<img
						className={styles.Right}
						src={X}
						onClick={() => BtnOpenWeb("https://x.com/fomowellcom")}
					/>
					<img
						className={styles.Right}
						src={documentIcon}
						onClick={handleOpendocument}
					/>
				</div>
				{appStore.userId != "" ? (
					<div>
						<div className={styles.connect}>
							<div
								className={styles.leftUserToken}
								onClick={openUserEditInfoOpen}
							>
								<img src={getImgUrl(appStore.useImg)} />
								<div className={styles.userName}>{appStore.userName}</div>
							</div>
							<Divider
								orientation="vertical"
								className={styles.verticalline}
								flexItem
							/>
							<div className={styles.rightUserToken} onClick={btnOpenTopup}>
								<div className={styles.token_and_img}>
									{appStore.userToken !== null &&
									appStore.userToken !== undefined ? (
										<img src={wellpoint} alt="Token Image" />
									) : (
										<Tooltip title="Start a new coin to unfreeze FOMO points!">
											<img src={wellpointNull} alt="Token Image" />
										</Tooltip>
									)}
									{/* <img src={appStore.userToken ? wellpoint : wellpointNull} alt="Token Image" /> */}
									<div
										className={styles.Tokeninfo}
										style={{
											color:
												appStore.userToken !== null &&
												appStore.userToken !== undefined
													? "#ffffff"
													: "#9e9a99",
										}}
									>
										{appStore.userToken !== null &&
										appStore.userToken !== undefined ? (
											appStore.userToken
										) : (
											<span>
												{20 +
													(appStore.lockToken ? Number(appStore.lockToken) : 0)}
											</span>
										)}
									</div>
									{/* <div className={styles.TopUp}>Top-up</div> */}
								</div>
							</div>
						</div>
					</div>
				) : (
					<Button
						className={styles.ConnectWallet}
						sx={{ color: "#fff" }}
						onClick={handleOpenWallet}
					>
						<div className={styles.top}>{"Connect Wallet"}</div>
					</Button>
					// <img className={styles.ConnectWallet} src={ConnectWallet} onClick={handleOpenWallet} />
				)}
			</div>
			<BuyTokenModal ref={OpenTopupRef} onopen={buyTokenOpen}></BuyTokenModal>
			<SentIcp ref={OpensendicpRef} onopen={senticpOpen}></SentIcp>
			{/* step */}
			<Modal
				open={openStep}
				onClose={handleCloseStep}
				style={{ borderColor: "#262939", zIndex: 54 }}
			>
				<Fade in={openStep}>
					<Box
						sx={{
							...ModolStyle,
						}}
						className={styles.HowWorks}
					>
						<div
							className={styles.RightClose}
							style={{ position: "absolute", right: "20px", top: "5px" }}
						>
							<CloseIcon
								sx={{
									color: "rgba(255,255,255,0.45)",
									height: "45px",
									cursor: "pointer",
								}}
								onClick={handleCloseStep}
							></CloseIcon>
						</div>
						<div className={styles.Title} style={{ ...TitleStyle }}>
							How it works
						</div>
						<div className="step">
							<div className="one" style={{ ...stepStyle }}>
								FomoWell prevents rugs with a completely transparent fair launch
								mechanism. Every token is issued fairly, with no pre-sale, no
								team reservation, and no honeypot.
							</div>
							<div className="two" style={{ ...stepStyle }}>
								<div style={{ marginTop: "5px" }}>
									step 1: pick a coin that you like
								</div>
								<div style={{ marginTop: "5px" }}>
									step 2: buy the coin on the canister contract
								</div>
								<div style={{ marginTop: "5px" }}>
									step 3: sell at any time to lock in your profits or losses
								</div>
								<div style={{ marginTop: "5px" }}>
									step 4: when enough people buy on the pool it reaches a market
									cap of $5k
								</div>
								<div style={{ marginTop: "5px" }}>
									step 5: all of liquidity will be deposited in ICPEx and burned
								</div>
							</div>
						</div>
						<Button
							className={styles.readyStep}
							onClick={handleCloseStep}
							style={{ ...readyStyle }}
						>
							I'm ready
						</Button>
					</Box>
				</Fade>
			</Modal>
			{/* CreateWallet */}
			<Modal
				// disableAutoFocus
				open={openCreateWallet}
				sx={{
					".css-pjyw4r": {
						paddingLeft: "18px",
						paddingRight: "0px",
						zIndex: "55",
					},
				}}
				onClose={handleCloseWallet}
				style={{ borderColor: "#262939" }}
			>
				<Fade in={openCreateWallet}>
					<Box sx={{ ...ModolWalletStyle }} className={styles.WalletHowWorks}>
						<div className={styles.RightClose}>
							<div className={styles.Title} style={{ ...TitleStyle }}>
								Connect Wallet
							</div>
							<CloseIcon
								sx={{
									color: "rgba(255,255,255,0.45)",
									height: "45px",
									cursor: "pointer",
								}}
								style={{ position: "absolute", right: "20px", top: "10px" }}
								onClick={handleCloseWallet}
							></CloseIcon>
						</div>
						<FormGroup>
							<FormControlLabel
								className={styles.walletRead}
								control={
									<Checkbox
										checked={CheckboxVal}
										onChange={CheckboxChange}
										sx={{
											color: "#5D52DE",
											"&.Mui-checked": { color: "#5D52DE" },
											translate: "0px -11px",
										}}
									/>
								}
								label={
									<span className={styles.ReadContent} style={{ padding: 5 }}>
										l have read, understand and agree to the{" "}
										<span onClick={btnService} style={{ color: "red" }}>
											Terms of Service.
										</span>
									</span>
								}
								sx={{
									marginLeft: 0,
								}}
							/>
						</FormGroup>
						{walletList.map(
							(item: {
								id: string;
								name: string;
								icon: any;
								adapter: any;
								walletName: string;
							}) => {
								// const isActive = curType === item.id || checked;
								return (
									<div
										className={classNames(
											styles.InternetIdentity,
											CheckboxVal && styles.walletActive,
										)}
										// style={{
										//   '.InternetIdentity:hover': {
										//     backgroundColor: CheckboxVal ? '#1B1D28' : '',
										//   },
										// }}
										onClick={() => BtnSelectWallet(item.id)}
										key={item.id}
									>
										<div className={styles.Left}>
											<img
												src={item.icon}
												className={classNames(CheckboxVal && styles.active)}
											/>
											<div
												className={classNames(
													styles.Text,
													CheckboxVal && styles.active,
												)}
											>
												{item.name}
											</div>
										</div>
										{/* <img style={{ display: item.isCheck ? '' : 'none' }} className={styles.SelectIcon} src={checkIcon} /> */}
									</div>
								);
							},
						)}
					</Box>
				</Fade>
			</Modal>
			{/* userInfo */}
			<Modal
				// disableAutoFocus
				open={openWalletLoginSuccess}
				sx={{ ".css-pjyw4r": { paddingLeft: "18px", paddingRight: "0px" } }}
				onClose={openWalletLoginSuccessClose}
				style={{ borderColor: "#262939", zIndex: "60" }}
			>
				<Fade in={openWalletLoginSuccess}>
					<Box
						sx={{ ...ModolLoginSuccessStyle, padding: "8px" }}
						className={styles.HowWorks}
					>
						<div
							className={styles.RightClose}
							style={{ position: "absolute", right: "20px", top: "5px" }}
						>
							<CloseIcon
								sx={{
									color: "rgba(255,255,255,0.45)",
									height: "45px",
									cursor: "pointer",
								}}
								onClick={openWalletLoginSuccessClose}
							></CloseIcon>
						</div>
						<div className={styles.LoginUserSuccess}>
							<img
								className={styles.loginUserImg}
								src={getImgUrl(appStore.useImg)}
							></img>
							<div className={styles.loginNameEdit}>
								<div className={styles.EditInfo}>
									<div className={styles.Name} onClick={BtnShowUserInfo}>
										{user_info.user_name[0] ? (
											user_info.user_name[0]
										) : (
											<Skeleton
												variant="text"
												sx={{
													bgcolor: "#655EA7",
													marginTop: "10px",
													height: "40px",
												}}
											/>
										)}
									</div>
									<div className={styles.Edit} onClick={BtnUSerEditInfo}>
										Edit profile
										<DriveFileRenameOutline
											sx={{ width: "18px", height: "18px", marginLeft: "8px" }}
										></DriveFileRenameOutline>
									</div>
								</div>
								<div className={styles.userToken}>
									<div className={styles.token_and_img}>
										{appStore.userToken !== null &&
										appStore.userToken !== undefined ? (
											<img src={wellToken} />
										) : (
											<Tooltip title="Start a new coin to unfreeze FOMO points!">
												<img src={welltokenNull} />
											</Tooltip>
										)}
										<div
											className={styles.Tokeninfo}
											style={{
												color:
													appStore.userToken !== null &&
													appStore.userToken !== undefined
														? "#ffffff"
														: "#9e9a99",
											}}
										>
											{appStore.userToken !== null &&
											appStore.userToken !== undefined
												? appStore.userToken
												: 20 +
													(appStore.lockToken ? Number(appStore.lockToken) : 0)}
										</div>
									</div>
									<div className={styles.TopUp} onClick={btnOpenTopup}>
										Top-up FOMO Points
									</div>
								</div>
								<div className={styles.sendICP}>
									<div className={styles.icpImgNum}>
										<img
											src={`https://metrics.icpex.org/images/${process.env.CANISTER_ID_ICRC2_LEDGER}.png`}
										/>
										<span>
											{formatAmountByUnit(
												appStore.icpAccount ? appStore.icpAccount : userBalance,
											)}
										</span>
									</div>
									<div className={styles.btnSend} onClick={btnsend}>
										Send
									</div>
								</div>
							</div>
						</div>
						<div className={styles.UserPrincipleID}>
							<div className={styles.IdItem}>
								<div>Principle lD : {truncateString(appStore.userId)}</div>
								<div onClick={() => CanisterCopyBtnFn(appStore.userId)}>
									<ContentCopy className={styles.IconImg}></ContentCopy>
								</div>
								<div onClick={() => getPrincipalDashboardURL(appStore.userId)}>
									<Launch className={styles.IconImg}></Launch>
								</div>
							</div>
							<div className={styles.IdItem}>
								<div>Account ID :{truncateString(appStore.accountId)}</div>
								<div>
									<ContentCopy
										className={styles.IconImg}
										onClick={() => CanisterCopyBtnFn(appStore.accountId)}
									></ContentCopy>
								</div>
								<div>
									<Launch
										className={styles.IconImg}
										onClick={() => getAccountDashboardURL(appStore.accountId)}
									></Launch>
								</div>
							</div>
						</div>
						<Button
							variant="text"
							sx={{ ...LoginUserSuccessBtn }}
							className={styles.DisUser}
							onClick={BtnDisconnectWallet}
						>
							Disconnect Wallet
						</Button>
					</Box>
				</Fade>
			</Modal>
			{/* Edit profile */}
			<Modal
				open={openUserEditInfo}
				sx={{ ".css-pjyw4r": { paddingLeft: "18px", paddingRight: "0px" } }}
				onClose={openUserEditInfoClose}
				style={{ borderColor: "#262939", zIndex: "61" }}
			>
				<Fade in={openUserEditInfo}>
					<Box
						sx={{ ...ModolopenUserEditInfoStyle, outline: "none" }}
						className={styles.HowWorks}
					>
						<div className={styles.RightClose}>
							<div
								className={styles.Title}
								style={{ ...UserEditTitleStyle }}
								onClick={openUserEditInfoClose}
							>
								Edit profile
							</div>
							<CloseIcon
								sx={{
									color: "rgba(255,255,255,0.45)",
									height: "45px",
									cursor: "pointer",
								}}
								style={{ position: "absolute", right: "20px", top: "10px" }}
								onClick={openUserEditInfoClose}
							></CloseIcon>
						</div>
						<div className={styles.Editphoto}>
							<div className={styles.Name}>Profile photo</div>
							<img
								className={styles.UploadImg}
								src={editImg ? editImg : curEditInfImgUrl}
							/>
							<label htmlFor="icon-button-file" className={styles.UploadBtn}>
								<input
									accept="image/*"
									id="icon-button-file"
									type="file"
									style={{ display: "none", zIndex: 0 }}
									onChange={BtnPhoto}
								/>
								<IconButton
									color="primary"
									aria-label="upload picture"
									component="span"
								>
									<DriveFileRenameOutline style={{ color: "#838383" }} />
								</IconButton>
							</label>
						</div>
						<div className={styles.EditName}>
							<div className={styles.Name}>Your Name</div>
							<InputBase
								value={curEditName}
								onChange={EditNameChange}
								className={styles.Nameinput}
							></InputBase>
						</div>
						{/* <div className={styles.IpuntWarn}>You can change your username once every day</div> */}
						<div className={styles.EditButtom}>
							<Button
								className={styles.closeBtn}
								onClick={openUserEditInfoClose}
							>
								Close
							</Button>
							<LoadingButton
								loading={isSave}
								className={styles.SaveBtn}
								onClick={SaveUserEditInfo}
							>
								<span>Save</span>
								<span>
									Requires: 8
									<img
										src={wellToken}
										style={{ display: isSave ? "none" : "" }}
									></img>
								</span>
							</LoadingButton>
						</div>
					</Box>
				</Fade>
			</Modal>
		</div>
	);
});

export default Header;
