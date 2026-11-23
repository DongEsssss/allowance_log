export type PaydayRule = 'earlier' | 'later';
export type PaydaySettings = { day: number; rule: PaydayRule };

// ────────── 한국 공휴일·대체공휴일 ──────────
// 한국천문연구원 월력요항 및 인사혁신처의 2026년 노동절·제헌절 공휴일 지정 반영.
// https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026
// https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027
// https://www.mpm.go.kr/mpm/comm/newsPress/newsPressRelease/?boardId=bbs_0000000000000029&cntId=4250&mode=view
const holidays: Partial<Record<number, ReadonlySet<string>>> = {
  2026: new Set([
    '01-01', '02-16', '02-17', '02-18', '03-01', '03-02', '05-01', '05-05',
    '05-24', '05-25', '06-03', '06-06', '07-17', '08-15', '08-17',
    '09-24', '09-25', '09-26', '10-03', '10-05', '10-09', '12-25',
  ]),
  2027: new Set([
    '01-01', '02-06', '02-07', '02-08', '02-09', '03-01',
    '05-01', '05-03', '05-05', '05-13', '06-06', '07-17', '07-19', '08-15', '08-16',
    '09-14', '09-15', '09-16', '10-03', '10-04', '10-09', '10-11', '12-25', '12-27',
  ]),
};

export function isPaydayDay(day: number) {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

export function isPaydayRule(rule: unknown): rule is PaydayRule {
  return rule === 'earlier' || rule === 'later';
}

// 날짜 비교는 한국의 날짜를 UTC 자정 값에 담아 기기 시간대와 분리합니다.
function koreanToday(now: Date) {
  const korea = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return new Date(Date.UTC(korea.getUTCFullYear(), korea.getUTCMonth(), korea.getUTCDate()));
}

export function monthlyPayday(year: number, month: number, settings: PaydaySettings) {
  // 31일이 없는 달은 말일을 기준으로 잡고, 연휴가 길면 영업일까지 계속 이동합니다.
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const scheduled = new Date(Date.UTC(year, month, Math.min(settings.day, lastDay)));
  const actual = new Date(scheduled);
  const step = settings.rule === 'earlier' ? -1 : 1;

  while (true) {
    const calendar = holidays[actual.getUTCFullYear()];
    if (!calendar) return null;
    const weekend = actual.getUTCDay() === 0 || actual.getUTCDay() === 6;
    if (!weekend && !calendar.has(actual.toISOString().slice(5, 10))) return { scheduled, actual };
    actual.setUTCDate(actual.getUTCDate() + step);
  }
}

export function nextPayday(settings: PaydaySettings, now = new Date()) {
  const today = koreanToday(now);
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();

  // 이전 달 월급이 연휴로 이달 초에 지급될 수도 있습니다.
  for (const offset of [-1, 0, 1]) {
    const payday = monthlyPayday(year, month + offset, settings);
    if (payday && payday.actual >= today) return payday;
  }
  return null;
}

// 지급일을 키로 사용해야 다른 달로 넘어간 월급도 실제 지급 날짜에 표시됩니다.
export function calendarPaydays(settings: PaydaySettings) {
  const dates = new Map<string, string>();
  for (const year of Object.keys(holidays)) {
    for (let month = 0; month < 12; month++) {
      const payday = monthlyPayday(Number(year), month, settings);
      if (!payday) continue;
      const { scheduled, actual } = payday;
      const details = [String(month + 1) + '월 급여'];
      if (scheduled.getUTCDate() !== settings.day) details.push('말일 기준');
      if (scheduled.getTime() !== actual.getTime()) {
        const label = (date: Date) => (date.getUTCMonth() + 1) + '월 ' + date.getUTCDate() + '일';
        details.push(label(scheduled) + ' → ' + label(actual));
        details.push(settings.rule === 'earlier' ? '주말·공휴일로 이전 영업일 지급' : '주말·공휴일로 다음 영업일 지급');
      } else {
        details.push('예정대로 지급');
      }
      dates.set(actual.toISOString().slice(0, 10), details.join(' · '));
    }
  }
  return dates;
}