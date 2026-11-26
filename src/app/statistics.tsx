import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '@/features/ledger/appearance';
import { BottomMenu } from '@/features/ledger/bottom-menu';
import { ExpenseChart } from '@/features/ledger/expense-chart';
import { localDate } from '@/features/ledger/ledger';

export default function StatisticsScreen() {
  const { ui } = useAppearance();
  const month = localDate().slice(0, 7);

  return (
    <SafeAreaView style={ui.safe}>
      <ScrollView style={ui.scroll} contentContainerStyle={[ui.page, styles.content]}>
        <Text accessibilityRole="header" style={ui.title}>통계</Text>
        <ExpenseChart month={month} />
      </ScrollView>
      <BottomMenu active="/statistics" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 32, gap: 26 },
});
