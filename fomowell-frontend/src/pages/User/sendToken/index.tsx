import React, {
	ChangeEventHandler,
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import styles from "./index.module.less";
import { Principal } from "@dfinity/principal";
import {
	Box,
	InputAdornment,
	InputBase,
	InputLabel,
	Modal,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
	divideAndConvertToNumber,
	formatAmountByUnit,
	isValidAccountId,
	isValidPrincipal,
	multiplyAndConvertToBigInt,
} from "@/utils/common";
import Big from "big.js";
import { LoadingButton } from "@mui/lab";
import { observer } from "mobx-react-lite";
import {
	icrc1_decimals,
	icrc1_decimals_token,
	icrc1_fee,
	icrc1_transfer,
	icrc1balance,
} from "@/api/icrc2_ledger";
import appStore, { seticpaccount } from "@/store/app";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import {
	account_balance,
	decimals,
	transfer,
	transfer_fee,
} from "@/api/ledger";
import Message from "@/components/Snackbar/message";
import SnackbarProgress, {
	SnackbarModalHandles,
} from "@/components/SnackbarProgress/SnackbarProgress";
import { amountItem, amountType } from "@/api/getCoinCreateOrHold";
import { TransferArg } from "@/canisters/icrc2_ledger/icrc2_ledger.did";
const addseticpModalStyles = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	backgroundColor: "#333744",
	borderRadius: "8px",
	width: "350px",
	padding: "20px",
	outline: "none",
};
//  BuyTokenModal  props
interface BuyTokenModalProps {
	onopen: boolean;
	ref: React.RefObject<{
		openModal: (baseInfo: amountItem) => void;
	}>;
}

//  ref
interface BuyTokenModalRef {
	openModal: (baseInfo: amountItem) => void;
}
const sentToken: React.FC<BuyTokenModalProps> = observer(
	forwardRef<BuyTokenModalRef, BuyTokenModalProps>(({ onopen }, ref) => {
		const [openModalVal, setopenModal] = React.useState(false);
		const [amount, setamount] = React.useState<string | number>("");
		const [openbuyAmountLoding, setopenbuyAmountLoding] = React.useState(false);
		const [isshow, setisshow] = React.useState(true);
		const [btnfomoText, setbtnfomoText] = React.useState("Enter ICP amount");
		const [toamount, settoamount] = React.useState<string>();
		const [curicpBalance, setcuricpBalance] = React.useState<number | string>(
			"",
		);
		const [feeVal, setfeeVal] = React.useState<number>(0);
		const [ConvertFee, setConvertFee] = React.useState<number>(0);
		const [decimal, setdecimal] = React.useState(8);
		const [openRightBox, setopenRightBox] = React.useState(false);
		const [baseInfo, setbaseInfo] = React.useState<amountItem>();
		useImperativeHandle(ref, () => ({
			openModal: (baseInfo: amountItem) => {
				setcuricpBalance(baseInfo.balance);
				setbaseInfo(baseInfo);
				init(baseInfo);
				setopenModal(true);
			},
		}));
		const init = async (baseInfo: amountItem) => {
			// const result = await getToken(Principal.fromText(baseInfo.tokenid))
			const fee = await icrc1_fee(baseInfo.tokenid);
			// console.log(fee);

			const decimals = await icrc1_decimals_token(baseInfo.tokenid);
			// console.log(result);
			const transferFee = divideAndConvertToNumber(fee, decimal, 18);
			setdecimal(Number(decimals));
			setConvertFee(transferFee);
			setfeeVal(Number(fee));
		};
		const handleadsenticp = () => {
			setopenModal(false);
			setamount(0);
		};
		const btnseticp = async () => {
			if (!toamount) {
				return;
			}
			let to_address: Principal;
			if (isValidPrincipal(toamount.toString())) {
				to_address = Principal.fromText(toamount.toString());
			} else {
				throw new Error("Invalid ICP Address!");
			}
			setopenbuyAmountLoding(true);
			const transferAmount = multiplyAndConvertToBigInt(amount, decimal);
			const params: TransferArg = {
				to: {
					owner: to_address,
					subaccount: [],
				},
				fee: [BigInt(feeVal)],
				memo: [],
				from_subaccount: [],
				created_at_time: [],
				amount: BigInt(transferAmount),
			};
			setopenRightBox(true);
			console.log(params.to.toString(), isValidAccountId(toamount.toString()));
			try {
				const result = await icrc1_transfer(baseInfo!.tokenid, params);
				if ("Ok" in result) {
					Message.success("Transfer successful!");
					setopenbuyAmountLoding(false);
					setopenModal(false);
					setopenRightBox(false);
					const balance = await account_balance([
						{
							account: AccountIdentifier.fromHex(
								appStore.accountId.toString(),
							).toNumbers(),
						},
					]);
					seticpaccount(
						new Big(Number(balance.e8s.toString()))
							.div(new Big(10).pow(Number(decimal)))
							.toString(),
					);
				} else {
					const error = result.Err;
					console.log(error);
					Message.error("Transfer failed");
					setopenbuyAmountLoding(false);
					setopenRightBox(false);
				}
			} catch (err) {
				console.log(err);
				Message.error("Transfer failed");
				setopenbuyAmountLoding(false);
				setopenRightBox(false);
			}
		};
		const btnMaxICP = () => {
			// console.log(appStore.icpAccount, divideAndConvertToNumber(feeVal.transfer_fee.e8s, decimal, 18));
			setamount(new Big(baseInfo!.balance).minus(ConvertFee).toString());
		};
		const inputamountchange = (
			e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
		) => {
			if (
				typeof Number(e.target.value) == "number" &&
				!isNaN(Number(e.target.value))
			) {
				setamount(e.target.value);
			} else {
				// props.onRouteChange({ type: 'error', content: 'The entered value is incorrect' });
				Message.error("The entered value is incorrect");
			}
			console.log(e);
		};
		const snackbarRef = useRef<SnackbarModalHandles>(null);
		const handleButtonClick = (RightBox: boolean) => {
			if (snackbarRef.current) {
				snackbarRef.current.openSnackbar("ICP transfer in progress", RightBox);
				snackbarRef.current.setViewProgress(true);
			}
		};
		const handleViewProgress = () => {
			console.log("");
		};
		useEffect(() => {
			handleButtonClick(openRightBox);
		}, [openRightBox]);
		useEffect(() => {
			if (amount && amount != 0 && toamount && toamount != "") {
				setisshow(false);
				if (new Big(amount).gt(new Big(curicpBalance))) {
					setisshow(true);
					setbtnfomoText("Insufficient balance");
				}
				if (!isValidPrincipal(toamount.toString())) {
					setisshow(true);
					setbtnfomoText("Invalid ICP Address");
				}
			} else {
				setisshow(true);
				if (!amount && amount == 0) {
					setbtnfomoText(`Enter ${baseInfo?.symbol} amount`);
				} else {
					setbtnfomoText("Enter the principal ID");
				}
			}
		}, [amount, toamount]);
		return (
			<div>
				<Modal
					className={styles.sendicpModal}
					open={openModalVal}
					onClose={handleadsenticp}
					style={{ borderColor: "#262939" }}
				>
					<Box
						sx={{
							...addseticpModalStyles,
						}}
					>
						<div className={styles.sendicp}>
							<div onClick={handleadsenticp}>
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
							<div className={styles.header}>Transfer Token</div>
							<div className={styles.balanceInfo}>
								<div>
									<div className={styles.TransferFee}>
										Transfer Fee:
										<span className={styles.MaxICPorBalance}>
											{ConvertFee} {baseInfo?.symbol}
										</span>
									</div>
								</div>
								<div>
									Balance:{formatAmountByUnit(baseInfo?.balance)}
									<span className={styles.MaxICPorBalance} onClick={btnMaxICP}>
										Max
									</span>
								</div>
							</div>
							<div className={styles.amountInput}>
								<InputLabel className={styles.icpamount}>Amount</InputLabel>
								<InputBase
									className={styles.amount}
									placeholder={`Enter ${baseInfo?.symbol} amount`}
									value={amount}
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
							<div className={styles.amountInput}>
								<InputLabel className={styles.icpamount}>To</InputLabel>
								<InputBase
									className={styles.amount}
									placeholder="Enter the principal ID"
									sx={{
										".css-3b6ca1-MuiInputBase-input": {
											border: "1px soild red",
										},
									}}
									// onChange={(e) => setamount(new Big(e.target.value).times(Math.pow(10, cyclesdecimals!)).toFixed(0, 0))}
									onChange={(e) => settoamount(e.target.value)}
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
								onClick={btnseticp}
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
				<SnackbarProgress
					ref={snackbarRef}
					onViewProgress={handleViewProgress}
				></SnackbarProgress>
			</div>
		);
	}),
);

export default sentToken;
