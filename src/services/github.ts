import { Octokit } from "@octokit/rest";
import type {
	Discussion,
	GitHubPost,
	PostFileStructure,
} from "../types/index.js";

export class GitHubService {
	private readonly _octokit: Octokit;
	private readonly owner: string;
	private readonly repo: string;
	private readonly postsPath: string;
	private readonly postFileStructure: PostFileStructure;

	get octokit(): Octokit {
		return this._octokit;
	}

	constructor(
		token: string,
		owner: string,
		repo: string,
		postsPath: string,
		postFileStructure: PostFileStructure,
	) {
		this._octokit = new Octokit({
			auth: token,
		});
		this.owner = owner;
		this.repo = repo;
		this.postsPath = postsPath;
		this.postFileStructure = postFileStructure;
	}

	async getPostFolders(path = this.postsPath): Promise<GitHubPost[]> {
		if (this.postFileStructure === "folder-with-index") {
			return this.getPostsFromFoldersWithIndex(path);
		}
		return this.getPostsFromFlatFiles(path);
	}

	private async getPostsFromFoldersWithIndex(
		path: string,
	): Promise<GitHubPost[]> {
		try {
			const { data } = await this._octokit.rest.repos.getContent({
				owner: this.owner,
				repo: this.repo,
				path,
			});

			if (!Array.isArray(data)) {
				return [];
			}

			const posts: GitHubPost[] = [];

			// Look for directories that contain index.md files
			for (const item of data) {
				if (item.type === "dir") {
					// Check for index.md in each directory
					const indexPath = `${item.path}/index.md`;
					const fileContent = await this.getFileContent(indexPath);
					if (fileContent) {
						const postData = this.parsePostContent(
							fileContent,
							item.name,
							indexPath,
						);
						if (postData) {
							posts.push(postData);
						}
					}
				}
			}

			return posts;
		} catch (error) {
			console.error("Error fetching post folders:", error);
			return [];
		}
	}

	private async getPostsFromFlatFiles(path: string): Promise<GitHubPost[]> {
		try {
			const posts: GitHubPost[] = [];
			await this.collectMarkdownFiles(path, posts);
			return posts;
		} catch (error) {
			console.error("Error fetching flat files:", error);
			return [];
		}
	}

	private async collectMarkdownFiles(
		path: string,
		posts: GitHubPost[],
	): Promise<void> {
		try {
			const { data } = await this._octokit.rest.repos.getContent({
				owner: this.owner,
				repo: this.repo,
				path,
			});

			if (!Array.isArray(data)) {
				return;
			}

			for (const item of data) {
				if (item.type === "file") {
					const isMarkdown =
						item.name.endsWith(".md") || item.name.endsWith(".mdx");
					if (isMarkdown) {
						const fileContent = await this.getFileContent(item.path);
						if (fileContent) {
							const fileName = item.name.replace(/\.(md|mdx)$/, "");
							const postData = this.parsePostContent(
								fileContent,
								fileName,
								item.path,
							);
							if (postData) {
								posts.push(postData);
							}
						}
					}
				} else if (item.type === "dir") {
					// Recursive call for subdirectories
					await this.collectMarkdownFiles(item.path, posts);
				}
			}
		} catch (error) {
			console.error(`Error collecting markdown files from ${path}:`, error);
		}
	}

	private parsePostContent(
		content: string,
		folderName: string,
		path: string,
	): GitHubPost | null {
		try {
			// Parse frontmatter
			const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
			if (!frontmatterMatch) {
				return null;
			}

			const frontmatter = frontmatterMatch[1];
			const title =
				this.extractFrontmatterValue(frontmatter, "title") || folderName;
			const published =
				this.extractFrontmatterValue(frontmatter, "published") || "";
			const tagsString =
				this.extractFrontmatterValue(frontmatter, "tags") || "[]";
			const category =
				this.extractFrontmatterValue(frontmatter, "category") || "DEV";

			// Parse tags array
			let tags: string[] = [];
			try {
				tags = JSON.parse(tagsString.replace(/'/g, '"'));
			} catch {
				tags = [];
			}

			return {
				folderName,
				title,
				path,
				content,
				published,
				tags,
				category,
			};
		} catch (error) {
			console.error(`Error parsing post content for ${folderName}:`, error);
			return null;
		}
	}

	private extractFrontmatterValue(
		frontmatter: string,
		key: string,
	): string | null {
		const regex = new RegExp(`^${key}:\s*(.+)`, "m");
		const match = frontmatter.match(regex);
		return match ? match[1].trim() : null;
	}

	async getFileContent(path: string): Promise<string | null> {
		try {
			const { data } = await this._octokit.rest.repos.getContent({
				owner: this.owner,
				repo: this.repo,
				path,
			});

			if ("content" in data) {
				return Buffer.from(data.content, "base64").toString("utf-8");
			}
			return null;
		} catch (error) {
			console.error(`Error fetching file content for ${path}:`, error);
			return null;
		}
	}

	async findDiscussionByTitle(title: string): Promise<Discussion | null> {
		try {
			const query = `
				query($searchQuery: String!) {
					search(query: $searchQuery, type: DISCUSSION, first: 1) {
						nodes {
							... on Discussion {
								number
							title
							url
							createdAt
							category {
								name
							}
						}
						}
					}
				}
			`;

			// Search for discussions with exact title match
			const searchQuery = `repo:${this.owner}/${this.repo} "${title}"`;

			const result = await this._octokit.graphql(query, {
				searchQuery,
			});

			const discussions = (result as any).search.nodes;

			// Find exact title match
			const exactMatch = discussions.find((node: any) => node.title === title);

			if (exactMatch) {
				return {
					number: exactMatch.number,
					title: exactMatch.title,
					url: exactMatch.url,
					createdAt: exactMatch.createdAt,
					category: exactMatch.category,
				};
			}

			return null;
		} catch (error) {
			console.error(`Error finding discussion by title "${title}":`, error);
			return null;
		}
	}

	async getDiscussions(): Promise<Discussion[]> {
		try {
			const query = `
				query($owner: String!, $repo: String!, $first: Int!) {
					repository(owner: $owner, name: $repo) {
						discussions(first: $first) {
							nodes {
								number
							title
							url
							createdAt
							category {
								name
							}
						}
						}
					}
				}
			`;

			const result = await this._octokit.graphql(query, {
				owner: this.owner,
				repo: this.repo,
				first: 50,
			});

			const discussions = (result as any).repository.discussions.nodes.map(
				(node: any) => ({
					number: node.number,
					title: node.title,
					url: node.url,
					createdAt: node.createdAt,
					category: node.category,
				}),
			);

			return discussions;
		} catch (error) {
			console.error("Error fetching discussions:", error);
			return [];
		}
	}

	async getDiscussionComments(discussionNumber: number): Promise<any[]> {
		try {
			const query = `
				query($owner: String!, $repo: String!, $number: Int!, $first: Int!) {
					repository(owner: $owner, name: $repo) {
						discussion(number: $number) {
							comments(first: $first) {
								nodes {
									id
								body
									createdAt
									author {
										login
									}
								}
							}
						}
					}
				}
			`;

			const result = await this._octokit.graphql(query, {
				owner: this.owner,
				repo: this.repo,
				number: discussionNumber,
				first: 10,
			});

			return (result as any).repository.discussion.comments.nodes;
		} catch (error) {
			console.error(
				`Error fetching discussion comments for #${discussionNumber}:`,
				error,
			);
			return [];
		}
	}

	async addDiscussionComment(
		discussionId: string,
		body: string,
	): Promise<boolean> {
		try {
			const mutation = `
				mutation($discussionId: ID!, $body: String!) {
					addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
						comment {
							id
						}
					}
				}
			`;

			await this._octokit.graphql(mutation, {
				discussionId,
				body,
			});

			return true;
		} catch (error) {
			console.error("Error adding discussion comment:", error);
			return false;
		}
	}

	async getDiscussionId(discussionNumber: number): Promise<string | null> {
		try {
			const query = `
				query($owner: String!, $repo: String!, $number: Int!) {
					repository(owner: $owner, name: $repo) {
						discussion(number: $number) {
							id
						}
					}
				}
			`;

			const result = await this._octokit.graphql(query, {
				owner: this.owner,
				repo: this.repo,
				number: discussionNumber,
			});

			return (result as any).repository.discussion.id;
		} catch (error) {
			console.error(
				`Error fetching discussion ID for #${discussionNumber}:`,
				error,
			);
			return null;
		}
	}

	async createDiscussion(
		title: string,
		body: string,
		categoryId: string,
	): Promise<Discussion | null> {
		try {
			// First get repository ID
			const repoQuery = `
				query($owner: String!, $repo: String!) {
					repository(owner: $owner, name: $repo) {
						id
					}
				}
			`;

			const repoResult = await this._octokit.graphql(repoQuery, {
				owner: this.owner,
				repo: this.repo,
			});

			const repositoryId = (repoResult as any).repository.id;

			// Create discussion
			const mutation = `
				mutation($repositoryId: ID!, $title: String!, $body: String!, $categoryId: ID!) {
					createDiscussion(input: {
						repositoryId: $repositoryId,
						title: $title,
						body: $body,
						categoryId: $categoryId
					}) {
						discussion {
							id
							number
							title
							url
							createdAt
							category {
								name
							}
						}
					}
				}
			`;

			const result = await this._octokit.graphql(mutation, {
				repositoryId,
				title,
				body,
				categoryId,
			});

			const discussion = (result as any).createDiscussion.discussion;
			return {
				number: discussion.number,
				title: discussion.title,
				url: discussion.url,
				createdAt: discussion.createdAt,
				category: discussion.category,
			};
		} catch (error) {
			console.error("Error creating discussion:", error);
			return null;
		}
	}
}