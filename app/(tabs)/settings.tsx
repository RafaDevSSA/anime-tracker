import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ActivityIndicator,
  ScrollView, TextInput,
} from 'react-native';
import { SettingsRepository, type AppSettings } from '@/src/db/SettingsRepository';
import { useTheme, type ThemeMode } from '@/src/context/ThemeContext';
import { showError } from '@/src/utils/alert';

function HourPicker({
  label, value, onChange, textColor, borderColor, inputBg,
}: { label: string; value: number; onChange: (h: number) => void; textColor: string; borderColor: string; inputBg: string }) {
  const [text, setText] = useState(String(value));

  useEffect(() => { setText(String(value)); }, [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (isNaN(n) || n < 0 || n > 23) {
      showError('Valor inválido', 'Informe uma hora entre 0 e 23.');
      setText(String(value));
      return;
    }
    onChange(n);
  };

  return (
    <View style={[pickerStyles.row, { borderBottomColor: borderColor }]}>
      <Text style={[pickerStyles.label, { color: textColor }]}>{label}</Text>
      <View style={[pickerStyles.inputWrap, { backgroundColor: inputBg }]}>
        <TextInput
          style={[pickerStyles.input, { color: textColor }]}
          keyboardType="number-pad"
          maxLength={2}
          value={text}
          onChangeText={setText}
          onBlur={commit}
          onSubmitEditing={commit}
          returnKeyType="done"
        />
        <Text style={[pickerStyles.unit, { color: textColor }]}>h</Text>
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  label: { fontSize: 15 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  input: { fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  unit: { fontSize: 14, marginLeft: 4 },
});

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await SettingsRepository.get();
      setSettings(s);
    } catch (e: any) {
      showError('Erro', e.message ?? 'Não foi possível carregar as configurações.');
      setSettings({ checkHour: 8, quietStart: 22, quietEnd: 8, colorScheme: 'system' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = async (key: 'checkHour' | 'quietStart' | 'quietEnd', value: number) => {
    if (!settings) return;
    setSaving(true);
    try {
      await SettingsRepository.set(key, value);
      setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    } finally {
      setSaving(false);
    }
  };

  const s = makeStyles(colors);

  if (!settings) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.header}>Configurações</Text>

      {/* Tema */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Tema</Text>
        <Text style={s.sectionDesc}>Escolha a aparência do app.</Text>
        <View style={s.segmented}>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[s.segment, mode === opt.value && s.segmentActive]}
              onPress={() => setMode(opt.value)}
            >
              <Text style={[s.segmentText, mode === opt.value && s.segmentTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Verificação diária */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Verificação diária</Text>
        <Text style={s.sectionDesc}>Hora em que o app verifica novos episódios em segundo plano.</Text>
        <HourPicker
          label="Hora da verificação"
          value={settings.checkHour}
          onChange={(v) => handleChange('checkHour', v)}
          textColor={colors.textSecondary}
          borderColor={colors.border}
          inputBg={colors.background}
        />
      </View>

      {/* Silêncio noturno */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Silêncio noturno</Text>
        <Text style={s.sectionDesc}>Notificações não são enviadas neste intervalo.</Text>
        <HourPicker
          label="Início do silêncio"
          value={settings.quietStart}
          onChange={(v) => handleChange('quietStart', v)}
          textColor={colors.textSecondary}
          borderColor={colors.border}
          inputBg={colors.background}
        />
        <HourPicker
          label="Fim do silêncio"
          value={settings.quietEnd}
          onChange={(v) => handleChange('quietEnd', v)}
          textColor={colors.textSecondary}
          borderColor={colors.border}
          inputBg={colors.background}
        />
        <Text style={s.hint}>
          Silêncio ativo das {String(settings.quietStart).padStart(2, '0')}h às {String(settings.quietEnd).padStart(2, '0')}h
        </Text>
      </View>

      {saving && (
        <View style={s.savingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={s.savingText}>Salvando...</Text>
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 16 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 20 },
    section: { backgroundColor: c.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: c.border },
    sectionTitle: { color: c.accent, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    sectionDesc: { color: c.textMuted, fontSize: 13, marginBottom: 12 },
    hint: { color: c.textMuted, fontSize: 12, marginTop: 10 },
    segmented: { flexDirection: 'row', gap: 8, marginTop: 4 },
    segment: {
      flex: 1, paddingVertical: 10, alignItems: 'center',
      borderRadius: 8, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.background,
    },
    segmentActive: { backgroundColor: c.accent, borderColor: c.accent },
    segmentText: { color: c.textSecondary, fontWeight: '600', fontSize: 14 },
    segmentTextActive: { color: '#fff' },
    savingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 8 },
    savingText: { color: c.accent, fontSize: 13 },
  });
}
