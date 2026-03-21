import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { api } from '../../lib/api';
import { TermAndCondition, PaginatedResponse } from '../../types/api';

export function TermsScreen() {
  const navigation = useNavigation();
  const [terms, setTerms] = useState<TermAndCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<TermAndCondition>>('/terms-and-conditions', { params: { page: 1, limit: 50 } });
      setTerms(res.data.list);
    } catch {
      setError('Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.screenPadding }}>
          <SkeletonList count={3} />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTerms} />
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {terms.map((item) => (
            <View key={item.id} style={styles.section}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.content}>{item.content}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  scroll: { paddingHorizontal: spacing.screenPadding },
  section: { marginBottom: spacing.xl },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  content: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
