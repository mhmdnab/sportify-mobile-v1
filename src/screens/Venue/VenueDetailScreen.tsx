import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,

  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageCarousel } from '../../components/ui/ImageCarousel';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing } from '../../theme/spacing';
import { useVenuesStore } from '../../stores/venues.store';
import { useAssistantStore } from '../../stores/assistant.store';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { HomeStackParamList } from '../../types/navigation';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<HomeStackParamList, 'VenueDetail'>;

export function VenueDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { venueId, preselectedCoachId } = route.params;
  const { currentVenue, isLoading, error, fetchVenueById } = useVenuesStore();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  const setScreen = useAssistantStore((s) => s.setScreen);

  useEffect(() => {
    fetchVenueById(venueId);
  }, [venueId]);

  useFocusEffect(
    useCallback(() => {
      setScreen('venue', {
        venueName: currentVenue?.name,
        sport: currentVenue?.branch?.sport?.name,
        price: currentVenue?.price,
      });
      return () => setScreen('general');
    }, [currentVenue?.name, currentVenue?.branch?.sport?.name, currentVenue?.price]),
  );

  const handleLocationPress = () => {
    if (!currentVenue?.branch?.address) return;
    const { latitude, longitude } = currentVenue.branch.address;
    if (latitude && longitude) {
      const url = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
      });
      if (url) Linking.openURL(url);
    }
  };

  const handleShare = async () => {
    if (!currentVenue) return;
    try {
      await Share.share({ message: t('venue.shareMessage', { name: currentVenue.name }) });
    } catch {}
  };

  const handleBookNow = () => {
    navigation.navigate('Reservation', { venueId, preselectedCoachId });
  };

  if (isLoading && !currentVenue) {
    return (
      <View style={styles.container}>
        <SkeletonCard />
        <View style={{ padding: spacing.screenPadding }}>
          <SkeletonList count={3} />
        </View>
      </View>
    );
  }

  if (error || !currentVenue) {
    return <ErrorState message={error || t('venue.notFound')} onRetry={() => fetchVenueById(venueId)} />;
  }

  const venue = currentVenue;
  const venueTypeName = venue.venueTypes?.[0]?.name || null;
  const lowestPrice = venue.availability
    ?.flatMap((a) => a.slots || [])
    .reduce((min, slot) => (slot.price < min ? slot.price : min), Infinity);
  const priceDisplay = lowestPrice && lowestPrice !== Infinity
    ? `${lowestPrice.toLocaleString()} L.L/h`
    : null;

  return (
    <View style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      {/* Fixed image */}
      <ImageCarousel images={venue.images || []} height={280} />

      {/* Header buttons — fixed over image */}
      <View style={[styles.headerButtons, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <Ionicons name="share-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
          <Text style={[styles.name, { color: tc.textPrimary }]}>{venue.name}</Text>

          {/* Location */}
          {venue.branch?.address && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={isDark ? colors.navyLight : colors.navy} />
              <Text style={[styles.metaText, { color: tc.textSecondary }]}>
                {[venue.branch.address.city, venue.branch.address.state || venue.branch.address.country]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          )}

          {/* Players */}
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color={tc.textSecondary} />
            <Text style={[styles.metaText, { color: tc.textSecondary }]}>{venue.playerCapacity} {t('venue.players')}</Text>
          </View>

          {/* Price */}
          {priceDisplay && (
            <View style={styles.metaRow}>
              <Ionicons name="card-outline" size={16} color={tc.textSecondary} />
              <Text style={[styles.metaText, { color: tc.textSecondary }]}>{priceDisplay}</Text>
            </View>
          )}

          {/* Indoor/Outdoor */}
          {venueTypeName && (
            <View style={styles.metaRow}>
              <Ionicons name="grid-outline" size={16} color={tc.textSecondary} />
              <Text style={[styles.metaText, { color: tc.textSecondary }]}>{venueTypeName}</Text>
            </View>
          )}

          {/* Description */}
          {venue.description ? (
            <Text style={[styles.description, { color: tc.textSecondary }]}>{venue.description}</Text>
          ) : null}

          {/* Book Now button */}
          <TouchableOpacity style={[styles.bookBtn, { backgroundColor: isDark ? '#1D4ED8' : colors.navy }]} onPress={handleBookNow} activeOpacity={0.8}>
            <Text style={styles.bookBtnText}>{t('venue.bookNow')}</Text>
          </TouchableOpacity>

          {/* Location button */}
          <TouchableOpacity style={[styles.locationBtn, { borderColor: isDark ? '#A2B8FF' : colors.navy }]} onPress={handleLocationPress}>
            <Ionicons name="location-outline" size={18} color={isDark ? '#A2B8FF' : colors.navy} />
            <Text style={[styles.locationBtnText, { color: isDark ? '#A2B8FF' : colors.navy }]}>{t('venue.location')}</Text>
          </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEDF3',
  },
  headerButtons: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 8,
  },
  bookBtn: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  bookBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  locationBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
  },
});
