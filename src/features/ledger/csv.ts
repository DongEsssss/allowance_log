import { entryKindLabels, localDate, type Entry } from './ledger';

import { categoryLabel, type Category } from './categories';

export type CsvRange = { start: string; end: string };
export type CsvPreset = '1day' | '7days' | '1month' | '3months';

export function presetRange(preset: CsvPreset, today = new Date()): CsvRange {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // 오늘을 포함합니다. 월 단위는 이전 달의 같은 날(없으면 말일) 다음 날부터 셉니다.
  const monthsBack = preset === '3months' ? 3 : 1;
  const previousMonthLastDay = new Date(year, month - monthsBack + 1, 0).getDate();
  const start = preset === '1day' || preset === '7days'
    ? new Date(year, month, day - (preset === '7days' ? 6 : 0))
    : new Date(year, month - monthsBack, Math.min(day, previousMonthLastDay) + 1);

  return { start: localDate(start), end: localDate(today) };
}

export function recordsInRange(entries: Entry[], { start, end }: CsvRange) {
  return entries.filter((entry) => entry.date >= start && entry.date <= end);
}

function escapeMemo(memo: string) {
  // 엑셀에서 메모가 수식으로 실행되지 않게 하고, 쉼표·따옴표·줄바꿈을 그대로 보존합니다.
  const literal = /^[\s\uFEFF]*[=+\-@＝＋－＠]|^[\t\r\n]/.test(memo) ? "'" + memo : memo;
  return '"' + literal.replace(/"/g, '""') + '"';
}

export function createLedgerCsv(entries: Entry[], categories: Category[] = []) {
  const rows = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const lines = rows.map((entry) => [entry.date, entryKindLabels[entry.kind], entry.amount, escapeMemo(entry.memo), escapeMemo(categoryLabel(entry, categories))].join(','));
  // UTF-8 BOM과 CRLF를 사용해 엑셀에서도 한글과 행 구분이 유지됩니다.
  return '\uFEFF' + ['날짜,구분,금액(원),메모,카테고리', ...lines].join('\r\n') + '\r\n';
}
