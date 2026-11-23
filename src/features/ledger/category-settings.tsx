import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppearance } from './appearance';
import { moveCategory, nameCategory, type Category, type CategoryKind } from './categories';
import { entryKindLabels, useLedger } from './ledger';

// 잡은 카드는 손가락을 따라가고 이웃 카드는 빈자리로 미끄러집니다.
const spring = { stiffness: 310, damping: 32, mass: 0.8, overshootClamping: true, useNativeDriver: false };
function MovingCard({ active, dragging, offset, dragY, color, children }: {
  active: boolean; dragging: boolean; offset: number; dragY: Animated.Value; color: string; children: ReactNode;
}) {
  const [shift] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const lift = Animated.spring(scale, { ...spring, toValue: active ? 1.025 : 1 });
    lift.start();
    return () => lift.stop();
  }, [active, scale]);
  useEffect(() => {
    if (active || !dragging) {
      shift.setValue(0);
      return;
    }
    const animation = Animated.spring(shift, { ...spring, toValue: offset });
    animation.start();
    return () => animation.stop();
  }, [active, dragging, offset, shift]);
  return (
    <Animated.View style={[styles.card, {
      backgroundColor: color,
      transform: [{ translateY: active ? dragY : dragging ? shift : 0 }, { scale }],
    }, active && styles.lifted]}>
      {children}
    </Animated.View>
  );
}

export function CategorySettings({ onDragging }: { onDragging: (active: boolean) => void }) {
  const { categories, updateCategories } = useLedger();
  const { colors, mode, ui } = useAppearance();
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [editing, setEditing] = useState<string>();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragY] = useState(() => new Animated.Value(0));
  const [snapshot, setSnapshot] = useState<Category[] | null>(null);
  const items = snapshot ?? categories.filter((item) => item.kind === kind && !item.deleted);

  // 행의 실제 중심을 기준으로 손잡이를 놓을 위치를 계산합니다.
  const centers = useRef(new Map<string, number>());
  const gesture = useRef<{ id: string; startY: number; target: number } | null>(null);
  const [preview, setPreview] = useState<{ from: number; to: number; pitch: number } | null>(null);

  function targetIndex(index: number, pageY: number) {
    const start = gesture.current;
    if (!start) return index;
    const center = centers.current.get(start.id);
    if (center === undefined) return index;
    const position = center + pageY - start.startY;
    let closest = index;
    let distance = Math.abs(position - center);
    items.forEach((item, i) => {
      const y = centers.current.get(item.id);
      if (y !== undefined && Math.abs(position - y) < distance) {
        closest = i;
        distance = Math.abs(position - y);
      }
    });
    return closest;
  }

  function endDrag() {
    gesture.current = null;
    setSnapshot(null);
    setPreview(null);
    onDragging(false);
  }

  function dragPosition(index: number, pageY: number) {
    const center = centers.current.get(items[index].id) ?? 0;
    const first = centers.current.get(items[0].id) ?? center;
    const last = centers.current.get(items[items.length - 1].id) ?? center;
    const neighbor = items[index + 1] ?? items[index - 1];
    const pitch = neighbor ? Math.abs((centers.current.get(neighbor.id) ?? center) - center) : 0;
    const dy = pageY - (gesture.current?.startY ?? pageY);
    return { from: index, to: targetIndex(index, pageY), pitch, dy: Math.max(first - center, Math.min(last - center, dy)) };
  }

  function rowOffset(index: number) {
    if (!preview) return 0;
    const { from, to, pitch } = preview;

    if (from < index && index <= to) return -pitch;
    if (to <= index && index < from) return pitch;
    return 0;
  }

  function resetEditor() {
    setEditing(undefined);
    setName('');
    setError('');
  }

  async function change(update: (current: Category[]) => Category[], finishEditing = false) {
    setBusy(true);
    setError('');
    try {
      await updateCategories(update);
      if (finishEditing) resetEditor();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : '저장하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(item: Category) {
    const message = '‘' + item.name + '’ 카테고리를 삭제할까요? 기존 거래에는 이 이름이 유지돼요.';
    const remove = () => void change((current) => current.map((c) =>
      c.id === item.id ? { ...c, deleted: true } : c), editing === item.id);
    if (Platform.OS === 'web') {
      if (window.confirm(message)) remove();
    } else {
      Alert.alert('카테고리 삭제', message, [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: remove },
      ]);
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        {(['expense', 'income'] as const).map((value) => (
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: kind === value }}
            disabled={busy} onPress={() => { setKind(value); resetEditor(); }}
            style={[styles.tab, { backgroundColor: kind === value ? colors.primary : colors.background }]}>
            <Text style={{ color: kind === value ? colors.onPrimary : colors.ink }}>{entryKindLabels[value]}</Text>
          </Pressable>
        ))}
      </View>

      {/* ────────── 추가와 이름 변경 ────────── */}
      <Text style={[styles.title, { color: colors.ink }]}>{editing ? '이름 변경' : '새 카테고리'}</Text>
      <TextInput accessibilityLabel="카테고리 이름" value={name} onChangeText={setName} maxLength={30}
        editable={!busy} placeholder="카테고리 이름" placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.ink, borderColor: colors.line }]} />
      <View style={styles.row}>
        <Pressable accessibilityRole="button" disabled={busy || !name.trim()}
          onPress={() => void change((current) => nameCategory(current, kind, name, editing), true)}
          style={[ui.button, styles.grow, (busy || !name.trim()) && styles.dim]}>
          <Text style={ui.buttonText}>{editing ? '이름 저장' : '추가'}</Text>
        </Pressable>
        {editing && <Pressable accessibilityRole="button" onPress={resetEditor} disabled={busy} style={styles.action}>
          <Text style={{ color: colors.accent }}>취소</Text>
        </Pressable>}
      </View>
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.expense }}>{error}</Text>}

      {/* ────────── 현재 순서 및 기록 화면에 표시할 항목 ────────── */}
      {items.map((item, index) => (
        <View key={item.id}
          onLayout={({ nativeEvent: { layout } }) => centers.current.set(item.id, layout.y + layout.height / 2)}
          style={{ zIndex: preview?.from === index ? 2 : 0 }}>
          <MovingCard active={preview?.from === index} dragging={!!preview} dragY={dragY} offset={rowOffset(index)}
            color={preview?.from === index ? colors.accentSurface : colors.background}>
          <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={item.name + ' 이름 변경'}
            onPress={() => { setEditing(item.id); setName(item.name); setError(''); }} style={styles.action}>
            <Text style={{ color: colors.accent, fontSize: 18 }}>✎</Text>
          </Pressable>
          <Text numberOfLines={1} style={[styles.title, styles.grow, { color: colors.ink }]}>
            {item.name}{item.hidden ? ' · 숨김' : ''}
          </Text>
          <View style={styles.actions}>
            <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={item.name + ' 삭제'}
              onPress={() => confirmDelete(item)} style={styles.action}>
              <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                size={20} tintColor={mode === 'dark' ? '#FF8585' : '#C62828'} />
            </Pressable>
            <View accessible accessibilityRole="adjustable" accessibilityLabel={item.name + ' 순서 변경'}
              accessibilityHint="손잡이를 위아래로 끌어 이동하세요."
              accessibilityValue={{ min: 1, max: items.length, now: index + 1 }}
              accessibilityActions={[{ name: 'increment', label: '아래로' }, { name: 'decrement', label: '위로' }]}
              onAccessibilityAction={({ nativeEvent }) => {
                if (!busy) void change((current) => moveCategory(current, item, nativeEvent.actionName === 'increment' ? 1 : -1));
              }}
              style={styles.handle}
              onStartShouldSetResponder={() => !busy && !gesture.current && items.length > 1}
              onResponderGrant={({ nativeEvent }) => {
                gesture.current = { id: item.id, startY: nativeEvent.pageY, target: index };
                dragY.setValue(0);
                setSnapshot(items);
                setPreview(dragPosition(index, nativeEvent.pageY));
                onDragging(true);
              }}
              onResponderMove={({ nativeEvent }) => {
                const drag = gesture.current;
                if (!drag) return;
                const position = dragPosition(index, nativeEvent.pageY);
                // 픽셀마다 목록을 다시 그리지 않고 카드 위치만 갱신합니다.
                dragY.setValue(position.dy);
                if (drag.target !== position.to) {
                  drag.target = position.to;
                  setPreview(position);
                }
              }}
              onResponderRelease={({ nativeEvent }) => {
                const position = dragPosition(index, nativeEvent.pageY);
                const destination = centers.current.get(items[position.to].id) ?? 0;
                const origin = centers.current.get(item.id) ?? destination;
                setPreview(position);
                setBusy(true);
                // 저장 전후에 카드가 출발점으로 튀지 않도록 도착 위치까지 먼저 정착시킵니다.
                Animated.spring(dragY, { ...spring, toValue: destination - origin }).start(({ finished }) => {
                  if (finished && position.to !== index) {
                    void change((current) => moveCategory(current, item, position.to - index)).finally(endDrag);
                  } else {
                    setBusy(false);
                    endDrag();
                  }
                });
              }}
              onResponderTerminationRequest={() => false}
              onResponderTerminate={endDrag}>
              <View pointerEvents="none" style={styles.grip}>
                {[0, 1, 2, 3, 4, 5].map((dot) => (
                  <View key={dot} style={[styles.gripDot, { backgroundColor: colors.muted }]} />
                ))}
              </View>
            </View>
          </View>
          </MovingCard>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, paddingVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  grow: { flex: 1 },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  title: { fontSize: 15, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 48, fontSize: 16 },
  // 이름만 말줄임 처리하고 조작 버튼은 항상 같은 줄에 둡니다.
  card: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4, borderRadius: 12 },
  handle: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', touchAction: 'none' },
  // 두 열의 점만 작게 표시하고 실제 터치 영역은 44로 유지합니다.
  grip: { width: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gripDot: { width: 3, height: 3, borderRadius: 1.5 },
  lifted: { boxShadow: '0 5px 14px rgba(0, 0, 0, 0.22)' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  action: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  dim: { opacity: 0.45 },
});
