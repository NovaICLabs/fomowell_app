import { observer } from "mobx-react-lite";
import React, {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import styles from "./index.module.less";
import {
	Box,
	CircularProgress,
	Fade,
	InputAdornment,
	InputBase,
	Modal,
	Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import wellToken from "@/assets/welltoken.png";
import Message from "@/components/Snackbar/message";
import { LoadingButton } from "@mui/lab";
import { formatAmountByUnit } from "@/utils/common";
import { icrc1_decimals, icrc1balance } from "@/api/icrc2_ledger";
import Big from "big.js";
import appStore, { setlockToken, setusertoken } from "@/store/app";
import { Principal } from "@dfinity/principal";
import tokenStore from "@/store/token";
import {
	canisterId as icrc2CanisterId,
	idlFactory as icrc2IdlFactory,
} from "@/canisters/icrc2_ledger";
import { artemisWalletAdapter } from "@/utils/wallet/connect";
import { getBaseUserInfo, topup_points } from "@/api/fomowell_launcher";
import { BatchTransact } from "artemis-web3-adapter";
import success from "@/assets/icpInfo/success.png";
import CheckIcon from "@mui/icons-material/Check";
import pending from "@/assets/icpInfo/pending.png";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SnackbarProgress, {
	SnackbarModalHandles,
	globalSetMessageIsOpen,
} from "@/components/SnackbarProgress/SnackbarProgress";
const ModolWalletStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	// width: 300,
	backgroundColor: "#262939",
	borderRadius: "8px",
	borderColor: "#262939",
	overflow: "auto",
	pt: 2,
	px: 2,
	// pb: 3,
};
const ModolStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	backgroundColor: "#262939",
	borderRadius: "8px",
	borderColor: "#262939",
	pt: 2,
	px: 4,
	pb: 3,
};
//  BuyTokenModal  props
interface BuyTokenModalProps {
	onopen: boolean;
	ref: React.RefObject<{
		openModal: () => void;
	}>;
}

//  ref
interface BuyTokenModalRef {
	openModal: () => void;
}
const BuyTokenModal: React.FC<BuyTokenModalProps> = observer(
	forwardRef<BuyTokenModalRef, BuyTokenModalProps>(({ onopen }, ref) => {
		const [openModalVal, setopenModal] = React.useState(false);
		const [inputValue, setInputValue] = React.useState("");
		const [openbuyLoding, setopenbuyLoding] = React.useState(false);
		const localRef = useRef<HTMLDivElement>(null);
		const [isonpenWellModal, setisonpenWellModal] = React.useState(false);
		const [openStep, setOpenStep] = React.useState(false);
		const [isStepApprove, setIsStepApprove] = React.useState(true);
		const [isStepCreateFomo, setIsStepCreateFomo] = React.useState(false);
		const [StepApproveSuccess, setStepApproveSuccess] = React.useState(false);
		const [StepCreateFomoSuccess, setStepCreateFomoSuccess] =
			React.useState(false);
		const [openRightBox, setopenRightBox] = React.useState(false);
		const [userBalance, setUserBalance] = React.useState<number>(0);
		const [btnfomoText, setbtnfomoText] = React.useState(
			`Pay ≈ ${formatAmountByUnit(Number(tokenStore.dollar2ICP) * 0.1 * Number(inputValue))} ICP`,
		);
		const [isshow, setisshow] = React.useState(false);
		useImperativeHandle(ref, () => ({
			openModal: () => {
				//
				if (localRef.current) {
					//
					setopenModal(true);
				}
			},
		}));
		const closeBuyToken = () => {
			setopenModal(false);
		};

		const inputAmountChange = (
			e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
		) => {
			if (
				typeof Number(e.target.value) == "number" &&
				!isNaN(Number(e.target.value))
			) {
				setInputValue(e.target.value);
				if (!e.target.value) {
					setbtnfomoText("Enter an amount");
					setisshow(true);
				} else if (Number(e.target.value) < 10) {
					setbtnfomoText("The minimum purchase is 10 FOMO");
					setisshow(true);
				} else {
					setInputValue(e.target.value);
					setbtnfomoText(
						`Pay ≈ ${formatAmountByUnit(Number(tokenStore.dollar2ICP) * 0.1 * Number(e.target.value))} ICP`,
					);
					setisshow(false);
				}
			} else {
				Message.error("The entered value is incorrect");
			}
		};
		const selectHandle = (select: string) => {
			if (select != "custom value") {
				setInputValue(select);
				setbtnfomoText(
					`Pay ≈ ${formatAmountByUnit(Number(tokenStore.dollar2ICP) * 0.1 * Number(select))} ICP`,
				);
				setisshow(false);
			} else {
				setInputValue("");
				setbtnfomoText(`Enter an amount`);
				setisshow(true);
			}
		};
		const [icpdecimals, seticpdecimals] = React.useState<number>();
		const icrc1balanceReq = async () => {
			const balance = await icrc1balance([
				{ owner: Principal.fromText(appStore.userId!), subaccount: [] },
			]);
			const getIcrc1_decimals = await icrc1_decimals();
			seticpdecimals(getIcrc1_decimals);
			setUserBalance(
				new Big(Number(balance))
					.div(new Big(10).pow(Number(getIcrc1_decimals)))
					.toNumber(),
			);
		};
		const btnBuyToken = () => {
			const amount = icpdecimals
				? Number(inputValue) *
					Number(tokenStore.dollar2ICP) *
					1.3 *
					10 ** icpdecimals
				: Number(inputValue) * Number(tokenStore.dollar2ICP) * 1.3 * 10 ** 8;
			// console.log(icrc2CanisterId, curFomoInfo[0].token_pid.toString());
			setopenbuyLoding(true);
			if (appStore.userId) {
				setOpenStep(true);
				setopenRightBox(true);
				new BatchTransact(
					[
						{
							idl: icrc2IdlFactory,
							canisterId: icrc2CanisterId,
							methodName: "icrc2_approve",
							args: [
								{
									amount: BigInt(Math.floor(amount)),
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
							onSuccess: async () => {
								try {
									setIsStepApprove(false);
									setStepApproveSuccess(true);
									setopenRightBox(true);
									gettopup_points();
								} catch (err: any) {
									Message.error(err.toString());
									setopenbuyLoding(false);
									setTimeout(() => {
										setOpenStep(false);
									}, 800);
									setopenRightBox(false);
								} finally {
								}
							},
							onFail: (err: any) => {
								Message.error("Points redeemed failed");
								setopenRightBox(false);
								setopenbuyLoding(false);
								setTimeout(() => {
									setOpenStep(false);
								}, 800);
							},
						} as any,
					],
					artemisWalletAdapter,
				).execute();
			} else {
				// setisonpenWellModal(true)
			}
		};
		const gettopup_points = async () => {
			try {
				setIsStepCreateFomo(true);
				const res = await topup_points(BigInt(inputValue));
				setIsStepCreateFomo(false);
				setStepCreateFomoSuccess(true);
				if ("Ok" in res) {
					Message.success("FOMO points top-up successfully");
					setopenRightBox(false);
					setopenbuyLoding(false);
					setTimeout(() => {
						setStepCreateFomoSuccess(false);
						setOpenStep(false);
						setIsStepApprove(true);
						setIsStepCreateFomo(false);
						setStepApproveSuccess(false);
						setopenModal(false);
					}, 800);
					const name = await getBaseUserInfo(appStore.userId);
					setusertoken(name[0] ? Number(name[0].user_points) : 0);
					setlockToken(name[0] ? Number(name[0].user_pre_reward_points) : null);
				} else {
					setopenbuyLoding(false);
					Message.error(res["Err"]);
					setopenRightBox(false);
					setStepCreateFomoSuccess(false);
					setTimeout(() => {
						setOpenStep(false);
						setIsStepApprove(true);
						setIsStepCreateFomo(false);
						setStepApproveSuccess(false);
					}, 800);
				}
			} catch (err) {
				console.log(err);
				Message.error("FOMO points top-up failed");
				setopenRightBox(false);
				setStepCreateFomoSuccess(false);
				setopenbuyLoding(false);
				setTimeout(() => {
					setOpenStep(false);
					setIsStepApprove(true);
					setIsStepCreateFomo(false);
					setStepApproveSuccess(false);
				}, 800);
			}
		};
		const handleCloseStep = () => {
			setOpenStep(false);
		};
		const closeRightBox = () => {
			setopenRightBox(false);
		};
		const onBtnCloseStep = () => {
			setOpenStep(false);
		};
		const handleViewProgress = () => {
			setOpenStep(true);
		};
		const snackbarRef = useRef<SnackbarModalHandles>(null);
		const handleButtonClick = (RightBox: boolean) => {
			if (snackbarRef.current) {
				snackbarRef.current.openSnackbar("Top-up FOMO points", RightBox);
			}
		};
		useEffect(() => {
			handleButtonClick(openRightBox);
		}, [openRightBox]);
		useEffect(() => {
			if (appStore.userId) {
				icrc1balanceReq();
			}
		}, [appStore.userId]);
		useEffect(() => {
			if (!inputValue) {
				setbtnfomoText("Enter an amount");
				setisshow(true);
			}
		}, []);
		return (
			<div className={styles.BuyTokenModal} ref={localRef}>
				<Modal
					onClose={closeBuyToken}
					open={openModalVal}
					sx={{
						".css-pjyw4r": {
							paddingLeft: "18px",
							paddingRight: "0px",
							zIndex: "62",
						},
						zIndex: "62",
					}}
				>
					<Box
						className={styles.Content}
						sx={{ ...ModolWalletStyle, outline: "none" }}
					>
						<div className={styles.header}>
							<span>Top-up FOMO Points</span>
							<div>
								<CloseIcon
									sx={{ color: "rgba(255,255,255,0.45)", cursor: "pointer" }}
									onClick={closeBuyToken}
								></CloseIcon>
							</div>
						</div>
						<div className={styles.main}>
							<div className={styles.balances}>
								balances: {formatAmountByUnit(userBalance)} ICP
							</div>
							<div className={styles.inputInfo}>
								<InputBase
									// value="No file chosen"
									style={{ color: "#9EBADF", width: "100%" }}
									placeholder="0.0"
									value={inputValue}
									onChange={(e) => inputAmountChange(e)}
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
											<img
												src={wellToken}
												style={{
													cursor: "pointer",
													width: "30px",
													marginLeft: "10px",
												}}
											></img>
											<span style={{ marginLeft: "5px", fontSize: "16px" }}>
												FOMO
											</span>
										</InputAdornment>
									}
									className={styles.inputCoin}
								></InputBase>
							</div>
							<div className={styles.TypeTag}>
								<div
									className={styles.TypeTagItem}
									onClick={() => selectHandle("custom value")}
								>
									custom value
								</div>
								<div
									className={styles.TypeTagItem}
									onClick={() => selectHandle("10")}
								>
									10 FOMO
								</div>
								<div
									className={styles.TypeTagItem}
									onClick={() => selectHandle("20")}
								>
									20 FOMO
								</div>
								<div
									className={styles.TypeTagItem}
									onClick={() => selectHandle("50")}
								>
									50 FOMO
								</div>
							</div>
							<LoadingButton
								id="openbuyLoding"
								loading={openbuyLoding}
								className={styles.openbuyLoding}
								sx={{
									color: isshow ? "#eef7ff" : "#fff",
									backgroundImage: isshow
										? "linear-gradient(235deg, #4c516c 0%, #4e5082 100%)"
										: "linear-gradient(270deg, #A25FFF 0%, #6931FF 100%)",
									pointerEvents: isshow ? "none" : "",
								}}
								onClick={btnBuyToken}
							>
								<div style={{ display: isshow ? "none" : "" }}>Confirm</div>
								<div
									style={{
										fontSize: isshow ? 14 : 14,
										fontWeight: isshow ? "normal" : "normal",
									}}
								>
									{btnfomoText}
								</div>
							</LoadingButton>
						</div>
					</Box>
				</Modal>
				<Modal
					open={openStep}
					onClose={handleCloseStep}
					style={{ borderColor: "#262939", zIndex: "70" }}
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
									Buy points in progress
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
												// <img style={{ height: '20px' }} src={pending} />
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
										Approve ICP
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
												<img src={pending} style={{ height: "20px" }}></img>
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
										Buy Points
									</div>
								</div>
							</div>
						</Box>
					</Fade>
				</Modal>
				<SnackbarProgress
					ref={snackbarRef}
					onViewProgress={handleViewProgress}
				></SnackbarProgress>
			</div>
		);
	}),
);
export default BuyTokenModal;
