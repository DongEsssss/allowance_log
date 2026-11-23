import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { createUi, palettes, rainbowStripe, type Palette, type ThemeMode } from './styles';

const storageKey = 'allowance-log:theme';
export type ColorSlot = ThemeMode | `stripe${number}`;
const colorKey = (slot: ColorSlot) => 'allowance-log:color:' + slot;
const slots: ColorSlot[] = ['light', 'dark', 'rainbow', ...rainbowStripe.map((_, i) => `stripe${i}` as const)];
export const validHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

// 밝은 색과 어두운 색 모두에서 버튼 글자를 읽을 수 있게 상대 휘도로 전경색을 고릅니다.
function customize(base: Palette, hex: string | undefined): Palette {
  if (!hex) return base;
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const linear = rgb.map((n) => (n / 255 <= 0.04045 ? n / 255 / 12.92 : ((n / 255 + 0.055) / 1.055) ** 2.4));
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  const onPrimary = luminance > 0.179 ? '#000000' : '#FFFFFF';
  function blend(target: number, weight: number) {
    return '#' + rgb.map((n) => Math.round(n * (1 - weight) + target * weight).toString(16).padStart(2, '0')).join('');
  }
  // 무지개 테마의 포인트 색을 바꾸면 화면 바탕과 팝업도 같은 색조로 맞춥니다.
  const surfaces = {
    background: blend(255, 0.82),
    paper: blend(255, 0.95),
    line: blend(255, 0.68),
  };
  return { ...base, ...surfaces, primary: hex, onPrimary, cardMuted: onPrimary,
    accent: blend(0, 0.5),
    accentSurface: blend(255, 0.85) };
}
const AppearanceContext = createContext<{
  mode: ThemeMode;
  colors: Palette;
  ui: ReturnType<typeof createUi>;
  stripe: string[];
  saveColors: (changes: Partial<Record<ColorSlot, string>>) => Promise<void>;
  selectMode: (mode: ThemeMode) => void;
} | null>(null);

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [savedMode, setSavedMode] = useState<ThemeMode | null>(null);
  const [custom, setCustom] = useState<Partial<Record<ColorSlot, string>>>({});
  const pendingWrite = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    // 저장된 설정을 불러오는 동안 사용자가 직접 고른 테마가 있으면 그 선택을 우선합니다.
    void AsyncStorage.multiGet(slots.map(colorKey)).then((pairs) => {
      if (!active) return;
      const restored: Partial<Record<ColorSlot, string>> = {};
      for (const [key, value] of pairs) {
        const slot = slots.find((item) => colorKey(item) === key);
        if (slot && value && validHex(value)) restored[slot] = value;
      }
      setCustom((current) => ({ ...restored, ...current }));
    }).catch(() => {});
    void AsyncStorage.getItem(storageKey).then((value) => {
      if (active && (value === 'light' || value === 'dark' || value === 'rainbow')) {
        setSavedMode((current) => current ?? value);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function saveColors(changes: Partial<Record<ColorSlot, string>>) {
    const pairs: [string, string][] = [];
    for (const slot of slots) {
      const value = changes[slot];
      if (value === undefined) continue;
      if (!validHex(value)) throw new Error('올바른 색상 코드가 필요합니다.');
      pairs.push([colorKey(slot), value]);
    }
    const write = pendingWrite.current.then(() => AsyncStorage.multiSet(pairs));
    pendingWrite.current = write.catch(() => {});
    await write;
    setCustom((current) => ({ ...current, ...changes }));
  }

  const mode = savedMode ?? 'light';
  const colors = mode === 'rainbow' ? customize(palettes.rainbow, custom.rainbow) : palettes[mode];
  const ui = createUi(colors);
  const stripe = rainbowStripe.map((color, i) => custom[`stripe${i}`] ?? color);

  function selectMode(mode: ThemeMode) {
    setSavedMode(mode);
    // 테마를 연속으로 바꿔도 마지막 선택이 저장되도록 순서대로 기록합니다.
    pendingWrite.current = pendingWrite.current
      .then(() => AsyncStorage.setItem(storageKey, mode))
      .catch(() => {});
  }

  return (
    <AppearanceContext.Provider value={{ mode, selectMode, colors, ui, stripe, saveColors }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const appearance = useContext(AppearanceContext);
  if (!appearance) throw new Error('AppearanceProvider가 필요합니다.');
  return appearance;
}
