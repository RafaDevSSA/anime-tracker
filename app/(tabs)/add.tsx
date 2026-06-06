import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  FlatList, Image, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { AnimeService } from '@/src/services/AnimeService';
import { useTheme } from '@/src/context/ThemeContext';
import type { AnimeCandidate } from '@/src/types';

const DEBOUNCE_MS = 400;

type SearchState = 'idle' | 'searching' | 'results' | 'no_results' | 'error';

export default function AddScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeCandidate[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [adding, setAdding] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); setSearchState('idle'); return; }
    setSearchState('searching');
    setResults([]);
    try {
      const candidates = await AnimeService.searchByName(trimmed);
      setResults(candidates);
      setSearchState(candidates.length > 0 ? 'results' : 'no_results');
    } catch {
      setSearchState('error');
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
  };

  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
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

  const s = makeStyles(colors);

  const renderEmpty = () => {
    if (searchState === 'idle') return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Busque um anime</Text>
        <Text style={s.emptyText}>Digite o nome acima para encontrar.</Text>
      </View>
    );
    if (searchState === 'no_results') return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Nenhum resultado</Text>
        <Text style={s.emptyText}>Tente um nome diferente.</Text>
      </View>
    );
    if (searchState === 'error') return (
      <View style={s.empty}>
        <Text style={s.errorTitle}>Falha na busca</Text>
        <Text style={s.emptyText}>Verifique se os MCPs estão rodando.</Text>
        <TouchableOpacity style={s.retryBtn} onPress={handleSubmit}>
          <Text style={s.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
    return null;
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>Adicionar Anime</Text>
      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          placeholder="Nome do anime..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
        />
        <TouchableOpacity style={s.searchBtn} onPress={handleSubmit}>
          <Text style={s.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {searchState === 'searching' && <ActivityIndicator style={{ marginTop: 20 }} color={colors.accent} />}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.mal_id)}
        contentContainerStyle={s.list}
        ListEmptyComponent={searchState !== 'searching' ? renderEmpty() : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => add(item)} disabled={adding === item.mal_id} activeOpacity={0.8}>
            {item.cover_url ? (
              <Image source={{ uri: item.cover_url }} style={s.cover} />
            ) : (
              <View style={[s.cover, s.coverPlaceholder]} />
            )}
            <View style={s.info}>
              <Text style={s.animeName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.score}>{item.score ? `★ ${item.score.toFixed(1)}` : 'Sem nota'}</Text>
            </View>
            {adding === item.mal_id ? (
              <ActivityIndicator style={{ marginRight: 14 }} color={colors.accent} />
            ) : (
              <Text style={s.addBtn}>+</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { fontSize: 22, fontWeight: '700', color: c.text, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    searchRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12 },
    input: {
      flex: 1, backgroundColor: c.surface, color: c.text,
      borderRadius: 8, paddingHorizontal: 12, height: 44,
      borderWidth: 1, borderColor: c.border,
    },
    searchBtn: { backgroundColor: c.accent, borderRadius: 8, paddingHorizontal: 16, marginLeft: 8, justifyContent: 'center' },
    searchBtnText: { color: '#fff', fontWeight: '700' },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
    emptyTitle: { color: c.textSecondary, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    emptyText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    errorTitle: { color: c.error, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    retryBtn: {
      marginTop: 16, backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.accent,
      borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24,
    },
    retryText: { color: c.accent, fontWeight: '600' },
    card: {
      flexDirection: 'row', alignItems: 'center',
      marginBottom: 10, backgroundColor: c.card,
      borderRadius: 10, overflow: 'hidden',
      borderWidth: 1, borderColor: c.border,
    },
    cover: { width: 60, height: 86 },
    coverPlaceholder: { backgroundColor: c.border },
    info: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
    animeName: { color: c.text, fontSize: 15, fontWeight: '600' },
    score: { color: c.score, fontSize: 12, marginTop: 4 },
    addBtn: { color: c.accent, fontSize: 28, fontWeight: '700', marginRight: 14 },
  });
}
