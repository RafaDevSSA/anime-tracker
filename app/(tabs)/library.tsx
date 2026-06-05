import { StyleSheet, FlatList, View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAnimeList } from '@/src/hooks/useAnimeList';

export default function LibraryScreen() {
  const { animes, loading, error, remove } = useAnimeList();

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Remover', `Remover "${name}" da biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Biblioteca</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={animes}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Biblioteca vazia.</Text>
            <Text style={styles.emptyHint}>Adicione animes pela aba +</Text>
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
            </TouchableOpacity>
          </Link>
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
  status: { color: '#aaa', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
});
