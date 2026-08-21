import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface GroupVoteActionsProps {
  visible: boolean;
  placeName: string;
  currentVote: 'interested' | 'pass' | null;
  onVote: (vote: 'interested' | 'pass') => void;
  onClose: () => void;
}

/**
 * A themed overlay for casting a vote on a Group Itinerary item.
 * Appears after long-pressing a voting-in-progress itinerary card.
 *
 * Provides Interested / Pass actions.
 * Does not cast a vote on long-press alone — the user must explicitly choose.
 *
 * // TODO: Persist and synchronize group votes through backend/realtime
 * // TODO: Replace local vote counts with backend group-member votes
 */
export function GroupVoteActions({
  visible,
  placeName,
  currentVote,
  onVote,
  onClose,
}: GroupVoteActionsProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Vote on this destination</Text>
          <Text style={styles.placeName} numberOfLines={2}>
            {placeName}
          </Text>

          {/* Vote actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onVote('interested')}
              accessibilityRole="button"
              accessibilityLabel="Vote interested"
              style={[
                styles.voteButton,
                styles.interestedButton,
                currentVote === 'interested' && styles.voteButtonActive,
              ]}
            >
              {/* TODO: Replace with final Figma Interested/Like SVG icon */}
              <View style={styles.voteIconPlaceholder} />
              <Text
                style={[
                  styles.voteText,
                  styles.interestedText,
                  currentVote === 'interested' && styles.voteTextActive,
                ]}
              >
                Interested
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onVote('pass')}
              accessibilityRole="button"
              accessibilityLabel="Vote pass"
              style={[
                styles.voteButton,
                styles.passButton,
                currentVote === 'pass' && styles.passButtonActive,
              ]}
            >
              {/* TODO: Replace with final Figma Pass/No SVG icon */}
              <View style={styles.voteIconPlaceholder} />
              <Text
                style={[
                  styles.voteText,
                  styles.passText,
                  currentVote === 'pass' && styles.passTextActive,
                ]}
              >
                Pass
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel voting"
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: AutumnColors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AutumnColors.heading,
    marginBottom: 6,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  interestedButton: {
    backgroundColor: AutumnColors.chipBackground,
    borderColor: AutumnColors.secondaryAccent,
  },
  passButton: {
    backgroundColor: AutumnColors.chipBackground,
    borderColor: AutumnColors.chipBorder,
  },
  voteButtonActive: {
    backgroundColor: AutumnColors.secondaryAccent,
    borderColor: AutumnColors.secondaryAccent,
  },
  passButtonActive: {
    backgroundColor: AutumnColors.primary,
    borderColor: AutumnColors.primary,
  },
  voteIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },
  voteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  interestedText: {
    color: AutumnColors.secondaryAccent,
  },
  passText: {
    color: AutumnColors.chipText,
  },
  voteTextActive: {
    color: '#FFFFFF',
  },
  passTextActive: {
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.body,
  },
});
