import { StyleSheet, Text, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';
import type { GroupItineraryItem } from '@/contexts/GroupItineraryContext';
import { GroupItineraryCard } from './GroupItineraryCard';

interface GroupTimelineProps {
  items: GroupItineraryItem[];
  onLongPressItem: (itemId: string) => void;
}

/**
 * A vertical timeline rendering Group Itinerary items chronologically.
 * Each item has a time label on the left, a vertical connector with a status node,
 * and the itinerary card on the right.
 *
 * Timeline nodes:
 * - Olive green = confirmed
 * - Warm gold = voting in progress
 *
 * // TODO: Implement calendar integration
 */
export function GroupTimeline({ items, onLongPressItem }: GroupTimelineProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isVoting = item.votingStatus === 'voting';

        return (
          <View key={item.id} style={styles.row}>
            {/* Time label */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>{item.time}</Text>
            </View>

            {/* Timeline connector + node */}
            <View style={styles.connectorColumn}>
              <View
                style={[
                  styles.node,
                  isVoting ? styles.nodeVoting : styles.nodeConfirmed,
                ]}
              />
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    isVoting ? styles.connectorVoting : styles.connectorConfirmed,
                  ]}
                />
              )}
            </View>

            {/* Card */}
            <View style={styles.cardColumn}>
              <GroupItineraryCard
                item={item}
                onLongPress={() => onLongPressItem(item.id)}
              />
            </View>
          </View>
        );
      })}

      {/* Sync to Calendar is rendered separately outside the timeline */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  /* Time column */
  timeColumn: {
    width: 56,
    alignItems: 'flex-end',
    paddingRight: 10,
    paddingTop: 14,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: AutumnColors.body,
  },

  /* Connector column */
  connectorColumn: {
    width: 20,
    alignItems: 'center',
    paddingTop: 14,
  },
  node: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nodeConfirmed: {
    backgroundColor: AutumnColors.secondaryAccent,
  },
  nodeVoting: {
    backgroundColor: AutumnColors.goldenAccent,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 40,
    marginTop: 4,
  },
  connectorConfirmed: {
    backgroundColor: AutumnColors.secondaryAccent,
  },
  connectorVoting: {
    backgroundColor: AutumnColors.goldenAccent,
  },

  /* Card column */
  cardColumn: {
    flex: 1,
    paddingLeft: 8,
  },
});
