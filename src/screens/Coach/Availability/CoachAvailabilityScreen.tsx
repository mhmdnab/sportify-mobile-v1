import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useAuthStore } from '../../../stores/auth.store';
import { useCoachAvailabilityStore } from '../../../stores/coach-availability.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { Day } from '../../../types/api';
import { api } from '../../../lib/api';
import { colors } from '../../../theme/colors';

const ORDERED_DAYS: Day[] = [
  Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY,
  Day.FRIDAY, Day.SATURDAY, Day.SUNDAY,
];
const DAY_SHORT: Record<Day, string> = {
  [Day.MONDAY]: 'Mon', [Day.TUESDAY]: 'Tue', [Day.WEDNESDAY]: 'Wed',
  [Day.THURSDAY]: 'Thu', [Day.FRIDAY]: 'Fri',
  [Day.SATURDAY]: 'Sat', [Day.SUNDAY]: 'Sun',
};
const TIME_OPTIONS = [
  '06:00','07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00',
  '20:00','21:00','22:00',
];

interface DayState { isActive: boolean; startTime: string; endTime: string; id?: number }
interface BranchOption { id: number; name: string; venues: { id: number; name: string }[] }

// ─── Time picker button (trigger only — dropdown rendered at parent level) ─────

function TimePickerBtn({ label, value, isOpen, onToggle, tc, isDark }: {
  label: string; value: string;
  isOpen: boolean; onToggle: () => void;
  tc: any; isDark: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[pickerSt.label, { color: tc.textHint }]}>{label}</Text>
      <TouchableOpacity
        style={[pickerSt.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,26,62,0.05)' }, isOpen && { borderColor: '#0B1A3E', borderWidth: 1 }]}
        onPress={onToggle}
      >
        <Text style={[pickerSt.val, { color: tc.textPrimary }]}>{value}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={12} color={tc.textHint} />
      </TouchableOpacity>
    </View>
  );
}

const pickerSt = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  val: { fontSize: 13, fontWeight: '600' },
  option: { paddingVertical: 9, paddingHorizontal: 12 },
});

// ─── Select picker (for modal) ────────────────────────────────────────────────

function SelectPicker({ label, placeholder, options, value, onSelect, isOpen, onToggle, tc, isDark }: {
  label: string; placeholder: string;
  options: { label: string; value: number | string }[];
  value: number | string | null;
  onSelect: (v: number | string) => void;
  isOpen: boolean;
  onToggle: () => void;
  tc: any; isDark: boolean;
}) {
  const selected = options.find(o => o.value === value);
  return (
    <View style={{ marginBottom: spacing.md, zIndex: isOpen ? 10 : 1 }}>
      <Text style={[pickerSt.label, { color: tc.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[selectSt.btn, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#DDE1EF' }]}
        onPress={onToggle}
      >
        <Text style={{ color: selected ? tc.textPrimary : tc.textHint, fontSize: 14 }}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={tc.textHint} />
      </TouchableOpacity>
      {isOpen && (
        <View style={[selectSt.dropdown, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#DDE1EF' }]}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={[selectSt.option, opt.value === value && { backgroundColor: 'rgba(11,26,62,0.08)' }]}
                onPress={() => { onSelect(opt.value); onToggle(); }}
              >
                <Text style={{ color: opt.value === value ? '#0B1A3E' : tc.textPrimary, fontWeight: opt.value === value ? '700' : '400', fontSize: 14 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const selectSt = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  dropdown: { position: 'absolute', top: 72, left: 0, right: 0, zIndex: 20, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  option: { paddingVertical: 11, paddingHorizontal: 14 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function CoachAvailabilityScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const tc = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const coachSport = user?.coach?.sport ?? '';

  const { availabilities, isLoading, fetchAvailabilities, addAvailability, updateAvailability, deleteAvailability } =
    useCoachAvailabilityStore();

  // Section 1 state
  const [schedule, setSchedule] = useState<Record<Day, DayState>>(
    () => Object.fromEntries(ORDERED_DAYS.map(d => [d, { isActive: false, startTime: '08:00', endTime: '20:00' }])) as any,
  );
  const [savingDay, setSavingDay] = useState<Day | null>(null);
  const [openTimePicker, setOpenTimePicker] = useState<{ day: Day; field: 'start' | 'end' } | null>(null);

  // Section 2 state
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [savingVenue, setSavingVenue] = useState(false);
  const [openPicker, setOpenPicker] = useState<'branch' | 'venue' | null>(null);

  // Sync schedule from store
  useEffect(() => {
    const workDays = availabilities.filter(a => !a.venueId);
    setSchedule(prev => {
      const next = { ...prev };
      ORDERED_DAYS.forEach(d => {
        const match = workDays.find(a => a.day === d);
        if (match) {
          next[d] = { isActive: match.isActive, startTime: match.startTime.slice(0, 5), endTime: match.endTime.slice(0, 5), id: match.id };
        } else {
          next[d] = { isActive: false, startTime: '08:00', endTime: '20:00', id: undefined };
        }
      });
      return next;
    });
  }, [availabilities]);

  // Unique venues from section-2 availabilities
  const venueAvails = availabilities.filter(a => a.venueId != null);
  const uniqueVenueMap = new Map<number, { id: number; name: string }>();
  venueAvails.forEach(a => {
    if (a.venueId && !uniqueVenueMap.has(a.venueId)) {
      uniqueVenueMap.set(a.venueId, a.venue ?? { id: a.venueId, name: `Venue #${a.venueId}` });
    }
  });
  const venueList = Array.from(uniqueVenueMap.values());

  // Toggle a working day on/off
  const handleToggleDay = async (day: Day) => {
    const current = schedule[day];
    setSavingDay(day);
    try {
      if (current.id) {
        // Toggle active state
        await updateAvailability(current.id, { isActive: !current.isActive });
      } else {
        // Create new
        await addAvailability({ day, startTime: current.startTime, endTime: current.endTime, isActive: true, venueId: null });
      }
      await fetchAvailabilities();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to update');
    }
    setSavingDay(null);
  };

  // Remove a working day
  const handleRemoveDay = (day: Day) => {
    const current = schedule[day];
    if (!current.id) return;
    Alert.alert('Remove Day', `Remove ${day} from your schedule?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setSavingDay(day);
          await deleteAvailability(current.id!);
          await fetchAvailabilities();
          setSavingDay(null);
        },
      },
    ]);
  };

  // Load branches for the add-venue modal
  const loadBranches = useCallback(async () => {
    setLoadingBranches(true);
    try {
      const res = await api.get<any>('/branches', { params: { page: 1, limit: 100 } });
      const list: any[] = res.data?.list ?? res.data?.data?.list ?? [];
      setBranches(list.map(b => ({ id: b.id, name: b.name, venues: b.venues ?? [] })));
    } catch {
      setBranches([]);
    }
    setLoadingBranches(false);
  }, []);

  const openAddVenue = () => {
    setSelectedBranchId(null);
    setSelectedVenueId(null);
    setOpenPicker(null);
    setShowAddVenue(true);
    loadBranches();
  };

  // When branch changes, reset venue
  const handleBranchSelect = (branchId: number | string) => {
    setSelectedBranchId(Number(branchId));
    setSelectedVenueId(null);
  };

  // Save venue: create one availability per active working day
  const handleSaveVenue = async () => {
    const activeDays = ORDERED_DAYS.filter(d => schedule[d].isActive && schedule[d].id);
    if (activeDays.length === 0) {
      Alert.alert('No Working Days', 'Set up at least one working day in "Days of Work" before adding a venue.');
      return;
    }
    if (selectedVenueId && uniqueVenueMap.has(selectedVenueId)) {
      Alert.alert('Already Added', 'This venue is already in your list.');
      return;
    }
    setSavingVenue(true);
    try {
      for (const day of activeDays) {
        const { startTime, endTime } = schedule[day];
        await addAvailability({ day, startTime, endTime, venueId: selectedVenueId ?? null, isActive: true });
      }
      await fetchAvailabilities();
      setShowAddVenue(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to add venue');
    }
    setSavingVenue(false);
  };

  // Remove all availabilities for a venue
  const handleRemoveVenue = (venueId: number, venueName: string) => {
    Alert.alert('Remove Venue', `Remove "${venueName}" from your workplaces?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const ids = venueAvails.filter(a => a.venueId === venueId).map(a => a.id);
          for (const id of ids) await deleteAvailability(id);
          await fetchAvailabilities();
        },
      },
    ]);
  };

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const venueOptions = (selectedBranch?.venues ?? []).map(v => ({ label: v.name, value: v.id }));
  const branchOptions = branches.map(b => ({ label: b.name, value: b.id }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
      <BackgroundShapes isDark={isDark} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchAvailabilities} tintColor="#0B1A3E" />}
      >
        <Text style={[styles.screenTitle, { color: tc.textPrimary }]}>Availability</Text>

        {/* ── Section 1: Days of Work ────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.08)' }]}>
                <Ionicons name="calendar-outline" size={16} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
              </View>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Days of Work</Text>
            </View>
            <Text style={[styles.sectionHint, { color: tc.textHint }]}>Tap a day to activate it</Text>
          </View>

          <View style={styles.daysGrid}>
            {ORDERED_DAYS.map((day) => {
              const s = schedule[day];
              const isSaving = savingDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => handleToggleDay(day)}
                  disabled={isSaving}
                  style={[
                    styles.dayChip,
                    s.isActive && s.id
                      ? { backgroundColor: '#0B1A3E' }
                      : { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F2F8' },
                  ]}
                >
                  {isSaving
                    ? <ActivityIndicator size="small" color={s.isActive ? '#fff' : '#0B1A3E'} />
                    : <Text style={[styles.dayChipText, { color: s.isActive && s.id ? '#FFFFFF' : tc.textSecondary }]}>
                        {DAY_SHORT[day]}
                      </Text>
                  }
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active days: inline time pickers */}
          {ORDERED_DAYS.filter(d => schedule[d].isActive && schedule[d].id).map((day) => {
            const s = schedule[day];
            const isSaving = savingDay === day;
            const isStartOpen = openTimePicker?.day === day && openTimePicker?.field === 'start';
            const isEndOpen = openTimePicker?.day === day && openTimePicker?.field === 'end';
            const activeField = isStartOpen ? 'start' : isEndOpen ? 'end' : null;
            const activeValue = activeField === 'start' ? s.startTime : s.endTime;

            return (
              <View key={day} style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F2F8', marginTop: spacing.sm, paddingTop: spacing.md }}>
                {/* Row: label + pickers + remove */}
                <View style={styles.dayRow}>
                  <View style={styles.dayRowLeft}>
                    <View style={styles.dayDot} />
                    <Text style={[styles.dayRowLabel, { color: tc.textPrimary }]}>{DAY_SHORT[day]}</Text>
                  </View>
                  <View style={styles.dayRowPickers}>
                    <TimePickerBtn
                      label="Start" value={s.startTime}
                      isOpen={isStartOpen}
                      onToggle={() => setOpenTimePicker(isStartOpen ? null : { day, field: 'start' })}
                      tc={tc} isDark={isDark}
                    />
                    <View style={styles.timeSep}>
                      <Text style={{ color: tc.textHint, fontSize: 16 }}>–</Text>
                    </View>
                    <TimePickerBtn
                      label="End" value={s.endTime}
                      isOpen={isEndOpen}
                      onToggle={() => setOpenTimePicker(isEndOpen ? null : { day, field: 'end' })}
                      tc={tc} isDark={isDark}
                    />
                  </View>
                  <View style={styles.dayRowActions}>
                    {isSaving
                      ? <ActivityIndicator size="small" color="#0B1A3E" />
                      : <TouchableOpacity onPress={() => handleRemoveDay(day)} style={styles.removeBtn}>
                          <Ionicons name="close" size={14} color="#FF4444" />
                        </TouchableOpacity>
                    }
                  </View>
                </View>

                {/* Inline dropdown — renders below the row, never clipped */}
                {activeField && (
                  <View style={[styles.timeDropdown, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E0E4EF' }]}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }}>
                      {TIME_OPTIONS.map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[pickerSt.option, t === activeValue && { backgroundColor: 'rgba(11,26,62,0.08)' }]}
                          onPress={() => {
                            if (activeField === 'start') {
                              setSchedule(prev => ({ ...prev, [day]: { ...prev[day], startTime: t } }));
                              if (s.id) updateAvailability(s.id, { startTime: t }).then(() => fetchAvailabilities());
                            } else {
                              setSchedule(prev => ({ ...prev, [day]: { ...prev[day], endTime: t } }));
                              if (s.id) updateAvailability(s.id, { endTime: t }).then(() => fetchAvailabilities());
                            }
                            setOpenTimePicker(null);
                          }}
                        >
                          <Text style={{ color: t === activeValue ? '#0B1A3E' : tc.textPrimary, fontWeight: t === activeValue ? '700' : '400', fontSize: 13 }}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Section 2: Where I Work At ─────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.08)' }]}>
                <Ionicons name="location-outline" size={16} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
              </View>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Where I Work At</Text>
            </View>
            <TouchableOpacity style={styles.addVenueBtn} onPress={openAddVenue}>
              <Ionicons name="add" size={15} color="#fff" />
              <Text style={styles.addVenueBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {venueList.length === 0 ? (
            <View style={styles.venueEmpty}>
              <Ionicons name="business-outline" size={32} color={tc.textHint} />
              <Text style={[styles.venueEmptyText, { color: tc.textHint }]}>No venues added yet</Text>
            </View>
          ) : (
            venueList.map((venue) => {
              const days = venueAvails.filter(a => a.venueId === venue.id).map(a => DAY_SHORT[a.day]);
              return (
                <View key={venue.id} style={[styles.venueCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F7F8FC' }]}>
                  <View style={[styles.venueIconBox, { backgroundColor: isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.08)' }]}>
                    <Ionicons name="business-outline" size={18} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
                  </View>
                  <View style={styles.venueInfo}>
                    <Text style={[styles.venueName, { color: tc.textPrimary }]} numberOfLines={1}>{venue.name}</Text>
                    <Text style={[styles.venueDays, { color: tc.textSecondary }]} numberOfLines={1}>
                      {days.join(' · ')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveVenue(venue.id, venue.name)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={15} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Add Venue Modal ─────────────────────────────────────────── */}
      <Modal visible={showAddVenue} transparent animationType="slide" onRequestClose={() => setShowAddVenue(false)}>
        <View style={modalSt.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowAddVenue(false)} />
          <View style={[modalSt.sheet, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
            <View style={modalSt.handle} />
            <Text style={[modalSt.title, { color: tc.textPrimary }]}>Add Venue</Text>
            {coachSport ? (
              <Text style={[modalSt.sportBadge, { backgroundColor: isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.08)' }]}>
                <Text style={{ color: isDark ? '#A2B8FF' : '#0B1A3E', fontWeight: '700' }}>{coachSport}</Text>
              </Text>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
              {loadingBranches ? (
                <ActivityIndicator color="#0B1A3E" style={{ marginVertical: 20 }} />
              ) : (
                <>
                  <SelectPicker
                    label="Branch"
                    placeholder="Select a branch…"
                    options={branchOptions}
                    value={selectedBranchId}
                    onSelect={handleBranchSelect}
                    isOpen={openPicker === 'branch'}
                    onToggle={() => setOpenPicker(openPicker === 'branch' ? null : 'branch')}
                    tc={tc}
                    isDark={isDark}
                  />
                  <SelectPicker
                    label="Venue"
                    placeholder={selectedBranchId ? 'Select a venue…' : 'Select a branch first'}
                    options={venueOptions}
                    value={selectedVenueId}
                    onSelect={(v) => setSelectedVenueId(Number(v))}
                    isOpen={openPicker === 'venue'}
                    onToggle={() => setOpenPicker(openPicker === 'venue' ? null : 'venue')}
                    tc={tc}
                    isDark={isDark}
                  />
                </>
              )}
            </ScrollView>

            <View style={[modalSt.note, { backgroundColor: isDark ? 'rgba(162,184,255,0.08)' : 'rgba(11,26,62,0.07)' }]}>
              <Ionicons name="information-circle-outline" size={18} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
              <Text style={[modalSt.noteText, { color: isDark ? '#A2B8FF' : '#0B1A3E' }]}>If no venue is selected, your availability will be set to anywhere.</Text>
            </View>

            <View style={modalSt.btnRow}>
              <TouchableOpacity style={modalSt.cancelBtn} onPress={() => setShowAddVenue(false)}>
                <Text style={{ color: tc.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalSt.saveBtn, savingVenue && { opacity: 0.6 }]} onPress={handleSaveVenue} disabled={savingVenue}>
                {savingVenue
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '700' }}>Add Venue</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 60, gap: spacing.lg },
  screenTitle: { fontSize: 26, fontWeight: '800', marginBottom: 4 },

  section: {
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { fontSize: 11 },

  // Day chips
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  dayChip: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayChipText: { fontSize: 12, fontWeight: '700' },

  // Active day row
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeDropdown: { marginTop: 8, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  dayRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 42 },
  dayDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0B1A3E' },
  dayRowLabel: { fontSize: 12, fontWeight: '700' },
  dayRowPickers: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  timeSep: { paddingBottom: 6 },
  dayRowActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,68,68,0.1)', alignItems: 'center', justifyContent: 'center' },

  // Venue section
  addVenueBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0B1A3E', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  addVenueBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  venueEmpty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  venueEmptyText: { fontSize: 13 },
  venueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: spacing.md, marginTop: 8 },
  venueIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  venueInfo: { flex: 1 },
  venueName: { fontSize: 14, fontWeight: '600' },
  venueDays: { fontSize: 11, marginTop: 2 },
});

const modalSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, paddingBottom: 40, height: '80%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#888', alignSelf: 'center', marginBottom: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sportBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, fontSize: 12 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(11,26,62,0.07)', borderRadius: 10, padding: 12, marginTop: spacing.md },
  noteText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0B1A3E', lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(120,120,120,0.08)' },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#0B1A3E' },
});
