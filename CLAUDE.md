# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sigee Watcher는 GitHub 저장소를 모니터링하여 자동으로 Giscus 댓글을 게시물에 추가하는 자동화 도구입니다. `sigee-min/www.sigee.xyz` 저장소의 블로그 포스트를 감시하고, GitHub Discussions를 생성하며, Gemini AI를 사용해 환영 댓글을 자동으로 추가합니다.

## Commands

### Development
```bash
# Build TypeScript to JavaScript
pnpm run build

# Compile and run (production)
pnpm start

# Compile and run (development)
pnpm run dev

# Compile in watch mode (doesn't run the code)
pnpm run dev:watch

# Type checking without emitting files
pnpm run typecheck
```

### Code Quality
```bash
# Run Biome linter
pnpm run lint

# Run linter with auto-fix
pnpm run lint:fix

# Format code with Biome
pnpm run format

# Run Biome check with auto-fix (includes linting and formatting)
pnpm run check

# Quick check: Biome check + typecheck
pnpm run t
```

### Cleanup
```bash
# Remove compiled dist directory
pnpm run clean
```

## Architecture

### Entry Point
- `src/index.ts`: 애플리케이션 진입점으로 WatcherService를 초기화하고 실행합니다.

### Core Services (Service Layer)

#### WatcherService (`src/services/watcher.ts`)
- 전체 워크플로우를 조율하는 메인 서비스
- `.cache/processed-postidid2.json` 파일에 처리된 게시물을 캐싱하여 중복 처리 방지
- 워크플로우:
  1. 저장소에서 모든 게시물 조회 (GitHubService 사용)
  2. 처리된 게시물 캐시 로드
  3. 각 게시물에 대해:
     - 이미 처리된 게시물은 스킵
     - Discussion 제목 생성 (DiscussionService 사용)
     - Discussion 존재 여부 확인 후 없으면 생성 (GitHubService 사용)
     - Discussion에 댓글이 없거나 mym0404의 댓글이 없으면 환영 댓글 추가
  4. 처리 완료된 게시물을 캐시에 기록

#### GitHubService (`src/services/github.ts`)
- Octokit REST API와 GraphQL API를 사용하여 GitHub와 상호작용
- 주요 기능:
  - `getPostFolders()`: `src/content/posts/` 디렉토리에서 index.md 파일을 포함한 모든 포스트 폴더 조회
  - Frontmatter 파싱 (title, published, tags, category)
  - Discussion CRUD: 생성, 조회, 제목으로 검색
  - Discussion 댓글: 조회, 추가
  - GraphQL을 사용한 Discussion ID 조회

#### DiscussionService (`src/services/discussion.ts`)
- Giscus 형식의 Discussion 제목 생성: `posts/{folderName}/`
- Gemini AI (`gemini-2.5-flash` 모델)를 사용하여 개인화된 환영 댓글 생성
- 해군 SW 개발병 710기 전역 진행률을 ASCII 프로그레스 바로 표시
- Gemini API 실패 시 fallback 댓글 템플릿 사용

### Configuration
- `src/utils/config.ts`:
  - 환경 변수 검증 및 기본값 설정
  - 필수 환경 변수: `GITHUB_TOKEN`, `GEMINI_API_KEY`
  - 선택 환경 변수: `GITHUB_OWNER`, `GITHUB_REPO`, `DISCUSSION_REPO`, `DISCUSSION_REPO_ID`, `DISCUSSION_CATEGORY_ID`
  - 기본값은 `sigee-min/www.sigee.xyz` 저장소를 대상으로 설정

### Types
- `src/types/index.ts`: TypeScript 인터페이스 정의
  - `GitHubPost`: 블로그 포스트 데이터 구조
  - `Discussion`: GitHub Discussion 데이터 구조
  - `DiscussionConfig`: Discussion 설정
  - `AppConfig`: 전체 애플리케이션 설정

## Code Style

- **Formatter**: Biome with tab indentation
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Module System**: ESNext with `.js` extensions in imports (TypeScript with ES modules)
- **Target**: ES2022
- **Type Safety**: Strict mode enabled

## Environment Variables

필수 환경 변수를 `.env` 파일에 설정해야 합니다:
- `GITHUB_TOKEN`: GitHub Personal Access Token (repo, discussions 권한 필요)
- `GEMINI_API_KEY`: Google Gemini API Key

## Important Notes

- 이 프로젝트는 일회성 실행 모드로 동작합니다 (cron이나 스케줄러에서 주기적으로 실행)
- 처리된 게시물은 `.cache/processed-postidid2.json`에 캐싱되어 중복 처리를 방지합니다
- mym0404 사용자의 댓글이 이미 있는지 확인하여 중복 댓글 방지
- Gemini AI는 한국어로 진지하고 존중하는 어투의 댓글을 생성합니다