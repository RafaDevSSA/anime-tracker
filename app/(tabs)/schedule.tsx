import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, SectionList, Image,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { ScheduleService } from '@/src/services/ScheduleService';
import { useTheme } from '@/src/context/ThemeContext';
import type { Anime, WeekSchedule } from '@/src/types';

const DAY_ORDER = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];
const DAY_PT: Record<string, string> = {
  Mondays: 'Segunda', Tuesdays: 'Terça', Wednesdays: 'Quarta',
  Thursdays: 'Quinta', Fridays: 'Sexta', Saturdays: 'Sábado', Sundays: 'Domingo',
};

type AnimeScheduleRow = { anime: Anime; schedule: WeekSchedule | null };
type Section = { title: string; data: AnimeScheduleRow[] };

function buildSections(rows: AnimeScheduleRow[]): Section[] {
  const byDay: Record<string, AnimeScheduleRow[]> = {};
  const noSchedule: AnimeScheduleRow[] = [];

  for (const row of rows) {
    const day = row.schedule?.day_of_week ?? null;
    if (!day) { noSchedule.push(row); continue; }
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(row);
  }

  const sections: Section[] = DAY_ORDER
    .filter((d) => byDay[d]?.length)
    .map((d) => ({
      title: DAY_PT[d] ?? d,
      data: byDay[d].sort((a, b) => (a.schedule?.air_time ?? '99:99').localeCompare(b.schedule?.air_time ?? '99:99')),
    }));

  if (noSchedule.length) sections.push({ title: 'Sem horário fixo', data: noSchedule });
  return sections;
}

export default function WeekScheduleScreen() {
  const { colors } = useTheme();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await ScheduleService.getWeekSchedules();
      setSections(buildSections(rows));
    } catch (e: any) {
      setLoadError(e.message ?? 'Erro ao carregar agenda.');
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const s = makeStyles(colors);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  if (loadError) return (
    <View style={s.center}>
      <Text style={s.errorTitle}>Falha ao carregar agenda</Text>
      <Text style={s.errorText}>{loadError}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={load}>
        <Text style={s.retryText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );

  if (sections.length === 0) return (
    <View style={s.container}>
      <Text style={s.header}>Agenda Semanal</Text>
      <View style={s.center}>
        <Text style={s.emptyTitle}>Nenhum anime cadastrado</Text>
        <Text style={s.emptyText}>Adicione animes pela aba + para ver a agenda.</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <Text style={s.header}>Agenda Semanal</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.anime.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHeader}>
            <Text style={s.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.anime.cover_url ? (
              <Image source={{ uri: item.anime.cover_url }} style={s.cover} />
            ) : (
              <View style={[s.cover, s.coverPlaceholder]} />
            )}
            <View style={s.info}>
              <Text style={s.animeName}>{item.anime.name}</Text>
              {item.schedule?.air_time ? (
                <Text style={s.airTime}>
                  {item.schedule.air_time}
                  {item.schedule.timezone ? ` (${item.schedule.timezone})` : ''}
                </Text>
              ) : (
                <Text style={s.noTime}>Horário não disponível</Text>
              )}
            </View>
          </View>
        )}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    header: { fontSize: 22, fontWeight: '700', color: c.text, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    errorTitle: { color: c.error, fontSize: 17, fontWeight: '600', marginBottom: 6 },
    errorText: { color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20 },
    retryBtn: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.accent, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28 },
    retryText: { color: c.accent, fontWeight: '600' },
    emptyTitle: { color: c.textSecondary, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    emptyText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    sectionHeader: {
      backgroundColor: c.surface,
      paddingHorizontal: 16, paddingVertical: 8,
      borderLeftWidth: 3, borderLeftColor: c.accent,
    },
    sectionHeaderText: { color: c.accent, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    card: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginVertical: 5,
      backgroundColor: c.card, borderRadius: 10, overflow: 'hidden',
      borderWidth: 1, borderColor: c.border,
    },
    cover: { width: 52, height: 74 },
    coverPlaceholder: { backgroundColor: c.border },
    info: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
    animeName: { color: c.text, fontSize: 15, fontWeight: '600' },
    airTime: { color: c.accent, fontSize: 12, marginTop: 4 },
    noTime: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  });
}
