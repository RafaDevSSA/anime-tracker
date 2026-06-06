import {
  StyleSheet, FlatList, View, Text, Image,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useTodaySchedule } from '@/src/hooks/useTodaySchedule';
import { ScheduleService } from '@/src/services/ScheduleService';
import { useTheme } from '@/src/context/ThemeContext';
import { useCallback, useState } from 'react';

export default function HomeScreen() {
  const { schedule, loading, error, refresh } = useTodaySchedule();
  const { colors } = useTheme();
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

  const s = makeStyles(colors);

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
        <Text style={s.errorTitle}>Falha ao carregar agenda</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={refresh}>
          <Text style={s.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.header}>Hoje</Text>
      <FlatList
        data={schedule}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Nenhum episódio hoje</Text>
            <Text style={s.emptyText}>Puxe para baixo para verificar novos episódios.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.cover_url ? (
              <Image source={{ uri: item.cover_url }} style={s.cover} />
            ) : (
              <View style={[s.cover, s.coverPlaceholder]} />
            )}
            <View style={s.info}>
              <Text style={s.animeName} numberOfLines={2}>{item.name}</Text>
              <View style={s.epBadge}>
                <Text style={s.epBadgeText}>EP {item.episode_num}</Text>
              </View>
            </View>
            <View style={s.accentBar} />
          </View>
        )}
      />
    </View>
  );
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
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    accentBar: { width: 3, alignSelf: 'stretch', backgroundColor: c.accent },
    cover: { width: 64, height: 92 },
    coverPlaceholder: { backgroundColor: c.border },
    info: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
    animeName: { color: c.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
    epBadge: {
      marginTop: 8,
      alignSelf: 'flex-start',
      backgroundColor: c.accentSubtle,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    epBadgeText: { color: c.accent, fontSize: 12, fontWeight: '700' },
  });
}
