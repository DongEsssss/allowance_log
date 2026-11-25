import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from './appearance';
import { localDate } from './ledger';

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

export function Calendar({ value, onSelect, markedDates, paydays }: {
  value: string;
  onSelect: (date: string) => void;
  paydays?: ReadonlyMap<string, string>;
  markedDates?: ReadonlySet<string>;
}) {
  const { colors } = useAppearance();
  const [month, setMonth] = useState(() => new Date(value.slice(0, 7) + '-01T12:00:00'));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = month.getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((offset + days) / 7) * 7;
  const today = localDate();

  function moveMonth(step: number) {
    setMonth(new Date(year, monthIndex + step, 1, 12));
  }

  return (
    <View style={[styles.calendar, { backgroundColor: colors.paper }]}>
      {/* ────────── 표시할 연도와 월 이동 ────────── */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => moveMonth(-1)} style={[styles.arrow, { backgroundColor: colors.accentSurface }]}>
          <Text style={[styles.arrowText, { color: colors.accent }]}>‹</Text>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={[styles.month, { color: colors.ink }]}>{year}년 {monthIndex + 1}월</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => moveMonth(1)} style={[styles.arrow, { backgroundColor: colors.accentSurface }]}>
          <Text style={[styles.arrowText, { color: colors.accent }]}>›</Text>
        </Pressable>
      </View>

      {/* ────────── 요일과 날짜 선택 칸 ────────── */}
      <View style={styles.grid}>
        <View style={[styles.week, styles.weekdayRow, { borderColor: colors.line }]}>
          {weekdays.map((day, index) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={[styles.weekday, { color: index === 0 ? colors.expense : colors.muted }]}>{day}</Text>
            </View>
          ))}
        </View>
        {Array.from({ length: cellCount / 7 }, (_, week) => (
          <View key={week} style={[styles.week, week > 0 && styles.weekDivider, { borderColor: colors.line }]}>
            {Array.from({ length: 7 }, (_, column) => {
              const day = week * 7 + column - offset + 1;
              if (day < 1 || day > days) return <View key={column} style={styles.cell} />;
              const date = localDate(new Date(year, monthIndex, day, 12));
              const selected = date === value;
              const isPayday = paydays?.has(date);
              const hasEntries = markedDates?.has(date);
              return (
                <Pressable
                  key={date}
                  accessibilityRole="button"
                  accessibilityLabel={date + (date === today ? ', 오늘' : '') + (isPayday ? ', 월급날' : '') + (hasEntries ? ', 기록 있음' : '')}
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(date)}
                  style={({ pressed }) => [styles.cell, styles.day, pressed && { opacity: 0.65 }]}>
                  <View style={[styles.dateCircle, { backgroundColor: selected ? colors.primary : date === today ? colors.accentSurface : 'transparent' }]}>
                    <Text style={[styles.dayText, { color: selected ? colors.onPrimary : column === 0 ? colors.expense : colors.ink }]}>{day}</Text>
                    {hasEntries && <View style={[styles.dot, { backgroundColor: selected ? colors.onPrimary : colors.accent }]} />}
                  </View>
                  {isPayday && <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.payday, { color: colors.accent }]}>월급날</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { borderRadius: 18, padding: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  arrow: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 26, lineHeight: 30 },
  month: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
  grid: { overflow: 'hidden' },
  week: { flexDirection: 'row' },
  weekdayRow: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 10 },
  weekDivider: { borderTopWidth: StyleSheet.hairlineWidth },
  weekdayCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  weekday: { fontSize: 12, fontWeight: '600' },
  cell: { flex: 1, minWidth: 0, height: 66 },
  day: { alignItems: 'center', paddingTop: 7 },
  dateCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2 },
  payday: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  dayText: { fontSize: 14, fontWeight: '600' },
});
