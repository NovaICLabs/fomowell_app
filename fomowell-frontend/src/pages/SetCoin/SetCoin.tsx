import {
	Box,
	InputBase,
	InputLabel,
	Button,
	InputAdornment,
	Modal,
	Input,
	IconButton,
	Hidden,
	CircularProgress,
	Fade,
	Typography,
	FormHelperText,
	Checkbox,
	FormGroup,
	FormControlLabel,
} from "@mui/material";
import styles from "./index.module.less";
import chooseFile from "@/assets/home/ChooseFile.png";
import arrowUp from "@/assets/home/arrowup.png";
import { Radio, RadioGroup, Tooltip } from "@mui/material"; 
import React, {
	ChangeEvent,
	ChangeEventHandler,
	useEffect,
	useState,
} from "react";
import { FomoProjectCreate } from "@/canisters/fomowell_launcher/fomowell_launcher.did";
import appStore from "@/store/app";
// import { connectWebSocket, transferToNumber } from '@/utils/common';
import { createFomo } from "@/api/fomowell_launcher";
import CheckIcon from "@mui/icons-material/Check";
import tokenStore from "@/store/token";
import {
	canisterId as icrc2CanisterId,
	idlFactory as icrc2IdlFactory,
} from "@/canisters/icrc2_ledger";
import { Principal } from "@dfinity/principal";
import { artemisWalletAdapter } from "@/utils/wallet/connect";
import { BatchTransact } from "artemis-web3-adapter";
import { messageInfo } from "@/utils/appType";
import { observe } from "mobx";
import success from "@/assets/icpInfo/success.png";
import pending from "@/assets/icpInfo/pending.png";
import CloseIcon from "@mui/icons-material/Close";
import Message from "@/components/Snackbar/message";
import { QeqImg } from "@/api/img_request";
import { isValidHttpUrl } from "@/utils/httpValid";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { LoadingButton } from "@mui/lab";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CryptoJS from "crypto-js";
import md5 from "md5";
import { formatAmountByUnit } from "@/utils/common";
import Big from "big.js";
interface UserInfoProps {
	//message under components/Snackbar is no longer used
	onRouteChange: (Params: messageInfo) => void;
	onWellModal: (Param: Boolean) => void;
	openSelectWell: Boolean;
}
const SetCoin: React.FC<UserInfoProps> = observer((props) => {
	const navigate = useNavigate();
	const [isShowmore, setIsShowmore] = React.useState("none");
	const [openRightBox, setopenRightBox] = React.useState(false);
	const closeRightBox = () => {
		setopenRightBox(false);
	};
	const BtnShowMore = () => {
		isShowmore == "none" ? setIsShowmore("") : setIsShowmore("none");
	};
	const [ImgFile, setImgFile] = React.useState<File>();
	const [EditImg, setEditImg] = React.useState("");
	const [fileName, setFileName] = React.useState("No file chosen");
	let curSelectImgDd5 = "";
	const BtnUpPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
		let filePath = "";
		const formData = new FormData();
		formData.append("file", e.target.files[0]);
		reader.readAsDataURL(e.target.files[0]);
		// getimgmd5(e)
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
				canvas.width = 80;
				canvas.height = 80;
				ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
				// Convert to base64 quality to image compression quality. The smaller the value between 0 and 1, the larger the compression, the poorer the image quality
				data = canvas.toDataURL(e.target.files[0].type, 0.3);
				setFomoParms({ ...FomoParms, logo: data, img_url: data });
				setFileName(e.target?.files[0].name);
				setEditImg(data);
			};
		};
		setImgFile(e.target.files[0]);
		return () => {};
	};
	const getimgmd5 = (file: any) => {
		let reader: any = new FileReader();
		reader.readAsArrayBuffer(file.target.files[0]);
		reader.onload = function () {
			let u8Arr = new Uint8Array(this.result);
			curSelectImgDd5 = md5(u8Arr);
			// console.log(md5(u8Arr))
		};
	};
	const [FomoParms, setFomoParms] = React.useState<FomoProjectCreate>({
		dogmi_dao_lock: [],
		sneed_dao_lock: [],
		name: "",
		ticker: "",
		img_url: "",
		logo: "",
		description: "",
		twitter_link: "",
		telegram_link: "",
		website: "",
	});
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
	const [openStep, setOpenStep] = React.useState(false);
	const [isStepApprove, setIsStepApprove] = React.useState(true);
	const [isStepCreateFomo, setIsStepCreateFomo] = React.useState(false);
	const [StepApproveSuccess, setStepApproveSuccess] = React.useState(false);
	const [StepCreateFomoSuccess, setStepCreateFomoSuccess] =
		React.useState(false);
	const handleCloseStep = () => {
		setOpenStep(false);
	};
	const requiredInfo: (keyof FomoProjectCreate)[] = [
		"name",
		"ticker",
		"img_url",
		"description",
	];
	const VaildParams: (keyof FomoProjectCreate)[] = [
		"twitter_link",
		"telegram_link",
		"website",
	];
	const [userId, setUserId] = React.useState<string>(appStore.userId);
	const btnFomo = async (e: React.FormEvent) => {
		// console.log(e);
		for (let key of VaildParams) {
			if (FomoParms[key] && !isValidHttpUrl(FomoParms[key] as any)) {
				Message.error(`Please enter the correct ${key}`);
				return;
			}
		}
		try {
			setInitialized(true);
			for (let key of requiredInfo) {
				if (!FomoParms[key]) {
					if (key == "img_url") {
						Message.error(`Please enter your fomo image`);
					} else {
						Message.error(`Please enter your fomo ${key}`);
					}
					return;
				}
			}
			if (lockeChecked) {
				if (Number(lockedVal) < 10 || Number(lockedVal) > 50) {
					Message.error("The input range should be 10%-50%");
					return;
				}
			} else {
				setFomoParms({ ...FomoParms, sneed_dao_lock: [] });
			}
			setOpenStep(true);
			if (appStore.userId) {
				stepApprove();
			} else {
				props.onWellModal(true);
				const IntervalUser = setInterval(() => {
					if (appStore.userId) {
						stepApprove();
						clearInterval(IntervalUser);
					}
				}, 500);
			}
		} catch (error) {
			Message.error("Upload failure");
		}
	};
	const [initialized, setInitialized] = React.useState(false);
	// useEffect(() => {
	//   if (initialized && FomoParms?.img_url) {
	//   }
	// }, [FomoParms?.img_url, initialized]);
	const stepApprove = () => {
		console.log(lockeChecked, FomoParms);
		setopenRightBox(true);
		const amount = Math.ceil(Number(tokenStore.dollar2ICP) * 1.3 * 6 * 10 ** 8);
		new BatchTransact(
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
					onSuccess: async () => {
						try {
							setIsStepApprove(false);
							setStepApproveSuccess(true);
							setopenRightBox(true);
							try {
								const res = await QeqImg(ImgFile!);
								setFomoParms((prev) => {
									return { ...prev, img_url: res.reference };
								});
								StepCreateFomo(res.reference);
							} catch (err) {
								console.log(err);
								Message.error("Image upload error");
								setOpenStep(false);
								setIsStepApprove(true);
								setIsStepCreateFomo(false);
								setStepApproveSuccess(false);
								setopenRightBox(false);
							}
						} catch (err: any) {
							console.log(err);
							Message.error("Create fomo failed");
							setopenRightBox(false);
							setTimeout(() => {
								setOpenStep(false);
							}, 800);
						} finally {
						}
					},
					onFail: (err: any) => {
						console.log(err);
						Message.error("Create fomo failed");
						// Message.error(err);
						setopenRightBox(false);
						setTimeout(() => {
							setOpenStep(false);
						}, 800);
					},
				} as any,
			],
			artemisWalletAdapter,
		).execute();
	};
	const StepCreateFomo = async (reference: string) => {
		setIsStepCreateFomo(true);
		try {
			const res = await createFomo(appStore.userId, {
				...FomoParms,
				img_url: reference,
				sneed_dao_lock: lockeChecked ? FomoParms.sneed_dao_lock : [],
			});
			setIsStepCreateFomo(false);
			setStepCreateFomoSuccess(true);
			if ("Err" in res) {
				Message.error(res["Err"]);
				setopenRightBox(false);
				setStepCreateFomoSuccess(false);
				setTimeout(() => {
					setOpenStep(false);
					setIsStepApprove(true);
					setIsStepCreateFomo(false);
					setStepApproveSuccess(false);
				}, 800);
			} else {
				Message.success("Create fomo success!");
				setopenRightBox(false);
				setTimeout(() => {
					navigate(`/${res["Ok"].fomo_pid.toString()}`);
				}, 3000);
				setTimeout(() => {
					setStepCreateFomoSuccess(false);
					setOpenStep(false);
					setIsStepApprove(true);
					setIsStepCreateFomo(false);
					setStepApproveSuccess(false);
				}, 800);
			}
		} catch (e) {
			console.log(e);
			Message.error("Create fomo failed");
			setopenRightBox(false);
			setStepCreateFomoSuccess(false);
			setTimeout(() => {
				setOpenStep(false);
				setIsStepApprove(true);
				setIsStepCreateFomo(false);
				setStepApproveSuccess(false);
			}, 800);
		}
	};
	const onBtnCloseStep = () => {
		setOpenStep(false);
	};
	const [lockedVal, setlockedVal] = useState("10");
	const [lockeChecked, setlockeChecked] = useState(false);
	const [lockedValRang, setlockedValRang] = useState(true);
	const CheckboxChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		checked: boolean,
	) => {
		setlockeChecked(checked);
		if (checked && lockedVal) {
			setFomoParms({
				...FomoParms,
				sneed_dao_lock: [
					BigInt(new Big(lockedVal).times(new Big("1e18")).div(100).toNumber()),
				],
			});
		} else {
			setFomoParms({ ...FomoParms, sneed_dao_lock: [] });
		}
	};
	const changelockedVal = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value = e.target.value;
		setlockedVal(value);
		if (value) {
			if (Number(value) < 10 || Number(value) > 50) {
				setlockedValRang(() => false);
			} else {
				setlockedValRang(() => true);
			}
		} else {
			if (lockeChecked) {
				setlockedValRang(() => false);
			} else {
				setlockedValRang(() => true);
			}
		}

		if (lockeChecked) {
			setFomoParms({
				...FomoParms,
				sneed_dao_lock: [
					BigInt(
						new Big(value ? value : 0)
							.times(new Big("1e18"))
							.div(100)
							.toNumber(),
					),
				],
			});
		} else {
			setFomoParms({ ...FomoParms, sneed_dao_lock: [] });
		}
	};
	const label = { inputProps: { "aria-label": "Checkbox demo" } };
	useEffect(() => {
		// connectWebSocket();
		const observer = (newUserId: string) => {
			setUserId(newUserId); // When the userId changes, update the local userId
		};
		// Add an observer when a component is mounted
		appStore.addObserver(observer);
		// Removes the observer when the component is unloaded
		return () => {
			appStore.removeObserver(observer);
		};
	}, []);
	return (
		<div>
			<Box className={styles.CoinFrom}>
				{/* <form onSubmit={btnFomo}> */}
				<div
					style={{ color: "#fff", cursor: "pointer", paddingTop: "10px" }}
					onClick={(e) => {
						e.stopPropagation();
						if (window.history.length > 1) {
							navigate(-1);
						} else {
							navigate("/dashboard");
						}
					}}
				>
					[ go back ]
				</div>
				<form>
					<div className={styles.CoinName}>
						<InputLabel required className={styles.LabelCom}>
							name
						</InputLabel>
						<InputBase
							className={styles.inputCoin}
							onChange={(e) =>
								setFomoParms({ ...FomoParms, name: e.target.value })
							}
							// required
						></InputBase>
						{/* {FomoParms.name == '' && <FormHelperText error>Please enter your first name</FormHelperText>} */}
					</div>
					<div className={styles.CoinTicker}>
						<InputLabel required className={styles.LabelCom}>
							ticker
						</InputLabel>
						<InputBase
							className={styles.inputCoin}
							onChange={(e) =>
								setFomoParms({ ...FomoParms, ticker: e.target.value })
							}
							// required
						></InputBase>
					</div>
					<div className={styles.CoinDescription}>
						<InputLabel required className={styles.LabelCom}>
							description
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
								setFomoParms({ ...FomoParms, description: e.target.value })
							}
							// required
						></InputBase>
					</div>
					<div className={styles.CoinTicker}>
						<InputLabel required className={styles.LabelCom}>
							image
						</InputLabel>
						<InputBase
							value={fileName}
							required
							style={{ color: "#9EBADF" }}
							onChange={(e) =>
								setFomoParms({ ...FomoParms, img_url: e.target.value })
							}
							sx={{
								".MuiInputBase-inputAdornedStart": {
									aspectRatio: "0",
								},
							}}
							startAdornment={
								<label
									htmlFor="icon-button-file-SetCoin"
									className={styles.UploadBtn}
								>
									<Input
										// accept="image/*"
										id="icon-button-file-SetCoin"
										type="file"
										style={{ display: "none", height: "48px" }}
										onChange={BtnUpPhoto}
									/>
									<IconButton
										color="primary"
										aria-label="upload picture"
										component="div"
										style={{ aspectRatio: "0" }}
									>
										<img src={chooseFile} style={{ cursor: "pointer" }}></img>
									</IconButton>
								</label>
								// <Input position="start" accept="image/*" onChange={BtnPhoto} type="file">
								//   <img src={chooseFile} style={{ cursor: 'pointer' }}></img>
								// </Input>
							}
							className={styles.inputCoin}
						></InputBase>
                    </div>
                    <div className={styles.LabelCom} style={{marginTop: '20px'}}>Launch on Dex *</div>
                    <RadioGroup
                        defaultValue="icpex"
                        row
                        sx={{
                            display: 'flex',
                            gap: '20px',
                            '.MuiFormControlLabel-label': {
                                color: '#fff'
                            }
                        }}
                    >
                        <FormControlLabel 
                            value="icpex" 
                            control={
                                <Radio 
                                    sx={{
                                        color: '#fff',
                                        '&.Mui-checked': {
                                            color: '#fff',
                                        },
                                    }}
                                />
                            } 
                            label="ICPEX" 
                            sx={{
                                '.MuiFormControlLabel-label': {
                                    color: '#fff'
                                }
                            }}
                        />
                        <Tooltip 
                            title="Coming soon" 
                            placement="top"
                            PopperProps={{
                                modifiers: [
                                    {
                                        name: 'offset',
                                        options: {
                                            offset: [10, -20],
                                        },
                                    },
                                ],
                            }}
                        >
                            <FormControlLabel 
                                value="kongswap" 
                                disabled
                                control={
                                    <Radio 
                                        sx={{
                                            color: '#fff !important',
                                            '&.Mui-disabled': {
                                                color: '#fff !important',
                                            },
                                        }}
                                    />
                                } 
                                label="KONGSWAP" 
                                sx={{
                                    '.MuiFormControlLabel-label': {
                                        color: '#fff !important'
                                    }
                                }}
                            />
                        </Tooltip>
                        <Tooltip 
                            title="Coming soon" 
                            placement="top"
                            PopperProps={{
                                modifiers: [
                                    {
                                        name: 'offset',
                                        options: {
                                            offset: [10, -20],
                                        },
                                    },
                                ],
                            }}
                        >
                            <FormControlLabel 
                                value="icpswap" 
                                disabled
                                control={
                                    <Radio 
                                        sx={{
                                            color: '#fff !important',
                                            '&.Mui-disabled': {
                                                color: '#fff !important',
                                            },
                                        }}
                                    />
                                } 
                                label="ICPSWAP" 
                                sx={{
                                    '.MuiFormControlLabel-label': {
                                        color: '#fff !important'
                                    }
                                }}
                            />
                        </Tooltip>
                        <Tooltip 
                            title="Coming soon" 
                            placement="top"
                            PopperProps={{
                                modifiers: [
                                    {
                                        name: 'offset',
                                        options: {
                                            offset: [10, -20],
                                        },
                                    },
                                ],
                            }}
                        >
                            <FormControlLabel 
                                value="sonic" 
                                disabled
                                control={
                                    <Radio 
                                        sx={{
                                            color: '#fff !important',
                                            '&.Mui-disabled': {
                                                color: '#fff !important',
                                            },
                                        }}
                                    />
                                } 
                                label="SONIC" 
                                sx={{
                                    '.MuiFormControlLabel-label': {
                                        color: '#fff !important'
                                    }
                                }}
                            />
                        </Tooltip>
                    </RadioGroup>
					<div className={styles.locked}>
						<div className={styles.LabelCom}>DAO-locked LP settings</div>
						<div className={styles.optionGroup}>
							<FormControlLabel
								control={
									<Checkbox
										sx={{
											"&.MuiCheckbox-root": {
												color: "white",
											},
											"&.Mui-checked": {
												color: "rgb(25, 118, 210)", //
											},
											"&.MuiCheckbox-root:hover": {
												backgroundColor: "transparent",
											},
											"&.MuiCheckbox-root.Mui-checked:hover": {
												backgroundColor: "transparent",
											},
										}}
										value={lockeChecked}
										onChange={CheckboxChange}
									/>
								}
								label="Sneed DAO"
								sx={{
									".MuiFormControlLabel-label": {
										color: "#fff",
									},
								}}
							/>
							<InputBase
								value={lockedVal}
								className={styles.lockedVal}
								sx={{
									border: lockedValRang ? "" : "2px solid red",
									display: lockeChecked ? "" : "none",
								}}
								endAdornment={
									<div style={{ color: "#fff", marginLeft: "3px" }}>%</div>
								}
								onChange={(e) => changelockedVal(e)}
								// required
							></InputBase>
						</div>
						<div
							className={styles.lockedDesc}
							style={{ display: lockeChecked ? "" : "none" }}
						>
							To ensure LP management is both decentralized and decision-making,
							you can choose to lock 10%-50% of the LP into Sneed DAO, with the
							remaining portion locked into the black hole account (aaaaa-aa).
						</div>
					</div>
					<div className={styles.ShowMore} onClick={BtnShowMore}>
						{isShowmore ? "Show" : "Hide"} more options
						<img
							className={styles.arrow}
							src={arrowUp}
							style={{
								rotate: isShowmore == "none" ? "0deg" : "-180deg",
								translate: isShowmore == "none" ? "0px" : "10px 10px",
							}}
						></img>
					</div>
					<div className={styles.showmoreFrom} style={{ display: isShowmore }}>
						<div className={styles.twitterLink}>
							<InputLabel className={styles.LabelCom}>twitter link</InputLabel>
							<InputBase
								className={styles.inputCoin}
								type="url"
								placeholder="(optional)"
								onChange={(e) =>
									setFomoParms({ ...FomoParms, twitter_link: e.target.value })
								}
							></InputBase>
						</div>
						<div className={styles.telegramLink}>
							<InputLabel className={styles.LabelCom}>telegram link</InputLabel>
							<InputBase
								className={styles.inputCoin}
								placeholder="(optional)"
								onChange={(e) =>
									setFomoParms({ ...FomoParms, telegram_link: e.target.value })
								}
							></InputBase>
						</div>
						<div className={styles.website}>
							<InputLabel className={styles.LabelCom}>website</InputLabel>
							<InputBase
								className={styles.inputCoin}
								placeholder="(optional)"
								onChange={(e) =>
									setFomoParms({ ...FomoParms, website: e.target.value })
								}
							></InputBase>
						</div>
					</div>
					{/* <Button type="submit" className={styles.CreateFomo} variant="contained"> */}
					<LoadingButton
						id="CreateFomo"
						loading={openRightBox}
						className={styles.CreateFomo}
						sx={{ color: "#fff" }}
						onClick={btnFomo}
					>
						<div className={styles.top}>
							{userId ? "Create Fomo" : "Connect Wallet"}
						</div>
						<div className={styles.buttom}>
							{userId
								? `Service Fees: ≈ ${formatAmountByUnit(Number(tokenStore.dollar2ICP) * 6)} ICP`
								: ""}
						</div>
					</LoadingButton>
				</form>
				{/* </Button> */}
				{/* <div className={styles.CreateFomo} onClick={btnFomo}>
            <div className={styles.top}>Create Fomo</div>
            <div className={styles.buttom}>Service Fees:0.0121 ICP</div>
          </div> */}
				{/* </form> */}
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
									Create fomo in progress
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
										Create Fomo
									</div>
								</div>
							</div>
						</Box>
					</Fade>
				</Modal>
			</Box>
			<div
				style={{
					position: "fixed",
					top: "120px",
					right: "10px",
					display: openRightBox ? "" : "none",
				}}
			>
				<div
					onClick={closeRightBox}
					style={{ position: "absolute", right: "10px", top: "5px" }}
				>
					<CloseIcon sx={{ color: "#fff", cursor: "pointer" }}></CloseIcon>
				</div>
				<div
					style={{
						padding: "10px 10px 10px 10px",
						backgroundColor: "#1f2946",
						minWidth: "240px",
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
							marginRight: "25px",
							maxWidth: "320px",
						}}
					>
						<div style={{ color: "#fff" }}>Create fomo {FomoParms.ticker}</div>
						<div
							style={{ color: "#5f56bf", cursor: "pointer" }}
							onClick={() => setOpenStep(true)}
						>
							View progress
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});

export default SetCoin;
