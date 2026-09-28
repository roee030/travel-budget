import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { fetchPlan, fetchProposals } from './api';
import { repaceDay, swapPlanItem } from './mock/engine';
import type { ProposalSummary, TripPlan, TripRequest } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  swapItem: (dayIndex: number, itemIndex: number) => void;
  repace: (dayIndex: number, mode: 'relax' | 'intense') => void;
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
    setTab('results');
    try {
      const [{ proposals }] = await Promise.all([fetchProposals(request), sleep(650)]);
      setProposals(proposals);
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
        const [planned] = await Promise.all([
          fetchPlan({ ...request, destination: proposal.destination }),
          sleep(800),
        ]);
        setPlan(planned);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoadingPlan(false);
      }
    },
    [request],
  );

  const swapItem = useCallback((dayIndex: number, itemIndex: number) => {
    setPlan((p) => (p ? swapPlanItem(p, dayIndex, itemIndex) : p));
  }, []);

  const repace = useCallback((dayIndex: number, mode: 'relax' | 'intense') => {
    setPlan((p) => (p ? repaceDay(p, dayIndex, mode) : p));
  }, []);

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
      swapItem,
      repace,
    }),
    [tab, request, proposals, plan, selectedProposalId, loadingProposals, loadingPlan, error, currency, toggleCurrency, runSearch, choose, swapItem, repace],
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
