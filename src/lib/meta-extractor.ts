/**
 * 미팅 노트에서 라벨 형식의 메타데이터를 정규식으로 추출하고,
 * 추출된 라인을 노트에서 제거한 "순수 본문"을 반환합니다.
 *
 * 목적: 캐시 키 계산 시 메타데이터(기업명/진단일/컨설턴트/참여자)는 제외하여
 * 이 값들만 다른 입력에 대해서도 캐시 히트가 발생하게 함.
 *
 * 지원 형식 (줄 시작에서):
 *   - 라벨: 값
 *   - • 라벨: 값
 *   * 라벨: 값
 *   라벨: 값
 *   라벨 : 값
 *   라벨 ： 값 (전각 콜론)
 */

export interface ExtractedMeta {
  companyName: string | null;
  diagnosisDate: string | null;
  consultantName: string | null;
  participants: string | null;
}

interface FieldSpec {
  key: keyof ExtractedMeta;
  labels: string[];
}

const FIELD_SPECS: FieldSpec[] = [
  { key: 'companyName', labels: ['기업명', '회사명', '법인명'] },
  { key: 'diagnosisDate', labels: ['진단일', '미팅날짜', '미팅 날짜', '미팅일', '일시'] },
  { key: 'consultantName', labels: ['컨설턴트', '컨설턴트명', '담당', '담당자', '컨설턴트 담당'] },
  { key: 'participants', labels: ['인터뷰 참여자', '참여자', '참석자', '인터뷰어', '참석인원'] },
];

function buildRegex(labels: string[]): RegExp {
  // 라벨 문자열을 정규식에 안전하게 삽입 (공백은 \s*로 변환하여 "미팅 날짜"/"미팅날짜" 모두 매칭)
  const escaped = labels
    .map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'))
    .join('|');
  // 콜론 있는 패턴: "라벨: 값" 또는 "라벨 ： 값"
  // 콜론 없는 패턴: "라벨 값" (공백만으로 구분, 값이 비어있지 않아야 함)
  return new RegExp(
    `^[\\s\\-•*]*(?:${escaped})[\\s]*(?:[:：][\\s]*|\\s+)(.+?)[\\s]*$`,
    'm',
  );
}

// ── 날짜 전용 패턴 (라벨 없이 날짜만 단독으로 한 줄에 있는 경우) ──
// "2026년 3월 4일", "2026.03.04", "2026-03-04", "3월 4일" 등
const DATE_ONLY_PATTERNS = [
  // 2026년 3월 4일 / 2026년 03월 04일
  /^[\s\-•*]*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일[\s]*$/m,
  // 3월 4일 (연도 없음 → 올해 적용)
  /^[\s\-•*]*(\d{1,2})월\s*(\d{1,2})일[\s]*$/m,
  // 2026.03.04 / 2026-03-04 (한 줄에 날짜만)
  /^[\s\-•*]*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})[\s]*$/m,
];

const COMPILED = FIELD_SPECS.map(spec => ({
  ...spec,
  regex: buildRegex(spec.labels),
}));

export function extractMetadata(rawNotes: string): {
  meta: ExtractedMeta;
  strippedNotes: string;
} {
  let stripped = rawNotes;
  const meta: ExtractedMeta = {
    companyName: null,
    diagnosisDate: null,
    consultantName: null,
    participants: null,
  };

  for (const { key, regex } of COMPILED) {
    const match = stripped.match(regex);
    if (match) {
      const value = match[1]?.trim();
      if (value) {
        meta[key] = value;
        // 매칭된 줄 전체를 제거 (해당 라인을 빈 줄로 대체)
        stripped = stripped.replace(regex, '');
      }
    }
  }

  // ── 날짜 전용 패턴: 라벨 없이 날짜만 한 줄에 있는 경우 (diagnosisDate가 아직 null일 때만) ──
  if (!meta.diagnosisDate) {
    const year = new Date().getFullYear();
    for (const pattern of DATE_ONLY_PATTERNS) {
      const m = stripped.match(pattern);
      if (m) {
        if (m.length === 4) {
          // 연도 + 월 + 일 (그룹 3개)
          const [, y, mo, d] = m;
          meta.diagnosisDate = `${y}.${mo.padStart(2, '0')}.${d.padStart(2, '0')}`;
        } else if (m.length === 3) {
          // 월 + 일 (연도 없음 → 올해)
          const [, mo, d] = m;
          meta.diagnosisDate = `${year}.${mo.padStart(2, '0')}.${d.padStart(2, '0')}`;
        }
        if (meta.diagnosisDate) {
          stripped = stripped.replace(pattern, '');
          break;
        }
      }
    }
  }

  // 연속된 빈 줄 정리
  stripped = stripped.replace(/\n{3,}/g, '\n\n').trim();

  return { meta, strippedNotes: stripped };
}
