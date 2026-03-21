import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { radius, spacing } from '../../../theme/spacing';
import { Blog } from '../../../types/api';
import { formatDate } from '../../../utils/date';

interface BlogCardProps {
  blog: Blog;
  onPress: () => void;
}

export function BlogCard({ blog, onPress }: BlogCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      {blog.image ? (
        <Image source={{ uri: blog.image }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="newspaper-outline" size={28} color={colors.textHint} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{blog.title}</Text>
        <Text style={styles.date}>{formatDate(blog.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginRight: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  image: {
    width: '100%',
    height: 120,
  },
  placeholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: colors.textHint,
  },
});
