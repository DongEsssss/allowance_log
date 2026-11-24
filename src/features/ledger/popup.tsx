import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from './appearance';

export function closePopup() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function Popup({ title, children, footer, scrollEnabled = true, fixedSize = false }: { title: string; children: ReactNode; footer?: ReactNode; scrollEnabled?: boolean; fixedSize?: boolean }) {
  const { colors, ui } = useAppearance();
  const { height: windowHeight } = useWindowDimensions();
  const fixedHeight = Math.min(windowHeight * 0.82, 680);

  return (
    <SafeAreaView style={styles.root}>
      {/* ────────── 팝업 밖을 누르면 닫히는 배경 ────────── */}
      <Pressable accessible={false} onPress={closePopup} style={[StyleSheet.absoluteFill, styles.backdrop]} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
        style={styles.position}>
        <View accessibilityViewIsModal style={[styles.panel, fixedSize && { height: fixedHeight }, { backgroundColor: colors.paper }]}>
          {/* ────────── 제목과 닫기 버튼 ────────── */}
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[ui.title, styles.title]}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={closePopup} style={styles.close}>
              <Text style={[styles.closeText, { color: colors.accent }]}>×</Text>
            </Pressable>
          </View>

          {/* ────────── 스크롤되는 내용과 하단 버튼 ────────── */}
          <ScrollView scrollEnabled={scrollEnabled} style={[styles.scroll, fixedSize && styles.fixedScroll]} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(15, 22, 17, 0.55)' },
  position: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 14 },
  panel: { width: '100%', maxWidth: 456, maxHeight: '100%', borderRadius: 18, overflow: 'hidden' },
  header: { paddingLeft: 24, paddingRight: 16, paddingTop: 18, flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 25 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 28, lineHeight: 32 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  fixedScroll: { flex: 1 },
  body: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 20 },
});
