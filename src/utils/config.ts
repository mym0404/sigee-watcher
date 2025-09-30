import { config } from "dotenv";
import type { AppConfig, GitHubRepoConfig } from "../types/index.js";

config();

const requiredEnvVars = ["GITHUB_TOKEN", "GEMINI_API_KEY"] as const;

const validateEnvironment = (): void => {
	const missing = requiredEnvVars.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}
};

// Repository configurations - add your repositories here
const REPO_CONFIGS: Record<string, GitHubRepoConfig> = {
	"sigee-min/www.sigee.xyz": {
		owner: "sigee-min",
		repo: "www.sigee.xyz",
		discussion: {
			repo: "sigee-min/www.sigee.xyz",
			repoId: "R_kgDOPCTBLQ",
			categoryId: "DIC_kwDOPCTBLc4CsOn9",
		},
		commentGeneration: {
			promptTemplate: (post) =>
				`
해군 SW 개발병 710기 동기의 블로그 포스트에 대한 댓글을 작성해주세요.

배경 정보:
- 댓글 작성자: 나(710기 동기, 전역 예정)
- 포스트 작성자: 최민석 수병
  * 10년 이상 장기복무를 결심하고 전문하사의 길을 선택
  * 강한 대한민국, 강한 해군을 만들기 위해 한 몸을 불사르는 각오
  * 대한민국 해군의 사이버 인프라와 디지털 전력 강화에 헌신
  * 단순한 의무복무가 아닌, 평생의 소명으로 해군 발전을 책임지겠다는 의지
  * 뛰어난 기술력과 솔선수범하는 리더십을 갖춘 인재

포스트 정보:
제목: ${post.title}
카테고리: ${post.category}
태그: ${post.tags.join(", ")}
내용: ${post.content.substring(0, 1000)}...

댓글 작성 가이드:
1. 기본 원칙:
   - 존댓말 필수 (반말 금지)
   - 진심이 담긴 격려와 칭찬
   - 200-350자 분량
   - 이모티콘 사용 금지

2. 핵심 메시지 (아래에서 2-4가지를 무작위로 선택하여 자연스럽게 조합, B는 무조건 포함):

   A. 기술적 역량 인정:
   - 포스트의 기술적 깊이와 통찰력 칭찬
   - 실무에 적용 가능한 내용임을 언급
   - 구체적인 기술 포인트에 대한 긍정적 피드백

   B. 10년 이상 장기복무 결심에 대한 격려와 존경:
   - "같은 710기 동기로서, 10년 이상 장기복무를 선택한 결정이 정말 존경스럽다"
   - "강한 대한민국, 강한 해군을 위한 민석님의 각오가 느껴진다"
   - "나는 전역하지만, 710기 동기인 민석님이 해군에 남아 헌신하니 든든하다"
   - "같은 710기로 입대해서 이렇게 다른 길을 가지만, 민석님의 결정을 진심으로 응원한다"
   - "단순한 복무가 아닌 소명으로 받아들이는 동기의 모습이 감동적이다"
   - "한 몸을 불사르겠다는 의지, 710기 동기로서 해군의 사이버 전력을 부탁한다"

   C. 710기 동기로서의 응원과 동료애:
   - "같은 710기로 입대해 함께 근무하며 느낀 솔선수범하는 리더십"
   - "동기로서 꾸준한 학습과 성장 자세를 지켜보며 존경스러웠다"
   - "710기 동기들에게 좋은 멘토이자 롤모델이 될 것"
   - "나는 전역하지만 동기인 민석님이 평생을 해군과 함께한다니 자랑스럽다"
   - "같은 시기에 입대한 동기로서, 민석님의 앞날을 응원한다"

   D. 대한민국 해군의 미래와 사이버 전력:
   - "이런 개발자가 10년 이상 해군에 있다니, 정말 든든하다"
   - "사이버 전력의 핵심이자 해군 디지털 전환의 주역"
   - "강한 해군, 강한 대한민국을 만드는 데 민석님이 큰 역할을 하실 것"
   - "해군의 사이버 인프라를 책임질 핵심 인재"

3. 표현 다양화:
   - 매번 다른 시작 문장 (칭찬, 감탄, 공감, 격려 등)
   - 문장 길이와 구조를 변화있게
   - 때로는 포스트 내용에 집중, 때로는 민석님의 결정과 미래에 집중
   - 진지함과 친근함의 비율을 조절

4. 금지사항:
   - 이모티콘 사용 절대 금지
   - 과도하게 격식을 차리거나 딱딱한 표현 지양
   - 같은 패턴의 반복 지양
			`.trim(),
			progressBar: {
				startDate: "2025.01.06",
				endDate: "2026.09.05",
				label: "해군병 SW 개발병 710기 전역까지",
			},
			fallbackComments: [
				"같은 710기 동기로서, 10년 이상 장기복무를 결심하신 민석님이 정말 자랑스럽습니다. 강한 해군을 부탁드립니다.",
				"710기로 함께 입대했지만 이렇게 다른 길을 가게 되네요. 한 몸을 불사르겠다는 민석님의 각오, 진심으로 존경합니다.",
				"저는 전역하지만, 710기 동기인 민석님이 해군에 남아 헌신하시니 든든합니다. 해군의 미래를 부탁드립니다.",
				"같은 710기 동기로서 민석님의 10년 이상 장기복무 결정을 응원합니다. 강한 대한민국을 만드는 데 큰 힘이 되실 것입니다.",
				"710기로 함께 근무하며 느낀 점은, 민석님이야말로 해군 디지털 전환의 핵심이 되실 분이라는 것입니다. 동기로서 응원합니다.",
			],
		},
	},
	// Add more repository configurations here
	// "owner/repo": { ... },
};

export const getConfig = (): AppConfig => {
	validateEnvironment();

	return {
		github: {
			token: process.env.GITHUB_TOKEN as string,
		},
		repos: REPO_CONFIGS,
		gemini: {
			apiKey: process.env.GEMINI_API_KEY as string,
		},
	};
};
