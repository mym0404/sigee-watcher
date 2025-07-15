# Sigee Watcher

GitHub repository watcher that automatically adds Giscus comments to posts in https://github.com/sigee-min/www.sigee.xyz.

## Features

- 🔍 Monitors GitHub repository for new posts
- 🤖 Automatically adds Giscus comment script to posts without comments
- ⏰ Runs on configurable cron schedule
- 🔧 Fully configurable via environment variables

## Setup

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build the project:**
   ```bash
   pnpm run build
   ```

4. **Start the watcher:**
   ```bash
   pnpm start
   ```

## Development

- **Development mode:** `pnpm run dev` (compile + run)
- **Watch mode:** `pnpm run dev:watch` (compile in watch mode)
- **Type checking:** `pnpm run typecheck`
- **Linting:** `pnpm run lint`
- **Formatting:** `pnpm run format`

## Environment Variables

See `.env.example` for required configuration.

## Scripts

- `pnpm run build` - Build TypeScript to JavaScript
- `pnpm run start` - Start production server
- `pnpm run dev` - Compile TypeScript and run with Node.js
- `pnpm run dev:watch` - Compile TypeScript in watch mode
- `pnpm run lint` - Run linter
- `pnpm run format` - Format code
- `pnpm run typecheck` - Type checking without build