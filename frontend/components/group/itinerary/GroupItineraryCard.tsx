import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';
import type { GroupItineraryItem } from '@/contexts/GroupItineraryContext';

interface GroupItineraryCardProps {
  item: GroupItineraryItem;
  onLongPress: () => void;
}

/**
 * An individual Group Itinerary card showing place info, time, voting status,
 * and member vote indicators.
 *
 * Supports long-press to reveal voting actions for items with votingStatus === 'voting'.
 *
 * // TODO: Replace with real place data/image from recommendation API
 * // TODO: Connect View Route to maps/directions API
 */
export function GroupItineraryCard({ item, onLongPress }: GroupItineraryCardProps) {
  const isVoting = item.votingStatus === 'voting';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={isVoting ? onLongPress : undefined}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={`${item.placeName}, ${item.time}`}
      accessibilityHint={isVoting ? 'Long press to vote' : undefined}
    >
      <View style={styles.card}>
        {/* Place image placeholder */}
        {/* TODO: Replace with actual place image from API */}
        <View style={styles.imagePlaceholder} />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">
            {item.placeName}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {item.placeCategory}
          </Text>

          {/* Time + status row */}
          <View style={styles.metaRow}>
            <View style={[styles.statusDot, isVoting ? styles.statusVoting : styles.statusConfirmed]} />
            <Text style={styles.timeText}>
              {item.time}
            </Text>
            <Text style={styles.separator}>|</Text>

            {/* Member vote indicators */}
            {isVoting && (
              <View style={styles.voterRow}>
                {/* TODO: Replace with real member avatars who voted */}
                <View style={styles.voterDot} />
                <View style={styles.voterDot} />
                <View style={styles.voterDot} />
              </View>
            )}
          </View>

          {/* Status label */}
          <Text style={[styles.statusText, isVoting ? styles.statusTextVoting : styles.statusTextConfirmed]}>
            {isVoting ? 'Voting in progress' : 'Confirmed'}
          </Text>

          {/* Vote counts for voting items */}
          {isVoting && (
            <Text style={styles.voteCount}>
              {item.votes.interested} interested · {item.votes.pass} pass
            </Text>
          )}
        </View>

        {/* View Route — available for both confirmed and voting items */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="View Route"
          style={styles.viewRouteButton}
        >
          {/* TODO: Connect View Route to maps/directions API */}
          <Text style={styles.viewRouteText}>View Route</Text>
          {/* TODO: Replace with final Figma arrow SVG */}
          <View style={styles.routeArrowPlaceholder} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.chipBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    padding: 12,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  imagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: AutumnColors.chipBorder,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: AutumnColors.heading,
  },
  category: {
    fontSize: 11,
    fontWeight: '400',
    color: AutumnColors.body,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: AutumnColors.secondaryAccent,
  },
  statusVoting: {
    backgroundColor: AutumnColors.goldenAccent,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  separator: {
    fontSize: 11,
    color: AutumnColors.chipBorder,
  },
  voterRow: {
    flexDirection: 'row',
    gap: -4,
  },
  voterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: AutumnColors.chipBorder,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  statusTextConfirmed: {
    color: AutumnColors.secondaryAccent,
  },
  statusTextVoting: {
    color: AutumnColors.goldenAccent,
  },
  voteCount: {
    fontSize: 10,
    fontWeight: '400',
    color: AutumnColors.body,
    marginTop: 1,
  },
  viewRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewRouteText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  routeArrowPlaceholder: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
