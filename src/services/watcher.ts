import type {
	AppConfig,
	Discussion,
	GitHubPost,
	GitHubRepoConfig,
} from "../types/index.js";
import { DiscussionService } from "./discussion.js";
import { GitHubService } from "./github.js";

export class WatcherService {
	private githubService: GitHubService;
	private discussionService: DiscussionService;
	private repoConfig: GitHubRepoConfig;

	constructor(config: AppConfig, repoKey: string) {
		const repoConfig = config.repos[repoKey];
		if (!repoConfig) {
			throw new Error(`Repository configuration not found for: ${repoKey}`);
		}

		this.repoConfig = repoConfig;

		this.githubService = new GitHubService(
			config.github.token,
			repoConfig.owner,
			repoConfig.repo,
		);
		this.discussionService = new DiscussionService(
			repoConfig.discussion,
			repoConfig.owner,
			repoConfig.repo,
			config.gemini.apiKey,
			repoConfig.commentGeneration,
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
				this.repoConfig.discussion.categoryId,
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

		// Find mym0404's comments
		const mym0404Comments = comments.filter(
			(comment) => comment.author && comment.author.login === "mym0404",
		);

		let shouldAddComment = false;
		let action = "Adding";

		if (mym0404Comments.length === 0) {
			// No mym0404 comment, add one
			shouldAddComment = true;
			action = comments.length === 0 ? "Adding" : "Adding mym0404";
		} else {
			// Check if last mym0404 comment is older than 30 days
			const lastComment = mym0404Comments[mym0404Comments.length - 1];
			const lastCommentDate = new Date(lastComment.createdAt);
			const now = Date.now();
			const daysSinceLastComment =
				(now - lastCommentDate.getTime()) / (1000 * 60 * 60 * 24);

			if (daysSinceLastComment >= 30) {
				shouldAddComment = true;
				action = "Re-adding (30+ days)";
				console.log(
					`Last comment was ${Math.floor(daysSinceLastComment)} days ago`,
				);
			} else {
				console.log(
					`Discussion for ${post.folderName} has recent mym0404 comment (${Math.floor(daysSinceLastComment)} days ago), skipping`,
				);
			}
		}

		if (shouldAddComment) {
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
		}
	}

	async run(): Promise<void> {
		console.log("🚀 Starting single watcher run");
		await this.checkAndUpdatePosts();
		console.log("✅ Watcher run completed");
	}
}
