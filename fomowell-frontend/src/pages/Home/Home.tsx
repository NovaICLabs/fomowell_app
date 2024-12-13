import React, { useEffect } from "react";
import {
	Card,
	CardContent,
	Paper,
	IconButton,
	InputBase,
	FormControl,
	Select,
	MenuItem,
	Skeleton,
	Button,
	Stack,
	Pagination,
	PaginationItem,
	SelectChangeEvent,
	InputBaseProps,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import styles from "./index.module.less";
import UserIcon from "@/assets/home/UserIcon.png";
import X from "@/assets/home/X.png";
import buy from "@/assets/home/headerBuy.png";
import link from "@/assets/home/BtmLink.png";
import champion from "@/assets/home/champion1.gif";
import {
	getFomoUserInfo,
	get_fomo_by_fomo_idx,
	get_fomo_by_index,
	get_fomo_context,
	get_god_of_wells,
	search_fomos,
	getBaseUserInfo,
} from "@/api/fomowell_launcher";
import {
	Context,
	FomoProject,
	FomoProjectVo,
	SearchParam,
	UserProfile,
} from "@/canisters/fomowell_launcher/fomowell_launcher.did";
import { Principal } from "@dfinity/principal";
import appStore from "@/store/app";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { get_comments_len } from "@/api/fomowell_project";
import { messageInfo } from "@/utils/appType";
import { Height } from "@mui/icons-material";
import Message from "@/components/Snackbar/message";
import { getImgUrl } from "@/utils/getImgUrl";
import { formatAmountByUnit } from "@/utils/common";
import god_img from "@/assets/home/GODOFWELLS.png";
import dayjs from "dayjs";
import Big from "big.js";
import { StyledComponent } from "@emotion/styled";
import ICPEx from "@/assets/ICPEx.png";
import sneed from "@/assets/SNEED.png";
import { cycles as fomowell_project_cycles } from "@/api/fomowell_project";
import lowBatteryimg from "@/assets/icpInfo/low gas.png";
interface UserInfoProps {
	//message under components/Snackbar is no longer used
	onMessageModal: (Params: messageInfo) => void;
	onCurBtnFomoInfo: (Params: FomoProject) => void;
}
interface SelectsProps {
	handleSortMenuChange: (event: SelectChangeEvent<string>) => void;
	BootstrapInput: StyledComponent<InputBaseProps, {}, {}>;
	SortMenu: {
		value: string;
		name: string;
	}[];
	handleOrderMenuChange: (event: SelectChangeEvent<string>) => void;
	OrderMenu: {
		value: string;
		name: string;
	}[];
}
const Selects = ({
	handleSortMenuChange,
	BootstrapInput,
	SortMenu,
	handleOrderMenuChange,
	OrderMenu,
}: SelectsProps) => {
	const [SortVal, setSortVal] = React.useState("BumpOrder");
	const [OrderVal, setOrderVal] = React.useState("DESC");
	const SelectsMemoSortChange = (e: SelectChangeEvent<string>) => {
		handleSortMenuChange(e);
		setSortVal(e.target.value);
	};
	const SelectsMemoOrderChange = (e: SelectChangeEvent<string>) => {
		handleOrderMenuChange(e);
		setOrderVal(e.target.value);
	};
	return (
		<div className={styles.FilterBoxAll}>
			<FormControl sx={{ m: 1 }}>
				<Select
					className={styles.FilterBox}
					value={SortVal}
					label="SortVal"
					onChange={SelectsMemoSortChange}
					sx={{
						height: "35px",
						".MuiInputBase-input": {
							padding: "8px 10px 8px 10px",
						},
					}}
					input={<BootstrapInput />}
				>
					{SortMenu.map((item) => {
						return (
							<MenuItem key={item.name} value={item.value}>
								{item.name}
							</MenuItem>
						);
					})}
				</Select>
			</FormControl>
			<FormControl sx={{ m: 1 }}>
				<Select
					className={styles.FilterBox}
					value={OrderVal}
					label="OrderVal"
					sx={{
						height: "35px",
						".MuiInputBase-input": {
							padding: "8px 10px 8px 10px",
						},
					}}
					onChange={SelectsMemoOrderChange}
					input={<BootstrapInput />}
				>
					{OrderMenu.map((item) => {
						return (
							<MenuItem key={item.name} value={item.value}>
								{item.name}
							</MenuItem>
						);
					})}
				</Select>
			</FormControl>
		</div>
	);
};
const HOCChild = React.memo(Selects, (pre, next) => {
	return true;
});
const Home = (props: UserInfoProps) => {
	const [SortMenu] = React.useState([
		{
			value: "BumpOrder",
			name: "sort: bump order",
		},
		{
			value: "LastReply",
			name: "sort: last reply",
		},
		{
			value: "ReplyCount",
			name: "sort: reply count",
		},
		{
			value: "MarketCap",
			name: "sort: market cap",
		},
		{
			value: "CreationTime",
			name: "sort: creation time",
		},
	]);
	const [OrderMenu] = React.useState([
		{
			value: "ASC",
			name: "order: asc",
		},
		{
			value: "DESC",
			name: "order: desc",
		},
	]);
	const navigate = useNavigate();
	const [SortVal, setSortVal] = React.useState("BumpOrder");
	const [OrderVal, setOrderVal] = React.useState("DESC");
	const [searchInputVal, setsearchInputVal] = React.useState("");
	const [searchFomosParams, setSearchFomosParams] = React.useState<SearchParam>(
		{
			order: { DESC: null },
			sort: { BumpOrder: null },
			text: "",
			limit: BigInt(6),
			start: BigInt(0),
		},
	);
	const handleSortMenuChange = (event: SelectChangeEvent<string>) => {
		// console.log(event.target.value, 'Sort');
		if (event.target.value == "BumpOrder") {
			setSearchFomosParams({ ...searchFomosParams, sort: { BumpOrder: null } });
		} else if (event.target.value == "LastReply") {
			setSearchFomosParams({ ...searchFomosParams, sort: { LastReply: null } });
		} else if (event.target.value == "ReplyCount") {
			setSearchFomosParams({
				...searchFomosParams,
				sort: { ReplyCount: null },
			});
		} else if (event.target.value == "MarketCap") {
			setSearchFomosParams({ ...searchFomosParams, sort: { MarketCap: null } });
		} else if (event.target.value == "CreationTime") {
			setSearchFomosParams({
				...searchFomosParams,
				sort: { CreationTime: null },
			});
		}
		console.log(searchInputVal);
		setSortVal(event.target.value);
	};
	const handleOrderMenuChange = (event: SelectChangeEvent<string>) => {
		// console.log(event.target.value, 'Order');
		if (event.target.value == "ASC") {
			setSearchFomosParams({ ...searchFomosParams, order: { ASC: null } });
		} else if (event.target.value == "DESC") {
			setSearchFomosParams({ ...searchFomosParams, order: { DESC: null } });
		}
		setOrderVal(event.target.value);
	};
	const returnCurSort = () => {
		if (SortVal == "BumpOrder") {
			return { BumpOrder: null };
		} else if (SortVal == "LastReply") {
			return { LastReply: null };
		} else if (SortVal == "ReplyCount") {
			return { ReplyCount: null };
		} else if (SortVal == "MarketCap") {
			return { MarketCap: null };
		} else if (SortVal == "CreationTime") {
			return { CreationTime: null };
		}
	};
	const returnCurOrder = () => {
		if (OrderVal == "ASC") {
			return { ASC: null };
		} else if (OrderVal == "DESC") {
			return { DESC: null };
		}
	};
	const BootstrapInput = styled(InputBase)(({ theme }) => ({
		"label + &": {
			marginTop: theme.spacing(3),
		},
		"& .MuiInputBase-input": {
			borderRadius: 8,
			position: "relative",
			backgroundColor: "#655EA7",
			border: "1px solid #655EA7",
			fontSize: 16,
			padding: "10px 26px 10px 12px",
			"&:focus": {
				borderRadius: 8,
				borderColor: "",
				boxShadow: "",
			},
		},
		"& .MuiSelect-iconOutlined": {
			color: "#fff",
		},
	}));
	const BtnShowIcpInfo = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>,
		Fomoitem: FomoProject,
	) => {
		e.stopPropagation();
		let curParams: any = {};
		//Handle Fomoitem data because JSON serialization only supports primitive data types
		for (let key in Fomoitem) {
			if (typeof Fomoitem[key as keyof FomoProject] == "bigint") {
				curParams[key] = Number(Fomoitem[key as keyof FomoProject]);
			} else if (Fomoitem[key as keyof FomoProject] instanceof Principal) {
				curParams[key] = Fomoitem[key as keyof FomoProject].toLocaleString();
				// console.log(curParams[key], typeof curParams[key], 111);
			} else {
				curParams[key] = Fomoitem[key as keyof FomoProject].toString();
			}
		}
		appStore.setCurBtnFomoIcpInfo(curParams);
		navigate(`/${Fomoitem.fomo_pid.toString()}`);
	};
	const godBtnShowIcpInfo = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>,
		Fomoitem: FomoProject,
	) => {
		e.stopPropagation();
		let curParams: any = {};
		//Handle Fomoitem data because JSON serialization only supports primitive data types
		appStore.setCurBtnFomoIcpInfo(curParams);
		navigate(`/${Fomoitem.fomo_pid.toString()}`);
	};
	const [showVal, setShowVal] = React.useState(false);
	const btnToProfile = (
		e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
		create_user_pid: string,
	) => {
		e.stopPropagation();
		navigate(`/profile/${create_user_pid}`);
	};
	const BtnNewCoin = () => {
		navigate("/create");
	};
	const [fomoList, setFomoList] = React.useState<Array<FomoProject>>([]);
	const [userInfo, setUserInfo] = React.useState<Record<string, any>>({});
	const [lowBattery, setlowBattery] = React.useState<Record<string, any>>({});
	const [userReplies, setUserReplies] = React.useState<Record<string, string>>(
		{},
	);
	let addStart = 0;
	const pagChange = async (page: number) => {
		setShowVal(false);
		addStart = 6 * page - 6;
		console.log(searchFomosParams.text);
		if (searchInputVal) {
			setSearchFomosParams({
				...searchFomosParams,
				start: BigInt(addStart),
				text: searchInputVal,
			});
		} else {
			// console.log(addStart);
			const res = await search_fomos({
				...searchFomosParams,
				start: BigInt(addStart),
			});
			console.log(res);

			if (res.fomo_vec.length != 0) {
				// console.log(res.fomo_vec);
				setFomoList(res.fomo_vec);
				setShowVal(true);
				// console.log(555);
				isCurFomoListNull = false;
				updateFomoUserNames(res.fomo_vec);
			} else {
				isCurFomoListNull = true;
				// console.log(111);
				Message.error("Nothing more");
				setFomoList(res.fomo_vec);
				setShowVal(true);
			}
		}
	};
	useEffect(() => {
		searchFomos("");
	}, [searchFomosParams.start]);
	const [godOfWells, setGodOfWells] = React.useState<FomoProject>();
	const [godOfWellName, setGodOfWellName] = React.useState<string | undefined>(
		"",
	);
	const [godOfWellReplies, setGodOfWellReplies] = React.useState<string>("");
	const [GodUserInfo, setGodUserInfo] = React.useState<UserProfile>();
	let isCurFomoListNull = false;
	//Initial display of home page data
	const defaultgetFomoList = async () => {
		// console.log(111);

		// useEffect(() => {
		setShowVal(false);
		search_fomos(searchFomosParams).then((res) => {
			// console.log(res);
			if (res.fomo_vec) {
				setFomoList(res.fomo_vec);
				setShowVal(true);
				updateFomoUserNames(res.fomo_vec);
			}
		});
		get_god_of_wells().then((res: [] | [FomoProject]) => {
			if (res[0]) {
				getBaseUserInfo(res[0].create_user_pid.toString()).then((res) => {
					setGodUserInfo(res[0]);
				});
				setGodOfWells(res[0]);
				getFomoUserInfo(res[0].create_user_pid)
					.then((res) => {
						setGodOfWellName(res[0]?.user_name);
					})
					.catch((e) => {
						console.log(e);
						Message.error("getFomoUserInfo error");
					});
				get_comments_len(res[0].fomo_pid.toString(), res[0].create_user_pid)
					.then((res) => {
						if (res.toLocaleString() != "[object Object]") {
							setGodOfWellReplies(res.toLocaleString());
						}
					})
					.catch((e) => {
						console.log(e);
						// props.onMessageModal({ type: 'error', content: 'getData error' });
						// Message.error('getData error');
					});
			}
		});
		// }, []);
	};
	//Asynchronously updates fomo list UserName to prevent slow loading and display [object,object]

	const updateFomoUserNames = async (fomoVec: FomoProject[]) => {
		const updatedUserNames: Record<string, any> = {};
		const updatedUserReplies: Record<string, string> = {};
		const updatedlowBattery: Record<string, boolean> = {};
		let lowBattery = false;
		for (const fomoItem of fomoVec) {
			const results = await Promise.allSettled([
				getUserFomoName(fomoItem.create_user_pid),
				getCommentsLen(fomoItem.fomo_pid.toString(), fomoItem.create_user_pid),
				fomowell_project_cycles(fomoItem.fomo_pid.toString()),
			]);

			const userName =
				results[0].status === "fulfilled" ? results[0].value : "";
			const userReplie =
				results[1].status === "fulfilled" ? results[1].value : "";
			const fomowell_cycles =
				results[2].status === "fulfilled" ? results[2].value : 0;
			if (
				new Big(Number(fomowell_cycles)).lt(new Big(100000000000)) ||
				(results[2].status === "rejected" &&
					results[2].reason.result.reject_message.includes("frozen"))
			) {
				lowBattery = true;
			} else {
				lowBattery = false;
			}
			updatedUserNames[fomoItem.create_user_pid.toString()] = userName!;
			updatedlowBattery[fomoItem.token_pid.toString()] = lowBattery;
			if (userReplie != "[object Object]") {
				// console.log(fomoItem.token_pid.toString());
				updatedUserReplies[fomoItem.token_pid.toString()] = userReplie;
				setUserReplies(updatedUserReplies);
			}
		}
		// console.log(updatedUserNames);
		setUserInfo(updatedUserNames);
		setlowBattery(updatedlowBattery);
	};
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
	const getCommentsLen = async (
		fomo_pid: string,
		create_user_pid: Principal,
	) => {
		const userReplie = await get_comments_len(fomo_pid, create_user_pid);
		return userReplie.valueOf().toLocaleString();
	};
	const [currentPage, setCurrentPage] = React.useState(1);
	const handlePrevPage = () => {
		if (currentPage > 1) {
			pagChange(currentPage - 1);
			setCurrentPage(currentPage - 1);
		}
	};

	const handleNextPage = () => {
		if (fomoList.length != 0) {
			pagChange(currentPage + 1);
			setCurrentPage(currentPage + 1);
		} else {
			Message.warning("Nothing more");
		}
	};
	const BtnToUserInfoPage = (
		e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
		Pid: Principal,
	) => {
		e.stopPropagation();
		localStorage.setItem("setCurUserInfoPid", Pid.toString());
		navigate(`/profile/${Pid.toString()}`);
	};
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
			// props.onMessageModal({ type: 'error', content: res['Err'] });
			Message.error(res["Err"]);
		} else {
			const resIdx = await get_fomo_by_fomo_idx(
				BigInt(res.last_buy_sell_op.fomo_idx),
			);
			const rescreate_fomo = await get_fomo_by_fomo_idx(
				BigInt(res.last_create_fomo.fomo_idx),
			);
			if (curbuyStateIdx != String(res.last_buy_sell_op.swap_timestamp)) {
				curbuyStateIdx = String(res.last_buy_sell_op.swap_timestamp);
				setbuyShake(true);
			} else {
				setbuyShake(false);
			}
			if (curcreateStateIdx != String(res.last_create_fomo.create_time)) {
				curcreateStateIdx = String(res.last_create_fomo.create_time);
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
			const timer = setTimeout(() => setbuyShake(false), 500); // 500ms stop
			return () => clearTimeout(timer);
		}
		if (createShake) {
			const timer = setTimeout(() => setcreateShake(false), 500); // 500ms stop
			return () => clearTimeout(timer);
		}
	}, [buyShake, createShake]);
	//search box query when type is search, in order to distinguish between pagination after search and pagination data by clicking the search button
	const searchFomos = async (type: string) => {
		// console.log(searchInputVal);
		// console.log({ ...searchFomosParams, order: returnCurOrder()!, sort: returnCurSort()!, text: searchInputVal });
		const res = await search_fomos({
			...searchFomosParams,
			order: returnCurOrder()!,
			sort: returnCurSort()!,
			text: searchInputVal,
		});
		if (type == "search") {
			addStart = 0;
			setCurrentPage(1);
		}
		if (res.fomo_vec.length == 0) {
			Message.error("Nothing more");
		}
		setFomoList(res.fomo_vec);
		updateFomoUserNames(res.fomo_vec);
		setShowVal(true);
	};
	//The search data is triggered when the sorting criteria change
	useEffect(() => {
		searchFomos("search");
	}, [SortVal, OrderVal]);
	useEffect(() => {
		setSearchFomosParams({ ...searchFomosParams, text: searchInputVal });
	}, [searchInputVal]);
	const BtnSearch = () => {
		searchFomos("search");
	};
	const BtnLastBuySell = async (FomoPid: string) => {
		const res = await get_fomo_by_fomo_idx(BigInt(FomoPid));
		navigate(`/${res[0]?.fomo_pid.toString()}`);
	};
	const handlTimeFn = (Time: bigint | undefined) => {
		if (Time) {
			const milliseconds = Time / 1000000n;
			return dayjs(Number(milliseconds)).utc().format("MM/DD/YY");
		} else {
			return "";
		}
	};
	const [shake, setShake] = React.useState(false);
	let CurgodFomoIdx = "";
	useEffect(() => {
		setTimeout(() => {
			setInterval(() => {
				getFomContext();
			}, 15000);
		}, 15000);
		getFomContext();
		defaultgetFomoList();
		setTimeout(() => {
			setInterval(() => {
				get_god_of_wells().then((res: [] | [FomoProject]) => {
					// setShake(false);
					if (res[0]) {
						getBaseUserInfo(res[0].create_user_pid.toString()).then((res) => {
							setGodUserInfo(res[0]);
						});
						setGodOfWells(res[0]);
						if (String(res[0].fomo_idx) == CurgodFomoIdx) {
							setShake(false);
						} else {
							setShake(true);
							CurgodFomoIdx = String(res[0].fomo_idx);
						}
						getFomoUserInfo(res[0].create_user_pid)
							.then((res) => {
								setGodOfWellName(res[0]?.user_name);
							})
							.catch((e) => {
								console.log(e);
								Message.error("getFomoUserInfo error");
							});
						get_comments_len(res[0].fomo_pid.toString(), res[0].create_user_pid)
							.then((res) => {
								if (res.toLocaleString() != "[object Object]") {
									setGodOfWellReplies(res.toLocaleString());
								}
							})
							.catch((e) => {
								console.log(e);
								// props.onMessageModal({ type: 'error', content: 'getData error' });
								// Message.error('getData error');
							});
					}
				});
			}, 10000);
		}, 20000);
	}, []);
	useEffect(() => {
		if (shake) {
			const timer = setTimeout(() => setShake(false), 500); // 500ms
			return () => clearTimeout(timer);
		}
	}, [shake]);
	return (
		// style={{ overflow: hiden ? 'hidden' : '' }}
		<div className={styles.HomeMain}>
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
			<div className={styles.HomeCenter}>
				<div className={styles.MainTitle} onClick={BtnNewCoin}>
					Start a new coin
				</div>
				{godOfWells ? (
					<Card
						className={`${styles.userInfoCard} ${shake ? styles.shake : ""}`}
						onClick={(e) => godBtnShowIcpInfo(e, godOfWells!)}
					>
						<img className={styles.subheade} src={god_img} />
						<CardContent className={`${styles.CardUserContent}`}>
							<img
								className={styles.CarduserIcon}
								src={getImgUrl(godOfWells?.img_url!)}
							/>
							<div className={styles.CardInfoList}>
								<div
									className={styles.CardInfoItem}
									onClick={(e) =>
										BtnToUserInfoPage(e, godOfWells?.create_user_pid!)
									}
									style={{ cursor: "pointer" }}
								>
									created by{" "}
									<img
										style={{ height: "14px", marginRight: "5px" }}
										src={getImgUrl(GodUserInfo?.avatar!)}
									></img>
									<span className={styles.godOfWellName}>{godOfWellName}</span>
								</div>
								<div
									className={styles.CardInfoItem}
									style={{ display: "flex", alignItems: "center" }}
								>
									<div>
										market cap: $
										<span>
											{godOfWells?.market_cap !== undefined
												? formatAmountByUnit(
														Big(BigInt(godOfWells?.market_cap).toString())
															.div(10 ** 18)
															.toNumber(),
													)
												: "0"}
										</span>
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											marginLeft: "5px",
										}}
									>
										[<span>badge:</span>
										<img
											style={{ width: "18px", height: "18px" }}
											src={champion}
										></img>{" "}
										]
									</div>
								</div>
								<div className={styles.CardInfoItem}>
									replies:{" "}
									<span style={{ color: "#ffc900" }}>{godOfWellReplies}</span>
								</div>
								<div
									className={styles.CardInfoItem}
									style={{ color: "#ffc900" }}
								>
									{godOfWells?.name} [ticker:{godOfWells?.ticker}]
								</div>
							</div>
						</CardContent>
					</Card>
				) : (
					<Card
						style={{
							backgroundColor: "#3a3a5a",
							width: "400px",
							height: "220px",
						}}
					>
						<CardContent className={styles.CardUserContent}>
							<Skeleton
								variant="text"
								sx={{ bgcolor: "#655EA7", marginTop: "10px", height: "40px" }}
							/>
							<Skeleton
								variant="circular"
								width={40}
								height={40}
								sx={{ bgcolor: "#655EA7", marginTop: "10px" }}
							/>
							<Skeleton
								variant="rectangular"
								width={210}
								height={80}
								sx={{ bgcolor: "#655EA7", marginTop: "10px" }}
							/>
						</CardContent>
					</Card>
				)}
				<Paper
					className={styles.SearchBox}
					// component="form"
					sx={{ p: "2px 4px", display: "flex", alignItems: "center" }}
				>
					<InputBase
						// value={SearchValue}
						sx={{ ml: 1, flex: 1 }}
						placeholder="Search by symbol or address id"
						onChange={(e) => setsearchInputVal(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								BtnSearch();
							}
						}}
						// inputProps={{ 'aria-label': 'search google maps' }}
					/>
					<IconButton sx={{ p: "10px", color: "#7F7F7F" }} onClick={BtnSearch}>
						<SearchIcon className={styles.SearchIcon} />
					</IconButton>
				</Paper>
			</div>
			<div className={styles.HomeButtom}>
				<div className={styles.FilterBoxAll}>
					<HOCChild
						handleSortMenuChange={handleSortMenuChange}
						BootstrapInput={BootstrapInput}
						SortMenu={SortMenu}
						handleOrderMenuChange={handleOrderMenuChange}
						OrderMenu={OrderMenu}
					></HOCChild>
					{/* <FormControl sx={{ m: 1 }}>
            <Select
              className={styles.FilterBox}
              value={SortVal}
              label="SortVal"
              onChange={handleSortMenuChange}
              sx={{
                height: '35px',
                '.MuiInputBase-input': {
                  padding: '8px 10px 8px 10px',
                },
              }}
              input={<BootstrapInput />}
            >
              {SortMenu.map((item) => {
                return (
                  <MenuItem key={item.name} value={item.value}>
                    {item.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl sx={{ m: 1 }}>
            <Select
              className={styles.FilterBox}
              value={OrderVal}
              label="OrderVal"
              sx={{
                height: '35px',
                '.MuiInputBase-input': {
                  padding: '8px 10px 8px 10px',
                },
              }}
              onChange={handleOrderMenuChange}
              input={<BootstrapInput />}
            >
              {OrderMenu.map((item) => {
                return (
                  <MenuItem key={item.name} value={item.value}>
                    {item.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl> */}
				</div>
				<div className={styles.ButtomCard}>
					{showVal
						? fomoList.map((Fomoitem, index) => {
								return (
									<Card
										className={styles.ButtomuserInfoCard}
										sx={{ padding: 0, margin: 0 }}
										key={Fomoitem.fomo_idx}
									>
										<CardContent
											className={styles.CardUserContent}
											sx={{
												"&:last-child": {
													paddingBottom: 1,
												},
												padding: 1,
											}}
										>
											<div
												className={styles.BtmUserInfoAll}
												onClick={(e) => BtnShowIcpInfo(e, Fomoitem)}
											>
												<div className={styles.BtmUserInfo}>
													<div className={styles.MainTitle}>
														{Fomoitem.name} [{Fomoitem?.ticker}]
													</div>
													<div className={styles.createUser}>
														created by{" "}
														<img
															src={getImgUrl(
																userInfo[Fomoitem.create_user_pid.toString()]
																	?.avatar,
															)}
														/>{" "}
														<span
															className={styles.fomoListName}
															style={{ cursor: "pointer" }}
															onClick={(e) =>
																btnToProfile(
																	e,
																	Fomoitem.create_user_pid.toString(),
																)
															}
														>
															{
																userInfo[Fomoitem.create_user_pid.toString()]
																	?.user_name
															}
														</span>
													</div>
													<div className={styles.Description}>
														{Fomoitem.description}
													</div>
													<div className={styles.BtmUserInfoItem}>
														{Fomoitem.twitter_link && (
															<div className={styles.BtmleftItem}>
																<img className={styles.ItemInfoImg} src={X} />
															</div>
														)}
														{Fomoitem.telegram_link && (
															<div className={styles.BtmleftItem}>
																<img className={styles.ItemInfoImg} src={buy} />
															</div>
														)}
														{Fomoitem.website && (
															<div className={styles.BtmleftItem}>
																<img
																	className={styles.ItemInfoImg}
																	src={link}
																/>
															</div>
														)}
													</div>
													<div className={styles.amountInfo}>
														<div>
															market cap: $
															<span className={styles.amountInfoText}>
																{Fomoitem?.market_cap !== undefined
																	? formatAmountByUnit(
																			Big(
																				BigInt(Fomoitem?.market_cap).toString(),
																			)
																				.div(10 ** 18)
																				.toNumber(),
																		)
																	: "0"}
															</span>
															<span
																style={{
																	display:
																		Fomoitem.god_of_wells_progress >=
																		BigInt(10000)
																			? ""
																			: "none",
																}}
															>
																[<span>badge:</span>
																<img
																	style={{
																		width: "18px",
																		height: "18px",
																		translate: "1px 3px",
																	}}
																	src={champion}
																></img>
																<img
																	style={{
																		width: "16px",
																		height: "16px",
																		marginRight: "1px",
																		translate: "1px 3px",
																		display:
																			Fomoitem.pool_progress_done_time.length !=
																			0
																				? ""
																				: "none",
																	}}
																	src={ICPEx}
																/>
																<img
																	style={{
																		width: "16px",
																		height: "16px",
																		marginRight: "1px",
																		translate: "1px 3px",
																		display:
																			Fomoitem.pool_progress_done_time.length !=
																				0 && Fomoitem.sneed_dao_lock.length != 0
																				? ""
																				: "none",
																	}}
																	src={sneed}
																/>
																]
															</span>
														</div>
														<div
															className={styles.replies}
															style={{
																marginLeft: "3px",
																// translate: Fomoitem.god_of_wells_progress >= BigInt(10000) ? document.body.offsetWidth <= 600 ? '1px 10px' : '1px 4px' : '',
																translate:
																	Fomoitem.god_of_wells_progress >=
																	BigInt(10000)
																		? "1px 3px"
																		: "",
															}}
														>
															replies:{" "}
															<span className={styles.amountInfoText}>
																{userReplies[Fomoitem.token_pid.toString()]}
															</span>
														</div>
													</div>
												</div>
												<div className={styles.ImgBox}>
													<img
														className={styles.BtmUserIcon}
														src={getImgUrl(Fomoitem.img_url)}
													/>
												</div>
												<img
													className={styles.lowBattery}
													style={{
														display: lowBattery[Fomoitem.token_pid.toString()]
															? ""
															: "none",
													}}
													src={lowBatteryimg}
													alt=""
												/>
											</div>
										</CardContent>
									</Card>
								);
							})
						: [1, 2, 3].map((item, index) => {
								return (
									<Card className={styles.ButtomuserInfoCard} key={index}>
										<CardContent className={styles.CardUserContent}>
											<Skeleton
												variant="text"
												sx={{
													bgcolor: "#655EA7",
													marginTop: "10px",
													height: "40px",
												}}
											/>
											<Skeleton
												variant="circular"
												width={40}
												height={40}
												sx={{ bgcolor: "#655EA7", marginTop: "10px" }}
											/>
											<Skeleton
												variant="rectangular"
												width={210}
												height={118}
												sx={{ bgcolor: "#655EA7", marginTop: "10px" }}
											/>
										</CardContent>
									</Card>
								);
							})}
				</div>
				<div
					style={{
						marginTop: "10px",
						translate: "-13px",
						paddingBottom: "10px",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<ArrowBackIcon
						onClick={handlePrevPage}
						sx={{ color: "#fff", marginRight: "10px", cursor: "pointer" }}
					></ArrowBackIcon>
					<div style={{ color: "#fff" }}>{currentPage}</div>
					<ArrowForwardIcon
						onClick={handleNextPage}
						sx={{ color: "#fff", marginLeft: "10px", cursor: "pointer" }}
					></ArrowForwardIcon>
				</div>
			</div>
		</div>
	);
};

export default Home;
