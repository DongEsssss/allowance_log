import { readPayday, savePayday } from "./payday-storage";
import { useEffect, useState } from "react";
import { Pressable, Switch, StyleSheet, Text, TextInput, View } from "react-native";

import { useAppearance } from "./appearance";
import {
  isPaydayDay,

  nextPayday,
  type PaydayRule,
} from "./payday";


const formatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const rules: { value: PaydayRule; label: string; description: string }[] = [
  { value: "earlier", label: "당겨서 받기", description: "이전 영업일" },
  { value: "later", label: "미뤄서 받기", description: "다음 영업일" },
];

export function PaydaySettingsSection() {
  const { colors, ui } = useAppearance();
  const [dayText, setDayText] = useState("");
  const [rule, setRule] = useState<PaydayRule>("earlier");
  const [showOnCalendar, setShowOnCalendar] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const day = Number(dayText);
  const valid = isPaydayDay(day);
  const preview = valid ? nextPayday({ day, rule }) : null;

  useEffect(() => {
    let active = true;
    void readPayday()
      .then((saved) => {
        if (!active || !saved) return;
        setDayText(String(saved.day));
        setRule(saved.rule);
        setShowOnCalendar(saved.showOnCalendar);
      })
      .catch(() => {
        if (active) setMessage("저장된 월급일을 불러오지 못했어요.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!valid || !ready || saving) return;
    setSaving(true);
    try {
      await savePayday({ day, rule, showOnCalendar });
      setMessage("월급일을 저장했어요.");
    } catch {
      setMessage("월급일을 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.section}>
      {/* ────────── 매월 기본 월급일 ────────── */}
      <Text
        accessibilityRole="header"
        style={[styles.heading, { color: colors.ink }]}
      >
        월급일
      </Text>
      <View style={styles.dayRow}>
        <Text style={[styles.label, { color: colors.ink }]}>매월</Text>
        <TextInput
          accessibilityLabel="매월 월급일, 1일부터 31일까지"
          value={dayText}
          onChangeText={(text) => {
            setDayText(text.replace(/\D/g, "").slice(0, 2));
            setMessage("");
          }}
          editable={ready && !saving}
          inputMode="numeric"
          maxLength={2}
          placeholder="25"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            { borderColor: colors.line, color: colors.ink },
          ]}
        />
        <Text style={[styles.label, { color: colors.ink }]}>일</Text>
      </View>
      <Text style={[styles.help, { color: colors.muted }]}>
        해당 날짜가 없는 달은 말일을 기준으로 계산해요.
      </Text>
      {dayText !== "" && !valid && (
        <Text style={{ color: colors.expense }}>
          1일부터 31일까지 입력해 주세요.
        </Text>
      )}

      {/* ────────── 주말·한국 공휴일 지급 방식 ────────── */}
      <Text style={[styles.label, { color: colors.ink }]}>
        주말·공휴일이라면
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="휴일 지급 방식"
        style={styles.rules}
      >
        {rules.map(({ value, label, description }) => {
          const selected = rule === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{
                checked: selected,
                disabled: !ready || saving,
              }}
              disabled={!ready || saving}
              onPress={() => {
                setRule(value);
                setMessage("");
              }}
              style={[
                styles.rule,
                {
                  backgroundColor: selected ? colors.accentSurface : colors.paper,
                  borderColor: selected ? colors.accent : colors.line,
                },
              ]}
            >
              <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
              <Text style={[styles.help, { color: colors.muted }]}>
                {description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ────────── 다음 지급일 미리보기와 저장 ────────── */}
      {valid && (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.preview,
            { color: colors.accent, backgroundColor: colors.accentSurface },
          ]}
        >
          {preview
            ? "다음 지급 예정일 · " + formatter.format(preview.actual)
            : "해당 기간의 공휴일 자료가 없어요."}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.label, { color: colors.ink }]}>달력에 월급날 표시</Text>
        <Switch accessibilityLabel="달력에 월급날 표시" disabled={!ready || saving} value={showOnCalendar}
          onValueChange={(value) => { setShowOnCalendar(value); setMessage(''); }} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready || !valid || saving }}
        disabled={!ready || !valid || saving}
        onPress={() => void save()}
        style={[ui.button, (!ready || !valid || saving) && styles.disabled]}
      >
        <Text style={ui.buttonText}>월급일 저장</Text>
      </Pressable>
      {message !== "" && (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.help, { color: colors.muted }]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, paddingTop: 20, paddingBottom: 8 },
  heading: { fontSize: 19, fontWeight: "800" },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 15, fontWeight: "700" },
  input: {
    width: 64,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 16,
  },
  help: { fontSize: 13 },
  rules: { flexDirection: "row", gap: 8 },
  rule: {
    flex: 1,
    gap: 3,
    minHeight: 54,
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  preview: { padding: 12, borderRadius: 12, fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
