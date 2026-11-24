import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppearance } from './appearance';

// ────────── 하단 메뉴의 화면 읽기 이름, 아이콘, 순서 ──────────
const items = [
  { href: '/', label: '홈', icon: { ios: 'house', android: 'home', web: 'home' } },
  { href: '/calendar', label: '달력', icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } },
  { href: '/settings', label: '설정', icon: { ios: 'gearshape', android: 'settings', web: 'settings' } },
] as const;

export function BottomMenu({ active }: { active: '/' | '/calendar' }) {
  const { colors, ui } = useAppearance();

  return (
    <View style={{ backgroundColor: colors.paper }}>
      <View style={[ui.page, styles.menu]}>
        {items.map(({ href, label, icon }) => {
          const selected = href === active;
          return (
            <Link key={href} href={href} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                style={StyleSheet.flatten([
                  styles.item,
                  selected && { backgroundColor: colors.accentSurface },
                ])}>
                <SymbolView name={icon} size={24} tintColor={selected ? colors.accent : colors.ink} />
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

// ────────── 메뉴 높이 ──────────
const styles = StyleSheet.create({
  menu: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  item: { flexGrow: 1, flexBasis: 0, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 14, padding: 4 },
});
