import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { GroupMemberCard } from '@/components/group/GroupMemberCard';
import { GroupJumpBackCard } from '@/components/group/GroupJumpBackCard';
import { GroupInviteSheet } from '@/components/group/GroupInviteSheet';
import {
  getTrip,
  getTripMembers,
  getTripPlaces,
  type SavedTripPlace,
  type TripMember,
  type TripSummary,
} from '@/lib/api';

function formatPreference(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function GroupDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [showInvite, setShowInvite] = useState(false);
  const [group, setGroup] = useState<TripSummary | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedTripPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [loadedGroup, loadedMembers, loadedPlaces] = await Promise.all([
        getTrip(groupId),
        getTripMembers(groupId),
        getTripPlaces(groupId),
      ]);
      setGroup(loadedGroup);
      setMembers(loadedMembers);
      setSavedPlaces(loadedPlaces);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load this group.');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const groupName = group?.name ?? 'Travel group';
  const hasJumpBackData = savedPlaces.length > 0;
  const canInvite = group?.current_user_role === 'owner' || group?.current_user_role === 'admin';

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    setShowInvite(true);
  };

  const handleCreateNewPlace = () => {
    const path = `/discovery?tripId=${encodeURIComponent(groupId ?? '')}&section=preferences` as RelativePathString;
    router.push(path);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.headerButton}
        >
          {/* TODO: Replace with final Figma Back arrow SVG */}
          <View style={styles.iconPlaceholder} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupName}
        </Text>

        <TouchableOpacity
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share group"
          style={styles.headerButton}
        >
          {/* TODO: Replace with final Figma Share SVG icon */}
          <View style={styles.iconPlaceholder} />
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator color={AutumnColors.primary} />
            <Text style={styles.statusText}>Loading group…</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <TouchableOpacity style={styles.errorCard} onPress={() => void loadGroup()}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        ) : null}

        {/* Jump Back In or Start Your Journey */}
        {!isLoading && !errorMessage && hasJumpBackData ? (
          <>
            <Text style={styles.sectionTitle}>Jump Back In</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jumpBackRow}
            >
              <GroupJumpBackCard
                title={group?.destination_name || groupName}
                attractionCount={savedPlaces.length}
                onPress={() => {
                  const path = `/discovery?tripId=${encodeURIComponent(groupId ?? '')}&section=itinerary` as RelativePathString;
                  router.push(path);
                }}
              />
            </ScrollView>
          </>
        ) : !isLoading && !errorMessage ? (
          <>
            <Text style={styles.sectionTitle}>Start Your Journey</Text>
            {/* Map placeholder for empty group state */}
            {/* TODO: Replace with real map component when maps/API integration is implemented */}
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>MAP PLACEHOLDER</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCreateNewPlace}
                style={styles.addNewOverlay}
                accessibilityRole="button"
                accessibilityLabel="Add New"
              >
                <Text style={styles.addNewOverlayText}>Add New</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* Create New Place CTA */}
        {!isLoading && !errorMessage && hasJumpBackData && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCreateNewPlace}
            accessibilityRole="button"
            accessibilityLabel="Create New Place"
            style={styles.createPlaceCard}
          >
            <View style={styles.createPlaceContent}>
              <Text style={styles.createPlaceTitle}>Create New Place</Text>
              <Text style={styles.createPlaceSubtitle}>
                Create camping with your Friends
              </Text>
            </View>
            {/* TODO: Replace with final Figma Add SVG icon */}
            <View style={styles.addIconCircle}>
              <View style={styles.addIconPlaceholder} />
            </View>
          </TouchableOpacity>
        )}

        {/* See Group Members */}
        <Text style={styles.sectionTitle}>See Group Members</Text>

        {members.map((member) => (
          <View key={member.user_id} style={styles.memberCardWrapper}>
            <GroupMemberCard
              name={member.full_name || `${formatPreference(member.role)} member`}
              preferences={member.preference_keys.map(formatPreference)}
            />
          </View>
        ))}

        {/* Add Member */}
        {canInvite ? <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowInvite(true)}
          accessibilityRole="button"
          accessibilityLabel="Add Member"
          style={styles.addMemberRow}
        >
          <View style={styles.addMemberAvatar}>
            {/* TODO: Replace with final Figma Add Member SVG icon */}
            <View style={styles.addMemberIconPlaceholder} />
          </View>
          <Text style={styles.addMemberText}>Add Member</Text>
          {/* TODO: Replace with final Figma plus SVG icon */}
          <View style={styles.plusIconPlaceholder} />
        </TouchableOpacity> : null}
      </ScrollView>

      {/* Invite Sheet */}
      <GroupInviteSheet
        visible={showInvite}
        groupId={groupId ?? ''}
        groupName={groupName}
        canInvite={canInvite}
        onClose={() => setShowInvite(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AutumnColors.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: AutumnColors.heading,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  iconPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },

  /* Scroll content */
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
  },
  statusText: {
    color: AutumnColors.body,
    fontSize: 13,
  },
  errorCard: {
    backgroundColor: '#FBE9E5',
    borderRadius: 12,
    marginBottom: 16,
    padding: 14,
  },
  errorText: {
    color: '#8A2C1F',
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    color: AutumnColors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },

  /* Section title */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AutumnColors.heading,
    marginBottom: 12,
    marginTop: 8,
  },

  /* Jump Back In */
  jumpBackRow: {
    gap: 12,
    paddingBottom: 16,
  },

  /* Map placeholder for empty state */
  mapPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#EDE9E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapPlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: AutumnColors.body,
  },
  addNewOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: AutumnColors.secondaryAccent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addNewOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Create New Place CTA */
  createPlaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.chipBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  createPlaceContent: {
    flex: 1,
  },
  createPlaceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AutumnColors.heading,
  },
  createPlaceSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: AutumnColors.body,
    marginTop: 2,
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AutumnColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  /* Member cards */
  memberCardWrapper: {
    marginBottom: 10,
  },

  /* Add Member */
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.chipBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    marginTop: 4,
  },
  addMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AutumnColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AutumnColors.body,
  },
  addMemberText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.heading,
  },
  plusIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },
});
