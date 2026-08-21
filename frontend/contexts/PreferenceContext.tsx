import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Temporary in-memory preference state for the current session.
 *
 * This context stores the user's selected travel preferences reactively
 * so both the Preferences screen and Discovery screen can share the same data.
 *
 * Maximum of 4 preferences may be selected at any time.
 *
 * TODO: Replace temporary preference state with persisted user profile preferences.
 * This context will eventually be hydrated from the authenticated user's backend profile
 * and synced back on changes.
 */

const MAX_PREFERENCES = 4;

interface PreferenceContextValue {
  /** The set of currently selected preference IDs */
  selectedPreferences: Set<string>;
  /** Toggle a preference. If already selected, deselects. If not selected and under max, selects. */
  togglePreference: (id: string) => void;
  /** Replace the current preferences, capped at the configured maximum. */
  setPreferences: (ids: Iterable<string>) => void;
  /** Whether the maximum number of preferences has been reached */
  isMaxReached: boolean;
  /** Maximum allowed selections */
  maxPreferences: number;
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

export function PreferenceProvider({ children }: { children: ReactNode }) {
  const [selectedPreferences, setSelectedPreferences] = useState<Set<string>>(new Set());

  const togglePreference = useCallback((id: string) => {
    setSelectedPreferences((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Always allow deselection
        next.delete(id);
      } else if (next.size < MAX_PREFERENCES) {
        // Only allow selection if under the maximum
        next.add(id);
      }
      // If at max and trying to add, do nothing (no-op)
      return next;
    });
  }, []);

  const setPreferences = useCallback((ids: Iterable<string>) => {
    setSelectedPreferences(new Set(Array.from(ids).slice(0, MAX_PREFERENCES)));
  }, []);

  const isMaxReached = selectedPreferences.size >= MAX_PREFERENCES;

  return (
    <PreferenceContext.Provider
      value={{
        selectedPreferences,
        togglePreference,
        setPreferences,
        isMaxReached,
        maxPreferences: MAX_PREFERENCES,
      }}
    >
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences(): PreferenceContextValue {
  const context = useContext(PreferenceContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferenceProvider');
  }
  return context;
}
