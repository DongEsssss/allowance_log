import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAppearance } from './appearance';
import { categoryLabel } from './categories';
import { formatAmount, useLedger } from './ledger';

const chartColors = ['#A56B58', '#6D8E82', '#D0A45D', '#8C80A7', '#7194B0', '#C38288', '#8D9D62', '#B58B6D'];
const radius = 58;
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
      <View style={[styles.card, { backgroundColor: colors.paper }]}>
        {total === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>이번 달 지출 내역이 없어요.</Text>
        ) : (
          <>
            <View style={styles.chart} accessible accessibilityLabel={'이번 달 총 지출 ' + formatAmount(total) + '원'}>
              <Svg width={160} height={160} viewBox="0 0 160 160">
                {groups.map(([label, amount], index) => {
                  const length = circumference * amount / total;
                  const start = circumference * groups.slice(0, index).reduce((sum, [, value]) => sum + value, 0) / total;
                  return <Circle key={label} cx={80} cy={80} r={radius} fill="none"
                    stroke={chartColors[index % chartColors.length]} strokeWidth={20}
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-start} rotation={-90} origin="80, 80" />;
                })}
              </Svg>
              <View pointerEvents="none" style={styles.center}>
                <Text style={[styles.centerLabel, { color: colors.muted }]}>총 지출</Text>
                <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.centerAmount, { color: colors.ink }]}>{formatAmount(total)}원</Text>
              </View>
            </View>
            <View style={styles.legend}>
              {groups.map(([label, amount], index) => (
                <View key={label} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: chartColors[index % chartColors.length] }]} />
                  <Text style={[styles.name, { color: colors.ink }]}>{label}</Text>
                  <Text style={[styles.value, { color: colors.ink }]}>{formatAmount(amount)}원</Text>
                  <Text style={[styles.percent, { color: colors.muted }]}>{Math.round(amount / total * 100)}%</Text>
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
  card: { borderRadius: 14, padding: 20, gap: 20 },
  empty: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  chart: { width: 160, height: 160, alignSelf: 'center' },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25 },
  centerLabel: { fontSize: 12, marginBottom: 4 },
  centerAmount: { fontSize: 15, fontWeight: '700' },
  legend: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  name: { flex: 1, fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  percent: { width: 42, textAlign: 'right', fontSize: 13, fontVariant: ['tabular-nums'] },
});
