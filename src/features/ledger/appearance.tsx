import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { createUi, palettes, type ThemeMode } from './styles';

const storageKey = 'allowance-log:theme';
const sharedStyles = { light: createUi(palettes.light), dark: createUi(palettes.dark) };

const AppearanceContext = createContext<{
  mode: ThemeMode;
  selectMode: (mode: ThemeMode) => void;
} | null>(null);

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [savedMode, setSavedMode] = useState<ThemeMode | null>(null);
  const pendingWrite = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    // 저장된 설정을 불러오는 동안 사용자가 직접 고른 테마가 있으면 그 선택을 우선합니다.
    void AsyncStorage.getItem(storageKey).then((value) => {
      if (active && (value === 'light' || value === 'dark')) {
        setSavedMode((current) => current ?? value);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  function selectMode(mode: ThemeMode) {
    setSavedMode(mode);
    // 테마를 연속으로 바꿔도 마지막 선택이 저장되도록 순서대로 기록합니다.
    pendingWrite.current = pendingWrite.current
      .then(() => AsyncStorage.setItem(storageKey, mode))
      .catch(() => {});
  }

  return (
    <AppearanceContext.Provider value={{ mode: savedMode ?? 'light', selectMode }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const appearance = useContext(AppearanceContext);
  if (!appearance) throw new Error('AppearanceProvider가 필요합니다.');
  return { ...appearance, colors: palettes[appearance.mode], ui: sharedStyles[appearance.mode] };
}
