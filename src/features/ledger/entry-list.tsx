import { StyleSheet, Text, View } from 'react-native';

import { useAppearance } from './appearance';
import { categoryLabel } from './categories';
import { useLedger, entryKindLabels, formatAmount, type Entry, type EntryKind } from './ledger';
import { type Palette } from './styles';

const kindIcons: Record<EntryKind, string> = {
  income: '↙',
  expense: '↗',
  savings: '↔',
  investment: '↔',
};

// ────────── 홈과 달력에서 함께 쓰는 기록 목록 ──────────
export function EntryList({ entries }: { entries: Entry[] }) {
  const { categories } = useLedger();
  const { colors } = useAppearance();
  const styles = createStyles(colors);

  return (
    <View style={styles.list}>
      {entries.map((entry) => {
        const income = entry.kind === 'income';
        const expense = entry.kind === 'expense';
        const category = categoryLabel(entry, categories);
        const kindLabel = entryKindLabels[entry.kind];
        const [, entryMonth, day] = entry.date.split('-');
        return (
          <View key={entry.id} style={styles.row}>
            <View style={[styles.badge, expense && styles.expenseBadge]}>
              <Text style={[styles.badgeText, expense && styles.expenseText]}>{kindIcons[entry.kind]}</Text>
            </View>
            <View style={styles.details}>
              <Text numberOfLines={1} style={styles.memo}>{entry.memo || kindLabel}</Text>
              <Text style={styles.date}>{Number(entryMonth)}월 {Number(day)}일 · {kindLabel}{category && ' · ' + category}</Text>
            </View>
            <Text style={[styles.amount, expense && styles.expenseText]}>
              {income ? '+' : '−'}{formatAmount(entry.amount)}원
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  list: { backgroundColor: colors.paper, borderRadius: 14, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17 },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSurface },
  expenseBadge: { backgroundColor: colors.softRed },
  badgeText: { color: colors.accent, fontSize: 19, fontWeight: '700' },
  details: { flex: 1, gap: 5 },
  memo: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  date: { color: colors.muted, fontSize: 12 },
  amount: { color: colors.accent, fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'], flexShrink: 1, textAlign: 'right' },
  expenseText: { color: colors.expense },
});

