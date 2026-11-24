import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppearanceProvider, useAppearance } from '@/features/ledger/appearance';
import { LedgerProvider } from '@/features/ledger/ledger-provider';

export const unstable_settings = { anchor: 'index' };
const popupOptions = { presentation: 'transparentModal', contentStyle: { backgroundColor: 'transparent' } } as const;

function AppStack() {
  const { mode, colors } = useAppearance();
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  // 화면 전환 배경과 상태 표시줄도 선택한 테마에 맞춥니다.
  return (
    <ThemeProvider value={{
      ...baseTheme,
      colors: { ...baseTheme.colors, background: colors.background, card: colors.paper, text: colors.ink },
    }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="calendar" />
        {/* ────────── 홈 화면 위에 표시할 팝업 ────────── */}
        <Stack.Screen name="add" options={popupOptions} />
        <Stack.Screen name="settings" options={popupOptions} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // 화면을 이동해도 기록과 테마 선택이 유지되도록 공용 상태를 라우터 바깥에 둡니다.
  return (
    <AppearanceProvider>
      <LedgerProvider>
        <AppStack />
      </LedgerProvider>
    </AppearanceProvider>
  );
}
