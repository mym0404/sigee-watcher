import type { AppConfig, Discussion, GitHubPost } from "../types/index.js";
import { DiscussionService } from "./discussion.js";
import { GitHubService } from "./github.js";

export class WatcherService {
	private githubService: GitHubService;
	private discussionService: DiscussionService;
	private config: AppConfig;

	constructor(config: AppConfig) {
		this.config = config;
		this.githubService = new GitHubService(
			config.github.token,
			config.github.owner,
			config.github.repo,
		);
		this.discussionService = new DiscussionService(
			config.discussion,
			config.github.owner,
			config.github.repo,
			config.gemini.apiKey,
		);
	}

	async checkAndUpdatePosts(): Promise<void> {
		console.log("🔍 Checking for posts without welcome comments...");

		try {
			// Get all posts from the repository
			const posts = await this.githubService.getPostFolders();
			console.log(`Found ${posts.length} posts to check`);

			// Process each post
			for (const post of posts) {
				console.log(`Processing post: ${post.folderName}`);

				const discussionTitle =
					this.discussionService.generateDiscussionTitle(post);

				// Find existing discussion or create new one
				const discussion = await this.findOrCreateDiscussion(
					post,
					discussionTitle,
				);

				// Process the discussion (add comments if needed)
				if (discussion) {
					await this.processDiscussion(post, discussion);
				}
			}

			console.log("✅ Finished checking posts");
		} catch (error) {
			console.error("Error during post check:", error);
		}
	}

	private async findOrCreateDiscussion(
		post: GitHubPost,
		discussionTitle: string,
	): Promise<Discussion | null> {
		// Check if discussion exists by trying to find it by title
		let discussion =
			await this.githubService.findDiscussionByTitle(discussionTitle);

		if (!discussion) {
			// Create new discussion for this post
			console.log(`Creating new discussion for post: ${post.folderName}`);

			const welcomeComment =
				await this.discussionService.generateWelcomeComment(post);

			discussion = await this.githubService.createDiscussion(
				discussionTitle,
				welcomeComment,
				this.config.discussion.categoryId,
			);

			if (discussion) {
				console.log(
					`✅ Created discussion #${discussion.number}: ${discussionTitle}`,
				);
				console.log(
					`✅ Added welcome comment to new discussion for ${post.folderName}`,
				);
			} else {
				console.log(`❌ Failed to create discussion for ${post.folderName}`);
			}
		}

		return discussion;
	}

	private async processDiscussion(
		post: GitHubPost,
		discussion: Discussion,
	): Promise<void> {
		// Discussion exists, check if it has comments
		const comments = await this.githubService.getDiscussionComments(
			discussion.number,
		);

		// Check if mym0404 has already commented
		const hasMym0404Comment = comments.some(
			(comment: any) => comment.author && comment.author.login === "mym0404",
		);

		if (comments.length === 0 || !hasMym0404Comment) {
			const action = comments.length === 0 ? "Adding" : "Adding mym0404";
			console.log(
				`${action} welcome comment to discussion #${discussion.number}: ${discussion.title}`,
			);

			// Get discussion ID for GraphQL mutation
			const discussionId = await this.githubService.getDiscussionId(
				discussion.number,
			);

			if (discussionId) {
				const welcomeComment =
					await this.discussionService.generateWelcomeComment(post);
				const success = await this.githubService.addDiscussionComment(
					discussionId,
					welcomeComment,
				);

				if (success) {
					console.log(`✅ Added welcome comment to ${post.folderName}`);
				} else {
					console.log(`❌ Failed to add comment to ${post.folderName}`);
				}
			}
		} else {
			console.log(
				`Discussion for ${post.folderName} already has mym0404 comment, skipping`,
			);
		}
	}

	async run(): Promise<void> {
		console.log("🚀 Starting single watcher run");
		await this.checkAndUpdatePosts();
		console.log("✅ Watcher run completed");
	}
}
