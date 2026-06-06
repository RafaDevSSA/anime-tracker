import {
  StyleSheet, FlatList, View, Text, Image,
  TouchableOpacity, Alert, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useAnimeList } from '@/src/hooks/useAnimeList';
import { useTheme } from '@/src/context/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMNS = 2;
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * (COLUMNS + 1) * 2) / COLUMNS;
const COVER_HEIGHT = CARD_WIDTH * 1.45;

export default function LibraryScreen() {
  const { animes, loading, error, refresh, remove } = useAnimeList();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Remover', `Remover "${name}" da biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errorTitle}>Falha ao carregar biblioteca</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={refresh}>
          <Text style={s.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.header}>Minha Biblioteca</Text>
      <FlatList
        data={animes}
        numColumns={COLUMNS}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.row}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Biblioteca vazia</Text>
            <Text style={s.emptyText}>Use a aba + para adicionar animes.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Link href={`/anime/${item.id}`} asChild>
              <TouchableOpacity activeOpacity={0.8}>
                {item.cover_url ? (
                  <Image source={{ uri: item.cover_url }} style={s.cover} />
                ) : (
                  <View style={[s.cover, s.coverPlaceholder]} />
                )}
                <View style={s.cardBody}>
                  <Text style={s.animeName} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.status}>{statusLabel(item.status)}</Text>
                </View>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => handleDelete(item.id, item.name)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <SymbolView
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                tintColor={colors.textMuted}
                size={16}
                fallback={
                  <Text style={{ color: colors.textMuted, fontSize: Platform.OS === 'web' ? 14 : 16, lineHeight: 16 }}>
                    ✕
                  </Text>
                }
              />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
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
    header: { fontSize: 22, fontWeight: '700', color: c.text, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    errorTitle: { color: c.error, fontSize: 17, fontWeight: '600', marginBottom: 6 },
    errorText: { color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20 },
    retryBtn: {
      backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.accent,
      borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28,
    },
    retryText: { color: c.accent, fontWeight: '600' },
    empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 24 },
    emptyTitle: { color: c.textSecondary, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    emptyText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    grid: { paddingHorizontal: CARD_MARGIN, paddingBottom: 24 },
    row: { justifyContent: 'space-between' },
    card: {
      width: CARD_WIDTH,
      backgroundColor: c.card,
      borderRadius: 10,
      marginBottom: CARD_MARGIN * 2,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    cover: { width: CARD_WIDTH, height: COVER_HEIGHT },
    coverPlaceholder: { backgroundColor: c.border },
    cardBody: { padding: 8 },
    animeName: { color: c.text, fontSize: 13, fontWeight: '600', lineHeight: 18 },
    status: { color: c.accent, fontSize: 11, marginTop: 4 },
    deleteBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: 5 },
  });
}
