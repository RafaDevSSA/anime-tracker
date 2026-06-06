import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, Image, ActivityIndicator,
  ScrollView, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { confirmDelete, showError } from '@/src/utils/alert';
import { AnimeRepository } from '@/src/db/AnimeRepository';
import { EpisodeRepository } from '@/src/db/EpisodeRepository';
import { AnimeService } from '@/src/services/AnimeService';
import { useTheme } from '@/src/context/ThemeContext';
import type { Anime, Episode, AnimeDetail } from '@/src/types';

const DAY_PT: Record<string, string> = {
  Mondays: 'Segundas', Tuesdays: 'Terças', Wednesdays: 'Quartas',
  Thursdays: 'Quintas', Fridays: 'Sextas', Saturdays: 'Sábados', Sundays: 'Domingos',
};

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
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
    confirmDelete(`Remover "${anime.name}" da biblioteca?`, () => {
      AnimeService.remove(anime.id)
        .then(() => router.back())
        .catch((e: any) => showError('Erro', e.message ?? 'Não foi possível remover o anime.'));
    });
  };

  const s = makeStyles(colors);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  if (loadError) return (
    <View style={s.center}>
      <Text style={s.errorTitle}>Falha ao carregar</Text>
      <Text style={s.errorText}>{loadError}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={load}>
        <Text style={s.retryText}>Tentar novamente</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  if (!anime) return (
    <View style={s.center}>
      <Text style={s.notFound}>Anime não encontrado.</Text>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const coverUrl = detail?.cover_url ?? anime.cover_url;
  const schedule = detail?.schedule;
  const dayLabel = schedule?.day_of_week ? (DAY_PT[schedule.day_of_week] ?? schedule.day_of_week) : null;

  return (
    <ScrollView style={s.container}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={s.banner} />
      ) : (
        <View style={[s.banner, s.bannerPlaceholder]} />
      )}

      <View style={s.content}>
        <Text style={s.title}>{anime.name}</Text>

        <View style={s.metaRow}>
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeText}>{statusLabel(anime.status)}</Text>
          </View>
          {detail?.score != null && (
            <Text style={s.score}>★ {detail.score.toFixed(1)}</Text>
          )}
          {detail?.total_episodes != null && (
            <Text style={s.metaItem}>{detail.total_episodes} ep</Text>
          )}
        </View>

        {dayLabel && (
          <View style={s.scheduleRow}>
            <Text style={s.scheduleLabel}>Exibição:</Text>
            <Text style={s.scheduleValue}>
              {dayLabel}{schedule?.air_time ? ` às ${schedule.air_time}` : ''}
              {schedule?.timezone ? ` (${schedule.timezone})` : ''}
            </Text>
          </View>
        )}

        {detail?.synopsis ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Sinopse</Text>
            <Text style={s.synopsis}>{detail.synopsis}</Text>
          </View>
        ) : null}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Episódios Hoje</Text>
          {episodes.length > 0 ? (
            episodes.map((ep) => (
              <View key={ep.id} style={s.epRow}>
                <View style={s.epBadge}>
                  <Text style={s.epBadgeText}>EP {ep.episode_num}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={s.noEpisodes}>Nenhum episódio hoje.</Text>
          )}
        </View>

        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
          <Text style={s.deleteBtnText}>Remover da Biblioteca</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = { airing: 'Em exibição', completed: 'Completo', unknown: 'Desconhecido' };
  return map[status] ?? status;
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    notFound: { color: c.textSecondary, fontSize: 16, marginBottom: 20 },
    errorTitle: { color: c.error, fontSize: 17, fontWeight: '600', marginBottom: 6 },
    errorText: { color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20 },
    retryBtn: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.accent, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28, marginBottom: 12 },
    retryText: { color: c.accent, fontWeight: '600' },
    backBtn: { paddingVertical: 8 },
    backText: { color: c.textMuted, fontSize: 14 },
    banner: { width: '100%', height: 280 },
    bannerPlaceholder: { backgroundColor: c.border },
    content: { padding: 16 },
    title: { color: c.text, fontSize: 22, fontWeight: '700', marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
    statusBadge: { backgroundColor: c.accentSubtle, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
    statusBadgeText: { color: c.accent, fontSize: 12, fontWeight: '600' },
    score: { color: c.score, fontSize: 15, fontWeight: '700' },
    metaItem: { color: c.textSecondary, fontSize: 13 },
    scheduleRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
    scheduleLabel: { color: c.accent, fontSize: 13, fontWeight: '600' },
    scheduleValue: { color: c.textSecondary, fontSize: 13 },
    section: { marginBottom: 20 },
    sectionTitle: { color: c.accent, fontSize: 15, fontWeight: '600', marginBottom: 10 },
    synopsis: { color: c.textSecondary, fontSize: 14, lineHeight: 22 },
    epRow: { marginBottom: 6 },
    epBadge: { alignSelf: 'flex-start', backgroundColor: c.accentSubtle, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
    epBadgeText: { color: c.accent, fontSize: 13, fontWeight: '700' },
    noEpisodes: { color: c.textMuted, fontSize: 14 },
    deleteBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1, borderColor: c.error,
      borderRadius: 8, padding: 14,
      alignItems: 'center', marginTop: 20,
    },
    deleteBtnText: { color: c.error, fontWeight: '600' },
  });
}
