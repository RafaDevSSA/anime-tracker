import { StyleSheet, FlatList, View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAnimeList } from '@/src/hooks/useAnimeList';

export default function LibraryScreen() {
  const { animes, loading, error, refresh, remove } = useAnimeList();

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Remover', `Remover "${name}" da biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

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
        <Text style={styles.errorTitle}>Falha ao carregar biblioteca</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Biblioteca</Text>
      <FlatList
        data={animes}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Biblioteca vazia</Text>
            <Text style={styles.emptyText}>Use a aba + para adicionar animes.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/anime/${item.id}`} asChild>
            <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item.id, item.name)}>
              {item.cover_url ? (
                <Image source={{ uri: item.cover_url }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.coverPlaceholder]} />
              )}
              <View style={styles.info}>
                <Text style={styles.animeName}>{item.name}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </Link>
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
  status: { color: '#aaa', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  chevron: { color: '#555', fontSize: 22, marginRight: 14 },
});
