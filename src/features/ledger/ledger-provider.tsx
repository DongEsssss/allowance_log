import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { initialEntries, LedgerContext, type Entry, type EntryDraft } from './ledger';

import { defaultCategories, type Category } from './categories';

const categoryKey = 'allowance-log:categories';
async function readCategories(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(categoryKey);
  return raw === null ? defaultCategories : JSON.parse(raw);
}

const storageKey = 'allowance-log:entries';

async function readEntries(fallback: Entry[]): Promise<Entry[]> {
  const stored = await AsyncStorage.getItem(storageKey);
  return stored === null ? fallback : JSON.parse(stored);
}

// 기기 저장에 성공한 뒤에만 홈·달력의 공용 목록을 갱신합니다.
export function LedgerProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState(initialEntries);
  const [categories, setCategories] = useState(defaultCategories);
  const seed = useRef(entries);
  const pending = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    pending.current = pending.current.then(async () => {
      const saved = await readEntries(seed.current);
      if (active) setEntries(saved);
      const storedCategories = await readCategories();
      if (active) setCategories(storedCategories);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  function updateCategories(change: (items: Category[]) => Category[]) {
    const write = pending.current.then(async () => {
      const next = change(await readCategories());
      await AsyncStorage.setItem(categoryKey, JSON.stringify(next));
      setCategories(next);
    });
    pending.current = write.catch(() => {});
    return write;
  }

  function addEntry(entry: EntryDraft) {
    const write = pending.current.then(async () => {
      const saved = await readEntries(seed.current);
      const next = [{ ...entry, id: (saved[0]?.id ?? 0) + 1 }, ...saved];
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      setEntries(next);
    });
    pending.current = write.catch(() => {});
    return write;
  }

  return <LedgerContext.Provider value={{ entries, addEntry, categories, updateCategories }}>{children}</LedgerContext.Provider>;
}
