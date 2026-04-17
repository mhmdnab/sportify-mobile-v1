import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useOwnerVenuesStore } from '../../../stores/owner-venues.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { OwnerVenuesStackParamList } from '../../../types/navigation';
import { Availability, Day } from '../../../types/api';
import { formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';

type RouteParams = RouteProp<OwnerVenuesStackParamList, 'OwnerVenueDetail'>;

const dayOrder: Day[] = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY, Day.SATURDAY, Day.SUNDAY];
const dayTranslationKeys: Record<Day, string> = {
  [Day.MONDAY]: 'days.mon',
  [Day.TUESDAY]: 'days.tue',
  [Day.WEDNESDAY]: 'days.wed',
  [Day.THURSDAY]: 'days.thu',
  [Day.FRIDAY]: 'days.fri',
  [Day.SATURDAY]: 'days.sat',
  [Day.SUNDAY]: 'days.sun',
};

/** Parse "HH:MM:SS" or "HH:MM" into a Date object (date part is irrelevant) */
function timeStringToDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/** Format a Date into "HH:MM:SS" */
function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}

/** Format a Date into "HH:MM" for display */
function formatTimeDisplay(timeStr: string): string {
  const [h, m] = timeStr.split(':');
  return `${h}:${m}`;
}

interface EditState {
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export function OwnerVenueDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { venueId } = route.params;
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { currentVenue: venue, isLoadingDetail, isSavingAvailability, fetchVenueById, updateAvailability } = useOwnerVenuesStore();

  const [editingAvailId, setEditingAvailId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<EditState>({ startTime: '08:00:00', endTime: '22:00:00', isOpen: true });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    fetchVenueById(venueId);
  }, [venueId]);

  if (isLoadingDetail || !venue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const imageUri = venue.images?.[0];
  const typeNames = venue.venueTypes?.map((t) => t.name).join(', ') || '-';
  const sortedAvailability = venue.availability
    ? [...venue.availability].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
    : [];

  function startEditing(avail: Availability) {
    setEditingAvailId(avail.id);
    setEditValues({
      startTime: avail.startTime,
      endTime: avail.endTime,
      isOpen: avail.isOpen,
    });
    setShowStartPicker(false);
    setShowEndPicker(false);
  }

  function cancelEditing() {
    setEditingAvailId(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
  }

  async function saveEditing(avail: Availability) {
    try {
      await updateAvailability(venue!.id, [{
        day: avail.day,
        startTime: editValues.startTime,
        endTime: editValues.endTime,
        isOpen: editValues.isOpen,
      }]);
      setEditingAvailId(null);
      setShowStartPicker(false);
      setShowEndPicker(false);
    } catch {
      Alert.alert(t('owner.error'), t('owner.failedUpdateStatus'));
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1}>
          {t('owner.venueDetails')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? colors.navyLight : '#E8EAF0' }]}>
            <Ionicons name="football" size={48} color={isDark ? '#556080' : '#B0B5C5'} />
          </View>
        )}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: tc.cardBg }]}>
          <Text style={[styles.venueName, { color: tc.textPrimary }]}>{venue.name}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={18} color={isDark ? '#8A94B0' : colors.navy} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{venue.playerCapacity}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{t('owner.players')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="pricetag" size={18} color={isDark ? '#8A94B0' : colors.navy} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{typeNames}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{t('owner.type')}</Text>
            </View>
          </View>
        </View>

        {/* Availability */}
        {sortedAvailability.length > 0 && (
          <View style={[styles.section, { backgroundColor: tc.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{t('owner.availability')}</Text>
            {sortedAvailability.map((avail) => {
              const isEditing = editingAvailId === avail.id;

              return (
                <View key={avail.id} style={[styles.availRow, { borderColor: tc.border }]}>
                  {/* Row header */}
                  <View style={styles.availHeader}>
                    <View style={styles.availDay}>
                      <Text style={[styles.dayText, { color: tc.textPrimary }]}>{t(dayTranslationKeys[avail.day])}</Text>
                      {!isEditing && (
                        <View style={[styles.openBadge, {
                          backgroundColor: avail.isOpen ? 'rgba(0,193,106,0.1)' : 'rgba(255,68,68,0.1)',
                        }]}>
                          <Text style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: avail.isOpen ? '#00C16A' : '#FF4444',
                          }}>
                            {avail.isOpen ? t('owner.open') : t('owner.closed')}
                          </Text>
                        </View>
                      )}
                    </View>
                    {!isEditing && (
                      <TouchableOpacity
                        onPress={() => startEditing(avail)}
                        style={styles.editBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="create-outline" size={18} color={isDark ? '#8A94B0' : colors.navy} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Read-only: slots */}
                  {!isEditing && avail.isOpen && avail.slots && avail.slots.length > 0 && (
                    <View style={styles.slotsWrap}>
                      {avail.slots.map((slot) => (
                        <View key={slot.id} style={[styles.slotChip, { backgroundColor: isDark ? 'rgba(150,170,220,0.08)' : '#F0F2F8' }]}>
                          <Text style={[styles.slotTime, { color: tc.textPrimary }]}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </Text>
                          <Text style={[styles.slotPrice, { color: isDark ? '#8A94B0' : colors.navy }]}>
                            {formatPrice(slot.price)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Edit mode */}
                  {isEditing && (
                    <View style={styles.editForm}>
                      {/* isOpen toggle */}
                      <View style={styles.editRow}>
                        <Text style={[styles.editLabel, { color: tc.textSecondary }]}>{t('owner.open')}</Text>
                        <Switch
                          value={editValues.isOpen}
                          onValueChange={(val) => setEditValues((p) => ({ ...p, isOpen: val }))}
                          trackColor={{ false: '#E0E2EC', true: '#00C16A' }}
                          thumbColor="#FFFFFF"
                        />
                      </View>

                      {/* Start time */}
                      <View style={styles.editRow}>
                        <Text style={[styles.editLabel, { color: tc.textSecondary }]}>{t('owner.openTime')}</Text>
                        <TouchableOpacity
                          onPress={() => { setShowStartPicker(true); setShowEndPicker(false); }}
                          style={[styles.timeBtn, { backgroundColor: isDark ? 'rgba(150,170,220,0.08)' : '#F0F2F8' }]}
                        >
                          <Ionicons name="time-outline" size={14} color={isDark ? '#8A94B0' : colors.navy} />
                          <Text style={[styles.timeBtnText, { color: tc.textPrimary }]}>
                            {formatTimeDisplay(editValues.startTime)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {showStartPicker && (
                        <DateTimePicker
                          value={timeStringToDate(editValues.startTime)}
                          mode="time"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(_e, date) => {
                            if (Platform.OS === 'android') setShowStartPicker(false);
                            if (date) setEditValues((p) => ({ ...p, startTime: dateToTimeString(date) }));
                          }}
                        />
                      )}

                      {/* End time */}
                      <View style={styles.editRow}>
                        <Text style={[styles.editLabel, { color: tc.textSecondary }]}>{t('owner.closeTime')}</Text>
                        <TouchableOpacity
                          onPress={() => { setShowEndPicker(true); setShowStartPicker(false); }}
                          style={[styles.timeBtn, { backgroundColor: isDark ? 'rgba(150,170,220,0.08)' : '#F0F2F8' }]}
                        >
                          <Ionicons name="time-outline" size={14} color={isDark ? '#8A94B0' : colors.navy} />
                          <Text style={[styles.timeBtnText, { color: tc.textPrimary }]}>
                            {formatTimeDisplay(editValues.endTime)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {showEndPicker && (
                        <DateTimePicker
                          value={timeStringToDate(editValues.endTime)}
                          mode="time"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(_e, date) => {
                            if (Platform.OS === 'android') setShowEndPicker(false);
                            if (date) setEditValues((p) => ({ ...p, endTime: dateToTimeString(date) }));
                          }}
                        />
                      )}

                      {/* Save / Cancel */}
                      <View style={styles.editActions}>
                        <TouchableOpacity
                          onPress={cancelEditing}
                          style={styles.cancelBtn}
                        >
                          <Text style={[styles.cancelBtnText, { color: tc.textSecondary }]}>{t('owner.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => saveEditing(avail)}
                          disabled={isSavingAvailability}
                          style={styles.saveBtn}
                        >
                          {isSavingAvailability ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  infoCard: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  venueName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  availRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
  },
  availHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  availDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editBtn: {
    padding: 4,
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 4,
    marginTop: 2,
  },
  slotChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  slotPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Edit form styles
  editForm: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#00C16A',
    borderRadius: radius.button,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
