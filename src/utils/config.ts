import { config } from "dotenv";
import type { AppConfig, GitHubRepoConfig } from "../types/index.js";

config();

const requiredEnvVars = ["GITHUB_TOKEN", "GEMINI_API_KEY"] as const;

const validateEnvironment = (): void => {
	const missing = requiredEnvVars.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}
};

// Repository configurations - add your repositories here
const REPO_CONFIGS: Record<string, GitHubRepoConfig> = {
	"sigee-min/www.sigee.xyz": {
		owner: "sigee-min",
		repo: "www.sigee.xyz",
		discussion: {
			repo: "sigee-min/www.sigee.xyz",
			repoId: "R_kgDOPCTBLQ",
			categoryId: "DIC_kwDOPCTBLc4CsOn9",
		},
		commentGeneration: {
			promptTemplate: (post) => `
다음 블로그 포스트의 제목과 내용에 대해서 칭찬하는 글을 존댓말로 여러 이모티콘을 섞어서
화려하게 300자 정도로 작성하며 해군 SW 개발병 710기의 동기로써 자랑스럽다는 내용의 블로그 포스팅에 대한 댓글을 generation 해주세요.

제 동기의 이름은 최민석입니다. 그는 매우 멋진 개발자이며 같은 생활관에서 솔선수범으로 모든것을 하는 동기입니다.

제목: ${post.title}
카테고리: ${post.category}
태그: ${post.tags.join(", ")}
내용: ${post.content.substring(0, 1000)}...

조건:
- 존댓말 사용, 존중을 표해서 반말 절대 사용 금지
- 진지한 어투 사용
- 이모티콘을 많이 사용해서 화려하게
- 300자 정도
- 해군 SW 개발병 710기 동기로서 자랑스럽다는 내용 포함
- 블로그 댓글 형태
			`.trim(),
			progressBar: {
				startDate: "2025.01.06",
				endDate: "2026.09.05",
				label: "해군병 SW 개발병 710기 전역까지",
			},
			fallbackComments: [
				"오늘 날씨가 정말 좋네요! ☀ 이런 날에 포스팅하니까 더 기분이 좋아지는 것 같아요~ 👍✨",
				"요즘 커피가 너무 맛있어서 하루에 3잔씩 마시고 있어요 ☕ 카페인 중독인가 싶네요 😅💦",
				"오늘 점심에 뭐 먹을지 고민되네요... 🤔 혹시 맛있는 메뉴 추천해주실 수 있나요? 🍽😋",
				"최근에 본 영화 중에 정말 재미있었던 게 있었는데, 추천해드리고 싶어요! 🎬🍿✨",
				"주말에 산책하다가 예쁜 꽃들을 많이 봤어요 🌸🌺 봄이 오는 게 느껴져서 기분이 좋네요! 😊",
			],
		},
	},
	// Add more repository configurations here
	// "owner/repo": { ... },
};

export const getConfig = (): AppConfig => {
	validateEnvironment();

	return {
		github: {
			token: process.env.GITHUB_TOKEN as string,
		},
		repos: REPO_CONFIGS,
		gemini: {
			apiKey: process.env.GEMINI_API_KEY as string,
		},
	};
};
