import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { initCanisterEnv } from "./config/env";
import * as path from "path";
// import { HttpsProxyAgent } from 'https-proxy-agent'

export default defineConfig({
	plugins: [react()],
	build: {},
	define: {
		"process.env.DFX_NETWORK":
			process.env.DFX_NETWORK === "ic"
				? JSON.stringify("ic")
				: JSON.stringify("local"),
		// 'process.env.CANISTER_ID_FOMOWELL_LAUNCHER':JSON.stringify('yi7jn-yyaaa-aaaam-acshq-cai')
		...initCanisterEnv(),
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
			path: "path-browserify",
			// fs: 'browserify-fs',
			url: "url",
			"source-map-js": "source-map",
		},
	},
	server: {
		host: "0.0.0.0",
		proxy: {
			"/api": {
				// agent: new HttpsProxyAgent('http://192.168.1.200:7890'),
				target: "https://image.fomowell.com/",
				// target: 'https://icpex.org/',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => {
					// console.log(path);

					return path.replace(/^\/api/, "/api");
				},
			},
			"/service": {
				// agent: new HttpsProxyAgent('http://192.168.1.200:7890'),
				target: "https://metrics.icpex.org/",
				changeOrigin: true,
				secure: false,
				headers: {
					//test env
					Referer: "https://eqtk7-7aaaa-aaaag-albsq-cai.icp0.io/",
				},
				rewrite: (path) => {
					// console.log(path);

					return path.replace(/^\/service/, "");
				},
			},
		},
	},
	optimizeDeps: {
		//  TypeScript
		include: ["typescript"],
	},
});
