import { StyleSheet, FlatList, View, Text, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useTodaySchedule } from '@/src/hooks/useTodaySchedule';
import { ScheduleService } from '@/src/services/ScheduleService';
import { useCallback, useState } from 'react';

export default function HomeScreen() {
  const { schedule, loading, error, refresh } = useTodaySchedule();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await ScheduleService.refreshTodayEpisodes();
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agenda de Hoje</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={schedule}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum episódio novo hoje.</Text>
            <Text style={styles.emptyHint}>Puxe para atualizar.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.cover_url ? (
              <Image source={{ uri: item.cover_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.animeName}>{item.name}</Text>
              <Text style={styles.episodeLabel}>Episódio {item.episode_num}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', padding: 16 },
  error: { color: '#ff6b6b', paddingHorizontal: 16 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#aaa', fontSize: 16 },
  emptyHint: { color: '#555', fontSize: 13, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1a', borderRadius: 10, overflow: 'hidden' },
  cover: { width: 70, height: 100 },
  coverPlaceholder: { backgroundColor: '#333' },
  info: { flex: 1, paddingHorizontal: 12 },
  animeName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  episodeLabel: { color: '#aaa', fontSize: 13, marginTop: 4 },
});
