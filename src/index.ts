import { WatcherService } from "./services/watcher.js";
import { getConfig } from "./utils/config.js";

const main = async (): Promise<void> => {
	try {
		console.log("🌟 Starting Sigee Watcher...");

		const config = getConfig();
		const repoKeys = Object.keys(config.repos);

		console.log(`Found ${repoKeys.length} repository(s) to watch:`);
		for (const repoKey of repoKeys) {
			console.log(`  - ${repoKey}`);
		}
		console.log("");

		for (const repoKey of repoKeys) {
			console.log(`\n📦 Processing repository: ${repoKey}`);
			console.log("=".repeat(50));

			const watcher = new WatcherService(config, repoKey);
			await watcher.run();

			console.log("=".repeat(50));
		}

		console.log("\n🎯 All repositories processed, exiting...");
		process.exit(0);
	} catch (error) {
		console.error("❌ Failed to run watcher:", error);
		process.exit(1);
	}
};

main().catch((error) => {
	console.error("💥 Unhandled error:", error);
	process.exit(1);
});
