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
  const today = localDate();

  function moveMonth(step: number) {
    setMonth(new Date(year, monthIndex + step, 1, 12));
  }

  return (
    <View style={[styles.calendar, { backgroundColor: colors.background }]}>
      {/* ────────── 표시할 연도와 월 이동 ────────── */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => moveMonth(-1)} style={styles.arrow}>
          <Text style={[styles.arrowText, { color: colors.accent }]}>‹</Text>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={[styles.month, { color: colors.ink }]}>{year}년 {monthIndex + 1}월</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => moveMonth(1)} style={styles.arrow}>
          <Text style={[styles.arrowText, { color: colors.accent }]}>›</Text>
        </Pressable>
      </View>

      {/* ────────── 요일과 날짜 선택 칸 ────────── */}
      <View style={styles.grid}>
        {weekdays.map((day) => (
          <Text key={day} style={[styles.weekday, { color: colors.muted }]}>{day}</Text>
        ))}
        {Array.from({ length: offset }, (_, index) => <View key={index} style={styles.cell} />)}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
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
              <Text style={[styles.dayText, {
                backgroundColor: selected ? colors.primary : date === today ? colors.accentSurface : 'transparent',
                color: selected ? colors.onPrimary : colors.ink,
              }]}>{day}</Text>
              {isPayday && <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent, marginBottom: 5 }}>월급날</Text>}
              {hasEntries && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { borderRadius: 14, padding: 5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 25 },
  month: { fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.28%', textAlign: 'center', paddingVertical: 5, fontSize: 13 },
  cell: { width: '14.28%', minHeight: 44 },
  day: { alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2 },
  dayText: { minWidth: 28, textAlign: 'center', paddingVertical: 5, borderRadius: 9, overflow: 'hidden', fontSize: 14 },
});
