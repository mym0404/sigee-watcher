import { config } from "dotenv";
import type { AppConfig } from "../types/index.js";

config();

const requiredEnvVars = [
	"GITHUB_TOKEN",
	"GITHUB_OWNER",
	"GITHUB_REPO",
	"DISCUSSION_REPO",
	"DISCUSSION_REPO_ID",
	"DISCUSSION_CATEGORY_ID",
	"GEMINI_API_KEY",
] as const;

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
			owner: process.env.GITHUB_OWNER as string,
			repo: process.env.GITHUB_REPO as string,
		},
		discussion: {
			repo: process.env.DISCUSSION_REPO as string,
			repoId: process.env.DISCUSSION_REPO_ID as string,
			categoryId: process.env.DISCUSSION_CATEGORY_ID as string,
		},
		server: {
			port: Number.parseInt(process.env.PORT || "3000", 10),
			cronSchedule: process.env.CRON_SCHEDULE || "0 */6 * * *",
		},
		gemini: {
			apiKey: process.env.GEMINI_API_KEY as string,
		},
		webhookSecret: process.env.WEBHOOK_SECRET,
	};
};
