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
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useCoachReservationsStore } from '../../../stores/coach-reservations.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatDate } from '../../../utils/date';
import { colors } from '../../../theme/colors';

const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toAMPM(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${String(h % 12 || 12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function TimelineItem({ reservation, isFirst, isLast, isCurrent, tc, isDark }: {
  reservation: Reservation; isFirst: boolean; isLast: boolean; isCurrent: boolean; tc: any; isDark: boolean;
}) {
  const venueName = reservation.slot?.availability?.venue?.name ?? 'Venue';
  const userName = reservation.user?.name ?? 'Client';
  const startAMPM = toAMPM(reservation.slot?.startTime ?? '');
  const endAMPM = toAMPM(reservation.slot?.endTime ?? '');
  const dotColor = isCurrent ? '#0B1A3E' : colors.navy;
  const lineColor = isDark ? '#1A2A52' : '#DDEEE6';

  return (
    <View style={tlStyles.row}>
      <View style={tlStyles.timeCol}>
        <Text style={[tlStyles.timeLabel, { color: isCurrent ? tc.textPrimary : tc.textHint }, isCurrent && { fontWeight: '700' }]}>
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
      <View style={[tlStyles.card, { backgroundColor: isCurrent ? (isDark ? 'rgba(11,26,62,0.08)' : 'rgba(11,26,62,0.06)') : 'transparent' }]}>
        <Text style={[tlStyles.cardTitle, { color: tc.textPrimary }, isCurrent && { fontWeight: '700' }]} numberOfLines={1}>{userName}</Text>
        <View style={tlStyles.detailRow}>
          <Ionicons name="location-outline" size={12} color={tc.textHint} />
          <Text style={[tlStyles.detailText, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}</Text>
        </View>
        <View style={tlStyles.detailRow}>
          <Ionicons name="calendar-outline" size={12} color={tc.textHint} />
          <Text style={[tlStyles.detailText, { color: tc.textSecondary }]}>{formatDate(reservation.slotDate)}</Text>
        </View>
        {startAMPM && endAMPM ? (
          <View style={tlStyles.detailRow}>
            <Ionicons name="time-outline" size={12} color={tc.textHint} />
            <Text style={[tlStyles.detailText, { color: tc.textSecondary }]}>{startAMPM} - {endAMPM}</Text>
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
  lineCol: { width: 24, alignItems: 'center' },
  lineSegment: { flex: 1, width: 1.5, minHeight: 16 },
  dotOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotInner: { width: 10, height: 10, borderRadius: 5 },
  dotOutline: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dotOutlineDot: { width: 6, height: 6, borderRadius: 3 },
  card: { flex: 1, marginLeft: 10, marginBottom: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radius.card },
  cardTitle: { fontSize: 15, fontWeight: '500', marginBottom: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  detailText: { fontSize: 12, flex: 1 },
});

export function CoachScheduleScreen() {
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { allReservations, isLoadingSchedule, fetchForSchedule } = useCoachReservationsStore();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchForSchedule(); }, []);

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

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
  const dayReservations = allReservations
    .filter((r) => [ReservationStatus.CONFIRMED, ReservationStatus.PAID].includes(r.status as any) && r.slotDate?.startsWith(selectedDateStr))
    .sort((a, b) => (a.slot?.startTime ? toMinutes(a.slot.startTime) : 0) - (b.slot?.startTime ? toMinutes(b.slot.startTime) : 0));

  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const currentIndex = isSameDay(selectedDate, today)
    ? dayReservations.findIndex((r) => r.slot && nowMinutes >= toMinutes(r.slot.startTime) && nowMinutes < toMinutes(r.slot.endTime))
    : -1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tc.screenBg }}>
      <BackgroundShapes isDark={isDark} />
      <FlatList
        data={dayReservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TimelineItem reservation={item} isFirst={index === 0} isLast={index === dayReservations.length - 1} isCurrent={index === currentIndex} tc={tc} isDark={isDark} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B1A3E" />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={[styles.title, { color: tc.textPrimary }]}>Schedule</Text>
            </View>
            <View style={[styles.calendarCard, { backgroundColor: tc.cardBg }]}>
              <View style={styles.monthRow}>
                <Text style={[styles.monthTitle, { color: tc.textPrimary }]}>
                  {MONTH_NAMES[month]} {year}
                </Text>
                <View style={styles.monthNav}>
                  <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))} style={styles.monthArrow}>
                    <Ionicons name="chevron-back" size={14} color={tc.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))} style={styles.monthArrow}>
                    <Ionicons name="chevron-forward" size={14} color={tc.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.dayHeaders}>
                {DAY_ABBREVS.map((d) => <Text key={d} style={[styles.dayHeader, { color: tc.textHint }]}>{d}</Text>)}
              </View>
              <View style={styles.grid}>
                {cells.map((day, idx) => {
                  if (day === null) return <View key={`b-${idx}`} style={styles.cell} />;
                  const cellDate = new Date(year, month, day);
                  const isSelected = isSameDay(cellDate, selectedDate);
                  return (
                    <TouchableOpacity key={`d-${day}`} style={styles.cell} onPress={() => setSelectedDate(cellDate)} activeOpacity={0.7}>
                      {isSelected ? (
                        <View style={styles.selectedPill}>
                          <Text style={styles.selectedDayAbbrev}>{DAY_ABBREVS[cellDate.getDay()]}</Text>
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
              {DAY_ABBREVS[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !isLoadingSchedule ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No bookings for this day</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: spacing.md },
  title: { fontSize: 24, fontWeight: '800' },
  calendarCard: { borderRadius: radius.card, padding: spacing.lg, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  monthTitle: { fontSize: 16, fontWeight: '700' },
  monthNav: { flexDirection: 'row', gap: 4 },
  monthArrow: { padding: 6 },
  dayHeaders: { flexDirection: 'row', marginBottom: spacing.sm },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100/7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, minHeight: 52 },
  selectedPill: { backgroundColor: '#0B1A3E', borderRadius: 22, paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center', minWidth: 36 },
  selectedDayAbbrev: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  selectedDateNum: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', lineHeight: 20 },
  dateNum: { fontSize: 16, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.sm },
  listContent: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '500' },
});
