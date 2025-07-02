import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for optimized data fetching with caching and debouncing
 */
export const useOptimizedFetch = (fetchFn, dependencies = [], options = {}) => {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    refetchOnFocus = true,
    refetchOnReconnect = true,
    debounceMs = 300,
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const cacheRef = useRef(new Map());

  const getCacheKey = useCallback(() => {
    return JSON.stringify(dependencies);
  }, [dependencies]);

  const shouldRefetch = useCallback(() => {
    if (!enabled) return false;
    
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    
    if (!cached) return true;
    
    const now = Date.now();
    return (now - cached.timestamp) > cacheTime;
  }, [enabled, getCacheKey, cacheTime]);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled && !force) return;

    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);

    // Return cached data if still valid and not forcing
    if (!force && cached && !shouldRefetch()) {
      setData(cached.data);
      setError(null);
      return cached.data;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(abortControllerRef.current.signal);
      
      // Cache the result
      cacheRef.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      setData(result);
      setLastFetch(Date.now());
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        console.error('Fetch error:', err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchFn, getCacheKey, shouldRefetch]);

  const debouncedFetch = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fetchData(...args);
    }, debounceMs);
  }, [fetchData, debounceMs]);

  // Initial fetch
  useEffect(() => {
    if (shouldRefetch()) {
      fetchData();
    }
  }, [fetchData, shouldRefetch]);

  // Focus refetch
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      if (shouldRefetch()) {
        debouncedFetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, shouldRefetch, debouncedFetch]);

  // Reconnect refetch
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => {
      if (shouldRefetch()) {
        debouncedFetch();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetchOnReconnect, shouldRefetch, debouncedFetch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    lastFetch,
    clearCache: () => cacheRef.current.clear()
  };
};

/**
 * Hook for managing multiple related queries
 */
export const useQueryManager = () => {
  const [queries, setQueries] = useState(new Map());

  const addQuery = useCallback((key, queryFn, options) => {
    setQueries(prev => new Map(prev.set(key, { queryFn, options })));
  }, []);

  const removeQuery = useCallback((key) => {
    setQueries(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const invalidateQuery = useCallback((key) => {
    const query = queries.get(key);
    if (query) {
      // Trigger refetch for specific query
      query.refetch?.(true);
    }
  }, [queries]);

  const invalidateAll = useCallback(() => {
    queries.forEach((query) => {
      query.refetch?.(true);
    });
  }, [queries]);

  return {
    addQuery,
    removeQuery,
    invalidateQuery,
    invalidateAll
  };
};