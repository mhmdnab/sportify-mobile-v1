import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../theme/spacing';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { api } from '../../lib/api';
import { Faq, PaginatedResponse } from '../../types/api';

export function FAQsScreen() {
  const navigation = useNavigation();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchFaqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Faq>>('/faqs', { params: { page: 1, limit: 50 } });
      setFaqs(res.data.list);
    } catch {
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>FAQs</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.screenPadding }}>
          <SkeletonList count={5} />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchFaqs} />
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              onPress={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              style={[styles.faqItem, { borderBottomColor: tc.border }]}
            >
              <View style={styles.questionRow}>
                <Text style={[styles.question, { color: tc.textPrimary }]}>{faq.question}</Text>
                <Ionicons
                  name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={tc.textHint}
                />
              </View>
              {expandedId === faq.id && (
                <Text style={[styles.answer, { color: tc.textSecondary }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
  },
  faqItem: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  answer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.md,
  },
});
