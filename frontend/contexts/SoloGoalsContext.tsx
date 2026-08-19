import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Temporary in-memory Solo Goals state for the current session.
 *
 * This context stores the individual user's travel goals reactively
 * so both Home Goals and Discovery Goals share the same source of truth.
 *
 * Each goal has a unique `id` and `text` to make future backend hydration straightforward.
 *
 * TODO: Replace/hydrate Solo Goals state with persisted authenticated-user goals from backend.
 * TODO: Implement group-scoped goals separately when Group mode is added.
 */

export interface SoloGoal {
  id: string;
  text: string;
}

interface SoloGoalsContextValue {
  /** Current list of Solo travel goals */
  goals: SoloGoal[];
  /** Add a new goal. Text should be pre-trimmed and validated (max 100 chars). */
  addGoal: (text: string) => void;
  /** Remove a goal by its id */
  removeGoal: (id: string) => void;
}

const SoloGoalsContext = createContext<SoloGoalsContextValue | null>(null);

/** Simple incrementing ID generator — no dependency needed */
let nextId = 1;
function generateId(): string {
  return `goal_${Date.now()}_${nextId++}`;
}

export function SoloGoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<SoloGoal[]>([]);

  const addGoal = useCallback((text: string) => {
    const goal: SoloGoal = { id: generateId(), text };
    setGoals((prev) => [...prev, goal]);
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return (
    <SoloGoalsContext.Provider value={{ goals, addGoal, removeGoal }}>
      {children}
    </SoloGoalsContext.Provider>
  );
}

export function useSoloGoals(): SoloGoalsContextValue {
  const context = useContext(SoloGoalsContext);
  if (!context) {
    throw new Error('useSoloGoals must be used within a SoloGoalsProvider');
  }
  return context;
}
