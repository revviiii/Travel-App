import { useState } from 'react';
import {
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

/**
 * Temporary mock member data for layout testing.
 * TODO: Fetch/sync accepted group members from backend
 * TODO: Replace with real group member/profile data
 */
const MOCK_MEMBERS = [
  { id: 'm1', name: 'Member name', preferences: ['Road Trips', 'Art Gallery'] },
  { id: 'm2', name: 'Member name', preferences: ['Road Trips', 'Art Gallery'] },
  { id: 'm3', name: 'Member name', preferences: ['Road Trips', 'Art Gallery'] },
];

/**
 * Temporary mock Jump Back In data for layout testing.
 * TODO: Replace with group itinerary/recommendation API data
 */
const MOCK_JUMP_BACK = [
  { id: 'jb1', title: 'Nature', attractionCount: 2 },
  { id: 'jb2', title: 'Safari', attractionCount: 5 },
];

export default function GroupDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [showInvite, setShowInvite] = useState(false);

  // TODO: Fetch group data from backend using groupId
  // TODO: Replace temporary group ID with backend-generated groupId
  const groupName = 'Group Name';

  // Determine whether the group has saved data (for demo: use mock data presence)
  const hasJumpBackData = MOCK_JUMP_BACK.length > 0;

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    setShowInvite(true);
  };

  const handleCreateNewPlace = () => {
    // Navigate to Group Discovery
    const path = `/group/${groupId}/discovery` as RelativePathString;
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
        {/* Jump Back In or Start Your Journey */}
        {hasJumpBackData ? (
          <>
            <Text style={styles.sectionTitle}>Jump Back In</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jumpBackRow}
            >
              {MOCK_JUMP_BACK.map((item) => (
                <GroupJumpBackCard
                  key={item.id}
                  title={item.title}
                  attractionCount={item.attractionCount}
                />
              ))}
            </ScrollView>
          </>
        ) : (
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
        )}

        {/* Create New Place CTA */}
        {hasJumpBackData && (
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

        {MOCK_MEMBERS.map((member) => (
          <View key={member.id} style={styles.memberCardWrapper}>
            <GroupMemberCard
              name={member.name}
              preferences={member.preferences}
            />
          </View>
        ))}

        {/* Add Member */}
        <TouchableOpacity
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
        </TouchableOpacity>
      </ScrollView>

      {/* Invite Sheet */}
      <GroupInviteSheet
        visible={showInvite}
        groupName={groupName}
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
