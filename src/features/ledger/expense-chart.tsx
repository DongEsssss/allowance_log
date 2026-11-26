import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAppearance } from './appearance';
import { categoryLabel } from './categories';
import { formatAmount, useLedger } from './ledger';

const chartColors = ['#D47962', '#7CA99A', '#E3B967', '#A394C2', '#79A6BF', '#D897A0', '#A5B679', '#B58B6D'];
const radius = 82;
const circumference = 2 * Math.PI * radius;

export function ExpenseChart({ month }: { month: string }) {
  const { entries, categories } = useLedger();
  const { colors } = useAppearance();
  const amounts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind !== 'expense' || !entry.date.startsWith(month + '-') || entry.amount <= 0) continue;
    const label = categoryLabel(entry, categories);
    amounts.set(label, (amounts.get(label) ?? 0) + entry.amount);
  }
  const groups = [...amounts].sort((a, b) => b[1] - a[1]);
  const total = groups.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>이번 달 지출 통계</Text>
      <View style={[styles.card, { backgroundColor: colors.paper, borderColor: colors.line }]}>
        {total === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>이번 달 지출 내역이 없어요.</Text>
        ) : (
          <>
            <View style={styles.chart} accessible accessibilityLabel={'이번 달 총 지출 ' + formatAmount(total) + '원'}>
              <Svg width={220} height={220} viewBox="0 0 220 220">
                <Circle cx={110} cy={110} r={radius} fill="none" stroke={colors.accentSurface} strokeWidth={22} />
                {groups.map(([label, amount], index) => {
                  const length = circumference * amount / total;
                  const start = circumference * groups.slice(0, index).reduce((sum, [, value]) => sum + value, 0) / total;
                  const gap = groups.length > 1 ? Math.min(3, length * 0.15) : 0;
                  return <Circle key={label} cx={110} cy={110} r={radius} fill="none"
                    stroke={chartColors[index % chartColors.length]} strokeWidth={22}
                    strokeDasharray={`${length - gap} ${circumference - length + gap}`}
                    strokeDashoffset={-start - gap / 2} transform="rotate(-90 110 110)" />;
                })}
              </Svg>
              <View pointerEvents="none" style={styles.center}>
                <Text style={[styles.centerLabel, { color: colors.muted }]}>이번 달 총 지출</Text>
                <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.centerAmount, { color: colors.ink }]}>{formatAmount(total)}원</Text>
              </View>
            </View>
            <View style={[styles.legend, { borderTopColor: colors.line }]}>
              {groups.map(([label, amount], index) => (
                <View key={label} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: chartColors[index % chartColors.length] }]} />
                  <Text numberOfLines={1} style={[styles.name, { color: colors.ink }]}>{label}</Text>
                  <View style={styles.rowAmount}>
                    <Text style={[styles.value, { color: colors.ink }]}>{formatAmount(amount)}원</Text>
                    <Text style={[styles.percent, { color: colors.muted }]}>{(amount / total * 100).toFixed(1)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  title: { fontSize: 19, fontWeight: '700' },
  card: { borderRadius: 24, padding: 20, gap: 24, borderWidth: StyleSheet.hairlineWidth },
  empty: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  chart: { width: 220, height: 220, alignSelf: 'center', marginVertical: 8 },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25 },
  centerLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  centerAmount: { fontSize: 20, fontWeight: '800', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  legend: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontSize: 14, fontWeight: '600' },
  rowAmount: { alignItems: 'flex-end', gap: 2 },
  value: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  percent: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
