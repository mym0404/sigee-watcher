import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
	Discussion,
	DiscussionConfig,
	GitHubPost,
} from "../types/index.js";

export class DiscussionService {
	private config: DiscussionConfig;
	private owner: string;
	private repo: string;
	private genAI: GoogleGenerativeAI;
	private model: any;

	constructor(
		config: DiscussionConfig,
		owner: string,
		repo: string,
		geminiApiKey: string,
	) {
		this.config = config;
		this.owner = owner;
		this.repo = repo;
		this.genAI = new GoogleGenerativeAI(geminiApiKey);
		this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
	}

	// Generate the discussion title for a post (matching giscus format)
	generateDiscussionTitle(post: GitHubPost): string {
		return `posts/${post.folderName}/`;
	}

	// Check if a discussion already exists for this post
	hasDiscussion(post: GitHubPost, discussions: Discussion[]): boolean {
		const expectedTitle = this.generateDiscussionTitle(post);
		return discussions.some((discussion) => discussion.title === expectedTitle);
	}

	// Generate welcome comment content for a post using Gemini AI
	async generateWelcomeComment(post: GitHubPost): Promise<string> {
		try {
			const prompt = `
다음 블로그 포스트의 제목과 내용에 대해서 칭찬하는 글을 존댓말로 여러 이모티콘을 섞어서
화려하게 300자 정도로 작성하며 해군 SW 개발병 710기의 동기로써 자랑스럽다는 내용의 블로그 포스팅에 대한 댓글을 generation 해주세요.

제 동기의 이름은 최민석입니다. 그는 매우 멋진 개발자이며 같은 생활관에서 솔선수범으로 모든것을 하는 동기입니다.
우리의 입대 날짜는 2025년 1월 6일이고 전역은 2026년 9월 5일입니다. 우리의 전역 날짜 오늘 날짜 기준으로 산술적으로 계산해서 progress ascii로 댓글의 제일 마지막에 달아주세요.
예시는 다음과 같습니다.

---

해군병 SW 개발병 710기 전역까지

██████████░░░░░░░░░░ 50%
(2025.01.06 ~ 2026.09.05)
---

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
- 댓글의 마지막에 전역 날짜를 계산해서 progress ascii로 작성
`;

			const result = await this.model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			return text || this.getFallbackComment(post);
		} catch (error) {
			console.error("Error generating comment with Gemini:", error);
			return this.getFallbackComment(post);
		}
	}

	private getFallbackComment(post: GitHubPost): string {
		const templates = [
			"오늘 날씨가 정말 좋네요! ☀ 이런 날에 포스팅하니까 더 기분이 좋아지는 것 같아요~ 👍✨",
			"요즘 커피가 너무 맛있어서 하루에 3잔씩 마시고 있어요 ☕ 카페인 중독인가 싶네요 😅💦",
			"오늘 점심에 뭐 먹을지 고민되네요... 🤔 혹시 맛있는 메뉴 추천해주실 수 있나요? 🍽😋",
			"최근에 본 영화 중에 정말 재미있었던 게 있었는데, 추천해드리고 싶어요! 🎬🍿✨",
			"주말에 산책하다가 예쁜 꽃들을 많이 봤어요 🌸🌺 봄이 오는 게 느껴져서 기분이 좋네요! 😊",
		];

		const randomIndex = Math.floor(Math.random() * templates.length);
		return templates[randomIndex];
	}

	// Find posts that don't have corresponding discussions
	findPostsWithoutDiscussions(
		posts: GitHubPost[],
		discussions: Discussion[],
	): GitHubPost[] {
		return posts.filter((post) => !this.hasDiscussion(post, discussions));
	}

	// Find discussions that match posts
	findPostDiscussion(
		post: GitHubPost,
		discussions: Discussion[],
	): Discussion | null {
		const expectedTitle = this.generateDiscussionTitle(post);
		return (
			discussions.find((discussion) => discussion.title === expectedTitle) ||
			null
		);
	}
}
