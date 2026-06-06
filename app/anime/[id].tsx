import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AnimeRepository } from '@/src/db/AnimeRepository';
import { EpisodeRepository } from '@/src/db/EpisodeRepository';
import { AnimeService } from '@/src/services/AnimeService';
import type { Anime, Episode } from '@/src/types';

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const a = await AnimeRepository.findById(Number(id));
      setAnime(a);
      if (a) {
        const eps = await EpisodeRepository.findTodayByAnime(a.id);
        setEpisodes(eps);
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
        onPress: async () => {
          await AnimeService.remove(anime.id);
          router.back();
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

  return (
    <ScrollView style={styles.container}>
      {anime.cover_url ? (
        <Image source={{ uri: anime.cover_url }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, styles.bannerPlaceholder]} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{anime.name}</Text>
        <Text style={styles.status}>{anime.status}</Text>

        {episodes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episódios Hoje</Text>
            {episodes.map((ep) => (
              <Text key={ep.id} style={styles.episode}>Episódio {ep.episode_num}</Text>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episódios Hoje</Text>
            <Text style={styles.noEpisodes}>Nenhum episódio hoje.</Text>
          </View>
        )}

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
  banner: { width: '100%', height: 220 },
  bannerPlaceholder: { backgroundColor: '#333' },
  content: { padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  status: { color: '#aaa', fontSize: 13, textTransform: 'capitalize', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#6c63ff', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  episode: { color: '#ccc', fontSize: 14, marginBottom: 4 },
  noEpisodes: { color: '#555', fontSize: 14 },
  deleteBtn: { backgroundColor: '#3a1a1a', borderWidth: 1, borderColor: '#ff4444', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  deleteBtnText: { color: '#ff4444', fontWeight: '600' },
});
