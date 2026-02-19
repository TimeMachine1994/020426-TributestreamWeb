import { browser } from '$app/environment';
import { onDestroy } from 'svelte';

export interface FormAutoSaveOptions {
	storageKey: string;
	debounceMs?: number;
	useLocalStorage?: boolean; // true for localStorage, false for cookies
	cookieExpireDays?: number;
	onSave?: (data: any) => void;
	onLoad?: (data: any) => void;
	onClear?: () => void;
}

/**
 * GENERIC FORM AUTO-SAVE COMPOSABLE
 *
 * Provides auto-save functionality for any form using cookies or localStorage
 * Includes debouncing, data persistence, and cleanup
 */
export function useFormAutoSave<T extends Record<string, any>>(options: FormAutoSaveOptions) {
	const {
		storageKey,
		debounceMs = 2000,
		useLocalStorage = false,
		cookieExpireDays = 7,
		onSave,
		onLoad,
		onClear
	} = options;

	let saveTimeout: NodeJS.Timeout | null = null;
	let lastSaveData: string | null = null;
	let hasUnsavedChanges = false;
	let lastSaved: Date | null = null;

	console.log('💾 [FORM AUTO-SAVE] Initialized for key:', storageKey);

	/**
	 * Save data to storage (cookie or localStorage)
	 */
	function saveToStorage(data: T): void {
		if (!browser) return;

		const dataString = JSON.stringify({
			...data,
			_timestamp: Date.now(),
			_autoSaved: true
		});

		try {
			if (useLocalStorage) {
				localStorage.setItem(storageKey, dataString);
				console.log('✅ [FORM AUTO-SAVE] Data saved to localStorage');
			} else {
				// Save to cookie
				const expires = new Date();
				expires.setDate(expires.getDate() + cookieExpireDays);

				document.cookie = `${storageKey}=${encodeURIComponent(dataString)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
				console.log('✅ [FORM AUTO-SAVE] Data saved to cookie');
			}

			lastSaveData = dataString;
			lastSaved = new Date();
			hasUnsavedChanges = false;
			onSave?.(data);
		} catch (error) {
			console.error('❌ [FORM AUTO-SAVE] Failed to save data:', error);
		}
	}

	/**
	 * Load data from storage (cookie or localStorage)
	 */
	function loadFromStorage(): T | null {
		if (!browser) return null;

		try {
			let dataString: string | null = null;

			if (useLocalStorage) {
				dataString = localStorage.getItem(storageKey);
			} else {
				// Load from cookie
				const cookies = document.cookie.split(';');
				const targetCookie = cookies.find((cookie) => cookie.trim().startsWith(`${storageKey}=`));

				if (targetCookie) {
					dataString = decodeURIComponent(targetCookie.split('=')[1]);
				}
			}

			if (dataString) {
				const parsedData = JSON.parse(dataString);
				console.log('✅ [FORM AUTO-SAVE] Data loaded from storage');

				// Remove internal metadata before returning
				const { _timestamp, _autoSaved, ...cleanData } = parsedData;
				onLoad?.(cleanData);
				return cleanData as T;
			}
		} catch (error) {
			console.error('❌ [FORM AUTO-SAVE] Failed to load data:', error);
		}

		console.log('ℹ️ [FORM AUTO-SAVE] No saved data found');
		onLoad?.(null);
		return null;
	}

	/**
	 * Clear saved data from storage
	 */
	function clearStorage(): void {
		if (!browser) return;

		try {
			if (useLocalStorage) {
				localStorage.removeItem(storageKey);
			} else {
				// Clear cookie by setting expired date
				document.cookie = `${storageKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
			}

			lastSaveData = null;
			lastSaved = null;
			hasUnsavedChanges = false;
			console.log('✅ [FORM AUTO-SAVE] Storage cleared');
			onClear?.();
		} catch (error) {
			console.error('❌ [FORM AUTO-SAVE] Failed to clear storage:', error);
		}
	}

	/**
	 * Debounced auto-save trigger
	 */
	function triggerAutoSave(formData: T): void {
		const dataString = JSON.stringify(formData);

		// Skip if data hasn't changed
		if (dataString === lastSaveData) {
			return;
		}

		hasUnsavedChanges = true;

		// Clear existing timeout
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		// Set new timeout for debounced save
		saveTimeout = setTimeout(() => {
			console.log('💾 [FORM AUTO-SAVE] Auto-saving form data...');
			saveToStorage(formData);
		}, debounceMs);
	}

	/**
	 * Immediate save (bypass debounce)
	 */
	function saveNow(formData: T): void {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		console.log('💾 [FORM AUTO-SAVE] Immediate save triggered');
		saveToStorage(formData);
	}

	/**
	 * Check if there's saved data available
	 */
	function hasSavedData(): boolean {
		if (!browser) return false;

		try {
			if (useLocalStorage) {
				return localStorage.getItem(storageKey) !== null;
			} else {
				const cookies = document.cookie.split(';');
				return cookies.some((cookie) => cookie.trim().startsWith(`${storageKey}=`));
			}
		} catch (error) {
			console.error('❌ [FORM AUTO-SAVE] Error checking for saved data:', error);
			return false;
		}
	}

	/**
	 * Get timestamp of last save
	 */
	function getLastSaveTime(): Date | null {
		if (!browser) return null;

		try {
			let dataString: string | null = null;

			if (useLocalStorage) {
				dataString = localStorage.getItem(storageKey);
			} else {
				const cookies = document.cookie.split(';');
				const targetCookie = cookies.find((cookie) => cookie.trim().startsWith(`${storageKey}=`));

				if (targetCookie) {
					dataString = decodeURIComponent(targetCookie.split('=')[1]);
				}
			}

			if (dataString) {
				const parsedData = JSON.parse(dataString);
				return parsedData._timestamp ? new Date(parsedData._timestamp) : null;
			}
		} catch (error) {
			console.error('❌ [FORM AUTO-SAVE] Error getting last save time:', error);
		}

		return null;
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
	});

	return {
		// State getters
		hasUnsavedChanges: () => hasUnsavedChanges,
		lastSaved: () => lastSaved,
		hasSavedData,
		getLastSaveTime,

		// Methods
		triggerAutoSave,
		saveNow,
		loadFromStorage,
		clearStorage
	};
}

/**
 * FORM FIELD AUTO-SAVE HELPER
 *
 * Creates reactive auto-save for individual form fields
 */
export function createFormFieldAutoSave<T extends Record<string, any>>(
	formData: T,
	options: FormAutoSaveOptions
) {
	const autoSave = useFormAutoSave<T>(options);

	// Create a proxy to automatically trigger saves on field changes
	const reactiveFormData = new Proxy(formData, {
		set(target, property, value) {
			target[property as keyof T] = value;
			autoSave.triggerAutoSave(target);
			return true;
		}
	});

	return {
		formData: reactiveFormData,
		...autoSave
	};
}
