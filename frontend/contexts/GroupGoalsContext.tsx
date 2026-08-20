import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Temporary in-memory Group Goals state keyed by groupId.
 *
 * Each group maintains its own independent goal list.
 * Group A goals never appear in Solo Goals or Group B goals.
 *
 * TODO: Replace temporary Group Goals state with backend group-scoped persistence.
 * TODO: Sync Group Goals across members through backend/realtime.
 */

export interface GroupGoal {
  id: string;
  text: string;
}

interface GroupGoalsContextValue {
  /** Get goals for a specific group */
  getGoals: (groupId: string) => GroupGoal[];
  /** Add a goal to a specific group */
  addGoal: (groupId: string, text: string) => void;
  /** Remove a goal from a specific group by goalId */
  removeGoal: (groupId: string, goalId: string) => void;
}

const GroupGoalsContext = createContext<GroupGoalsContextValue | null>(null);

let nextGroupGoalId = 1;
function generateGroupGoalId(): string {
  return `ggoal_${Date.now()}_${nextGroupGoalId++}`;
}

export function GroupGoalsProvider({ children }: { children: ReactNode }) {
  const [goalsByGroup, setGoalsByGroup] = useState<Record<string, GroupGoal[]>>({});

  const getGoals = useCallback(
    (groupId: string): GroupGoal[] => {
      return goalsByGroup[groupId] ?? [];
    },
    [goalsByGroup],
  );

  const addGoal = useCallback((groupId: string, text: string) => {
    const goal: GroupGoal = { id: generateGroupGoalId(), text };
    setGoalsByGroup((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] ?? []), goal],
    }));
  }, []);

  const removeGoal = useCallback((groupId: string, goalId: string) => {
    setGoalsByGroup((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).filter((g) => g.id !== goalId),
    }));
  }, []);

  return (
    <GroupGoalsContext.Provider value={{ getGoals, addGoal, removeGoal }}>
      {children}
    </GroupGoalsContext.Provider>
  );
}

export function useGroupGoals(): GroupGoalsContextValue {
  const context = useContext(GroupGoalsContext);
  if (!context) {
    throw new Error('useGroupGoals must be used within a GroupGoalsProvider');
  }
  return context;
}
