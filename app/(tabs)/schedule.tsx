import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, SectionList, Image,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { ScheduleService } from '@/src/services/ScheduleService';
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

  if (noSchedule.length) {
    sections.push({ title: 'Sem horário fixo', data: noSchedule });
  }

  return sections;
}

export default function WeekScheduleScreen() {
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

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Falha ao carregar agenda</Text>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Agenda Semanal</Text>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Nenhum anime cadastrado</Text>
          <Text style={styles.emptyText}>Adicione animes pela aba + para ver a agenda.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agenda Semanal</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.anime.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6c63ff" />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.anime.cover_url ? (
              <Image source={{ uri: item.anime.cover_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.animeName}>{item.anime.name}</Text>
              {item.schedule?.air_time ? (
                <Text style={styles.airTime}>{item.schedule.air_time}{item.schedule.timezone ? ` (${item.schedule.timezone})` : ''}</Text>
              ) : (
                <Text style={styles.noTime}>Horário não disponível</Text>
              )}
            </View>
          </View>
        )}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', padding: 16, paddingBottom: 8 },
  errorTitle: { color: '#ff6b6b', fontSize: 17, fontWeight: '600', marginBottom: 6 },
  errorText: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#6c63ff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28 },
  retryText: { color: '#6c63ff', fontWeight: '600' },
  emptyTitle: { color: '#aaa', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center' },
  sectionHeader: { backgroundColor: '#181818', paddingHorizontal: 16, paddingVertical: 6, borderLeftWidth: 3, borderLeftColor: '#6c63ff' },
  sectionHeaderText: { color: '#6c63ff', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 5, backgroundColor: '#1a1a1a', borderRadius: 10, overflow: 'hidden' },
  cover: { width: 52, height: 74 },
  coverPlaceholder: { backgroundColor: '#333' },
  info: { flex: 1, paddingHorizontal: 12 },
  animeName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  airTime: { color: '#6c63ff', fontSize: 12, marginTop: 3 },
  noTime: { color: '#444', fontSize: 12, marginTop: 3 },
});
