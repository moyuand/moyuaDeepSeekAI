import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/

// 线上代理地址：http://localhost:8999/
// 本地代理地址：http://localhost:8999/api
export default defineConfig({
	plugins: [vue(), vueJsx(), vueDevTools()],
	server: {
		host: "0.0.0.0",
		proxy: {
			"/api": {
				target: "http://localhost:8999/",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	build: {
		// 优化代码分割
		rollupOptions: {
			output: {
				// 手动分块策略
				manualChunks: {
					// Vue核心库
					"vue-vendor": ["vue", "vue-router", "pinia"],
					// Naive UI组件库
					"naive-ui": ["naive-ui"],
					// Markdown相关
					markdown: ["marked", "dompurify", "highlight.js"],
					// 虚拟滚动
					virtual: ["virtua"],
					// 图标库
					icons: ["@vicons/fluent"],
				},
				// 优化chunk文件名
				chunkFileNames: "js/[name]-[hash].js",
				entryFileNames: "js/[name]-[hash].js",
				assetFileNames: "[ext]/[name]-[hash].[ext]",
			},
		},
		// chunk大小警告阈值(KB)
		chunkSizeWarningLimit: 1000,
	},
	// 使用esbuild压缩并移除调试语句，避免额外安装terser依赖
	esbuild: {
		drop: ["console", "debugger"],
	},
	// 优化依赖预构建
	optimizeDeps: {
		include: [
			"vue",
			"vue-router",
			"pinia",
			"naive-ui",
			"marked",
			"dompurify",
			"highlight.js",
			"virtua/vue",
			"@vicons/fluent",
		],
	},
});
