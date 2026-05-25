import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Team } from '../types/Team';
import {
  clearTeam as clearTeamStorage,
  loadTeam,
  saveTeam as saveTeamStorage,
} from '../storage/team';
import { getCurrentUser } from '../services/authService';
import { saveTeamToFirestore } from '../services/firestoreService';

type TeamContextValue = {
  team: Team | null;
  loading: boolean;
  saveTeam: (team: Team) => Promise<void>;
  clearTeam: () => Promise<void>;
};

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadTeam();
        if (!cancelled) setTeam(stored);
      } catch {
        if (!cancelled) setTeam(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveTeam = useCallback(async (next: Team) => {
    await saveTeamStorage(next);
    setTeam(next);

    // Auto-mirror to Firestore when signed in. Fire-and-forget: the local
    // save above is the source of truth, so a cloud failure must not surface.
    if (getCurrentUser()) {
      saveTeamToFirestore(next).catch((err) => {
        console.warn('[TeamContext] Cloud team mirror failed:', err);
      });
    }
  }, []);

  const clearTeam = useCallback(async () => {
    await clearTeamStorage();
    setTeam(null);
  }, []);

  return (
    <TeamContext.Provider value={{ team, loading, saveTeam, clearTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within a TeamProvider');
  return ctx;
}
