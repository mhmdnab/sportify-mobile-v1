import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing, radius } from '../../../theme/spacing';
import { useTranslation } from 'react-i18next';

interface FilterOption {
  id: number;
  name: string;
}

interface FilterBottomSheetProps {
  title: string;
  options: FilterOption[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export const FilterBottomSheet = forwardRef<BottomSheet, FilterBottomSheetProps>(
  ({ title, options, selectedId, onSelect }, ref) => {
    const { t } = useTranslation();
    const snapPoints = useMemo(() => ['50%'], []);

    const renderBackdrop = useCallback(
      (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {selectedId && (
            <TouchableOpacity onPress={() => onSelect(null)}>
              <Text style={styles.clear}>{t('explore.clear')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelect(item.id)}
              style={[styles.option, selectedId === item.id && styles.selectedOption]}
            >
              <Text
                style={[styles.optionText, selectedId === item.id && styles.selectedOptionText]}
              >
                {item.name}
              </Text>
              {selectedId === item.id && (
                <Ionicons name="checkmark" size={20} color={colors.navy} />
              )}
            </TouchableOpacity>
          )}
        />
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    backgroundColor: colors.border,
    width: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clear: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedOption: {
    backgroundColor: colors.surface,
    marginHorizontal: -spacing.screenPadding,
    paddingHorizontal: spacing.screenPadding,
    borderRadius: radius.input,
  },
  optionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  selectedOptionText: {
    color: colors.navy,
    fontWeight: '600',
  },
});
