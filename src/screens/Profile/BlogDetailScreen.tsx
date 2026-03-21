import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonCard, SkeletonLine } from '../../components/ui/Skeleton';
import { api } from '../../lib/api';
import { Blog } from '../../types/api';
import { formatDate } from '../../utils/date';
import { ProfileStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ProfileStackParamList, 'BlogDetail'>;

export function BlogDetailScreen({ route, navigation }: Props) {
  const { blogId } = route.params;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Blog>(`/blogs/${blogId}`);
      setBlog(res.data);
    } catch {
      setError('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
  }, [blogId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Article</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.screenPadding }}>
          <SkeletonCard />
          <SkeletonLine width="80%" height={24} />
          <SkeletonLine width="60%" height={16} />
          <SkeletonLine height={200} />
        </View>
      ) : error || !blog ? (
        <ErrorState message={error || 'Blog not found'} onRetry={fetchBlog} />
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {blog.image && (
            <Image source={{ uri: blog.image }} style={styles.heroImage} contentFit="cover" />
          )}
          <View style={styles.content}>
            <Text style={styles.title}>{blog.title}</Text>
            {blog.subtitle && <Text style={styles.subtitle}>{blog.subtitle}</Text>}
            <Text style={styles.date}>{formatDate(blog.createdAt)}</Text>
            <Text style={styles.body}>{blog.content}</Text>
          </View>
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
  scroll: { flex: 1 },
  heroImage: { width: '100%', height: 220 },
  content: { padding: spacing.screenPadding },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 8 },
  date: { fontSize: 13, color: colors.textHint, marginBottom: 20 },
  body: { fontSize: 15, color: colors.textPrimary, lineHeight: 24 },
});
