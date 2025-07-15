import { WatcherService } from "./services/watcher.js";
import { getConfig } from "./utils/config.js";

const main = async (): Promise<void> => {
	try {
		console.log("🌟 Starting Sigee Watcher...");

		const config = getConfig();
		const watcher = new WatcherService(config);

		await watcher.run();

		console.log("🎯 Watcher run completed, exiting...");
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
