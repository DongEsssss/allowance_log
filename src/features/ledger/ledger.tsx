import { createContext, useContext } from 'react';

import type { Category } from './categories';

export type EntryKind = 'expense' | 'income' | 'savings' | 'investment';
export const entryKindLabels: Record<EntryKind, string> = {
  income: '수입',
  expense: '지출',
  savings: '저축',
  investment: '투자',
};

export type EntryDraft = { kind: EntryKind; amount: number; date: string; memo: string; categoryId?: string };
export type Entry = EntryDraft & { id: number };

// 기기에서 보는 날짜를 사용해 자정 전후에도 날짜가 어긋나지 않게 합니다.
export function localDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return [date.getFullYear(), month, day].join('-');
}

const won = new Intl.NumberFormat('ko-KR');
export const formatAmount = (amount: number) => won.format(amount);

// ────────── 이번 달과 2026년 10월의 임시 샘플 기록 ──────────
export function initialEntries(): Entry[] {
  const today = new Date();
  const previousDay = (days: number) =>
    localDate(new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - days)));

  return [
    { id: 10, kind: 'expense', amount: 4500, date: previousDay(0), memo: '카페' },
    { id: 9, kind: 'expense', amount: 12000, date: previousDay(1), memo: '점심 식사' },
    { id: 8, kind: 'income', amount: 100000, date: previousDay(2), memo: '이번 달 용돈' },

    // 월급 1,000만 원 중 생활비 400만 원, 저축 300만 원, 투자 200만 원으로 가정합니다.
    { id: 7, kind: 'expense', amount: 600000, date: '2026-10-30', memo: '쇼핑·여가' },
    { id: 6, kind: 'investment', amount: 2000000, date: '2026-10-27', memo: '투자 계좌 이체' },
    { id: 5, kind: 'savings', amount: 3000000, date: '2026-10-26', memo: '저축 계좌 이체' },
    { id: 4, kind: 'income', amount: 10000000, date: '2026-10-25', memo: '10월 월급' },
    { id: 3, kind: 'expense', amount: 500000, date: '2026-10-20', memo: '교통·통신비' },
    { id: 2, kind: 'expense', amount: 900000, date: '2026-10-15', memo: '식비·장보기' },
    { id: 1, kind: 'expense', amount: 2000000, date: '2026-10-05', memo: '월세·관리비' },
  ];
}

// ────────── 화면과 Provider가 함께 참조하는 기록 연결 ──────────
export const LedgerContext = createContext<{
  entries: Entry[];
  categories: Category[];
  updateCategories: (change: (items: Category[]) => Category[]) => Promise<void>;
  addEntry: (entry: EntryDraft) => Promise<void>;
} | null>(null);

export function useLedger() {
  const ledger = useContext(LedgerContext);
  if (!ledger) throw new Error('LedgerProvider가 필요합니다.');
  return ledger;
}
