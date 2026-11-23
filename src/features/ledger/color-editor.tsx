import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppearance, validHex, type ColorSlot } from './appearance';
import { rainbowStripe } from './styles';

export function ColorEditor() {
  const { colors, mode, stripe, saveColors, ui } = useAppearance();
  // -1은 화면 전체의 포인트 색, 0~6은 무지개 띠의 각 칸입니다.
  const [index, setIndex] = useState(-1);
  const [drafts, setDrafts] = useState<Partial<Record<ColorSlot, string>>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const current = index < 0 ? colors.primary : stripe[index];
  const slotKey = (slot: number): ColorSlot => slot < 0 ? mode : `stripe${slot}`;
  const value = drafts[slotKey(index)] ?? current;
  const hex = '#' + value.trim().replace(/^#/, '').toUpperCase();
  const valid = validHex(hex);

  // 다른 칸으로 이동해도 편집값을 보관하고 적용 버튼에서 한꺼번에 저장합니다.
  function setDraft(value: string) {
    setDrafts((current) => ({ ...current, [slotKey(index)]: value }));
    setMessage('');
  }

  function chooseSlot(next: number) {
    setIndex(next);

    setMessage('');
  }

  async function applyColor() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const changes: Partial<Record<ColorSlot, string>> = {};
      for (const slot of [-1, ...stripe.map((_, i) => i)]) {
        const key = slotKey(slot);
        const raw = drafts[key];
        if (raw === undefined) continue;
        const color = '#' + raw.trim().replace(/^#/, '').toUpperCase();
        if (!validHex(color)) {
          setIndex(slot);
          setMessage('표시된 색상 코드를 확인해 주세요.');
          return;
        }
        changes[key] = color;
      }
      await saveColors(changes);
      setDrafts({});
  
      setMessage('색상을 저장했어요.');
    } catch {
      setMessage('색상을 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>색상 맞춤 설정</Text>
      <View accessibilityLabel="적용된 테마 색상" style={[styles.preview, { backgroundColor: colors.primary }]}>
        <Text style={{ color: colors.onPrimary }}>적용된 색상</Text>
        <View style={styles.stripe}>
          {stripe.map((color, i) => <View key={i} style={{ flex: 1, backgroundColor: color }} />)}
        </View>
      </View>
      {mode === 'rainbow' && (
        <View style={styles.row}>
          {[-1, ...stripe.map((_, i) => i)].map((slot) => (
            <Pressable key={slot} disabled={busy} accessibilityRole="button"
              accessibilityLabel={slot < 0 ? '포인트 색' : (slot + 1) + '번째 띠 색상'}
              accessibilityState={{ selected: slot === index }} onPress={() => chooseSlot(slot)}
              style={[styles.slot, { borderColor: slot === index ? colors.accent : colors.line }]}>
              <Text style={{ color: colors.ink }}>{slot < 0 ? '포인트' : slot + 1}</Text>
              <View style={[styles.sample, { backgroundColor: validHex('#' + (drafts[slotKey(slot)] ?? '').replace(/^#/, '')) ? '#' + drafts[slotKey(slot)]!.replace(/^#/, '') : slot < 0 ? colors.primary : stripe[slot] }]} />
            </Pressable>
          ))}
        </View>
      )}
      <Text style={{ color: colors.muted }}>{index < 0 ? '화면 배경과 버튼에 쓸 포인트 색' : (index + 1) + '번째 띠 색상'} · 색을 고르거나 HEX 코드를 입력하세요.</Text>
      <View style={styles.row}>
        {rainbowStripe.map((color) => (
          <Pressable key={color} disabled={busy} accessibilityRole="button" accessibilityLabel={'색상 ' + color}
            onPress={() => { setDraft(color); setMessage(''); }}
            style={[styles.swatch, { borderColor: hex === color ? colors.accent : colors.line }]}>
            <View style={[styles.chip, { backgroundColor: color }]} />
          </Pressable>
        ))}
      </View>
      <View style={[styles.inputRow, { borderColor: colors.line }]}>
        <View style={[styles.chip, { backgroundColor: valid ? hex : current }]} />
        <TextInput accessibilityLabel="HEX 색상 코드" autoCorrect={false} autoCapitalize="characters"
          editable={!busy} maxLength={7} value={value} onChangeText={(text) => { setDraft(text); setMessage(''); }}
          style={[styles.input, { color: colors.ink }]} />
      </View>
      {!valid && <Text style={{ color: colors.expense }}>예: #8047A1처럼 여섯 자리로 입력해 주세요.</Text>}
      <Pressable accessibilityRole="button" disabled={!valid || busy} onPress={applyColor}
        style={[ui.button, (!valid || busy) && { opacity: 0.5 }]}>
        <Text style={ui.buttonText}>색상 적용</Text>
      </Pressable>
      {!!message && <Text accessibilityLiveRegion="polite" style={{ color: colors.muted }}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, paddingVertical: 12 },
  preview: { padding: 14, gap: 10, borderRadius: 12 },
  stripe: { flexDirection: 'row', height: 10, overflow: 'hidden', borderRadius: 5 },
  title: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  slot: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderRadius: 8 },
  sample: { height: 5, width: 22, borderRadius: 3 },
  swatch: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { width: 24, height: 24, borderRadius: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, gap: 10 },
  input: { flex: 1, minHeight: 44, fontSize: 16 },
});
