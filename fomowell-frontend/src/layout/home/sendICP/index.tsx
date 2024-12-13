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
import { icrc1_decimals, icrc1balance } from "@/api/icrc2_ledger";
import appStore, { seticpaccount } from "@/store/app";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { TransferArgs, TransferFee } from "@/canisters/ledger/ledger.did";
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
		openModal: () => void;
	}>;
}

//  ref
interface BuyTokenModalRef {
	openModal: () => void;
}
const sentIcp: React.FC<BuyTokenModalProps> = observer(
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
		const [feeVal, setfeeVal] = React.useState<TransferFee>({
			transfer_fee: { e8s: BigInt(10000) },
		});
		const [decimal, setdecimal] = React.useState(8);
		const [openRightBox, setopenRightBox] = React.useState(false);
		useImperativeHandle(ref, () => ({
			openModal: () => {
				//
				if (!curicpBalance) {
					icrc1balanceReq();
				}
				//
				init();
				setopenModal(true);
			},
		}));
		const init = async () => {
			const fee = await transfer_fee([{}]);
			let decimal = (await decimals()).decimals;
			setdecimal(decimal);
			setfeeVal(fee);
		};
		const handleadsenticp = () => {
			setopenModal(false);
			setamount(0);
		};
		const btnseticp = async () => {
			if (!toamount) {
				return;
			}
			let to_address: number[] = [];
			if (isValidAccountId(toamount.toString())) {
				to_address = AccountIdentifier.fromHex(toamount.toString()).toNumbers();
			} else if (isValidPrincipal(toamount.toString())) {
				to_address = AccountIdentifier.fromPrincipal({
					principal: Principal.fromText(toamount.toString()),
				}).toNumbers();
			} else {
				throw new Error("Invalid ICP Address!");
			}
			setopenbuyAmountLoding(true);
			const transferAmount = multiplyAndConvertToBigInt(amount, decimal);
			const params: TransferArgs = {
				to: to_address,
				fee: feeVal.transfer_fee,
				memo: BigInt(0),
				from_subaccount: [],
				created_at_time: [],
				amount: { e8s: BigInt(transferAmount) },
			};
			setopenRightBox(true);
			console.log(params.to.toString(), isValidAccountId(toamount.toString()));
			try {
				const result = await transfer([params]);
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
					//   if ('TxTooOld' in error) {
					//     Message.error(
					//       `Transfer failed: Transaction too old. Allowed window nanos: ${error.TxTooOld.allowed_window_nanos}`,
					//     );
					//   } else if ('BadFee' in error) {
					//     Message.error(`Transfer failed: Bad fee. Expected fee: ${error.BadFee.expected_fee}`);
					//   } else if ('InsufficientFunds' in error) {
					//     Message.error(`Transfer failed: Insufficient funds. Balance: ${error.InsufficientFunds.balance}`);
					//   } else if ('TxDuplicate' in error) {
					//     Message.error(`Transfer failed: Duplicate transaction. Duplicate of: ${error.TxDuplicate.duplicate_of}`);
					//   } else if ('TxCreatedInFuture' in error) {
					//     Message.error('Transfer failed: Transaction created in the future.');
					//   } else {
					//     Message.error('Transfer failed: Unknown error.');
					//   }
				}
			} catch (err) {
				console.log(err);
				Message.error("Transfer failed");
				setopenbuyAmountLoding(false);
				setopenRightBox(false);
			}
		};
		const icrc1balanceReq = async () => {
			const balance = await account_balance([
				{
					account: AccountIdentifier.fromHex(
						appStore.accountId.toString(),
					).toNumbers(),
				},
			]);
			//   console.log(balance);
			setcuricpBalance(
				new Big(Number(balance.e8s))
					.div(new Big(10).pow(Number(decimal)))
					.toString(),
			);
		};
		const btnMaxICP = () => {
			// console.log(appStore.icpAccount, divideAndConvertToNumber(feeVal.transfer_fee.e8s, decimal, 18));

			setamount(
				appStore.icpAccount
					? new Big(appStore.icpAccount)
							.minus(
								divideAndConvertToNumber(feeVal.transfer_fee.e8s, decimal, 18),
							)
							.toString()
					: new Big(curicpBalance)
							.minus(
								divideAndConvertToNumber(feeVal.transfer_fee.e8s, decimal, 18),
							)
							.toString(),
			);
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
				if (
					!(
						isValidAccountId(toamount.toString()) ||
						isValidPrincipal(toamount.toString())
					)
				) {
					setisshow(true);
					setbtnfomoText("Invalid ICP Address");
				}
			} else {
				setisshow(true);
				if (!amount && amount == 0) {
					setbtnfomoText("Enter ICP amount");
				} else {
					setbtnfomoText("Enter the account Id or principal ID");
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
							<div className={styles.header}>SEND ICP</div>
							<div className={styles.balanceInfo}>
								<div>
									Transfer Fee:
									<span className={styles.MaxICPorBalance}>
										{divideAndConvertToNumber(
											feeVal.transfer_fee.e8s,
											decimal,
											18,
										)}{" "}
										ICP
									</span>
								</div>
								<div>
									Balance:
									{formatAmountByUnit(
										appStore.icpAccount
											? appStore.icpAccount
											: curicpBalance?.toString(),
									)}
									<span className={styles.MaxICPorBalance} onClick={btnMaxICP}>
										Max
									</span>
								</div>
							</div>
							<div className={styles.amountInput}>
								<InputLabel className={styles.icpamount}>Amount</InputLabel>
								<InputBase
									className={styles.amount}
									placeholder="Enter ICP amount"
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
									placeholder="Enter the account Id or principal ID"
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

export default sentIcp;
