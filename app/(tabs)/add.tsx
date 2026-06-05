import { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  FlatList, Image, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { AnimeService } from '@/src/services/AnimeService';
import type { AnimeCandidate } from '@/src/types';

export default function AddScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const candidates = await AnimeService.searchByName(query.trim());
      setResults(candidates);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSearching(false);
    }
  };

  const add = async (candidate: AnimeCandidate) => {
    setAdding(candidate.mal_id);
    try {
      await AnimeService.addToLibrary(candidate);
      Alert.alert('Adicionado!', `${candidate.name} foi adicionado à biblioteca.`, [
        { text: 'OK', onPress: () => router.replace('/(tabs)/library') },
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setAdding(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Adicionar Anime</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Nome do anime..."
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={search}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {searching && <ActivityIndicator style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.mal_id)}
        ListEmptyComponent={
          !searching ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Busque pelo nome do anime.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => add(item)} disabled={adding === item.mal_id}>
            {item.cover_url ? (
              <Image source={{ uri: item.cover_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.animeName}>{item.name}</Text>
              <Text style={styles.score}>{item.score ? `★ ${item.score.toFixed(1)}` : 'Sem nota'}</Text>
            </View>
            {adding === item.mal_id ? (
              <ActivityIndicator style={{ marginRight: 12 }} />
            ) : (
              <Text style={styles.addBtn}>+</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', padding: 16 },
  searchRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  searchBtn: { backgroundColor: '#6c63ff', borderRadius: 8, paddingHorizontal: 16, marginLeft: 8, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#555', fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: '#1a1a1a', borderRadius: 10, overflow: 'hidden' },
  cover: { width: 60, height: 85 },
  coverPlaceholder: { backgroundColor: '#333' },
  info: { flex: 1, paddingHorizontal: 12 },
  animeName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  score: { color: '#ffd700', fontSize: 12, marginTop: 3 },
  addBtn: { color: '#6c63ff', fontSize: 28, fontWeight: '700', marginRight: 14 },
});
