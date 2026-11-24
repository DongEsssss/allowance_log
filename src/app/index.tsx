import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatAmount, localDate, useLedger } from '@/features/ledger/ledger';
import { useAppearance } from '@/features/ledger/appearance';
import { BottomMenu } from '@/features/ledger/bottom-menu';
import { EntryList } from '@/features/ledger/entry-list';
import { type Palette } from '@/features/ledger/styles';

export default function HomeScreen() {
  const { mode, colors, stripe, ui } = useAppearance();
  const styles = createStyles(colors);
  const { entries } = useLedger();
  const [listHeight, setListHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [year, month] = localDate().split('-');
  const indicatorHeight = contentHeight > listHeight ? Math.max(24, listHeight * listHeight / contentHeight) : 0;
  const indicatorTop = contentHeight > listHeight
    ? Math.max(0, Math.min(1, scrollY / (contentHeight - listHeight))) * (listHeight - indicatorHeight)
    : 0;

  // 이번 달 합계는 기록 날짜로 계산하고, 최근 내역은 추가한 순서로 보여줍니다.
  const totals = { income: 0, expense: 0, savings: 0, investment: 0 };
  for (const entry of entries) {
    if (entry.date.startsWith(year + '-' + month)) totals[entry.kind] += entry.amount;
  }
  // 저축·투자 이체는 지출 합계와 구분하고, 쓸 수 있는 잔액에서는 뺍니다.
  const balance = totals.income - totals.expense - totals.savings - totals.investment;

  return (
    <SafeAreaView style={ui.safe}>
      <ScrollView style={ui.scroll} contentContainerStyle={[ui.page, styles.content]}>
        {/* ────────── 앱 제목 ────────── */}
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={ui.title}>용돈기입장</Text>
          <Text style={styles.month}>{year}년 {Number(month)}월</Text>
        </View>
        {/* ────────── 이번 달 잔액과 합계 ────────── */}
        <View style={styles.summary}>
          {mode === 'rainbow' && (
            <View style={styles.spectrum}>
              {stripe.map((color, index) => <View key={index} style={{ flex: 1, backgroundColor: color }} />)}
            </View>
          )}
          <Text style={styles.summaryLabel}>이번 달 잔액</Text>
          <Text style={styles.balance}>{formatAmount(balance)}<Text style={styles.unit}> 원</Text></Text>
          <View style={styles.totals}>
            <View style={styles.total}>
              <Text style={styles.summaryLabel}>수입</Text>
              <Text style={styles.totalAmount}>{formatAmount(totals.income)}원</Text>
            </View>
            <View style={styles.total}>
              <Text style={styles.summaryLabel}>지출</Text>
              <Text style={styles.totalAmount}>{formatAmount(totals.expense)}원</Text>
            </View>
          </View>
        </View>

        {/* ────────── 최근 기록 ────────── */}
        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>최근 내역</Text>
            <Link href="/add" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="기록 추가" style={styles.addButton}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={24} tintColor={colors.ink} />
              </Pressable>
            </Link>
          </View>
          <View style={styles.recentList}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setContentHeight(height)}
              onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}>
              <EntryList entries={entries} />
            </ScrollView>
            {indicatorHeight > 0 && (
              <View pointerEvents="none" style={[styles.scrollIndicator, { height: indicatorHeight, top: indicatorTop }]} />
            )}
          </View>
        </View>
      </ScrollView>

      <BottomMenu active="/" />
    </SafeAreaView>
  );
}

// 홈 화면의 카드, 목록, 글자 크기와 간격은 이곳에서 조정하세요.
const createStyles = (colors: Palette) => StyleSheet.create({
  content: { paddingTop: 36, paddingBottom: 24, gap: 30 },
  heading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  month: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  summary: { backgroundColor: colors.primary, padding: 22, borderRadius: 18 },
  spectrum: { flexDirection: 'row', height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  summaryLabel: { color: colors.cardMuted, fontSize: 14, fontWeight: '600' },
  balance: { color: colors.onPrimary, fontSize: 40, fontWeight: '600', letterSpacing: -1.5, marginTop: 4, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 20, fontWeight: '500' },
  totals: { flexDirection: 'row', marginTop: 24, gap: 8 },
  total: { flex: 1, gap: 4, padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' },
  totalAmount: { color: colors.onPrimary, fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  recent: { gap: 16 },
  recentList: { maxHeight: 360, borderRadius: 14 },
  scrollIndicator: { position: 'absolute', right: 3, width: 3, borderRadius: 2, backgroundColor: colors.muted, opacity: 0.5 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '700' },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

