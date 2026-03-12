'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { listMyLeavesApi, listPendingApprovalsApi } from '@/lib/leaveApi';

interface NavCountsContextType {
  pendingTeamCount: number;
  pendingMyCount: number;
  refresh: () => void;
}

const NavCountsContext = createContext<NavCountsContextType>({
  pendingTeamCount: 0,
  pendingMyCount: 0,
  refresh: () => {},
});

export function NavCountsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pendingTeamCount, setPendingTeamCount] = useState(0);
  const [pendingMyCount, setPendingMyCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user) return;

    try {
      const myRes = await listMyLeavesApi({ status: 'pending', limit: 1 });
      setPendingMyCount(myRes.meta?.total ?? 0);
    } catch {
      // ignore
    }

    if (['manager', 'hr', 'admin'].includes(user.role)) {
      try {
        const teamRes = await listPendingApprovalsApi({ status: 'pending', limit: 1 });
        setPendingTeamCount(teamRes.meta?.total ?? 0);
      } catch {
        // ignore
      }
    }
  }, [user?._id, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <NavCountsContext.Provider value={{ pendingTeamCount, pendingMyCount, refresh: fetchCounts }}>
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
