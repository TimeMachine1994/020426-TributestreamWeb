import { onDestroy } from 'svelte';
import type { CalculatorFormData } from '$lib/types/livestream';

export interface AutoSaveData {
	services?: any;
	calculatorData?: CalculatorFormData;
}

export function useAutoSave(
	memorialId: string,
	options?: {
		delay?: number;
		onSave?: (success: boolean, error?: string) => void;
		onLoad?: (data: AutoSaveData | null) => void;
	}
) {
	let saveTimeout: NodeJS.Timeout | null = null;
	let lastSaveData: string | null = null;
	let isSaving = false;
	let lastSaved: Date | null = null;
	let hasUnsavedChanges = false;

	const delay = options?.delay || 2000;
	const onSave = options?.onSave;
	const onLoad = options?.onLoad;

	// Auto-save function
	async function autoSave(data: AutoSaveData) {
		if (!data.services && !data.calculatorData) {
			return;
		}

		const dataString = JSON.stringify(data);
		if (dataString === lastSaveData) {
			return;
		}

		isSaving = true;
		hasUnsavedChanges = false;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					services: data.services,
					calculatorData: data.calculatorData,
					timestamp: Date.now()
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				lastSaveData = dataString;
				lastSaved = new Date();
				onSave?.(true);
			} else {
				hasUnsavedChanges = true;
				onSave?.(false, result.error);
			}
		} catch (error) {
			hasUnsavedChanges = true;
			onSave?.(false, error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isSaving = false;
		}
	}

	// Trigger auto-save
	function triggerAutoSave(data: AutoSaveData) {
		hasUnsavedChanges = true;

		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		saveTimeout = setTimeout(() => {
			autoSave(data);
		}, delay);
	}

	// Load auto-saved data
	async function loadAutoSavedData(): Promise<AutoSaveData | null> {
		try {
			const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`);
			const result = await response.json();

			if (response.ok && result.success && result.hasAutoSave) {
				const data: AutoSaveData = {};

				if (result.services) {
					data.services = result.services;
				}

				if (result.autoSave?.formData) {
					data.calculatorData = result.autoSave.formData;
				}

				if (data.services || data.calculatorData) {
					onLoad?.(data);
					return data;
				}
			}

			return null;
		} catch (error) {
			onLoad?.(null);
			return null;
		}
	}

	// Manual save function
	function saveNow(data: AutoSaveData): Promise<void> {
		return new Promise(async (resolve) => {
			if (saveTimeout) {
				clearTimeout(saveTimeout);
				saveTimeout = null;
			}

			await autoSave(data);
			resolve();
		});
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
	});

	return {
		isSaving: () => isSaving,
		lastSaved: () => lastSaved,
		hasUnsavedChanges: () => hasUnsavedChanges,
		triggerAutoSave,
		saveNow,
		loadAutoSavedData
	};
}
