import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Memorial } from '$lib/types/memorial';

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	expiry: number;
}

interface LoadingState {
	isLoading: boolean;
	error: string | null;
	lastFetch: number | null;
}

class DataCache {
	private cache = new Map<string, CacheEntry<any>>();
	private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

	set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			expiry: Date.now() + ttl
		});
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		if (Date.now() > entry.expiry) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	invalidate(key: string): void {
		this.cache.delete(key);
	}

	invalidatePattern(pattern: string): void {
		const regex = new RegExp(pattern);
		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	clear(): void {
		this.cache.clear();
	}
}

const dataCache = new DataCache();

export interface OptimizedDataOptions {
	ttl?: number;
	refetchInterval?: number;
	staleWhileRevalidate?: boolean;
	retryAttempts?: number;
	retryDelay?: number;
}

export function useOptimizedData<T>(
	key: string,
	fetcher: () => Promise<T>,
	options: OptimizedDataOptions = {}
) {
	const {
		ttl = 5 * 60 * 1000, // 5 minutes
		refetchInterval,
		staleWhileRevalidate = true,
		retryAttempts = 3,
		retryDelay = 1000
	} = options;

	const loadingState = writable<LoadingState>({
		isLoading: false,
		error: null,
		lastFetch: null
	});

	const data = writable<T | null>(null);

	let refetchTimer: NodeJS.Timeout | null = null;
	let retryCount = 0;

	const fetchData = async (forceRefresh = false): Promise<void> => {
		if (!browser) return;

		// Check cache first
		if (!forceRefresh) {
			const cached = dataCache.get<T>(key);
			if (cached) {
				data.set(cached);
				loadingState.update((state) => ({ ...state, lastFetch: Date.now() }));

				// If stale-while-revalidate, fetch in background
				if (staleWhileRevalidate) {
					setTimeout(() => fetchData(true), 0);
				}
				return;
			}
		}

		loadingState.update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const result = await fetcher();

			// Cache the result
			dataCache.set(key, result, ttl);
			data.set(result);

			loadingState.update((state) => ({
				...state,
				isLoading: false,
				error: null,
				lastFetch: Date.now()
			}));

			retryCount = 0; // Reset retry count on success

			// Set up automatic refetch if interval specified
			if (refetchInterval && refetchInterval > 0) {
				if (refetchTimer) clearTimeout(refetchTimer);
				refetchTimer = setTimeout(() => fetchData(true), refetchInterval);
			}
		} catch (error) {
			console.error(`Error fetching data for key ${key}:`, error);

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// Retry logic
			if (retryCount < retryAttempts) {
				retryCount++;
				setTimeout(() => fetchData(forceRefresh), retryDelay * retryCount);
				return;
			}

			loadingState.update((state) => ({
				...state,
				isLoading: false,
				error: errorMessage
			}));
		}
	};

	// Initial fetch
	fetchData();

	const refresh = () => fetchData(true);

	const invalidate = () => {
		dataCache.invalidate(key);
		data.set(null);
	};

	// Cleanup function
	const cleanup = () => {
		if (refetchTimer) {
			clearTimeout(refetchTimer);
			refetchTimer = null;
		}
	};

	return {
		data: { subscribe: data.subscribe },
		loading: { subscribe: loadingState.subscribe },
		refresh,
		invalidate,
		cleanup
	};
}

// Specialized hook for memorial data
export function useMemorialData(memorialId: string, options?: OptimizedDataOptions) {
	return useOptimizedData<Memorial>(
		`memorial:${memorialId}`,
		async () => {
			const response = await fetch(`/api/memorials/${memorialId}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch memorial: ${response.statusText}`);
			}
			return response.json();
		},
		{
			ttl: 10 * 60 * 1000, // 10 minutes for memorial data
			staleWhileRevalidate: true,
			...options
		}
	);
}

// Specialized hook for user's memorials list
export function useUserMemorials(userId: string, options?: OptimizedDataOptions) {
	return useOptimizedData<Memorial[]>(
		`user-memorials:${userId}`,
		async () => {
			const response = await fetch(`/api/users/${userId}/memorials`);
			if (!response.ok) {
				throw new Error(`Failed to fetch user memorials: ${response.statusText}`);
			}
			return response.json();
		},
		{
			ttl: 5 * 60 * 1000, // 5 minutes for lists
			refetchInterval: 30 * 1000, // Refresh every 30 seconds
			...options
		}
	);
}

// Specialized hook for funeral director assigned memorials
export function useFuneralDirectorMemorials(options?: OptimizedDataOptions) {
	return useOptimizedData<Memorial[]>(
		'funeral-director-memorials',
		async () => {
			const response = await fetch('/api/funeral-director/memorials');
			if (!response.ok) {
				throw new Error(`Failed to fetch assigned memorials: ${response.statusText}`);
			}
			return response.json();
		},
		{
			ttl: 3 * 60 * 1000, // 3 minutes for active work data
			refetchInterval: 60 * 1000, // Refresh every minute
			...options
		}
	);
}

// Batch data fetcher for multiple memorials
export function useBatchMemorialData(memorialIds: string[], options?: OptimizedDataOptions) {
	const batchKey = `batch-memorials:${memorialIds.sort().join(',')}`;

	return useOptimizedData<Memorial[]>(
		batchKey,
		async () => {
			// Check cache for individual memorials first
			const cached: Memorial[] = [];
			const toFetch: string[] = [];

			for (const id of memorialIds) {
				const cachedMemorial = dataCache.get<Memorial>(`memorial:${id}`);
				if (cachedMemorial) {
					cached.push(cachedMemorial);
				} else {
					toFetch.push(id);
				}
			}

			// Fetch missing memorials
			if (toFetch.length > 0) {
				const response = await fetch('/api/memorials/batch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ ids: toFetch })
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch memorials: ${response.statusText}`);
				}

				const fetched: Memorial[] = await response.json();

				// Cache individual memorials
				fetched.forEach((memorial) => {
					dataCache.set(`memorial:${memorial.id}`, memorial, options?.ttl);
				});

				cached.push(...fetched);
			}

			// Sort by original order
			return memorialIds.map((id) => cached.find((m) => m.id === id)).filter(Boolean) as Memorial[];
		},
		{
			ttl: 5 * 60 * 1000,
			...options
		}
	);
}

// Global cache management
export const cacheManager = {
	invalidateMemorial: (memorialId: string) => {
		dataCache.invalidate(`memorial:${memorialId}`);
		dataCache.invalidatePattern(`.*memorials.*`); // Invalidate lists containing this memorial
	},

	invalidateUserData: (userId: string) => {
		dataCache.invalidatePattern(`user.*${userId}.*`);
	},

	invalidateAll: () => {
		dataCache.clear();
	},

	preload: async (key: string, fetcher: () => Promise<any>, ttl?: number) => {
		try {
			const data = await fetcher();
			dataCache.set(key, data, ttl);
		} catch (error) {
			console.warn(`Failed to preload data for key ${key}:`, error);
		}
	}
};

// Performance monitoring
export function usePerformanceMonitor() {
	const metrics = writable({
		cacheHitRate: 0,
		averageLoadTime: 0,
		errorRate: 0
	});

	// This would be implemented with actual performance tracking
	// For now, it's a placeholder for future enhancement

	return {
		metrics: { subscribe: metrics.subscribe }
	};
}
