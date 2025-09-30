import {promises as fs} from "fs";
import {join} from "path";
import type {
  AppConfig,
  Discussion,
  GitHubPost,
  GitHubRepoConfig,
} from "../types/index.js";
import {DiscussionService} from "./discussion.js";
import {GitHubService} from "./github.js";

export class WatcherService {
  private githubService: GitHubService;
  private discussionService: DiscussionService;
  private repoConfig: GitHubRepoConfig;
  private repoKey: string;
  private cacheDir: string = ".cache";
  private processedPostsFile: string;

  constructor(config: AppConfig, repoKey: string) {
    const repoConfig = config.repos[repoKey];
    if (!repoConfig) {
      throw new Error(`Repository configuration not found for: ${repoKey}`);
    }
    

    this.repoKey = repoKey;
    this.repoConfig = repoConfig;
    this.processedPostsFile = join(
      this.cacheDir,
      `processed-${repoKey.replace("/", "-")}.json`,
    );

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
    this.initializeCache();
  }

  async checkAndUpdatePosts(): Promise<void> {
    console.log("🔍 Checking for posts without welcome comments...");

    try {
      // Get all posts from the repository
      const posts = await this.githubService.getPostFolders();
      console.log(`Found ${posts.length} posts to check`);

      // Load processed posts cache
      const processedPosts = await this.loadProcessedPosts();

      // Process each post
      for (const post of posts) {
        // Skip if already processed
        if (this.isPostProcessed(post, processedPosts)) {
          console.log(`Skipping already processed post: ${post.folderName}`);
          continue;
        }

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
          const wasProcessed = await this.processDiscussion(post, discussion);

          // Mark as processed if comment was added or already exists
          if (wasProcessed) {
            await this.markPostAsProcessed(post);
          }
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
  ): Promise<boolean> {
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
          return true;
        } else {
          console.log(`❌ Failed to add comment to ${post.folderName}`);
          return false;
        }
      }
      return false;
    } else {
      console.log(
        `Discussion for ${post.folderName} already has mym0404 comment, skipping`,
      );
      return true; // Already processed
    }
  }

  private async initializeCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, {recursive: true});
    } catch (error) {
      console.error("Failed to create cache directory:", error);
    }
  }

  private async loadProcessedPosts(): Promise<Set<string>> {
    try {
      const data = await fs.readFile(this.processedPostsFile, "utf-8");
      const processedPosts = JSON.parse(data);
      return new Set(processedPosts);
    } catch (error) {
      // File doesn't exist or is invalid, return empty set
      return new Set();
    }
  }

  private async saveProcessedPosts(processedPosts: Set<string>): Promise<void> {
    try {
      const data = JSON.stringify([...processedPosts], null, 2);
      await fs.writeFile(this.processedPostsFile, data, "utf-8");
    } catch (error) {
      console.error("Failed to save processed posts cache:", error);
    }
  }

  private generatePostId(post: GitHubPost): string {
    return post.folderName;
  }

  private isPostProcessed(
    post: GitHubPost,
    processedPosts: Set<string>,
  ): boolean {
    const postId = this.generatePostId(post);
    return processedPosts.has(postId);
  }

  private async markPostAsProcessed(post: GitHubPost): Promise<void> {
    const processedPosts = await this.loadProcessedPosts();
    const postId = this.generatePostId(post);
    processedPosts.add(postId);
    await this.saveProcessedPosts(processedPosts);
    console.log(`Marked post as processed: ${post.folderName}`);
  }

  async run(): Promise<void> {
    console.log("🚀 Starting single watcher run");
    await this.checkAndUpdatePosts();
    console.log("✅ Watcher run completed");
  }
}
