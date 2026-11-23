import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from './appearance';
import { Calendar } from './calendar';
import { createLedgerCsv, presetRange, recordsInRange, type CsvPreset, type CsvRange } from './csv';
import { exportFile } from './export-file';
import { useLedger } from './ledger';

type Period = CsvPreset | 'custom';

const options: { value: Period; label: string }[] = [
  { value: '1day', label: '1일' },
  { value: '7days', label: '7일' },
  { value: '1month', label: '1달' },
  { value: '3months', label: '3달' },
  { value: 'custom', label: '직접 지정' },
];

const dateFields = [
  { value: 'start', label: '시작일' },
  { value: 'end', label: '종료일' },
] as const;

export function CsvSettingsSection() {
  const { colors, ui } = useAppearance();
  const { entries, categories } = useLedger();
  const [period, setPeriod] = useState<Period>('1month');
  const [customRange, setCustomRange] = useState(() => presetRange('1month'));
  const [picker, setPicker] = useState<keyof CsvRange>('start');
  const [exporting, setExporting] = useState(false);
  const exportInProgress = useRef(false);
  const [error, setError] = useState('');
  const range = period === 'custom' ? customRange : presetRange(period);
  const valid = range.start <= range.end;
  const matchingEntries = valid ? recordsInRange(entries, range) : [];
  const disabled = exporting || (valid && !matchingEntries.length);

  function selectDate(date: string) {
    if (exporting) return;
    // 빠른 기간에서 날짜를 누르면 기존 범위를 복사한 뒤 선택한 날짜를 반영합니다.
    setCustomRange({ ...range, [picker]: date });
    setPeriod('custom');
    setPicker('end');
    setError('');
  }

  async function download() {
    if (disabled || exportInProgress.current) return;
    // 날짜 순서 오류는 내보내기를 눌렀을 때만 안내합니다.
    if (!valid) {
      const message = '종료일은 시작일과 같거나 이후여야 합니다.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('날짜 확인', message, [{ text: '확인' }]);
      return;
    }
    exportInProgress.current = true;
    setExporting(true);
    setError('');
    try {
      await exportFile('allowance-log_' + range.start + '_' + range.end + '.csv', createLedgerCsv(matchingEntries, categories));
    } catch {
      setError('CSV 파일을 내보내지 못했어요. 다시 시도해 주세요.');
    } finally {
      exportInProgress.current = false;
      setExporting(false);
    }
  }

  return (
    <View style={styles.section}>
      {/* ────────── CSV에 넣을 기간 선택 ────────── */}
      <View accessibilityRole="radiogroup" accessibilityLabel="내보낼 기간" style={styles.options}>
        {options.map(({ value, label }) => {
          const selected = period === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              disabled={exporting}
              onPress={() => {
                if (value === period) return;
                if (value === 'custom') setCustomRange(range);
                setPeriod(value);
                setPicker('start');
                setError('');
              }}
              style={[styles.option, {
                backgroundColor: selected ? colors.accentSurface : colors.paper,
                borderColor: selected ? colors.accent : colors.line,
              }]}>
              <Text style={[styles.label, { color: selected ? colors.accent : colors.ink }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ────────── 모든 기간에서 보이는 시작일·종료일과 달력 ────────── */}
      <View style={styles.options}>
        {dateFields.map(({ value, label }) => {
          const selected = picker === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              disabled={exporting}
              onPress={() => setPicker(value)}
              style={[styles.date, {
                backgroundColor: selected ? colors.accentSurface : colors.paper,
                borderColor: selected ? colors.accent : colors.line,
              }]}>
              <Text style={[styles.label, { color: colors.accent }]}>{label}</Text>
              <Text style={{ color: colors.ink }}>{range[value]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Calendar key={picker + range[picker].slice(0, 7)} value={range[picker]} onSelect={selectDate} />

      {/* ────────── 선택한 범위와 내보내는 기록 건수 ────────── */}
      <Text accessibilityLiveRegion="polite" style={{ color: colors.muted }}>
        {range.start + ' ~ ' + range.end}{valid ? ' · ' + matchingEntries.length + '건' : ''}
      </Text>
      {valid && !matchingEntries.length && <Text style={{ color: colors.muted }}>선택한 기간에 기록이 없어요.</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: exporting }}
        disabled={disabled}
        onPress={() => void download()}
        style={[ui.button, disabled && styles.disabled]}>
        <Text style={ui.buttonText}>{exporting ? '내보내는 중…' : 'CSV 파일 내보내기'}</Text>
      </Pressable>
      {error !== '' && <Text accessibilityRole="alert" style={{ color: colors.expense }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 19, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  option: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
  date: { flex: 1, minHeight: 52, padding: 10, gap: 2, borderRadius: 12, borderWidth: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
