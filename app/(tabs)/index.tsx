import { StyleSheet, FlatList, View, Text, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
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
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Falha ao carregar agenda</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agenda de Hoje</Text>
      <FlatList
        data={schedule}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6c63ff" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum episódio hoje</Text>
            <Text style={styles.emptyText}>Puxe para baixo para verificar novos episódios.</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', padding: 16 },
  errorTitle: { color: '#ff6b6b', fontSize: 17, fontWeight: '600', marginBottom: 6 },
  errorText: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#6c63ff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28 },
  retryText: { color: '#6c63ff', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: { color: '#aaa', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1a', borderRadius: 10, overflow: 'hidden' },
  cover: { width: 70, height: 100 },
  coverPlaceholder: { backgroundColor: '#333' },
  info: { flex: 1, paddingHorizontal: 12 },
  animeName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  episodeLabel: { color: '#aaa', fontSize: 13, marginTop: 4 },
});
