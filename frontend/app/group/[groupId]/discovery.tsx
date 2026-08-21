import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Keeps the group route while delegating to the production discovery workflow,
 * which uses Google Places, Routes, saved places, voting, itinerary finalization,
 * and calendar sync.
 */
export default function GroupDiscoveryScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  if (!groupId) {
    return <Redirect href="/home" />;
  }

  return (
    <Redirect
      href={{
        pathname: '/discovery',
        params: { tripId: groupId, section: 'preferences' },
      }}
    />
  );
}
