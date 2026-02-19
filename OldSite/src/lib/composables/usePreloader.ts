import { browser } from '$app/environment';
import { cacheManager } from './useOptimizedData';

interface PreloadConfig {
	memorialId?: string;
	userId?: string;
	role?: string;
	priority?: 'high' | 'medium' | 'low';
}

class DataPreloader {
	private preloadQueue: Array<{ key: string; fetcher: () => Promise<any>; priority: number }> = [];
	private isProcessing = false;

	private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
		switch (priority) {
			case 'high':
				return 1;
			case 'medium':
				return 2;
			case 'low':
				return 3;
			default:
				return 2;
		}
	}

	async preload(
		key: string,
		fetcher: () => Promise<any>,
		priority: 'high' | 'medium' | 'low' = 'medium'
	) {
		if (!browser) return;

		this.preloadQueue.push({
			key,
			fetcher,
			priority: this.getPriorityValue(priority)
		});

		// Sort by priority
		this.preloadQueue.sort((a, b) => a.priority - b.priority);

		if (!this.isProcessing) {
			this.processQueue();
		}
	}

	private async processQueue() {
		this.isProcessing = true;

		while (this.preloadQueue.length > 0) {
			const item = this.preloadQueue.shift();
			if (!item) break;

			try {
				await cacheManager.preload(item.key, item.fetcher);
				// Small delay to prevent overwhelming the server
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				console.warn(`Preload failed for ${item.key}:`, error);
			}
		}

		this.isProcessing = false;
	}
}

const preloader = new DataPreloader();

export function usePreloader() {
	const preloadForRole = async (config: PreloadConfig) => {
		const { memorialId, userId, role, priority = 'medium' } = config;

		switch (role) {
			case 'owner':
				if (userId) {
					await preloader.preload(
						`user-memorials:${userId}`,
						() => fetch(`/api/users/${userId}/memorials`).then((r) => r.json()),
						priority
					);
				}
				break;

			case 'funeral_director':
				await preloader.preload(
					'funeral-director-memorials',
					() => fetch('/api/funeral-director/memorials').then((r) => r.json()),
					'high'
				);
				break;

			case 'family_member':
				if (memorialId) {
					await preloader.preload(
						`memorial:${memorialId}`,
						() => fetch(`/api/memorials/${memorialId}`).then((r) => r.json()),
						'high'
					);
				}
				break;

			case 'viewer':
				if (userId) {
					await preloader.preload(
						`followed-memorials:${userId}`,
						() => fetch(`/api/users/${userId}/followed`).then((r) => r.json()),
						priority
					);
				}
				break;
		}
	};

	const preloadMemorialDetails = async (
		memorialId: string,
		priority: 'high' | 'medium' | 'low' = 'medium'
	) => {
		await preloader.preload(
			`memorial:${memorialId}`,
			() => fetch(`/api/memorials/${memorialId}`).then((r) => r.json()),
			priority
		);

		// Preload related data
		await preloader.preload(
			`memorial-photos:${memorialId}`,
			() => fetch(`/api/memorials/${memorialId}/photos`).then((r) => r.json()),
			'low'
		);

		await preloader.preload(
			`memorial-stream-status:${memorialId}`,
			() => fetch(`/api/memorials/${memorialId}/stream/status`).then((r) => r.json()),
			'medium'
		);
	};

	const preloadCriticalData = async (userRole: string, userId: string) => {
		// Preload session data
		await preloader.preload(
			'user-session',
			() => fetch('/api/session').then((r) => r.json()),
			'high'
		);

		// Role-specific critical data
		await preloadForRole({ role: userRole, userId, priority: 'high' });
	};

	return {
		preloadForRole,
		preloadMemorialDetails,
		preloadCriticalData
	};
}

// Intersection Observer for lazy preloading
export function useLazyPreloader() {
	let observer: IntersectionObserver | null = null;

	const observeElement = (
		element: Element,
		preloadFn: () => Promise<void>,
		options: IntersectionObserverInit = { rootMargin: '50px' }
	) => {
		if (!browser || !element) return;

		if (!observer) {
			observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const target = entry.target as HTMLElement;
						const preloadFunction = (target as any).__preloadFn;
						if (preloadFunction) {
							preloadFunction();
							observer?.unobserve(target);
						}
					}
				});
			}, options);
		}

		(element as any).__preloadFn = preloadFn;
		observer.observe(element);
	};

	const disconnect = () => {
		if (observer) {
			observer.disconnect();
			observer = null;
		}
	};

	return {
		observeElement,
		disconnect
	};
}

// Network-aware preloading
export function useNetworkAwarePreloader() {
	const getConnectionSpeed = (): 'slow' | 'medium' | 'fast' => {
		if (!browser || !('connection' in navigator)) return 'medium';

		const connection = (navigator as any).connection;
		if (!connection) return 'medium';

		const effectiveType = connection.effectiveType;

		switch (effectiveType) {
			case 'slow-2g':
			case '2g':
				return 'slow';
			case '3g':
				return 'medium';
			case '4g':
			default:
				return 'fast';
		}
	};

	const shouldPreload = (priority: 'high' | 'medium' | 'low'): boolean => {
		const speed = getConnectionSpeed();

		switch (speed) {
			case 'slow':
				return priority === 'high';
			case 'medium':
				return priority === 'high' || priority === 'medium';
			case 'fast':
				return true;
			default:
				return true;
		}
	};

	const adaptivePreload = async (
		key: string,
		fetcher: () => Promise<any>,
		priority: 'high' | 'medium' | 'low' = 'medium'
	) => {
		if (shouldPreload(priority)) {
			await preloader.preload(key, fetcher, priority);
		}
	};

	return {
		getConnectionSpeed,
		shouldPreload,
		adaptivePreload
	};
}
