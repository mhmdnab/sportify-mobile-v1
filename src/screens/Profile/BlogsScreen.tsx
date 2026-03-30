import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { spacing, radius } from '../../theme/spacing';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { api } from '../../lib/api';
import { Blog, PaginatedResponse } from '../../types/api';
import { formatDate } from '../../utils/date';
import { ProfileStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Blogs'>;

export function BlogsScreen() {
  const navigation = useNavigation<Nav>();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Blog>>('/blogs', { params: { page: 1, limit: 50 } });
      setBlogs(res.data.list);
    } catch {
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Blogs</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.screenPadding }}>
          <SkeletonList count={5} />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBlogs} />
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('BlogDetail', { blogId: item.id })}
              style={[styles.blogCard, { backgroundColor: tc.cardBg }]}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.blogImage} contentFit="cover" />
              ) : (
                <View style={[styles.blogImage, styles.placeholder, { backgroundColor: tc.inputBg }]}>
                  <Ionicons name="newspaper-outline" size={28} color={tc.textHint} />
                </View>
              )}
              <View style={styles.blogInfo}>
                <Text style={[styles.blogTitle, { color: tc.textPrimary }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.blogDate, { color: tc.textHint }]}>{formatDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  list: { paddingHorizontal: spacing.screenPadding },
  blogCard: {
    flexDirection: 'row',
    borderRadius: radius.card,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  blogImage: { width: 100, height: 90 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogInfo: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  blogTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  blogDate: { fontSize: 12 },
});
