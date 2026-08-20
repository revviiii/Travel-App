import { Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface GroupInviteSheetProps {
  visible: boolean;
  groupName: string;
  onClose: () => void;
}

/**
 * A bottom-sheet modal for inviting friends to a group.
 * Uses React Native's built-in Share API for frontend testing.
 *
 * // TODO: Generate group invitation/deep link from backend
 * // TODO: Replace temporary invite text with real joinable group invitation link
 */
export function GroupInviteSheet({ visible, groupName, onClose }: GroupInviteSheetProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my travel group "${groupName}" on Ramyl!\n\n[GROUP INVITE LINK PLACEHOLDER]`,
      });
    } catch {
      // User cancelled or share failed — silently ignore
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Drag handle visual */}
          <View style={styles.handleBar} />

          <Text style={styles.title}>Invite friends to your Group</Text>

          {/* Share button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share group invitation"
            style={styles.shareButton}
          >
            {/* TODO: Replace with final Figma Share SVG */}
            <View style={styles.shareIconPlaceholder} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or</Text>

          {/* Placeholder invite link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>GROUP INVITE LINK PLACEHOLDER</Text>
          </View>

          {/* Close */}
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>Close</Text>
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AutumnColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AutumnColors.chipBorder,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: AutumnColors.heading,
    textAlign: 'center',
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AutumnColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  shareIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  shareText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orText: {
    fontSize: 14,
    fontWeight: '400',
    color: AutumnColors.body,
    marginVertical: 14,
  },
  linkContainer: {
    width: '100%',
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '400',
    color: AutumnColors.primary,
    textDecorationLine: 'underline',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.body,
  },
});
