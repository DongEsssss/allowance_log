import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '@/features/ledger/appearance';
import { BottomMenu } from '@/features/ledger/bottom-menu';
import { Calendar } from '@/features/ledger/calendar';
import { EntryList } from '@/features/ledger/entry-list';
import { localDate, useLedger } from '@/features/ledger/ledger';

import { calendarPaydays } from '@/features/ledger/payday';
import { readPayday } from '@/features/ledger/payday-storage';

export default function CalendarScreen() {
  const { colors, ui } = useAppearance();
  const { entries } = useLedger();
  const [date, setDate] = useState(() => localDate());
  const [paydays, setPaydays] = useState(new Map<string, string>());
  // 설정 팝업에서 돌아올 때 저장된 월급일과 표시 여부를 다시 읽습니다.
  useFocusEffect(useCallback(() => {
    let active = true;
    void readPayday().then((saved) => {
      if (active) setPaydays(saved?.showOnCalendar ? calendarPaydays(saved) : new Map());
    }).catch(() => {});
    return () => { active = false; };
  }, []));
  const [, month, day] = date.split('-');

  // ────────── 선택한 날짜의 기록과 달력에 표시할 날짜 ──────────
  const dailyEntries = entries.filter((entry) => entry.date === date);
  const markedDates = new Set(entries.map((entry) => entry.date));

  return (
    <SafeAreaView style={ui.safe}>
      <ScrollView style={ui.scroll} contentContainerStyle={[ui.page, styles.content]}>
        <Text accessibilityRole="header" style={ui.title}>달력</Text>
        <View style={[styles.calendarCard, { backgroundColor: colors.paper }]}>
          <Calendar value={date} onSelect={setDate} markedDates={markedDates} paydays={paydays} />
        </View>

        {/* ────────── 날짜를 누르면 아래 기록 목록이 바뀝니다 ────────── */}
        <View style={styles.details}>
          <Text accessibilityRole="header" style={[styles.subtitle, { color: colors.ink }]}>
            {Number(month)}월 {Number(day)}일 기록
          </Text>
          {paydays.has(date) && (
            <Text style={[styles.empty, { color: colors.accent, backgroundColor: colors.accentSurface }]}>
              {paydays.get(date)}
            </Text>
          )}
          {dailyEntries.length ? <EntryList entries={dailyEntries} /> : (
            <Text style={[styles.empty, { color: colors.muted, backgroundColor: colors.paper }]}>
              이 날짜에 기록이 없어요.
            </Text>
          )}
        </View>
      </ScrollView>
      <BottomMenu active="/calendar" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 32, gap: 26 },
  calendarCard: { borderRadius: 20, padding: 8 },
  details: { gap: 16 },
  subtitle: { fontSize: 19, fontWeight: '800' },
  empty: { padding: 16, borderRadius: 15, fontSize: 15 },
});
