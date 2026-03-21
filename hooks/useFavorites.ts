import { useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from './useAuth';

interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  image?: string;
}

interface FavoriteEntry {
  id: number;
  productId: number;
  product: FavoriteProduct;
}

export function useFavorites() {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);

  const fetchFavorites = useCallback(async () => {
    if (!isClient) return;
    try {
      const data = await api.getFavorites();
      const list = Array.isArray(data) ? data : [];
      setFavorites(list);
      setFavoriteIds(new Set(list.map((f: FavoriteEntry) => f.productId)));
    } catch {}
  }, [isClient]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (productId: number) => {
    if (!isClient) return;
    const isFav = favoriteIds.has(productId);
    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      if (isFav) {
        await api.removeFavorite(productId);
      } else {
        await api.addFavorite(productId);
      }
      fetchFavorites();
    } catch {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(productId);
        else next.delete(productId);
        return next;
      });
    }
  }, [isClient, favoriteIds, fetchFavorites]);

  return { favoriteIds, favorites, toggleFavorite, isFavorite: (id: number) => favoriteIds.has(id) };
}
