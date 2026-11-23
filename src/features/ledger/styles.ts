import { StyleSheet } from 'react-native';

export type ThemeMode = 'light' | 'dark';

// 테마별 색을 바꾸려면 이곳을 수정하세요. paper는 카드·입력칸, ink는 기본 글자색입니다.
export const palettes = {
  light: {
    background: '#F0F5FC',
    paper: '#FFFFFF',
    ink: '#102344',
    muted: '#4A6080',
    line: '#D5E1F2',
    primary: '#174BB7',
    accent: '#174BB7',
    onPrimary: '#FFFFFF',
    softBlue: '#E1ECFF',
    softRed: '#FCECEB',
    expense: '#9F342D',
    cardMuted: '#E3EEFF',
  },
  dark: {
    background: '#0A1325',
    paper: '#14223A',
    ink: '#EDF4FF',
    muted: '#B2C4DF',
    line: '#344966',
    primary: '#2459C5',
    accent: '#A4C6FF',
    onPrimary: '#FFFFFF',
    softBlue: '#20385F',
    softRed: '#422B37',
    expense: '#FFB3AA',
    cardMuted: '#E3EEFF',
  },
};

export type Palette = (typeof palettes)[ThemeMode];

// 화면에서 공통으로 쓰는 바깥 여백과 버튼 모양입니다.
export function createUi(colors: Palette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    page: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 24 },
    title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.3 },
    footer: { paddingTop: 12, paddingBottom: 16 },
    button: {
      minHeight: 56,
      padding: 14,
      backgroundColor: colors.primary,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
    pressed: { opacity: 0.8 },
  });
}
