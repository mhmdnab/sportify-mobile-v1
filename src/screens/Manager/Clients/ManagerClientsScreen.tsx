import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useManagerClientsStore, ClientStat } from '../../../stores/manager-clients.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { ManagerClientsStackParamList } from '../../../types/navigation';

type Nav = NativeStackNavigationProp<ManagerClientsStackParamList, 'ManagerClients'>;

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function avatarColor(name: string): string {
  const palette = ['#00C16A', '#4A90D9', '#FF9500', '#9B59B6', '#E74C3C', '#1ABC9C'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function ClientCard({ client, tc, isDark, onPress }: { client: ClientStat; tc: any; isDark: boolean; onPress: () => void }) {
  const color = avatarColor(client.name);
  const initials = getInitials(client.name);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[cardStyles.container, { backgroundColor: tc.cardBg }]}>
      {/* Avatar */}
      <View style={[cardStyles.avatar, { backgroundColor: `${color}20` }]}>
        <Text style={[cardStyles.initials, { color }]}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={cardStyles.info}>
        <Text style={[cardStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>{client.name}</Text>
        <Text style={[cardStyles.email, { color: tc.textSecondary }]} numberOfLines={1}>{client.email}</Text>
        {client.phone ? <Text style={[cardStyles.phone, { color: tc.textHint }]}>{client.phone}</Text> : null}
      </View>

      {/* Stats chips */}
      <View style={cardStyles.stats}>
        <View style={[cardStyles.chip, { backgroundColor: isDark ? 'rgba(0,193,106,0.12)' : 'rgba(0,193,106,0.08)' }]}>
          <Ionicons name="calendar" size={10} color="#00C16A" />
          <Text style={[cardStyles.chipText, { color: '#00C16A' }]}>{client.totalReservations}</Text>
        </View>
        <View style={[cardStyles.chip, { backgroundColor: isDark ? 'rgba(74,144,217,0.12)' : 'rgba(74,144,217,0.08)' }]}>
          <Ionicons name="cash" size={10} color="#4A90D9" />
          <Text style={[cardStyles.chipText, { color: '#4A90D9' }]}>${client.totalRevenue.toFixed(0)}</Text>
        </View>
        {client.totalCancellations > 0 && (
          <View style={[cardStyles.chip, { backgroundColor: 'rgba(255,68,68,0.08)' }]}>
            <Ionicons name="close-circle" size={10} color="#FF4444" />
            <Text style={[cardStyles.chipText, { color: '#FF4444' }]}>{client.totalCancellations}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 15, fontWeight: '800' },
  info: { marginLeft: 56, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  email: { fontSize: 12, marginBottom: 1 },
  phone: { fontSize: 11 },
  stats: { flexDirection: 'row', gap: 6, marginLeft: 56, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '700' },
});

export function ManagerClientsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { clients, total, isLoading, search, fetchClients, fetchMore, hasNext, setSearch } = useManagerClientsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchClients(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClients(true);
    setRefreshing(false);
  }, []);

  const onSearchChange = (text: string) => {
    setInputValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(text);
      fetchClients(true);
    }, 400);
  };

  const clearSearch = () => {
    setInputValue('');
    setSearch('');
    fetchClients(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Clients</Text>
        {total > 0 && (
          <View style={[styles.totalBadge, { backgroundColor: isDark ? 'rgba(0,193,106,0.15)' : 'rgba(0,193,106,0.1)' }]}>
            <Text style={styles.totalText}>{total} total</Text>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#ECEDF3' }]}>
        <Ionicons name="search-outline" size={16} color={tc.textHint} />
        <TextInput
          style={[styles.searchInput, { color: tc.textPrimary }]}
          placeholder="Search by name, email or phone..."
          placeholderTextColor={tc.textHint}
          value={inputValue}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {inputValue.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={tc.textHint} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.userId.toString()}
        renderItem={({ item }) => (
          <ClientCard
            client={item}
            tc={tc}
            isDark={isDark}
            onPress={() => navigation.navigate('ManagerClientDetail', {
              userId: item.userId,
              name: item.name,
              email: item.email,
              phone: item.phone,
              totalReservations: item.totalReservations,
              totalCancellations: item.totalCancellations,
              totalPaid: item.totalPaid,
              totalRevenue: item.totalRevenue,
            })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNext && fetchMore()}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.textSecondary} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                {search ? 'No clients match your search' : 'No clients yet'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.screenPadding, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '800' },
  totalBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  totalText: { fontSize: 12, fontWeight: '700', color: '#00C16A' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.screenPadding, marginBottom: spacing.md, borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: 10, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  list: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '500' },
});
