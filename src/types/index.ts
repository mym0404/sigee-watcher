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

export interface AppConfig {
	github: {
		token: string;
		owner: string;
		repo: string;
	};
	discussion: DiscussionConfig;
	gemini: {
		apiKey: string;
	};
	webhookSecret?: string;
}
