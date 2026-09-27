import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { fetchPlan, fetchProposals } from './api';
import type { ProposalSummary, TripPlan, TripRequest } from './types';

export type TabKey = 'wizard' | 'results' | 'budget' | 'itinerary';

export function defaultRequest(): TripRequest {
  return {
    origin: 'TLV',
    destination: null,
    destinationHints: [],
    departDate: null,
    returnDate: null,
    flexibleDates: true,
    targetMonth: null,
    nights: 5,
    partyType: 'couple',
    adults: 2,
    children: [],
    vibe: 'mixed',
    transport: 'mixed',
    budgetTotal: 12500,
    currency: 'ILS',
    specialRequests: '',
    language: 'he',
  };
}

interface StoreValue {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  request: TripRequest;
  setRequest: React.Dispatch<React.SetStateAction<TripRequest>>;
  proposals: ProposalSummary[];
  plan: TripPlan | null;
  selectedProposalId: string | null;
  loadingProposals: boolean;
  loadingPlan: boolean;
  error: string | null;
  currency: 'ILS' | 'USD';
  toggleCurrency: () => void;
  runSearch: () => Promise<void>;
  choose: (proposal: ProposalSummary) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<TabKey>('wizard');
  const [request, setRequest] = useState<TripRequest>(defaultRequest());
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = (request.currency === 'USD' ? 'USD' : 'ILS') as 'ILS' | 'USD';

  const toggleCurrency = useCallback(() => {
    setRequest((r) => ({ ...r, currency: r.currency === 'ILS' ? 'USD' : 'ILS' }));
  }, []);

  const runSearch = useCallback(async () => {
    setLoadingProposals(true);
    setError(null);
    try {
      const { proposals } = await fetchProposals(request);
      setProposals(proposals);
      setTab('results');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingProposals(false);
    }
  }, [request]);

  const choose = useCallback(
    async (proposal: ProposalSummary) => {
      setSelectedProposalId(proposal.id);
      setLoadingPlan(true);
      setError(null);
      setTab('budget');
      try {
        const planned = await fetchPlan({ ...request, destination: proposal.destination });
        setPlan(planned);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoadingPlan(false);
      }
    },
    [request],
  );

  const value = useMemo<StoreValue>(
    () => ({
      tab,
      setTab,
      request,
      setRequest,
      proposals,
      plan,
      selectedProposalId,
      loadingProposals,
      loadingPlan,
      error,
      currency,
      toggleCurrency,
      runSearch,
      choose,
    }),
    [tab, request, proposals, plan, selectedProposalId, loadingProposals, loadingPlan, error, currency, toggleCurrency, runSearch, choose],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// ── formatting helpers ──
export function money(amount: number, currency: string): string {
  const symbol = currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : '';
  const rounded = Math.round(amount).toLocaleString('en-US');
  return currency === 'ILS' ? `${symbol}${rounded}` : `${symbol}${rounded}`;
}
