import { useState } from 'react';
import { Modal, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AutumnColors } from '@/constants/colors';

interface PlaceInfo {
  name: string;
  category: string;
  location: string;
}

interface GroupSchedulePanelProps {
  visible: boolean;
  place: PlaceInfo | null;
  onClose: () => void;
  onAdd: (data: {
    date: string;
    time: string;
    votingEnabled: boolean;
  }) => void;
}

/**
 * A themed modal for scheduling a place into the Group Itinerary.
 * Shows place preview, native date/time pickers, Group Voting toggle,
 * and Add to Itinerary CTA.
 *
 * Date and time are stored as proper Date objects internally and
 * formatted for display/submission separately.
 *
 * // TODO: Replace temporary group itinerary state with backend group-scoped persistence
 */
export function GroupSchedulePanel({ visible, place, onClose, onAdd }: GroupSchedulePanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [votingEnabled, setVotingEnabled] = useState(false);

  // Picker visibility (Android shows as a dialog, so we toggle visibility)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const canAdd = selectedDate !== null && selectedTime !== null;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    // On Android, dismissal fires with type 'dismissed' — don't update state
    if (_event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    setShowDatePicker(Platform.OS === 'ios'); // iOS stays open until explicit close
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (_event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    setShowTimePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleAdd = () => {
    if (!canAdd || !selectedDate || !selectedTime) return;
    onAdd({
      date: selectedDate.toISOString().split('T')[0],
      time: formatTime(selectedTime),
      votingEnabled,
    });
    // Reset for next use
    setSelectedDate(null);
    setSelectedTime(null);
    setVotingEnabled(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setVotingEnabled(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    onClose();
  };

  if (!place) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Close control */}
          <TouchableOpacity
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close scheduling"
            style={styles.closeButton}
          >
            {/* TODO: Replace with final Figma Close/Cancel SVG */}
            <View style={styles.closeIconPlaceholder} />
          </TouchableOpacity>

          {/* Place preview */}
          <View style={styles.placePreview}>
            {/* TODO: Replace with actual place image from API */}
            <View style={styles.placeImage} />
            <View style={styles.placeInfo}>
              <Text style={styles.placeName} numberOfLines={1}>
                {place.name}
              </Text>
              <Text style={styles.placeLocation} numberOfLines={1}>
                {place.location}
              </Text>
            </View>
          </View>

          {/* Select Date */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Select date"
            style={styles.controlRow}
            onPress={() => setShowDatePicker(true)}
          >
            {/* TODO: Replace with final Figma calendar SVG icon */}
            <View style={styles.controlIcon} />
            <Text style={[styles.controlLabel, selectedDate && styles.controlLabelActive]}>
              {selectedDate ? formatDate(selectedDate) : 'Select Date'}
            </Text>
            {/* TODO: Replace with final Figma chevron SVG */}
            <View style={styles.chevronPlaceholder} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Select Time */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Select time"
            style={styles.controlRow}
            onPress={() => setShowTimePicker(true)}
          >
            {/* TODO: Replace with final Figma clock SVG icon */}
            <View style={styles.controlIcon} />
            <Text style={[styles.controlLabel, selectedTime && styles.controlLabelActive]}>
              {selectedTime ? formatTime(selectedTime) : 'Select Time'}
            </Text>
            {/* TODO: Replace with final Figma chevron SVG */}
            <View style={styles.chevronPlaceholder} />
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime ?? new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}

          {/* Add to Itinerary CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAdd}
            disabled={!canAdd}
            accessibilityRole="button"
            accessibilityLabel="Add to Itinerary"
            style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
          >
            <Text style={styles.addButtonText}>Add to Itinerary</Text>
          </TouchableOpacity>

          {/* Group Voting toggle */}
          <View style={styles.votingRow}>
            <View style={styles.votingInfo}>
              <Text style={styles.votingTitle}>Group Voting</Text>
              <Text style={styles.votingDescription}>
                Let group members vote on this destination.
              </Text>
            </View>
            <Switch
              value={votingEnabled}
              onValueChange={setVotingEnabled}
              trackColor={{ false: AutumnColors.chipBorder, true: AutumnColors.secondaryAccent }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Enable group voting"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  panel: {
    width: '100%',
    backgroundColor: AutumnColors.background,
    borderRadius: 20,
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  closeIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },

  /* Place preview */
  placePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  placeImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: AutumnColors.heading,
  },
  placeInfo: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: AutumnColors.heading,
  },
  placeLocation: {
    fontSize: 13,
    fontWeight: '400',
    color: AutumnColors.body,
  },

  /* Controls */
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 12,
  },
  controlIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },
  controlLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.body,
  },
  controlLabelActive: {
    color: AutumnColors.chipText,
  },
  chevronPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: AutumnColors.chipBorder,
  },

  /* Add button */
  addButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: AutumnColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Voting */
  votingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  votingInfo: {
    flex: 1,
  },
  votingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AutumnColors.heading,
  },
  votingDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: AutumnColors.body,
    lineHeight: 16,
    marginTop: 2,
  },
});
