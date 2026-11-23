import { StyleSheet } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'rainbow';

// 테마별 색을 바꾸려면 이곳을 수정하세요. paper는 카드·입력칸, ink는 기본 글자색입니다.
export const palettes = {
  light: {
    background: '#FFF9EB',
    paper: '#FFFFFF',
    ink: '#29251F',
    muted: '#665F53',
    line: '#DDD6C8',
    primary: '#39342E',
    accent: '#39342E',
    onPrimary: '#FFFFFF',
    accentSurface: '#F1EBDD',
    softRed: '#F5EAE3',
    expense: '#904A39',
    cardMuted: '#E5E2DE',
  },
  rainbow: {
    background: '#FAF6FB',
    paper: '#FFFFFF',
    ink: '#31293C',
    muted: '#645A70',
    line: '#E1D8E6',
    primary: '#543567',
    accent: '#674282',
    onPrimary: '#FFFFFF',
    accentSurface: '#F0E5F7',
    softRed: '#FBE7E5',
    expense: '#913D41',
    cardMuted: '#F0E5F7',
  },
  dark: {
    background: '#000000',
    paper: '#171717',
    ink: '#F5F5F5',
    muted: '#BDBDBD',
    line: '#484848',
    primary: '#383838',
    accent: '#E5E5E5',
    onPrimary: '#FFFFFF',
    accentSurface: '#303030',
    softRed: '#42312C',
    expense: '#EAB5A3',
    cardMuted: '#E5E2DE',
  },
};

// 무지개 테마에서 왼쪽부터 표시할 일곱 색상입니다.
export const rainbowStripe = ['#F28990', '#FFBA79', '#F6DA80', '#92CCA1', '#86C8E6', '#969EE6', '#C79BE0'];

export type Palette = (typeof palettes)[ThemeMode];

// 화면에서 공통으로 쓰는 바깥 여백과 버튼 모양입니다.
export function createUi(colors: Palette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    page: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 24 },
    title: { color: colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -1.1 },
    footer: { paddingTop: 12, paddingBottom: 16 },
    button: {
      minHeight: 56,
      padding: 14,
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
    pressed: { opacity: 0.8 },
  });
}
