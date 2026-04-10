/**
 * Haiku 폴백 메타 추출 (Layer 3).
 *
 * 정규식(meta-extractor.ts)이 라벨 형식("기업명: ABC")만 인식하는 한계를 보완하기 위해,
 * 자연어로 작성된 미팅 노트에서 Claude Haiku로 메타데이터를 추출합니다.
 *
 * 설계 원칙:
 * - 정규식이 찾은 값은 절대 덮어쓰지 않음 (missingKeys만 요청)
 * - 환각 방지: 엄격한 프롬프트 룰 + few-shot 예시 + temperature 0
 * - Graceful fallback: API 에러는 호출자가 try/catch로 swallow
 * - Structured output 강제: tool_use 블록으로만 응답
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ExtractedMeta } from './meta-extractor';

// ── API key helper (claude-prompt.ts의 동일 로직 복제) ──
// 향후 3곳 이상에서 필요해지면 lib/anthropic-common.ts로 추출 리팩토링 예정.
function getApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const envPath = join(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
    if (match) return match[1].trim();
  } catch {}
  throw new Error('ANTHROPIC_API_KEY not found');
}

// ── 설정 상수 ──
// 2026.04 기준 최신 Haiku 모델. snapshot date 포함 ID로 버전 고정.
// 환경변수 ANTHROPIC_HAIKU_MODEL로 오버라이드 가능.
const HAIKU_MODEL = process.env.ANTHROPIC_HAIKU_MODEL ?? 'claude-haiku-4-5-20251001';
const HAIKU_TIMEOUT_MS = 10_000;
const MAX_TOKENS = 512;

// ── Tool Schema (structured output 강제) ──
const META_TOOL: Anthropic.Tool = {
  name: 'extract_meta',
  description: '한국어 컨설팅 미팅노트에서 메타데이터 4종을 추출',
  input_schema: {
    type: 'object' as const,
    properties: {
      companyName: {
        type: ['string', 'null'],
        description: '정식 법인명 또는 명확한 기업 식별자. 없거나 애매하면 반드시 null',
      },
      diagnosisDate: {
        type: ['string', 'null'],
        description: 'YYYY.MM.DD 형식의 진단/미팅 날짜. 없으면 반드시 null',
      },
      consultantName: {
        type: ['string', 'null'],
        description: '외부에서 진단을 진행한 컨설턴트 이름. 클라이언트측 인원 아님. 역할 애매하면 null',
      },
      participants: {
        type: ['string', 'null'],
        description: '클라이언트측 참여자 수(예: "5명") 또는 직책 목록. 컨설턴트 제외. 없으면 null',
      },
    },
    required: [],
  },
};

// ── System prompt (강력한 환각 방지) ──
function buildSystemPrompt(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}.${m}.${d}`;

  return `당신은 한국어 컨설팅 미팅 노트에서 메타데이터를 정확히 추출하는 전문가입니다.

오늘 날짜: ${todayStr}

## 엄격한 규칙 (반드시 준수)
1. **노트에 명시되지 않은 정보는 반드시 null 반환**. 추측·창작·환각 절대 금지.
2. **역할이 애매하면 null**. 예: "김철수 부장"만 있고 컨설턴트/참여자 구분 불가 → consultantName=null
3. **컨설턴트는 외부 진행자**. 클라이언트측 임직원(대표, 임원, 직원)은 컨설턴트 아님.
4. **참여자는 클라이언트측 미팅 참석자**. 컨설턴트/진행자는 참여자 제외.
5. **기업명**: 정식 법인명 우선, 브랜드명만 있으면 브랜드명 가능. 지시 대명사("저희 회사", "그 기업")는 반드시 null.
6. **진단일은 YYYY.MM.DD 형식**. 연도 생략 시 ${y}년 적용. "오늘"/"어제" 등 상대 표현은 오늘 날짜 기준 계산.

## 좋은 예
입력: "3월 4일 (주)그린푸드에서 AX 진단 진행. 조코딩의 김철수 컨설턴트, 참석자 5명."
출력: { companyName: "(주)그린푸드", diagnosisDate: "${y}.03.04", consultantName: "김철수", participants: "5명" }

## 나쁜 예 (절대 하지 말 것)
입력: "오늘 그 회사 다녀옴. 사장님이랑 얘기함."
잘못: { companyName: "XX기업" } ← 창작 금지
올바름: { companyName: null, diagnosisDate: "${todayStr}", consultantName: null, participants: null }`;
}

const USER_MESSAGE_PREFIX = '아래 미팅 노트에서 메타데이터를 추출하세요:\n\n';

/**
 * 정규식이 놓친 필드만 Haiku로 보강 추출합니다.
 *
 * @param notes 원본 미팅 노트 (정규식 stripped 버전이 아닌 원본 사용)
 * @param missingKeys 정규식에서 null인 필드 키 배열
 * @returns 요청한 필드 중 Haiku가 값을 찾은 것만 포함한 Partial 객체
 *
 * - 전달된 missingKeys에 해당하는 필드만 반환값에 포함
 * - 어떤 이유로든 값이 없으면 해당 키 자체를 omit
 * - API 에러는 throw됨 → 호출자가 try/catch로 graceful fallback 처리 필요
 */
export async function extractMissingMetaViaHaiku(
  notes: string,
  missingKeys: (keyof ExtractedMeta)[],
): Promise<Partial<ExtractedMeta>> {
  if (missingKeys.length === 0) return {};

  const client = new Anthropic({
    apiKey: getApiKey(),
    timeout: HAIKU_TIMEOUT_MS,
  });

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: buildSystemPrompt(),
    tools: [META_TOOL],
    tool_choice: { type: 'tool' as const, name: 'extract_meta' },
    messages: [{ role: 'user', content: USER_MESSAGE_PREFIX + notes }],
  });

  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    return {};
  }

  const raw = toolBlock.input as Record<string, unknown>;
  const result: Partial<ExtractedMeta> = {};

  // 요청한 필드만 반환, 나머지는 무시. string이고 trim 후 비어있지 않은 값만 채택.
  for (const key of missingKeys) {
    const val = raw[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      result[key] = val.trim();
    }
  }

  return result;
}
