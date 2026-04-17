import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useCoachAvailabilityStore } from '../../../stores/coach-availability.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { CoachAvailability, Day } from '../../../types/api';
import { api } from '../../../lib/api';

const DAYS = Object.values(Day);
const TIME_OPTIONS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

function AvailabilityRow({
  item,
  onToggle,
  onDelete,
  tc,
  isDark,
}: {
  item: CoachAvailability;
  onToggle: () => void;
  onDelete: () => void;
  tc: any;
  isDark: boolean;
}) {
  return (
    <View style={[rowStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
      <View style={[rowStyles.dayBadge, { backgroundColor: item.isActive ? 'rgba(11,26,62,0.1)' : 'rgba(120,120,120,0.08)' }]}>
        <Text style={[rowStyles.dayText, { color: item.isActive ? '#0B1A3E' : '#888' }]}>{item.day?.slice(0, 3)}</Text>
      </View>
      <View style={rowStyles.info}>
        <Text style={[rowStyles.timeText, { color: tc.textPrimary }]}>
          {item.startTime?.slice(0, 5)} – {item.endTime?.slice(0, 5)}
        </Text>
        <Text style={[rowStyles.venueText, { color: tc.textSecondary }]} numberOfLines={1}>
          {(item as any).venue?.name ?? (item.venueId == null ? '📍 Anywhere' : 'Venue')}
        </Text>
      </View>
      <Switch
        value={item.isActive}
        onValueChange={onToggle}
        trackColor={{ true: '#0B1A3E', false: '#888' }}
        thumbColor="#fff"
        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      />
      <TouchableOpacity onPress={onDelete} style={rowStyles.deleteBtn}>
        <Ionicons name="trash-outline" size={16} color="#FF4444" />
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm, gap: 10 },
  dayBadge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontWeight: '800' },
  info: { flex: 1 },
  timeText: { fontSize: 14, fontWeight: '600' },
  venueText: { fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 4 },
});

interface Venue { id: number; name: string }

function PickerRow({ label, options, selected, onSelect, tc, isDark }: {
  label: string;
  options: { label: string; value: string | number }[];
  selected: string | number;
  onSelect: (v: string | number) => void;
  tc: any;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === selected)?.label ?? String(selected);
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[{ fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }, { color: tc.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[{ borderWidth: 1, borderRadius: 12, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E0E4EF' }]}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ color: tc.textPrimary }}>{selectedLabel}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={tc.textHint} />
      </TouchableOpacity>
      {open && (
        <View style={[{ borderWidth: 1, borderRadius: 12, marginTop: 4, maxHeight: 200, overflow: 'hidden' }, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E0E4EF', backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <ScrollView>
            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                onPress={() => { onSelect(opt.value); setOpen(false); }}
                style={[{ padding: spacing.md }, opt.value === selected && { backgroundColor: 'rgba(11,26,62,0.1)' }]}
              >
                <Text style={{ color: opt.value === selected ? '#0B1A3E' : tc.textPrimary, fontWeight: opt.value === selected ? '700' : '400' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function CoachAvailabilityScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const tc = useThemeColors();
  const { availabilities, isLoading, fetchAvailabilities, addAvailability, updateAvailability, deleteAvailability } =
    useCoachAvailabilityStore();

  const [showModal, setShowModal] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  // venueId = -1 means "Anywhere" (null on server)
  const [form, setForm] = useState({ venueId: -1, day: Day.MONDAY, startTime: '08:00', endTime: '20:00' });

  useEffect(() => {
    fetchAvailabilities();
    api.get<any>('/venues', { params: { page: 1, limit: 50 } }).then((res) => {
      const list = res.data?.list ?? res.data?.data?.list ?? [];
      setVenues(list);
    }).catch(() => {});
  }, []);

  const handleDelete = (id: number) => {
    Alert.alert('Remove Availability', 'Remove this availability slot?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteAvailability(id) },
    ]);
  };

  const handleToggle = (item: CoachAvailability) => {
    updateAvailability(item.id, { isActive: !item.isActive });
  };

  const handleAdd = async () => {
    try {
      // venueId -1 means "Anywhere" (null)
      const payload = { ...form, venueId: form.venueId === -1 ? undefined : form.venueId, isActive: true };
      await addAvailability(payload);
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to add availability');
    }
  };

  const venueOptions = [
    { label: '📍 Anywhere', value: -1 },
    ...venues.map((v) => ({ label: v.name, value: v.id })),
  ];
  const dayOptions = DAYS.map((d) => ({ label: d, value: d }));
  const timeOptions = TIME_OPTIONS.map((t) => ({ label: t, value: t }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>My Availabilities</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={availabilities}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AvailabilityRow
            item={item}
            onToggle={() => handleToggle(item)}
            onDelete={() => handleDelete(item.id)}
            tc={tc}
            isDark={isDark}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchAvailabilities} tintColor="#0B1A3E" />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textHint }]}>No availabilities set yet</Text>
              <TouchableOpacity style={styles.addAvailBtn} onPress={() => setShowModal(true)}>
                <Text style={styles.addAvailBtnText}>Add Availability</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        style={{ flex: 1 }}
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.sheet, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
            <View style={modalStyles.handle} />
            <Text style={[modalStyles.sheetTitle, { color: tc.textPrimary }]}>Add Availability</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <PickerRow label="Venue" options={venueOptions} selected={form.venueId} onSelect={(v) => setForm((f) => ({ ...f, venueId: Number(v) }))} tc={tc} isDark={isDark} />
              <PickerRow label="Day" options={dayOptions} selected={form.day} onSelect={(v) => setForm((f) => ({ ...f, day: v as Day }))} tc={tc} isDark={isDark} />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <PickerRow label="Start" options={timeOptions} selected={form.startTime} onSelect={(v) => setForm((f) => ({ ...f, startTime: String(v) }))} tc={tc} isDark={isDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <PickerRow label="End" options={timeOptions} selected={form.endTime} onSelect={(v) => setForm((f) => ({ ...f, endTime: String(v) }))} tc={tc} isDark={isDark} />
                </View>
              </View>
            </ScrollView>

            <View style={modalStyles.btnRow}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={{ color: tc.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.saveBtn} onPress={handleAdd}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 22, fontWeight: '800' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0B1A3E', alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  addAvailBtn: { backgroundColor: '#0B1A3E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  addAvailBtnText: { color: '#fff', fontWeight: '700' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#888', alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: spacing.lg },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(120,120,120,0.08)' },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#0B1A3E' },
});
