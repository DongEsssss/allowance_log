import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/features/ledger/appearance';
import { Popup } from '@/features/ledger/popup';
import { palettes, type Palette, type ThemeMode } from '@/features/ledger/styles';

// 설정에 표시하는 테마 이름과 설명입니다.
const options = [
  { mode: 'light', label: '라이트', description: '흰색 카드와 밝은 파랑 배경', icon: '☀' },
  { mode: 'dark', label: '다크', description: '짙은 남색 배경과 밝은 글자', icon: '☾' },
] satisfies { mode: ThemeMode; label: string; description: string; icon: string }[];

export default function SettingsScreen() {
  const { mode, selectMode, ui } = useAppearance();
  const styles = screenStyles[mode];

  return (
    <Popup title="설정">
      {/* ────────── 라이트·다크 테마 선택 ────────── */}
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>화면 테마</Text>
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
      </View>
    </Popup>
  );
}

// 테마 선택 카드의 여백, 모서리, 선택 표시를 조절하는 스타일입니다.
const createStyles = (colors: Palette) => StyleSheet.create({
  section: { marginTop: 10, gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  options: { gap: 10 },
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
  selected: { borderColor: colors.accent, backgroundColor: colors.softBlue },
  iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  icon: { color: colors.accent, fontSize: 22 },
  copy: { flex: 1, gap: 3 },
  label: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 13 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checked: { borderColor: colors.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});

const screenStyles = { light: createStyles(palettes.light), dark: createStyles(palettes.dark) };
