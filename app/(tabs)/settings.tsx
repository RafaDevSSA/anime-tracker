import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ActivityIndicator,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { SettingsRepository, type AppSettings } from '@/src/db/SettingsRepository';

function HourPicker({
  label, value, onChange,
}: { label: string; value: number; onChange: (h: number) => void }) {
  const [text, setText] = useState(String(value));

  useEffect(() => { setText(String(value)); }, [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (isNaN(n) || n < 0 || n > 23) {
      Alert.alert('Valor inválido', 'Informe uma hora entre 0 e 23.');
      setText(String(value));
      return;
    }
    onChange(n);
  };

  return (
    <View style={pickerStyles.row}>
      <Text style={pickerStyles.label}>{label}</Text>
      <View style={pickerStyles.inputWrap}>
        <TextInput
          style={pickerStyles.input}
          keyboardType="number-pad"
          maxLength={2}
          value={text}
          onChangeText={setText}
          onBlur={commit}
          onSubmitEditing={commit}
          returnKeyType="done"
        />
        <Text style={pickerStyles.unit}>h</Text>
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222' },
  label: { color: '#ccc', fontSize: 15 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  input: { color: '#fff', fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  unit: { color: '#666', fontSize: 14, marginLeft: 4 },
});

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const s = await SettingsRepository.get();
    setSettings(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = async (key: keyof AppSettings, value: number) => {
    if (!settings) return;
    setSaving(true);
    try {
      await SettingsRepository.set(key, value);
      setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Configurações</Text>

      {/* Verificação diária */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verificação diária</Text>
        <Text style={styles.sectionDesc}>Hora em que o app verifica novos episódios em segundo plano.</Text>
        <HourPicker
          label="Hora da verificação"
          value={settings.checkHour}
          onChange={(v) => handleChange('checkHour', v)}
        />
      </View>

      {/* Silêncio noturno */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Silêncio noturno</Text>
        <Text style={styles.sectionDesc}>Notificações não são enviadas neste intervalo.</Text>
        <HourPicker
          label="Início do silêncio"
          value={settings.quietStart}
          onChange={(v) => handleChange('quietStart', v)}
        />
        <HourPicker
          label="Fim do silêncio"
          value={settings.quietEnd}
          onChange={(v) => handleChange('quietEnd', v)}
        />
        <Text style={styles.hint}>
          Silêncio ativo das {String(settings.quietStart).padStart(2, '0')}h às {String(settings.quietEnd).padStart(2, '0')}h
        </Text>
      </View>

      {saving && (
        <View style={styles.savingRow}>
          <ActivityIndicator size="small" color="#6c63ff" />
          <Text style={styles.savingText}>Salvando...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 20 },
  section: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 20 },
  sectionTitle: { color: '#6c63ff', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  sectionDesc: { color: '#555', fontSize: 13, marginBottom: 12 },
  hint: { color: '#444', fontSize: 12, marginTop: 10 },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 8 },
  savingText: { color: '#6c63ff', fontSize: 13 },
});
