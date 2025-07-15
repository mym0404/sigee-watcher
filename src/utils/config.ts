import { config } from "dotenv";
import type { AppConfig } from "../types/index.js";

config();

// Default configuration values
const DEFAULT_CONFIG = {
	GITHUB_OWNER: "sigee-min",
	GITHUB_REPO: "www.sigee.xyz",
	DISCUSSION_REPO: "sigee-min/www.sigee.xyz",
	DISCUSSION_REPO_ID: "R_kgDOPCTBLQ",
	DISCUSSION_CATEGORY_ID: "DIC_kwDOPCTBLc4CsOn9",
} as const;

const requiredEnvVars = ["GITHUB_TOKEN", "GEMINI_API_KEY"] as const;

const validateEnvironment = (): void => {
	const missing = requiredEnvVars.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}
};

export const getConfig = (): AppConfig => {
	validateEnvironment();

	return {
		github: {
			token: process.env.GITHUB_TOKEN as string,
			owner: process.env.GITHUB_OWNER || DEFAULT_CONFIG.GITHUB_OWNER,
			repo: process.env.GITHUB_REPO || DEFAULT_CONFIG.GITHUB_REPO,
		},
		discussion: {
			repo: process.env.DISCUSSION_REPO || DEFAULT_CONFIG.DISCUSSION_REPO,
			repoId:
				process.env.DISCUSSION_REPO_ID || DEFAULT_CONFIG.DISCUSSION_REPO_ID,
			categoryId:
				process.env.DISCUSSION_CATEGORY_ID ||
				DEFAULT_CONFIG.DISCUSSION_CATEGORY_ID,
		},
		gemini: {
			apiKey: process.env.GEMINI_API_KEY as string,
		},
	};
};
