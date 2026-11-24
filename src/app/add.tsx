import { useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatAmount, localDate, useLedger, type EntryKind } from '@/features/ledger/ledger';
import { useAppearance } from '@/features/ledger/appearance';
import { Calendar } from '@/features/ledger/calendar';
import { closePopup, Popup } from '@/features/ledger/popup';
import { type Palette } from '@/features/ledger/styles';

const kinds = [
  { value: 'expense', label: '지출' },
  { value: 'income', label: '수입' },
] as const;

export default function AddEntryScreen() {
  const { colors, ui } = useAppearance();
  const styles = createStyles(colors);
  const { addEntry, categories } = useLedger();

  // 입력의 기본값입니다. 새 기록은 지출로 시작하며 날짜는 오늘로 채웁니다.
  const [kind, setKind] = useState<EntryKind>('expense');
  const [categoryId, setCategoryId] = useState<string>();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => localDate());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  const saving = useRef(false);

  async function saveEntry() {
    if (saving.current) return;
    // 금액을 확인한 뒤 공용 기록 목록에 추가하고 홈으로 돌아갑니다.
    if (!amount || Number(amount) <= 0) {
      setError('금액을 1원 이상 입력해 주세요.');
      return;
    }

    saving.current = true;
    try {
      await addEntry({ kind, categoryId, amount: Number(amount), date, memo: memo.trim() });
    } catch {
      setError('기기에 저장하지 못했어요. 다시 시도해 주세요.');
      return;
    } finally {
      saving.current = false;
    }
    closePopup();
  }

  return (
    <Popup
      title="기록 추가"
      footer={
        <Pressable accessibilityRole="button" onPress={saveEntry} style={({ pressed }) => [ui.button, pressed && ui.pressed]}>
          <Text style={ui.buttonText}>저장하기</Text>
        </Pressable>
      }>
      {/* ────────── 수입·지출과 금액 입력 ────────── */}
      <View style={styles.form}>
        <View style={styles.segment}>
          {kinds.map((option) => {
            const selected = kind === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => { if (!selected) setCategoryId(undefined); setKind(option.value); }}
                style={[styles.option, selected && styles.selected]}>
                <Text style={[styles.optionText, selected && styles.selectedText]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>금액</Text>
          <View style={styles.amountBox}>
            <TextInput
              accessibilityLabel="금액"
              style={styles.amountInput}
              inputMode="numeric"
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={amount ? formatAmount(Number(amount)) : ''}
              onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, '').slice(0, 10))}
            />
            <Text style={styles.unit}>원</Text>
          </View>
        </View>

        {/* ────────── 날짜 선택 달력 ────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>날짜</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'날짜 선택: ' + date}
            accessibilityState={{ expanded: calendarOpen }}
            onPress={() => {
              Keyboard.dismiss();
              setCalendarOpen(!calendarOpen);
            }}
            style={styles.dateButton}>
            <Text style={styles.dateText}>{date}</Text>
            <Text style={styles.dateAction}>{calendarOpen ? '접기' : '달력 열기'}</Text>
          </Pressable>
          {calendarOpen && <Calendar value={date} onSelect={(selectedDate) => {
            setDate(selectedDate);
            setCalendarOpen(false);
          }} />}
        </View>

        {/* ────────── 선택한 수입·지출 유형의 카테고리 ────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>카테고리</Text>
          <ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6 }}>
            {[{ id: undefined, name: '미분류' }, ...categories.filter((item) => item.kind === kind && !item.hidden && !item.deleted)].map((item) => (
              <Pressable key={item.id ?? 'none'} accessibilityRole="button" accessibilityState={{ selected: item.id === categoryId }}
                onPress={() => setCategoryId(item.id)}
                style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 12,
                  backgroundColor: item.id === categoryId ? colors.primary : colors.background }}>
                <Text style={{ color: item.id === categoryId ? colors.onPrimary : colors.ink }}>{item.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        {/* ────────── 선택 메모와 입력 오류 ────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>메모 (선택)</Text>
          <TextInput
            accessibilityLabel="메모 (선택)"
            style={styles.input}
            placeholder="예: 친구와 점심"
            placeholderTextColor={colors.muted}
            maxLength={100}
            value={memo}
            onChangeText={setMemo}
          />
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </View>
    </Popup>
  );
}

// 입력칸 높이, 항목 사이 여백, 수입·지출 선택 버튼의 모양을 지정합니다.
const createStyles = (colors: Palette) => StyleSheet.create({
  form: { marginTop: 8, gap: 20 },
  segment: { backgroundColor: colors.accentSurface, padding: 4, borderRadius: 16, flexDirection: 'row', gap: 4 },
  option: { flex: 1, minHeight: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.primary },
  optionText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  selectedText: { color: colors.onPrimary },
  field: { gap: 7 },
  label: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.paper,
    paddingHorizontal: 15,
    color: colors.ink,
    fontSize: 16,
  },
  dateButton: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 15,
    backgroundColor: colors.accentSurface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  dateAction: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.paper,
    paddingRight: 16,
  },
  amountInput: { flex: 1, minHeight: 68, paddingHorizontal: 15, color: colors.ink, fontSize: 28, fontWeight: '800' },
  unit: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  error: { color: colors.expense, fontSize: 14, fontWeight: '600' },
});

