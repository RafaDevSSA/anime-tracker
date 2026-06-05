import { useEffect, useState } from 'react';
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

  useEffect(() => {
    async function load() {
      const a = await AnimeRepository.findById(Number(id));
      setAnime(a);
      if (a) {
        const eps = await EpisodeRepository.findTodayByAnime(a.id);
        setEpisodes(eps);
      }
      setLoading(false);
    }
    load();
  }, [id]);

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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!anime) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Anime não encontrado.</Text>
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

        {episodes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episódios Hoje</Text>
            {episodes.map((ep) => (
              <Text key={ep.id} style={styles.episode}>Episódio {ep.episode_num}</Text>
            ))}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#aaa', fontSize: 16 },
  banner: { width: '100%', height: 220 },
  bannerPlaceholder: { backgroundColor: '#333' },
  content: { padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  status: { color: '#aaa', fontSize: 13, textTransform: 'capitalize', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#6c63ff', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  episode: { color: '#ccc', fontSize: 14, marginBottom: 4 },
  deleteBtn: { backgroundColor: '#3a1a1a', borderWidth: 1, borderColor: '#ff4444', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  deleteBtnText: { color: '#ff4444', fontWeight: '600' },
});
