import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
	CommentGenerationConfig,
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
	private commentConfig: CommentGenerationConfig;

	constructor(
		config: DiscussionConfig,
		owner: string,
		repo: string,
		geminiApiKey: string,
		commentConfig: CommentGenerationConfig,
	) {
		this.config = config;
		this.owner = owner;
		this.repo = repo;
		this.genAI = new GoogleGenerativeAI(geminiApiKey);
		this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
		this.commentConfig = commentConfig;
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
			const prompt = this.commentConfig.promptTemplate(post);

			const result = await this.model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			let ret = text || this.getFallbackComment();

			// Add progress bar if configured
			if (this.commentConfig.progressBar) {
				const progressBarText = this.generateProgressBar(
					this.commentConfig.progressBar,
				);
				ret = `${ret}\n\n${progressBarText}`.trim();
			}

			return ret;
		} catch (error) {
			console.error("Error generating comment with Gemini:", error);
			return this.getFallbackComment();
		}
	}

	private generateProgressBar(config: {
		startDate: string;
		endDate: string;
		label: string;
	}): string {
		const now = Date.now();
		const start = new Date(config.startDate).getTime();
		const end = new Date(config.endDate).getTime();
		const percentage = (end - now) / (end - start);

		const generateAsciiBar = (percent: number, length = 20): string => {
			const filled = Math.round((1 - percent) * length);
			const empty = length - filled;
			return "█".repeat(filled) + "░".repeat(empty);
		};

		return `**${config.label}**
${generateAsciiBar(percentage, 20)} ${((1 - percentage) * 100).toFixed(2)}%
*(${config.startDate} ~ ${config.endDate})*`;
	}

	private getFallbackComment(): string {
		const templates = this.commentConfig.fallbackComments;
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
