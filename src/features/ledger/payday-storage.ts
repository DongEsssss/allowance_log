import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPaydayDay, isPaydayRule, type PaydaySettings } from './payday';

const key = 'allowance-log:payday';
type Preferences = PaydaySettings & { showOnCalendar: boolean };

export async function readPayday(): Promise<Preferences | null> {
  const raw = await AsyncStorage.getItem(key);
  const saved = raw && JSON.parse(raw);
  if (!saved || !isPaydayDay(saved.day) || !isPaydayRule(saved.rule)) return null;
  return { day: saved.day, rule: saved.rule, showOnCalendar: saved.showOnCalendar !== false };
}

export function savePayday(settings: Preferences) {
  return AsyncStorage.setItem(key, JSON.stringify(settings));
}