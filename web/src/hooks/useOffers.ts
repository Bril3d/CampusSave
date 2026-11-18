import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from '../services/api';
import type { Commerce, Offer } from '../types';

export function useOffers(filters: {
  search: string;
  category: string;
  commerceId: string;
  maxPrice: string;
}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [offersRes, commercesRes] = await Promise.all([
        catalogApi.getOffers(filters),
        catalogApi.getCommerces(false),
      ]);
      setOffers(offersRes.offers);
      setCommerces(commercesRes.commerces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les offres.');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.category, filters.commerceId, filters.maxPrice]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { offers, commerces, loading, error, refresh };
}
