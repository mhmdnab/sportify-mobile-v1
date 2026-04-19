import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing, radius } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { Coach, Review, Venue } from '../../types/api';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { HomeStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'CoachProfile'>;

function StarRow({ rating, size = 16, color = '#F59E0B' }: { rating: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color={color} />
      ))}
    </View>
  );
}

function ReviewItem({ review, tc }: { review: Review; tc: any }) {
  return (
    <View style={[reviewStyles.item, { borderBottomColor: tc.border }]}>
      <View style={reviewStyles.top}>
        <View style={reviewStyles.avatar}>
          <Text style={reviewStyles.avatarText}>{review.user?.name?.slice(0, 2).toUpperCase() ?? 'U'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[reviewStyles.reviewer, { color: tc.textPrimary }]}>{review.user?.name ?? 'User'}</Text>
          <StarRow rating={review.rating} size={12} />
        </View>
      </View>
      {review.comment ? (
        <Text style={[reviewStyles.comment, { color: tc.textSecondary }]}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  item: { paddingVertical: 12, borderBottomWidth: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(11,26,62,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#0B1A3E' },
  reviewer: { fontSize: 13, fontWeight: '600' },
  comment: { fontSize: 13, lineHeight: 18 },
});

export function CoachProfileScreen({ navigation, route }: Props) {
  const { coachId } = route.params;
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const user = useAuthStore((s) => s.user);

  const [coach, setCoach] = useState<Coach | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [availableAnywhere, setAvailableAnywhere] = useState(false);
  const [anywhereBranches, setAnywhereBranches] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<any>(`/coaches/${coachId}`),
      api.get<any>(`/coaches/${coachId}/venues`),
      api.get<any>(`/coaches/${coachId}/reviews`, { params: { limit: 5 } }),
    ]).then(([coachRes, venueRes, reviewRes]) => {
      setCoach(coachRes.data?.data ?? coachRes.data);
      const vData = venueRes.data?.data ?? venueRes.data;
      setVenues(vData?.venues ?? []);
      setAvailableAnywhere(vData?.availableAnywhere ?? false);
      setAnywhereBranches(vData?.branches ?? []);
      const rData = reviewRes.data?.data ?? reviewRes.data;
      setReviews(rData?.list ?? []);
      setAvgRating(rData?.avgRating ?? 0);
      setReviewCount(rData?.count ?? 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [coachId]);

  const handleSubmitReview = async () => {
    if (myRating < 1 || myRating > 5) return;
    setSubmittingReview(true);
    try {
      await api.post(`/coaches/${coachId}/reviews`, { rating: myRating, comment: myComment || undefined });
      setShowReviewModal(false);
      // Refresh reviews
      const res = await api.get<any>(`/coaches/${coachId}/reviews`, { params: { limit: 5 } });
      const rData = res.data?.data ?? res.data;
      setReviews(rData?.list ?? []);
      setAvgRating(rData?.avgRating ?? 0);
      setReviewCount(rData?.count ?? 0);
      Alert.alert('Review submitted!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
        <ActivityIndicator color="#0B1A3E" size="large" />
      </View>
    );
  }

  if (!coach) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.lg }}>
          <Ionicons name="chevron-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: tc.textHint }}>Coach not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
      <BackgroundShapes isDark={isDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: tc.textPrimary }]} numberOfLines={1}>
          {coach.user?.name ?? 'Coach Profile'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <View style={styles.heroAvatar}>
            <FontAwesome6 name="people-group" size={34} color="#0B1A3E" />
          </View>
          <Text style={[styles.heroName, { color: tc.textPrimary }]}>{coach.user?.name ?? `Coach #${coach.id}`}</Text>
          {coach.sport ? (
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{coach.sport}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <StarRow rating={avgRating} size={18} />
            <Text style={[styles.ratingText, { color: tc.textSecondary }]}>
              {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings'} ({reviewCount})
            </Text>
          </View>
          <Text style={[styles.rate, { color: tc.textPrimary }]}>${coach.hourlyRate ?? 0}<Text style={{ fontSize: 14, color: tc.textSecondary }}>/hr</Text></Text>
          {coach.bio ? (
            <Text style={[styles.bio, { color: tc.textSecondary }]}>{coach.bio}</Text>
          ) : null}
        </View>

        {/* Available Anywhere section */}
        {availableAnywhere && (
          <View style={[styles.section, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={18} color="#0B1A3E" />
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Available Everywhere</Text>
            </View>
            <Text style={[styles.anywhereText, { color: tc.textSecondary }]}>
              This coach is available to train at any venue. Choose a stadium from the Stadiums section and add this coach during booking.
            </Text>
            {anywhereBranches.length > 0 && (
              <>
                <View style={[styles.branchDivider, { backgroundColor: tc.border }]} />
                {anywhereBranches.map((branch, idx) => (
                  <TouchableOpacity
                    key={branch.id}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('BranchDetail', { branchId: branch.id, preselectedCoachId: coachId })}
                    style={[
                      styles.branchCard,
                      { backgroundColor: isDark ? '#0A1428' : '#F8F9FF' },
                      idx < anywhereBranches.length - 1 && { marginBottom: 10 },
                    ]}
                  >
                    <View style={styles.branchIconWrap}>
                      <Ionicons name="business-outline" size={18} color="#0B1A3E" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.branchName, { color: tc.textPrimary }]}>{branch.name}</Text>
                      {branch.address?.city ? (
                        <Text style={[styles.branchCity, { color: tc.textSecondary }]}>
                          {branch.address.city}
                          {branch.sport?.name ? ` · ${branch.sport.name}` : ''}
                        </Text>
                      ) : branch.sport?.name ? (
                        <Text style={[styles.branchCity, { color: tc.textSecondary }]}>{branch.sport.name}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={tc.textHint} />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        {/* Venues section */}
        {venues.length > 0 && (
          <View style={[styles.section, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Available At</Text>
            {venues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={[styles.venueRow, { borderBottomColor: tc.border }]}
                onPress={() => navigation.navigate('CoachVenueAvailability', {
                  coachId,
                  venueId: venue.id,
                  venueName: venue.name,
                })}
                activeOpacity={0.7}
              >
                <View style={styles.venueIcon}>
                  <Ionicons name="american-football-outline" size={18} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.venueName, { color: tc.textPrimary }]}>{venue.name}</Text>
                  {(venue as any).branch?.address?.city ? (
                    <Text style={[styles.venueCity, { color: tc.textSecondary }]}>
                      {(venue as any).branch.address.city}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={tc.textHint} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reviews section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Reviews</Text>
            {user && (
              <TouchableOpacity onPress={() => setShowReviewModal(true)} style={styles.addReviewBtn}>
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={styles.addReviewText}>Review</Text>
              </TouchableOpacity>
            )}
          </View>
          {reviews.length === 0 ? (
            <Text style={[styles.noReviews, { color: tc.textHint }]}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.map((r) => <ReviewItem key={r.id} review={r} tc={tc} />)
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowReviewModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
            <View style={styles.handle} />
            <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>Write a Review</Text>
            {/* Star selector */}
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: spacing.lg }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setMyRating(i)}>
                  <Ionicons name={i <= myRating ? 'star' : 'star-outline'} size={32} color="#F59E0B" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.commentInput, { backgroundColor: tc.surface, color: tc.textPrimary }]}
              placeholder="Add a comment (optional)"
              placeholderTextColor={tc.textHint}
              value={myComment}
              onChangeText={setMyComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.submitBtn, submittingReview && { opacity: 0.6 }]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              <Text style={styles.submitBtnText}>{submittingReview ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  heroCard: {
    margin: spacing.lg,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(11,26,62,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroName: { fontSize: 22, fontWeight: '800' },
  sportBadge: { backgroundColor: 'rgba(11,26,62,0.12)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  sportBadgeText: { color: '#0B1A3E', fontWeight: '700', fontSize: 13 },
  ratingText: { fontSize: 13 },
  rate: { fontSize: 22, fontWeight: '800', color: '#0B1A3E', marginTop: 4 },
  bio: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  anywhereText: { fontSize: 13, lineHeight: 18 },
  branchDivider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
  },
  branchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(11,26,62,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchName: { fontSize: 14, fontWeight: '600' },
  branchCity: { fontSize: 12, marginTop: 2 },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  venueIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(6,15,40,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueName: { fontSize: 14, fontWeight: '600' },
  venueCity: { fontSize: 12, marginTop: 2 },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B1A3E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addReviewText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  noReviews: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#888', alignSelf: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: spacing.lg },
  commentInput: { borderRadius: 12, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.lg },
  submitBtn: { backgroundColor: '#0B1A3E', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
