import Constants from 'expo-constants';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/features/ledger/appearance';
import { ColorEditor } from '@/features/ledger/color-editor';
import { CategorySettings } from '@/features/ledger/category-settings';
import { CsvSettingsSection } from '@/features/ledger/csv-settings';
import { PaydaySettingsSection } from '@/features/ledger/payday-settings';
import { Popup } from '@/features/ledger/popup';
import { type Palette, type ThemeMode } from '@/features/ledger/styles';

// 설정에 표시하는 테마 이름과 설명입니다.
const options = [
  { mode: 'light', label: '라이트', description: '아이보리 배경과 흰색 카드', icon: '☀' },
  { mode: 'rainbow', label: '무지개', description: '내가 고른 테마 색과 일곱 빛깔 띠', icon: '🌈' },
  { mode: 'dark', label: '다크', description: '검은 배경과 밝은 글자', icon: '☾' },
] satisfies { mode: ThemeMode; label: string; description: string; icon: string }[];

// ────────── 라이트·다크 테마 선택 ──────────
function ThemeOptions() {
  const { mode, selectMode, colors, ui } = useAppearance();
  const styles = createStyles(colors);

  return (
    <View style={styles.section}>

      <View accessibilityRole="radiogroup" accessibilityLabel="화면 테마" style={styles.options}>
        {options.map((option) => {
          const checked = mode === option.mode;
          return (
            <Pressable
              key={option.mode}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked }}
              onPress={() => selectMode(option.mode)}
              style={({ pressed }) => [styles.option, checked && styles.selected, pressed && ui.pressed]}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{option.icon}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.label}>{option.label}</Text>
                <Text style={styles.description}>{option.description}</Text>
              </View>
              <View style={[styles.radio, checked && styles.checked]}>
                {checked && <View style={styles.dot} />}
              </View>
            </Pressable>
          );
        })}
      </View>
      {mode === 'rainbow' && <ColorEditor />}
    </View>
  );
}

// ────────── 설정 첫 화면의 순서와 상세 화면 ──────────
const menus = [
  { id: 'theme', label: '화면 테마', icon: '◐' },
  { id: 'payday', label: '월급일', icon: '₩' },
  { id: 'categories', label: '카테고리 관리', icon: '≡' },
  { id: 'data', label: '데이터 관리', icon: '⇩' },
  { id: 'about', label: '앱 정보', icon: 'ⓘ' },
] as const;
type Page = 'settings' | 'csv' | typeof menus[number]['id'];

export default function SettingsScreen() {
  const { mode, colors, ui } = useAppearance();
  const styles = createStyles(colors);
  const [dragging, setDragging] = useState(false);
  const [page, setPage] = useState<Page>('settings');
  const version = Constants.expoConfig?.version ?? '—';
  const details = {
    theme: options.find((option) => option.mode === mode)?.label,
    payday: '지급일 · 휴일 조정',
    categories: '수입·지출 분류와 표시 순서',
    data: '기간별 CSV 내보내기',
    about: '버전 ' + version,
  };
  const title = page === 'csv' ? 'CSV 내보내기' : menus.find((menu) => menu.id === page)?.label ?? '설정';

  return (
    <Popup key={page} title={title} scrollEnabled={page !== 'categories' || !dragging} fixedSize={page === 'categories'}>
      {page !== 'settings' && (
        <Pressable accessibilityRole="button" accessibilityLabel={page === 'csv' ? '데이터 관리로 돌아가기' : '설정으로 돌아가기'}
          style={styles.back} onPress={() => setPage(page === 'csv' ? 'data' : 'settings')}>
          <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={20} tintColor={colors.accent} />
          <Text style={styles.backText}>{page === 'csv' ? '데이터 관리' : '설정'}</Text>
        </Pressable>
      )}
      {page === 'settings' && (
        <View style={styles.menuGroup}>
          {menus.map((menu) => (
            <Pressable key={menu.id} accessibilityRole="button" accessibilityLabel={menu.label}
              onPress={() => setPage(menu.id)} style={({ pressed }) => [styles.menuRow, pressed && ui.pressed]}>
              <View style={styles.menuIcon}><Text style={styles.icon}>{menu.icon}</Text></View>
              <View style={styles.copy}>
                <Text style={styles.label}>{menu.label}</Text>
                <Text style={styles.description}>{details[menu.id]}</Text>
              </View>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={20} tintColor={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
      {page === 'theme' && <ThemeOptions />}
      {page === 'categories' && <CategorySettings onDragging={setDragging} />}
      {page === 'payday' && <PaydaySettingsSection />}
      {page === 'data' && (
        <Pressable accessibilityRole="button" onPress={() => setPage('csv')} style={styles.menuRow}>
          <View style={styles.copy}>
            <Text style={styles.label}>CSV 내보내기</Text>
            <Text style={styles.description}>기간을 선택해 거래 내역을 파일로 저장해요.</Text>
          </View>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={20} tintColor={colors.muted} />
        </Pressable>
      )}
      {page === 'csv' && <CsvSettingsSection />}
      {page === 'about' && (
        <View style={styles.info}>
          <Text style={styles.sectionTitle}>용돈기입장</Text>
          <Text style={styles.description}>버전 {version}</Text>
          <Text style={styles.label}>데이터 보관</Text>
          <Text style={styles.description}>테마와 월급일은 기기에 저장돼요. 저장한 거래 기록은 앱을 다시 열어도 이 기기에 남아요. 보관할 기록은 CSV로 내보낼 수 있어요.</Text>
        </View>
      )}
    </Popup>
  );
}
// 테마 선택 카드의 여백, 모서리, 선택 표시를 조절하는 스타일입니다.
const createStyles = (colors: Palette) => StyleSheet.create({
  menuGroup: { gap: 12, paddingVertical: 6 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 17, minHeight: 76, backgroundColor: colors.background, borderRadius: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSurface },
  back: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, color: colors.accent, fontWeight: '600' },
  info: { padding: 18, backgroundColor: colors.background, borderRadius: 12, gap: 10 },
  section: { marginTop: 12, gap: 18 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  options: { gap: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    padding: 14,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
  },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  icon: { color: colors.accent, fontSize: 22 },
  copy: { flex: 1, gap: 3 },
  label: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checked: { borderColor: colors.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});

