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
      const stored = await loadTeam();
      if (!cancelled) {
        setTeam(stored);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveTeam = useCallback(async (next: Team) => {
    await saveTeamStorage(next);
    setTeam(next);
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
