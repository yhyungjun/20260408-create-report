import type { ReportFields } from './report-schema';

function getGrade(total: number): string {
  if (total >= 20) return 'A등급 — AI 선도 기업';
  if (total >= 15) return 'B등급 — AI 실험 기업';
  if (total >= 10) return 'C등급 — AI 관심 기업';
  return 'D등급 — AI 미인지 기업';
}

function toList(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(Boolean);
  return [];
}

export function renderReport(htmlTemplate: string, fields: ReportFields): string {
  let html = htmlTemplate;

  const replace = (pattern: string, value: string | null | undefined) => {
    if (value != null) {
      html = html.replaceAll(pattern, value);
    }
  };

  // ── 인터뷰 정보 (diagnosisDate 전역 치환보다 먼저) ──
  if (fields.interviewInfo) {
    const info = fields.interviewInfo;
    if (info.participants) {
      // 특정 패턴: 참여자 {N}명, {YYYY.MM.DD} 실시
      html = html.replace(
        /참여자 \{N\}명, \{YYYY\.MM\.DD\} 실시/,
        `참여자 ${info.participants}명, ${info.date || '—'} 실시`
      );
    }
  }

  // 기업명
  replace('{기업명}', fields.companyName);
  replace('{정식 법인명}', fields.companyName);
  replace('{기업}', fields.companyName);

  // 메타 정보
  replace('{YYYY.MM.DD}', fields.diagnosisDate);
  replace('{컨설턴트명}', fields.consultantName);

  // 기업 기본정보
  replace('{예: 제조업 / IT서비스 / 유통}', fields.industry);
  replace('{핵심 사업 서술}', fields.businessDesc);
  replace('{B2B / B2C / B2G}', fields.customerType);
  replace('{10억 미만 / 10~50억 / 50~100억 / 100억 이상}', fields.revenue);

  // 임직원 수
  if (fields.employees) {
    const e = fields.employees;
    html = html.replace(
      /\{N\}명 \(정규직 \{N\} \/ 비정규직 \{N\}\)/,
      `${e.total}명 (정규직 ${e.regular} / 비정규직 ${e.contract})`
    );
    html = html.replace('{기업명} 전 부서 · 전 직원',
      `${fields.companyName || ''} 전 부서 · 전 직원`);
    // P9 전환 대상 (총 {N}명)
    html = html.replace(/\(총 \{N\}명\)/, `(총 ${e.total}명)`);
  }

  // AI 도입 단계
  if (fields.aiStage != null) {
    replace('{N}단계', `${fields.aiStage}단계`);
    for (let i = 1; i <= 5; i++) {
      if (i === fields.aiStage) {
        html = html.replace(
          new RegExp(`<div class="stage">(\\s*<div class="dot"></div>${i}단계)`),
          `<div class="stage active">$1`
        );
      } else {
        html = html.replace(
          new RegExp(`<div class="stage active">(\\s*<div class="dot"></div>${i}단계)`),
          `<div class="stage">$1`
        );
      }
    }
  }

  // 핵심 문제 키워드
  replace('{핵심 문제 키워드}', fields.coreProblem);

  // AI 예산
  if (fields.aiBudget) {
    replace('{금액 또는 없음}', fields.aiBudget.toolSubscription);
    replace('{금액 또는 없음}', fields.aiBudget.educationBudget);
  }

  // AI 전담 인력
  if (fields.aiSpecialists != null) {
    replace('{N명 또는 없음}', `${fields.aiSpecialists}명`);
  }

  // ── 5개 영역 점수 + 등급 + Chart.js ──
  if (fields.scores) {
    const s = fields.scores;
    const total = s.strategy + s.data + s.process + s.talent + s.tech;
    const scoreMap: [string, number, number][] = [
      ['AI 전략', s.strategy, 4.0],
      ['데이터', s.data, 3.5],
      ['프로세스', s.process, 4.0],
      ['인재역량', s.talent, 4.0],
      ['기술환경', s.tech, 4.0],
    ];
    for (const [label, score, target] of scoreMap) {
      const pct = Math.round((score / 5) * 100);
      const gapColor = pct < 40 ? 'var(--gap-high)' : pct < 60 ? 'var(--gap-mid)' : 'var(--gap-low)';
      const metricRegex = new RegExp(
        `<div class="metric"><div class="label">${label}</div><div class="score">[\\d.]+</div><div class="target">목표 [\\d.]+</div><div class="gap-bar"><div class="gap-fill" style="width:\\d+%;background:var\\(--gap-(?:high|mid|low)\\)"></div></div></div>`
      );
      html = html.replace(metricRegex,
        `<div class="metric"><div class="label">${label}</div><div class="score">${score.toFixed(1)}</div><div class="target">목표 ${target.toFixed(1)}</div><div class="gap-bar"><div class="gap-fill" style="width:${pct}%;background:${gapColor}"></div></div></div>`
      );
    }
    // 총점 — "12.0/25" 패턴과 종합점수 span의 독립 "12.0" 모두 교체
    html = html.replace(/12\.0\/25/g, `${total.toFixed(1)}/25`);
    // 종합 점수 큰 숫자 (font-size:36px)
    html = html.replace(
      /(<span style="font-size:36px;font-weight:900;color:var\(--brand\)">)12\.0(<\/span>)/,
      `$1${total.toFixed(1)}$2`
    );

    // 등급 라벨
    const grade = getGrade(total);
    html = html.replace(
      /B등급 — AI 실험 기업/g,
      grade
    );

    // P4 성숙도 진단 상세 테이블 — 5개 행의 현재/Gap/판정 교체
    const detailRows: [string, number, number][] = [
      ['AI 전략 & 리더십', s.strategy, 4.0],
      ['데이터 인프라', s.data, 3.5],
      ['업무 프로세스 AI 적용', s.process, 4.0],
      ['인재 & 조직 역량', s.talent, 4.0],
      ['기술 환경 & 도구', s.tech, 4.0],
    ];
    for (const [label, score, tgt] of detailRows) {
      const gap = score - tgt;
      const absGap = Math.abs(gap);
      const gapBg = absGap >= 1.5 ? '#fee2e2' : absGap >= 1.0 ? '#fef3c7' : '#dcfce7';
      const gapColor = absGap >= 1.5 ? '#991b1b' : absGap >= 1.0 ? '#92400e' : '#166534';
      const dotColor = absGap >= 1.5 ? 'var(--gap-high)' : absGap >= 1.0 ? 'var(--gap-mid)' : 'var(--gap-low)';
      const gapLabel = absGap >= 2.0 ? '매우 높은 Gap' : absGap >= 1.5 ? '높은 Gap' : absGap >= 1.0 ? '중간 Gap' : '낮은 Gap';
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rowRegex = new RegExp(
        `<tr><td style="font-weight:600">${escaped}</td><td[^>]*>[\\d.]+</td><td[^>]*>[\\d.]+</td><td[^>]*><span[^>]*>[^<]+</span></td><td>[\\s\\S]*?</td></tr>`
      );
      html = html.replace(rowRegex,
        `<tr><td style="font-weight:600">${label}</td><td style="text-align:center;font-weight:700;color:var(--brand)">${score.toFixed(1)}</td><td style="text-align:center">${tgt.toFixed(1)}</td><td style="text-align:center"><span style="background:${gapBg};color:${gapColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${gap.toFixed(1)}</span></td><td><span style="color:${dotColor}">●</span> ${gapLabel}</td></tr>`
      );
    }

    // P4 벤치마크 독립 "12.0" (stat-val) — {기업명}이 이미 치환된 후일 수 있으므로 유연하게 매치
    html = html.replace(
      /(<div class="stat-val" style="color:var\(--brand\)">)12\.0(<\/div><div class="stat-label">)[^<]*(현재<\/div>)/,
      `$1${total.toFixed(1)}$2${fields.companyName || ''} $3`
    );

    // P2 인사이트 텍스트 내 점수 치환
    html = html.replace(/AI 성숙도\(B등급, 12\.0\/25점\)/, `AI 성숙도(${grade}, ${total.toFixed(1)}/25점)`);
    html = html.replace(/데이터 인프라\(1\.7점\)/, `데이터 인프라(${s.data.toFixed(1)}점)`);
    html = html.replace(/인재 역량\(2\.0점\)/, `인재 역량(${s.talent.toFixed(1)}점)`);
    html = html.replace(/기술 환경\(3\.3점\)/, `기술 환경(${s.tech.toFixed(1)}점)`);

    // Chart.js 데이터 동기화
    const currentData = `[${s.strategy.toFixed(1)},${s.data.toFixed(1)},${s.process.toFixed(1)},${s.talent.toFixed(1)},${s.tech.toFixed(1)}]`;
    // 레이더 차트 + 갭 차트의 현재 데이터 교체
    html = html.replace(
      /data:\[2\.3,1\.7,2\.7,2\.0,3\.3\]/g,
      `data:${currentData}`
    );
  }

  // ── 우선 과제 (정확히 4개) ──
  if (fields.topTasks && fields.topTasks.length > 0) {
    const urgencyColor = (u: string) => {
      if (u.includes('높') || u.toLowerCase().includes('high')) return 'var(--gap-high)';
      if (u.includes('낮') || u.toLowerCase().includes('low')) return 'var(--gap-low)';
      return 'var(--gap-mid)';
    };
    const topTasks4 = fields.topTasks.slice(0, 4);
    // 우선 과제 테이블은 알파벳 부분만 추출 ([A] 워크숍 → [A])
    const moduleLetter = (m: string) => {
      const match = m.match(/\[([A-Z])\]/);
      return match ? `[${match[1]}]` : m;
    };
    const rows = topTasks4.map((task, i) =>
      `<tr><td style="font-weight:700;color:var(--brand)">${i + 1}</td><td>${task.name}</td><td><span style="background:#f3f0ff;color:var(--brand-dark);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${moduleLetter(task.module)}</span></td><td><span style="color:${urgencyColor(task.urgency)};font-weight:700">● ${task.urgency}</span></td></tr>`
    ).join('\n      ');

    // 기존 4행을 교체
    html = html.replace(
      /<tr><td style="font-weight:700;color:var\(--brand\)">1<\/td>[\s\S]*?<\/tr>\s*<tr><td style="font-weight:700;color:var\(--brand\)">2<\/td>[\s\S]*?<\/tr>\s*<tr><td style="font-weight:700;color:var\(--brand\)">3<\/td>[\s\S]*?<\/tr>\s*<tr><td style="font-weight:700;color:var\(--brand\)">4<\/td>[\s\S]*?<\/tr>/,
      rows
    );

    // ── 권장 경로 = topTasks의 module(알파벳만) + 과제명 가로형 화살표 ──
    const pathSteps = topTasks4
      .map(t => `<div class="path-step" style="display:inline-flex;align-items:center;gap:6px"><span style="background:#f3f0ff;color:var(--brand-dark);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;flex-shrink:0">${moduleLetter(t.module)}</span><span style="color:var(--text)">${t.name}</span></div>`)
      .join('<span class="path-arrow" style="color:#aaa;font-weight:700">→</span>\n        ');

    html = html.replace(
      /<div class="path-step"[\s\S]*?<\/div>(?:<span class="path-arrow"[\s\S]*?<\/span>\s*<div class="path-step"[\s\S]*?<\/div>){3}/,
      pathSteps
    );
  }

  // ── SWOT 분석 ──
  if (fields.swot) {
    const renderSwotList = (items: unknown): string => {
      const list = toList(items);
      if (list.length === 0) return '<li>—</li>';
      return list.map(item => `<li>${item}</li>`).join('\n          ');
    };

    const swotSections: [string, unknown][] = [
      ['swot-s', fields.swot.strengths],
      ['swot-w', fields.swot.weaknesses],
      ['swot-o', fields.swot.opportunities],
      ['swot-t', fields.swot.threats],
    ];

    for (const [cls, items] of swotSections) {
      const listHtml = renderSwotList(items);
      html = html.replace(
        new RegExp(`(<div class="swot-cell ${cls}">\\s*<h4>[^<]+</h4>\\s*)<ul>[\\s\\S]*?</ul>`),
        `$1<ul>\n          ${listHtml}\n        </ul>`
      );
    }
  }

  // ── P5 Pain Points 테이블 ──
  if (fields.painPoints && fields.painPoints.length > 0) {
    const ppRows = fields.painPoints.slice(0, 4).map(pp => {
      const prColor = pp.priority.includes('높') ? 'var(--gap-high)' : pp.priority.includes('낮') ? 'var(--gap-low)' : 'var(--gap-mid)';
      return `<tr><td style="font-weight:600">${pp.dept}</td><td>${pp.task}</td><td>${pp.painPoint}</td><td style="text-align:center">${pp.weeklyHours}</td><td style="text-align:center">${pp.aiApplicability}</td><td style="text-align:center"><span style="color:${prColor};font-weight:700">${pp.priority}</span></td></tr>`;
    }).join('\n      ');
    html = html.replace(
      /<tr><td style="font-weight:600">마케팅<\/td>[\s\S]*?<tr><td style="font-weight:600">인사<\/td>[\s\S]*?<\/tr>/,
      ppRows
    );
  }

  // ── P5 발견 사항 ──
  if (fields.findings) {
    const findingsList = toList(fields.findings);
    if (findingsList.length > 0) {
      const findingsHtml = findingsList.map((f, i) =>
        `<div class="finding"><strong>발견 ${i + 1}:</strong> ${f}</div>`
      ).join('\n      ');
      html = html.replace(
        /<div class="finding"><strong>발견 1:<\/strong>[\s\S]*?<\/div>\s*<div class="finding"><strong>발견 2:<\/strong>[\s\S]*?<\/div>\s*<div class="finding"><strong>발견 3:<\/strong>[\s\S]*?<\/div>/,
        findingsHtml
      );
    }
  }

  // ── P6 내부 역량 진단 테이블 ──
  if (fields.internalCapabilities && fields.internalCapabilities.length > 0) {
    const capRows = fields.internalCapabilities.map(cap => {
      const levelColor = cap.level.includes('양호') ? 'var(--gap-low)' : cap.level.includes('미흡') ? 'var(--gap-high)' : 'var(--gap-mid)';
      return `<tr><td style="font-weight:600">${cap.area}</td><td>${cap.summary}</td><td style="text-align:center"><span style="color:${levelColor};font-weight:700">●</span></td><td>${cap.issue}</td></tr>`;
    }).join('\n      ');
    html = html.replace(
      /<tr><td style="font-weight:600">경영진 리더십<\/td>[\s\S]*?<tr><td style="font-weight:600">재무 여력<\/td>[\s\S]*?<\/tr>/,
      capRows
    );
  }

  // ── P6 협업 도구 ──
  if (fields.collaborationTool) {
    replace('{Slack/Teams}', fields.collaborationTool);
  }

  // ── P6 업종별 AI 적용 영역 ──
  if (fields.aiApplicationAreas) {
    replace('{예: 고객응대, 재고예측, 콘텐츠 생성}', fields.aiApplicationAreas);
  }

  // ── P7 SWOT 교차 전략 ──
  if (fields.crossStrategies) {
    const cs = fields.crossStrategies;
    const crossPairs: [string, string, string][] = [
      ['SO', '강점 × 기회 → 공격 전략', cs.so],
      ['WO', '약점 × 기회 → 개선 전략', cs.wo],
      ['ST', '강점 × 위협 → 방어 전략', cs.st],
      ['WT', '약점 × 위협 → 생존 전략', cs.wt],
    ];
    for (const [code, , text] of crossPairs) {
      const regex = new RegExp(
        `(<h5><span[^>]*>${code}<\\/span>[^<]*<\\/h5>\\s*)<p>[\\s\\S]*?<\\/p>`
      );
      html = html.replace(regex, `$1<p>${text}</p>`);
    }
  }

  // ── P8 Gap As-Is/To-Be ──
  if (fields.gapAnalysis && fields.gapAnalysis.length > 0) {
    const gapLabels = ['AI 전략', '데이터', '프로세스', '인재역량', '기술환경'];
    for (let i = 0; i < Math.min(fields.gapAnalysis.length, gapLabels.length); i++) {
      const g = fields.gapAnalysis[i];
      const label = gapLabels[i];
      // 전체 gap-row를 교체 (Gap 배지는 scores에서 계산)
      const gapRegex = new RegExp(
        `<div class="gap-row"><span style="font-weight:600">${label}</span>[\\s\\S]*?</div>\\s*(?=<div class="gap-row">|</div>\\s*<div class="summary-box")`
      );
      // scores 기반 gap 레벨 계산
      let gapLevel = '중간';
      let gapBg = '#fef3c7';
      let gapColor = '#92400e';
      if (fields.scores) {
        const scoreMap: Record<string, number> = { 'AI 전략': fields.scores.strategy, '데이터': fields.scores.data, '프로세스': fields.scores.process, '인재역량': fields.scores.talent, '기술환경': fields.scores.tech };
        const targetMap: Record<string, number> = { 'AI 전략': 4.0, '데이터': 3.5, '프로세스': 4.0, '인재역량': 4.0, '기술환경': 4.0 };
        const absGap = Math.abs((scoreMap[label] || 0) - (targetMap[label] || 0));
        if (absGap >= 1.5) { gapLevel = absGap >= 2.0 ? '매우높음' : '높음'; gapBg = '#fee2e2'; gapColor = '#991b1b'; }
        else if (absGap < 1.0) { gapLevel = '낮음'; gapBg = '#dcfce7'; gapColor = '#166534'; }
      }
      html = html.replace(gapRegex,
        `<div class="gap-row"><span style="font-weight:600">${label}</span><span style="font-size:11.5px;color:var(--sub)">${g.asIs}</span><span style="font-size:11.5px">${g.toBe}</span><span><span style="background:${gapBg};color:${gapColor};padding:2px 6px;border-radius:3px;font-size:10px;font-weight:700">${gapLevel}</span></span><span style="font-size:11.5px">${g.action}</span></div>\n      `
      );
    }

    // GAP summary-box + expert-box 동적 교체 (표 속성 기반)
    if (fields.scores) {
      const s = fields.scores;
      const detailLabels = ['AI 전략', '데이터 인프라', '프로세스', '인재 & 조직 역량', '기술환경'];
      const shortLabels = ['AI 전략', '데이터', '프로세스', '인재역량', '기술환경'];
      const scoreValues = [s.strategy, s.data, s.process, s.talent, s.tech];
      const targets = [4.0, 3.5, 4.0, 4.0, 4.0];
      const gaps = scoreValues.map((v, i) => ({ label: shortLabels[i], detailLabel: detailLabels[i], gap: Math.abs(targets[i] - v), score: v, target: targets[i] }));
      const sorted = [...gaps].sort((a, b) => b.gap - a.gap);
      const top1 = sorted[0];
      const top2 = sorted[1];

      // summary-box: "가장 시급한 영역은..."
      html = html.replace(
        /<div class="summary-box" style="margin-top:16px">\s*<p>가장 시급한 영역은[\s\S]*?<\/p>\s*<\/div>(\s*<div class="expert-box eb-insight">\s*<div class="eb-head"><span class="eb-icon">💡<\/span> Gap 분석 전문 소견<\/div>)\s*<div class="eb-body">[\s\S]*?<\/div>/,
        `<div class="summary-box" style="margin-top:16px">
      <p>가장 시급한 영역은 <strong>${top1.detailLabel}</strong>이며, <strong>${top2.detailLabel}</strong>을 병행 개선하여 3개월 내 기초 체질을 전환하는 것이 핵심입니다.</p>
    </div>
    $1
      <div class="eb-body">Gap이 가장 큰 <em>${top1.detailLabel}(${top1.gap.toFixed(1)}점 Gap)</em>와 <em>${top2.detailLabel}(${top2.gap.toFixed(1)}점 Gap)</em>은 상호 의존적입니다. ${top1.label} 영역의 현재 수준(${top1.score.toFixed(1)}점)을 목표(${top1.target.toFixed(1)}점)까지 끌어올리기 위해서는 ${top2.label} 역량(${top2.score.toFixed(1)}점)이 뒷받침되어야 합니다. <em>두 영역을 동시에 착수하되, 교육 과정에서 실제 데이터를 다루는 "Learning by Doing" 방식</em>으로 설계하는 것이 핵심입니다.</div>`
      );
    }
  }

  // ── P10 혁신 과제 테이블 ──
  if (fields.innovationTasks && fields.innovationTasks.length > 0) {
    const itRows = fields.innovationTasks.slice(0, 8).map((t, i) => {
      const prClass = t.priority === 'P1' ? 'tp-high' : t.priority === 'P3' ? 'tp-low' : 'tp-mid';
      return `<tr><td style="font-weight:900;color:var(--brand)">${i + 1}</td><td style="font-weight:600">${t.name}</td><td>${t.dept}</td><td><span class="task-priority tp-mid">${t.type}</span></td><td style="text-align:center">${t.difficulty}</td><td style="text-align:center;font-weight:700;color:var(--gap-low)">${t.effect}</td><td style="text-align:center"><span class="task-priority ${prClass}">${t.priority}</span></td></tr>`;
    }).join('\n      ');
    html = html.replace(
      /<tr><td style="font-weight:900;color:var\(--brand\)">1<\/td><td style="font-weight:600">월말 재무 보고서 자동 생성[\s\S]*?<tr><td style="font-weight:900;color:var\(--brand\)">8<\/td>[\s\S]*?<\/tr>/,
      itRows
    );
  }

  // ── P11 세부 추진 계획 테이블 ──
  if (fields.detailedPlans && fields.detailedPlans.length > 0) {
    const dpRows = fields.detailedPlans.map((p, i) =>
      `<tr><td style="font-weight:900;color:var(--brand)">${i + 1}</td><td style="font-weight:600">${p.name}</td><td style="font-size:11.5px">${p.method}</td><td>${p.owner}</td><td>${p.duration}</td><td style="font-size:11px">${p.criteria}</td></tr>`
    ).join('\n      ');
    html = html.replace(
      /<tr><td style="font-weight:900;color:var\(--brand\)">1<\/td><td style="font-weight:600">재무 보고서 자동화[\s\S]*?<tr><td style="font-weight:900;color:var\(--brand\)">3<\/td><td style="font-weight:600">고객 FAQ 챗봇[\s\S]*?<\/tr>/,
      dpRows
    );
  }

  // ── P11 간트 차트 ──
  if (fields.ganttTasks && fields.ganttTasks.length > 0) {
    const colorMap: Record<string, string> = { P1: 'gb1', P2: 'gb2', P3: 'gb3' };
    const ganttRows = fields.ganttTasks.map(t => {
      const barClass = colorMap[t.priority] || 'gb4';
      const prClass = t.priority === 'P1' ? 'tp-high' : t.priority === 'P3' ? 'tp-low' : 'tp-mid';
      const leftPct = ((t.startWeek - 1) / 16) * 100;
      const widthPct = (t.durationWeeks / 16) * 100;
      return `<tr><td class="task-name"><span class="task-priority ${prClass}" style="margin-right:4px">${t.priority}</span>${t.name}</td><td style="position:relative" colspan="8"><div class="gbar ${barClass}" style="left:${leftPct.toFixed(0)}%;width:${widthPct.toFixed(0)}%"></div></td></tr>`;
    }).join('\n      ');
    // 기존 과제 행들 교체 (교육/퍼실리테이팅 행은 유지)
    html = html.replace(
      /<tr><td class="task-name"><span class="task-priority tp-high"[^>]*>P1<\/span>재무 보고서 자동화[\s\S]*?<tr style="background:#f9fafb"><td class="task-name" style="font-weight:700;color:var\(--brand-dark\)">교육/,
      `${ganttRows}\n      <tr style="background:#f9fafb"><td class="task-name" style="font-weight:700;color:var(--brand-dark)">교육`
    );
  }

  // ── P9 전환 목표 등급 상승 ──
  if (fields.scores) {
    const total = fields.scores.strategy + fields.scores.data + fields.scores.process + fields.scores.talent + fields.scores.tech;
    const currentGrade = total >= 20 ? 'A' : total >= 15 ? 'B' : total >= 10 ? 'C' : 'D';
    const targetGrade = currentGrade === 'A' ? 'A+' : currentGrade === 'D' ? 'B' : String.fromCharCode(currentGrade.charCodeAt(0) - 1);
    html = html.replace(
      />B→A</,
      `>${currentGrade}→${targetGrade}<`
    );
  }

  // ── P9 조직 구성도 — 1차 대상 부서로 챔피언 목록 동적 생성 ──
  if (fields.targetDepts?.phase1) {
    const depts = fields.targetDepts.phase1.split(/[,·、\/]/).map(d => d.trim()).filter(Boolean);
    if (depts.length > 0) {
      const orgBoxes = depts.map(d =>
        `<div class="org-box"><strong>${d}</strong><span style="font-size:11px;color:var(--sub)">챔피언 1명</span></div>`
      ).join('\n        ');
      html = html.replace(
        /<div class="org-box"><strong>마케팅<\/strong>[\s\S]*?<div class="org-box"><strong>개발<\/strong><span style="font-size:11px;color:var\(--sub\)">챔피언 1명<\/span><\/div>/,
        orgBoxes
      );
    }
  }

  // ── P10 과제별 기대효과 요약 — innovationTasks + painPoints 기반 자동 계산 ──
  if (fields.innovationTasks && fields.innovationTasks.length > 0) {
    const taskCount = fields.innovationTasks.length;
    const p1Count = fields.innovationTasks.filter(t => t.priority === 'P1').length;
    const p2Count = fields.innovationTasks.filter(t => t.priority === 'P2').length;
    const p3Count = taskCount - p1Count - p2Count;

    // 커버 부서 수 계산
    const deptSet = new Set(fields.innovationTasks.map(t => t.dept).filter(Boolean));
    const deptCount = deptSet.size;

    // 예상 시간절감 — painPoints에서 주당 시간 합산
    let totalHours = 0;
    if (fields.painPoints) {
      for (const pp of fields.painPoints) {
        const h = parseInt(pp.weeklyHours, 10);
        if (!isNaN(h)) totalHours += h;
      }
    }
    // 자동화로 약 60% 절감 추정
    const savedHours = totalHours > 0 ? Math.round(totalHours * 0.6) : 0;

    // 예상 ROI — 절감 시간 기반 추정 (시간당 3만원 기준, 6개월)
    const roiValue = savedHours > 0 ? Math.round((savedHours * 3 * 26) / 100) : 0; // 26주(6개월)
    const roiText = roiValue > 0 ? `${roiValue}%` : '—%';

    // 전체 4개 메트릭 교체 (P7 압축 레이아웃: style="padding:10px 8px")
    html = html.replace(
      /<div class="metric"[^>]*><div class="label">총 과제 수<\/div>[\s\S]*?<div class="metric"[^>]*><div class="label">커버 부서<\/div>[\s\S]*?<\/div><\/div>/,
      `<div class="metric" style="padding:10px 8px"><div class="label">총 과제 수</div><div class="score" style="font-size:18px">${taskCount}건</div><div class="target">P1: ${p1Count} / P2: ${p2Count} / P3: ${p3Count}</div></div>
      <div class="metric" style="padding:10px 8px"><div class="label">예상 시간절감</div><div class="score" style="font-size:18px">${savedHours > 0 ? savedHours + 'h' : '—'}</div><div class="target">주당 (전체 합산)</div></div>
      <div class="metric" style="padding:10px 8px"><div class="label">예상 ROI</div><div class="score" style="font-size:18px">${roiText}</div><div class="target">6개월 누적</div></div>
      <div class="metric" style="padding:10px 8px"><div class="label">커버 부서</div><div class="score" style="font-size:18px">${deptCount}개</div><div class="target">${deptCount >= 4 ? '전 부서 포함' : '주요 부서'}</div></div>`
    );
  }

  // ── P5 매트릭스 — innovationTasks 기반 4분면 동적 배치 ──
  if (fields.innovationTasks && fields.innovationTasks.length > 0) {
    const isDiffHigh = (d: string) => d.includes('상') || d.toLowerCase().includes('high');
    const isEffectHigh = (e: string) => e.includes('★★★★');
    // Quick Win ②: 낮은 난이도 + 높은 효과
    const quickWins = fields.innovationTasks
      .filter(t => !isDiffHigh(t.difficulty) && isEffectHigh(t.effect))
      .map(t => t.name).slice(0, 2);
    if (quickWins.length > 0) {
      html = html.replace(/예: 월말 보고서 자동화, FAQ 챗봇/, `예: ${quickWins.join(', ')}`);
    }
    // 장기 투자 ④: 높은 난이도 + 높은 효과
    const longTerm = fields.innovationTasks
      .filter(t => isDiffHigh(t.difficulty) && isEffectHigh(t.effect))
      .map(t => t.name).slice(0, 1);
    if (longTerm.length > 0) {
      html = html.replace(/예: 내부 데이터 기반 예측 모델/, `예: ${longTerm[0]}`);
    }
    // 보류/검토 ③: 높은 난이도 + 낮은 효과
    const holdTasks = fields.innovationTasks
      .filter(t => isDiffHigh(t.difficulty) && !isEffectHigh(t.effect))
      .map(t => t.name).slice(0, 1);
    if (holdTasks.length > 0) {
      html = html.replace(/예: 법률 검토 자동화/, `예: ${holdTasks[0]}`);
    }
    // 즉시 실행 ①: 낮은 난이도 + 낮은 효과
    const easyTasks = fields.innovationTasks
      .filter(t => !isDiffHigh(t.difficulty) && !isEffectHigh(t.effect))
      .map(t => t.name).slice(0, 2);
    if (easyTasks.length > 0) {
      html = html.replace(/예: 회의록 요약, 이메일 초안/, `예: ${easyTasks.join(', ')}`);
    }
  }

  // ── P15 패키지 추천 — 성숙도 등급 기반 ★ 추천 동적 배치 ──
  if (fields.scores) {
    const total = fields.scores.strategy + fields.scores.data + fields.scores.process + fields.scores.talent + fields.scores.tech;
    const grade = total >= 20 ? 'A' : total >= 15 ? 'B' : total >= 10 ? 'C' : 'D';
    // α(D~C) 기본 스타일, β(B) 기본 ★ 추천 스타일, γ(A) 기본 스타일
    if (grade === 'D' || grade === 'C') {
      // α에 ★ 추천, β에서 ★ 제거
      html = html.replace(
        /<div class="pkg" style="border-left:4px solid var\(--brand\)"><h4>패키지 α — AX 기초 체질 개선<\/h4>/,
        `<div class="pkg" style="border-left:4px solid var(--accent);background:#fffbeb"><h4>패키지 α — AX 기초 체질 개선 ★ 추천</h4>`
      );
      html = html.replace(
        /<div class="pkg" style="border-left:4px solid var\(--accent\);background:#fffbeb"><h4>패키지 β — AX 가속 전환 ★ 추천<\/h4>/,
        `<div class="pkg" style="border-left:4px solid var(--brand)"><h4>패키지 β — AX 가속 전환</h4>`
      );
      // β 스텝 색상 원복
      html = html.replace(
        /style="background:#fef3c7;color:#92400e">① \[B\] 컨설팅/,
        `>① [B] 컨설팅`
      );
      html = html.replace(
        /style="background:#fef3c7;color:#92400e">② \[C\]\+\[D\] 교육\+해커톤/,
        `>② [C]+[D] 교육+해커톤`
      );
      html = html.replace(
        /style="background:#fef3c7;color:#92400e">③ \[E\] 고도화/,
        `>③ [E] 고도화`
      );
    } else if (grade === 'A') {
      // γ에 ★ 추천, β에서 ★ 제거
      html = html.replace(
        /<div class="pkg" style="border-left:4px solid #22C55E"><h4>패키지 γ — AX 내재화<\/h4>/,
        `<div class="pkg" style="border-left:4px solid var(--accent);background:#fffbeb"><h4>패키지 γ — AX 내재화 ★ 추천</h4>`
      );
      html = html.replace(
        /<div class="pkg" style="border-left:4px solid var\(--accent\);background:#fffbeb"><h4>패키지 β — AX 가속 전환 ★ 추천<\/h4>/,
        `<div class="pkg" style="border-left:4px solid var(--brand)"><h4>패키지 β — AX 가속 전환</h4>`
      );
      html = html.replace(
        /style="background:#fef3c7;color:#92400e">① \[B\] 컨설팅/,
        `>① [B] 컨설팅`
      );
      html = html.replace(
        /style="background:#fef3c7;color:#92400e">② \[C\]\+\[D\] 교육\+해커톤/,
        `>② [C]+[D] 교육+해커톤`
      );
      html = html.replace(
        /style="background:#fef3c7;color:#92400e">③ \[E\] 고도화/,
        `>③ [E] 고도화`
      );
    }
    // B등급은 기본 β ★ 추천 그대로 유지
  }

  // ── P15 {AX 파트너스} → 조코딩 AX 파트너스 ──
  replace('{AX 파트너스}', '조코딩 AX 파트너스');

  // ── P14 KPI 전체 블록 — kpis 데이터로 전체 교체 ──
  if (fields.kpis) {
    const k = fields.kpis;
    // 조직 관점 전체 교체
    const orgKpi = `<div class="kpi-col" style="background:#f3f0ff;border-radius:var(--r)"><h4 style="color:var(--brand-dark)">조직 관점</h4><div class="kpi-item"><strong>업무 자동화율 증가</strong><br><span style="color:var(--sub)">${k.automationRate || '—'}</span></div><div class="kpi-item"><strong>개발 리드타임 단축</strong><br><span style="color:var(--sub)">${k.devLeadTime || '—'}</span></div><div class="kpi-item"><strong>데이터 활용도 향상</strong><br><span style="color:var(--sub)">월 ${(k.dataDecisions || '—').replace(/건$/, '')}건 데이터 의사결정</span></div></div>`;
    html = html.replace(
      /<div class="kpi-col" style="background:#f3f0ff;border-radius:var\(--r\)"><h4 style="color:var\(--brand-dark\)">조직 관점<\/h4>[\s\S]*?<\/div><\/div>/,
      orgKpi
    );

    // 인재 관점 전체 교체
    const talentKpi = `<div class="kpi-col" style="background:#fefce8;border-radius:var(--r)"><h4 style="color:#92400e">인재 관점</h4><div class="kpi-item"><strong>AI 활용 인력 확대</strong><br><span style="color:var(--sub)">${k.aiUsers || '—'}</span></div><div class="kpi-item"><strong>AX 리더 육성</strong><br><span style="color:var(--sub)">0명 → ${(k.aiLeaders || '—').replace(/명$/, '')}명</span></div><div class="kpi-item"><strong>자체 추진 역량</strong><br><span style="color:var(--sub)">외부 지원 없이 실행 가능</span></div></div>`;
    html = html.replace(
      /<div class="kpi-col" style="background:#fefce8;border-radius:var\(--r\)"><h4 style="color:#92400e">인재 관점<\/h4>[\s\S]*?<\/div><\/div>/,
      talentKpi
    );

    // 경영 관점 전체 교체
    const bizKpi = `<div class="kpi-col" style="background:#f0fdf4;border-radius:var(--r)"><h4 style="color:#166534">경영 관점</h4><div class="kpi-item"><strong>AI 투자 ROI 가시화</strong><br><span style="color:var(--sub)">절감 시간 → ${k.costSaving || '—'}</span></div><div class="kpi-item"><strong>단계별 성과 추적</strong><br><span style="color:var(--sub)">분기 리뷰 체계</span></div><div class="kpi-item"><strong>장기 경쟁력 확보</strong><br><span style="color:var(--sub)">AI 서비스 ${(k.aiServices || '—').replace(/건$/, '')}건 출시</span></div></div>`;
    html = html.replace(
      /<div class="kpi-col" style="background:#f0fdf4;border-radius:var\(--r\)"><h4 style="color:#166534">경영 관점<\/h4>[\s\S]*?<\/div><\/div>/,
      bizKpi
    );
  }

  // ── P11 마일스톤 ──
  if (fields.milestones && fields.milestones.length > 0) {
    const msColors = [
      { bg: 'var(--brand-light)', color: 'var(--brand)' },
      { bg: '#fef3c7', color: '#92400e' },
      { bg: '#dcfce7', color: '#166534' },
      { bg: '#eff6ff', color: '#1e40af' },
    ];
    const msHtml = fields.milestones.map((ms, i) => {
      const c = msColors[i % msColors.length];
      const items = ms.items.replace(/\n/g, '<br>');
      return `<div style="background:${c.bg};border-radius:8px;padding:10px;text-align:center;font-size:12px">
        <div style="font-weight:900;color:${c.color}">${ms.label}</div>
        <div style="color:var(--sub);font-size:11px;margin-top:2px">${items}</div>
      </div>`;
    }).join('\n      ');
    html = html.replace(
      /<div style="background:var\(--brand-light\);border-radius:8px;padding:10px;text-align:center;font-size:12px">\s*<div style="font-weight:900;color:var\(--brand\)">M1 말[\s\S]*?<div style="font-weight:900;color:#1e40af">M4 말[\s\S]*?<\/div>\s*<\/div>/,
      msHtml
    );
  }

  // ── 외부 환경 분석 ──
  if (fields.externalEnv) {
    const env = fields.externalEnv;
    if (env.industryAiRate) {
      html = html.replace(
        /동종업계 AI 도입률: \{X\}% \(전년 대비 \{Y\}%↑\)/,
        `동종업계 AI 도입률: ${env.industryAiRate}`
      );
    }
    if (env.competitors) {
      replace('{경쟁사A: 챗봇 도입 / 경쟁사B: 자동화 적용}', env.competitors);
    }
    if (env.govSupport) {
      replace('{중소기업 AI 바우처, AX 촉진 보조금 등}', env.govSupport);
    }
  }

  // (KPI는 위의 P14 전체 블록 교체에서 처리됨)

  // 대상 부서
  if (fields.targetDepts) {
    replace('{마케팅·재무·영업}', fields.targetDepts.phase1);
    replace('{인사·개발·경영지원}', fields.targetDepts.phase2);
  }

  // 스폰서
  replace('{대표이사 / C-Level}', fields.sponsor);
  replace('{대표/경영진}', fields.sponsor);

  // 인터뷰 참여자 수 (남은 {N}명 패턴 — interviewInfo 전용은 이미 위에서 처리)
  if (fields.interviewInfo?.participants) {
    replace('{N}명', fields.interviewInfo.participants);
  }

  // 기업 담당자
  replace('{기업 담당자}', fields.sponsor);

  // ── 남은 플레이스홀더 정리 ──
  html = html.replace(/\{N\}명/g, '—');
  html = html.replace(/\{N\}/g, '—');
  html = html.replace(/\{X\}%/g, '—%');
  html = html.replace(/\{X\}일/g, '—일');
  html = html.replace(/\{X\}명/g, '—명');
  html = html.replace(/\{Y\}%/g, '—%');
  html = html.replace(/\{Y\}명/g, '—명');
  html = html.replace(/\{Y\}만원\/월/g, '—만원/월');
  html = html.replace(/\{Y\}건/g, '—건');
  html = html.replace(/\{Y\}일/g, '—일');

  return html;
}
