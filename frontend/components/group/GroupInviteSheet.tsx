import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AutumnColors } from '@/constants/colors';
import { createTripInvitation, getTripInvitationShareUrl } from '@/lib/api';

interface GroupInviteSheetProps {
  visible: boolean;
  groupId: string;
  groupName: string;
  canInvite: boolean;
  onClose: () => void;
}

/**
 * A bottom-sheet modal for inviting friends to a group.
 * Creates a real, seven-day backend invitation and shares its deep link.
 */
export function GroupInviteSheet({
  visible,
  groupId,
  groupName,
  canInvite,
  onClose,
}: GroupInviteSheetProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ensureInviteLink = useCallback(async () => {
    if (inviteLink) return inviteLink;
    if (!canInvite) {
      throw new Error('Only the group owner or an admin can invite members.');
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const invitation = await createTripInvitation(groupId);
      const generatedLink = getTripInvitationShareUrl(invitation.invite_token);
      setInviteLink(generatedLink);
      return generatedLink;
    } finally {
      setIsLoading(false);
    }
  }, [canInvite, groupId, inviteLink]);

  useEffect(() => {
    if (!visible) {
      setInviteLink(null);
      setErrorMessage(null);
      return;
    }

    if (canInvite) {
      void ensureInviteLink().catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to create invitation.');
      });
    }
  }, [canInvite, ensureInviteLink, visible]);

  const handleShare = async () => {
    try {
      const link = await ensureInviteLink();
      await Share.share({
        title: `Join ${groupName} on Pinara`,
        message: `Join my travel group "${groupName}"!\n\n${link}`,
        ...(Platform.OS === 'ios' ? { url: link } : {}),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create invitation.');
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
            disabled={isLoading || !canInvite}
          >
            <Ionicons color="#FFFFFF" name="share-social-outline" size={18} />
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.shareText}>
                {canInvite ? 'Share Invitation' : 'Invite unavailable'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>or</Text>

          <View style={styles.linkContainer}>
            {inviteLink ? (
              <Text style={styles.linkText} selectable>{inviteLink}</Text>
            ) : (
              <View style={styles.linkLoadingRow}>
                <ActivityIndicator color={AutumnColors.primary} size="small" />
                <Text style={styles.linkLoadingText}>Creating secure link…</Text>
              </View>
            )}
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

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
  linkLoadingRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkLoadingText: {
    color: AutumnColors.body,
    fontSize: 13,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#A23A2A',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.body,
  },
});
