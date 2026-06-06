import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, Image, ActivityIndicator,
  ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AnimeRepository } from '@/src/db/AnimeRepository';
import { EpisodeRepository } from '@/src/db/EpisodeRepository';
import { AnimeService } from '@/src/services/AnimeService';
import type { Anime, Episode, AnimeDetail } from '@/src/types';

const DAY_PT: Record<string, string> = {
  Mondays: 'Segundas', Tuesdays: 'Terças', Wednesdays: 'Quartas',
  Thursdays: 'Quintas', Fridays: 'Sextas', Saturdays: 'Sábados', Sundays: 'Domingos',
};

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const a = await AnimeRepository.findById(Number(id));
      setAnime(a);
      if (a) {
        const [eps, det] = await Promise.allSettled([
          EpisodeRepository.findTodayByAnime(a.id),
          a.mal_id ? AnimeService.getDetails(a.mal_id) : Promise.resolve(null),
        ]);
        if (eps.status === 'fulfilled') setEpisodes(eps.value);
        if (det.status === 'fulfilled') setDetail(det.value);
      }
    } catch (e: any) {
      setLoadError(e.message ?? 'Erro ao carregar anime.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = () => {
    if (!anime) return;
    Alert.alert('Remover', `Remover "${anime.name}" da biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          AnimeService.remove(anime.id)
            .then(() => router.back())
            .catch((e: any) => Alert.alert('Erro', e.message ?? 'Não foi possível remover o anime.'));
        },
      },
    ]);
  };

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
        <Text style={styles.errorTitle}>Falha ao carregar</Text>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!anime) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Anime não encontrado.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const coverUrl = detail?.cover_url ?? anime.cover_url;
  const schedule = detail?.schedule;
  const dayLabel = schedule?.day_of_week ? (DAY_PT[schedule.day_of_week] ?? schedule.day_of_week) : null;

  return (
    <ScrollView style={styles.container}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{anime.name}</Text>

        {/* Score e status */}
        <View style={styles.metaRow}>
          <Text style={styles.statusBadge}>{anime.status}</Text>
          {detail?.score != null && (
            <Text style={styles.score}>★ {detail.score.toFixed(1)}</Text>
          )}
          {detail?.total_episodes != null && (
            <Text style={styles.metaItem}>{detail.total_episodes} ep</Text>
          )}
        </View>

        {/* Exibição semanal */}
        {dayLabel && (
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Exibição:</Text>
            <Text style={styles.scheduleValue}>
              {dayLabel}{schedule?.air_time ? ` às ${schedule.air_time}` : ''}
              {schedule?.timezone ? ` (${schedule.timezone})` : ''}
            </Text>
          </View>
        )}

        {/* Sinopse */}
        {detail?.synopsis ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sinopse</Text>
            <Text style={styles.synopsis}>{detail.synopsis}</Text>
          </View>
        ) : null}

        {/* Episódios hoje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Episódios Hoje</Text>
          {episodes.length > 0 ? (
            episodes.map((ep) => (
              <Text key={ep.id} style={styles.episode}>Episódio {ep.episode_num}</Text>
            ))
          ) : (
            <Text style={styles.noEpisodes}>Nenhum episódio hoje.</Text>
          )}
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Remover da Biblioteca</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFound: { color: '#aaa', fontSize: 16, marginBottom: 20 },
  errorTitle: { color: '#ff6b6b', fontSize: 17, fontWeight: '600', marginBottom: 6 },
  errorText: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#6c63ff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28, marginBottom: 12 },
  retryText: { color: '#6c63ff', fontWeight: '600' },
  backBtn: { paddingVertical: 8 },
  backText: { color: '#555', fontSize: 14 },
  banner: { width: '100%', height: 260 },
  bannerPlaceholder: { backgroundColor: '#333' },
  content: { padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  statusBadge: { backgroundColor: '#1a1a1a', color: '#aaa', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, textTransform: 'capitalize' },
  score: { color: '#ffd700', fontSize: 15, fontWeight: '700' },
  metaItem: { color: '#888', fontSize: 13 },
  scheduleRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  scheduleLabel: { color: '#6c63ff', fontSize: 13, fontWeight: '600' },
  scheduleValue: { color: '#ccc', fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#6c63ff', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  synopsis: { color: '#bbb', fontSize: 14, lineHeight: 21 },
  episode: { color: '#ccc', fontSize: 14, marginBottom: 4 },
  noEpisodes: { color: '#555', fontSize: 14 },
  deleteBtn: { backgroundColor: '#3a1a1a', borderWidth: 1, borderColor: '#ff4444', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  deleteBtnText: { color: '#ff4444', fontWeight: '600' },
});
