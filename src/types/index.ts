export interface GitHubPost {
	folderName: string;
	title: string;
	path: string;
	content: string;
	published: string;
	tags: string[];
	category: string;
}

export interface Discussion {
	number: number;
	title: string;
	url: string;
	createdAt: string;
	category: {
		name: string;
	};
}

export interface DiscussionConfig {
	repo: string;
	repoId: string;
	categoryId: string;
}

export interface ProgressBarConfig {
	startDate: string;
	endDate: string;
	label: string;
}

export interface CommentGenerationConfig {
	// Generate prompt for AI comment generation
	promptTemplate: (post: GitHubPost) => string;
	// Optional progress bar configuration
	progressBar?: ProgressBarConfig;
	// Fallback comments when AI fails
	fallbackComments: string[];
}

export type PostFileStructure = "folder-with-index" | "flat-files";

export type DiscussionMappingType = "pathname-folder" | "pathname-url";

export interface GitHubRepoConfig {
	owner: string;
	repo: string;
	postsPath: string;
	postFileStructure: PostFileStructure;
	discussionMappingType: DiscussionMappingType;
	discussion: DiscussionConfig;
	commentGeneration: CommentGenerationConfig;
}

export interface AppConfig {
	github: {
		token: string;
	};
	repos: Record<string, GitHubRepoConfig>;
	gemini: {
		apiKey: string;
	};
}
