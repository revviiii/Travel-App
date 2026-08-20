import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Temporary in-memory Group Itinerary state keyed by groupId.
 *
 * Each group maintains its own independent itinerary.
 * Group A itinerary never appears in Solo itinerary or Group B.
 *
 * TODO: Replace temporary group itinerary state with backend group-scoped persistence.
 * TODO: Persist and synchronize group votes through backend/realtime.
 * TODO: Apply final group voting/approval rules from backend/business logic.
 */

export interface GroupItineraryItem {
  id: string;
  groupId: string;
  placeName: string;
  placeCategory: string;
  placeLocation: string;
  date: string;
  time: string;
  votingEnabled: boolean;
  votingStatus: 'confirmed' | 'voting';
  votes: { interested: number; pass: number };
  /** Tracks the current local user's vote to prevent duplicates */
  currentUserVote: 'interested' | 'pass' | null;
}

interface GroupItineraryContextValue {
  /** Get itinerary items for a specific group */
  getItems: (groupId: string) => GroupItineraryItem[];
  /** Add an itinerary item to a specific group */
  addItem: (item: Omit<GroupItineraryItem, 'id'>) => void;
  /** Cast or change the current user's local vote on an item */
  castVote: (groupId: string, itemId: string, vote: 'interested' | 'pass') => void;
}

const GroupItineraryContext = createContext<GroupItineraryContextValue | null>(null);

let nextItemId = 1;
function generateItemId(): string {
  return `gitinerary_${Date.now()}_${nextItemId++}`;
}

export function GroupItineraryProvider({ children }: { children: ReactNode }) {
  const [itemsByGroup, setItemsByGroup] = useState<Record<string, GroupItineraryItem[]>>({});

  const getItems = useCallback(
    (groupId: string): GroupItineraryItem[] => {
      return itemsByGroup[groupId] ?? [];
    },
    [itemsByGroup],
  );

  const addItem = useCallback((item: Omit<GroupItineraryItem, 'id'>) => {
    const newItem: GroupItineraryItem = { ...item, id: generateItemId() };
    setItemsByGroup((prev) => ({
      ...prev,
      [item.groupId]: [...(prev[item.groupId] ?? []), newItem],
    }));
  }, []);

  const castVote = useCallback(
    (groupId: string, itemId: string, vote: 'interested' | 'pass') => {
      // TODO: Replace local vote counts with backend group-member votes
      setItemsByGroup((prev) => {
        const items = prev[groupId] ?? [];
        const updated = items.map((item) => {
          if (item.id !== itemId) return item;
          if (item.currentUserVote === vote) return item; // no-op if same vote

          const votes = { ...item.votes };

          // Remove previous vote if changing
          if (item.currentUserVote === 'interested') votes.interested--;
          if (item.currentUserVote === 'pass') votes.pass--;

          // Apply new vote
          if (vote === 'interested') votes.interested++;
          if (vote === 'pass') votes.pass++;

          return { ...item, votes, currentUserVote: vote };
        });
        return { ...prev, [groupId]: updated };
      });
    },
    [],
  );

  return (
    <GroupItineraryContext.Provider value={{ getItems, addItem, castVote }}>
      {children}
    </GroupItineraryContext.Provider>
  );
}

export function useGroupItinerary(): GroupItineraryContextValue {
  const context = useContext(GroupItineraryContext);
  if (!context) {
    throw new Error('useGroupItinerary must be used within a GroupItineraryProvider');
  }
  return context;
}
