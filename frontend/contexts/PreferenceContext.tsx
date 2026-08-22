import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { normalizePreferenceIds } from '@/constants/preferences';

/**
 * Temporary in-memory preference state for the current session.
 *
 * This context stores the user's selected travel preferences reactively
 * so both the Preferences screen and Discovery screen can share the same data.
 *
 * The API-backed preference screens hydrate this context so recommendations
 * react immediately after a saved preference change.
 * This context will eventually be hydrated from the authenticated user's backend profile
 * and synced back on changes.
 */

interface PreferenceContextValue {
  /** The set of currently selected preference IDs */
  selectedPreferences: Set<string>;
  /** Toggle a preference without applying an editing limit. */
  togglePreference: (id: string) => void;
  /** Replace the current preferences. */
  setPreferences: (ids: Iterable<string>) => void;
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

export function PreferenceProvider({ children }: { children: ReactNode }) {
  const [selectedPreferences, setSelectedPreferences] = useState<Set<string>>(new Set());

  const togglePreference = useCallback((id: string) => {
    const [normalizedId] = normalizePreferenceIds([id]);
    if (!normalizedId) return;
    setSelectedPreferences((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedId)) {
        next.delete(normalizedId);
      } else {
        next.add(normalizedId);
      }
      return next;
    });
  }, []);

  const setPreferences = useCallback((ids: Iterable<string>) => {
    setSelectedPreferences(new Set(normalizePreferenceIds(ids)));
  }, []);

  return (
    <PreferenceContext.Provider
      value={{
        selectedPreferences,
        togglePreference,
        setPreferences,
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
