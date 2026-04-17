import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useManagerReservationsStore } from '../../../stores/manager-reservations.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatDate } from '../../../utils/date';

const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toAMPM(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function TimelineItem({
  reservation,
  isFirst,
  isLast,
  isCurrent,
  tc,
  isDark,
}: {
  reservation: Reservation;
  isFirst: boolean;
  isLast: boolean;
  isCurrent: boolean;
  tc: any;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const venueName = reservation.slot?.availability?.venue?.name || t('owner.venue');
  const userName = reservation.user?.name || t('owner.user');
  const startAMPM = toAMPM(reservation.slot?.startTime ?? '');
  const endAMPM = toAMPM(reservation.slot?.endTime ?? '');
  const timeRange = startAMPM && endAMPM ? `${startAMPM} - ${endAMPM}` : '';
  const isPaid = reservation.status === ReservationStatus.PAID;
  const dotColor = isCurrent ? '#00C16A' : isPaid ? '#6B7280' : colors.navy;
  const lineColor = isDark ? '#1A2A52' : '#DDEEE6';

  return (
    <View style={tlStyles.row}>
      <View style={tlStyles.timeCol}>
        <Text
          style={[
            tlStyles.timeLabel,
            { color: isCurrent ? tc.textPrimary : tc.textHint },
            isCurrent && tlStyles.timeLabelBold,
          ]}
        >
          {startAMPM}
        </Text>
      </View>

      <View style={tlStyles.lineCol}>
        <View style={[tlStyles.lineSegment, { backgroundColor: isFirst ? 'transparent' : lineColor }]} />
        {isCurrent ? (
          <View style={[tlStyles.dotOuter, { borderColor: dotColor }]}>
            <View style={[tlStyles.dotInner, { backgroundColor: dotColor }]} />
          </View>
        ) : (
          <View style={[tlStyles.dotOutline, { borderColor: dotColor }]}>
            <View style={[tlStyles.dotOutlineDot, { backgroundColor: dotColor }]} />
          </View>
        )}
        <View style={[tlStyles.lineSegment, { backgroundColor: isLast ? 'transparent' : lineColor }]} />
      </View>

      <View
        style={[
          tlStyles.card,
          {
            backgroundColor: isCurrent
              ? (isDark ? 'rgba(0,193,106,0.08)' : 'rgba(0,193,106,0.06)')
              : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            tlStyles.cardTitle,
            { color: tc.textPrimary },
            isCurrent && tlStyles.cardTitleBold,
          ]}
          numberOfLines={1}
        >
          {userName}
        </Text>

        <View style={tlStyles.detailRow}>
          <Ionicons name="location-outline" size={12} color={tc.textHint} />
          <Text style={[tlStyles.detailText, { color: tc.textSecondary }]} numberOfLines={1}>
            {venueName}
          </Text>
        </View>

        <View style={tlStyles.detailRow}>
          <Ionicons name="calendar-outline" size={12} color={tc.textHint} />
          <Text style={[tlStyles.detailText, { color: tc.textSecondary }]}>
            {formatDate(reservation.slotDate)}
          </Text>
        </View>

        {timeRange ? (
          <View style={tlStyles.detailRow}>
            <Ionicons name="time-outline" size={12} color={tc.textHint} />
            <Text style={[tlStyles.detailText, { color: tc.textSecondary }]}>{timeRange}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  timeCol: { width: 72, alignItems: 'flex-end', paddingRight: 10, paddingTop: 12 },
  timeLabel: { fontSize: 11, fontWeight: '500' },
  timeLabelBold: { fontWeight: '700', fontSize: 12 },
  lineCol: { width: 24, alignItems: 'center' },
  lineSegment: { flex: 1, width: 1.5, minHeight: 16 },
  dotOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  dotInner: { width: 10, height: 10, borderRadius: 5 },
  dotOutline: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  dotOutlineDot: { width: 6, height: 6, borderRadius: 3 },
  card: { flex: 1, marginLeft: 10, marginBottom: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radius.card },
  cardTitle: { fontSize: 15, fontWeight: '500', marginBottom: 6 },
  cardTitleBold: { fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  detailText: { fontSize: 12, flex: 1 },
});

export function ManagerScheduleScreen() {
  const { t } = useTranslation();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { allReservations, isLoadingSchedule, fetchForSchedule } = useManagerReservationsStore();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchForSchedule();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchForSchedule();
    setRefreshing(false);
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const dayReservations = allReservations
    .filter(
      (r) =>
        (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.PAID) &&
        r.slotDate?.startsWith(selectedDateStr),
    )
    .sort((a, b) => {
      const aMin = a.slot?.startTime ? toMinutes(a.slot.startTime) : 0;
      const bMin = b.slot?.startTime ? toMinutes(b.slot.startTime) : 0;
      return aMin - bMin;
    });

  const isToday = isSameDay(selectedDate, today);
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const currentIndex = isToday
    ? dayReservations.findIndex((r) => {
        if (!r.slot) return false;
        const start = toMinutes(r.slot.startTime);
        const end = toMinutes(r.slot.endTime);
        return nowMinutes >= start && nowMinutes < end;
      })
    : -1;

  const selectedDayAbbrev = DAY_ABBREVS[selectedDate.getDay()];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      <FlatList
        data={dayReservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TimelineItem
            reservation={item}
            isFirst={index === 0}
            isLast={index === dayReservations.length - 1}
            isCurrent={index === currentIndex}
            tc={tc}
            isDark={isDark}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.textSecondary} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={[styles.title, { color: tc.textPrimary }]}>{t('owner.schedule')}</Text>
            </View>

            <View style={[styles.calendarCard, { backgroundColor: tc.cardBg }]}>
              <View style={styles.monthRow}>
                <Text style={[styles.monthTitle, { color: tc.textPrimary }]}>
                  {t('owner.appointmentDate')}
                </Text>
                <View style={[styles.monthPicker, { borderColor: tc.border }]}>
                  <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
                    <Ionicons name="chevron-back" size={14} color={tc.textSecondary} />
                  </TouchableOpacity>
                  <Text style={[styles.monthPickerText, { color: tc.textPrimary }]}>
                    {MONTH_NAMES[month]}
                  </Text>
                  <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
                    <Ionicons name="chevron-forward" size={14} color={tc.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dayHeaders}>
                {DAY_ABBREVS.map((d) => (
                  <Text key={d} style={[styles.dayHeader, { color: tc.textHint }]}>{d}</Text>
                ))}
              </View>

              <View style={styles.grid}>
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <View key={`blank-${idx}`} style={styles.cell} />;
                  }
                  const cellDate = new Date(year, month, day);
                  const isSelected = isSameDay(cellDate, selectedDate);
                  const dayAbbrev = DAY_ABBREVS[cellDate.getDay()];

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={styles.cell}
                      onPress={() => setSelectedDate(cellDate)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <View style={styles.selectedPill}>
                          <Text style={styles.selectedDayAbbrev}>{dayAbbrev}</Text>
                          <Text style={styles.selectedDateNum}>{day}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.dateNum, { color: tc.textPrimary }]}>{day}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
              {t('owner.reservationsFor', { day: selectedDayAbbrev, date: selectedDate.getDate() })}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !isLoadingSchedule ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                {t('owner.noReservations')}
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
  header: { paddingVertical: spacing.md },
  title: { fontSize: 24, fontWeight: '800' },
  calendarCard: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  monthTitle: { fontSize: 16, fontWeight: '700' },
  monthPicker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 6 },
  monthArrow: { padding: 2 },
  monthPickerText: { fontSize: 13, fontWeight: '600', minWidth: 60, textAlign: 'center' },
  dayHeaders: { flexDirection: 'row', marginBottom: spacing.sm },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, minHeight: 52 },
  selectedPill: { backgroundColor: '#00C16A', borderRadius: 22, paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center', minWidth: 36 },
  selectedDayAbbrev: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  selectedDateNum: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', lineHeight: 20 },
  dateNum: { fontSize: 16, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.sm },
  listContent: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '500' },
});
