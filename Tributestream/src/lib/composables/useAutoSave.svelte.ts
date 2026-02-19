/**
 * Auto-save composable using Svelte 5 runes.
 * Debounced POST to auto-save endpoint with state tracking.
 */

import type { MemorialServices, CalculatorFormData } from '$lib/features/booking/types';

interface AutoSaveOptions {
	memorialId: string;
	delayMs?: number;
}

export function useAutoSave(options: AutoSaveOptions) {
	const { memorialId, delayMs = 3000 } = options;

	let isSaving = $state(false);
	let lastSaved = $state<number | null>(null);
	let hasUnsavedChanges = $state(false);
	let error = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout> | null = null;

	function scheduleSave(services?: MemorialServices, calculatorData?: CalculatorFormData) {
		hasUnsavedChanges = true;
		error = null;

		if (timer) clearTimeout(timer);

		timer = setTimeout(() => {
			executeSave(services, calculatorData);
		}, delayMs);
	}

	async function executeSave(services?: MemorialServices, calculatorData?: CalculatorFormData) {
		if (isSaving) return;
		if (!services && !calculatorData) return;

		isSaving = true;
		error = null;

		try {
			const res = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ services, calculatorData })
			});

			if (res.ok) {
				const data = await res.json();
				lastSaved = data.timestamp;
				hasUnsavedChanges = false;
			} else {
				const data = await res.json().catch(() => ({ error: 'Auto-save failed' }));
				error = data.error ?? 'Auto-save failed';
			}
		} catch (e) {
			error = `Auto-save error: ${e}`;
		} finally {
			isSaving = false;
		}
	}

	async function loadSavedData(): Promise<{
		services: MemorialServices | null;
		calculatorConfig: any | null;
		hasAutoSave: boolean;
	} | null> {
		try {
			const res = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`);
			if (res.ok) {
				return await res.json();
			}
			return null;
		} catch {
			return null;
		}
	}

	function cancel() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	}

	function destroy() {
		cancel();
	}

	return {
		get isSaving() { return isSaving; },
		get lastSaved() { return lastSaved; },
		get hasUnsavedChanges() { return hasUnsavedChanges; },
		get error() { return error; },
		scheduleSave,
		executeSave,
		loadSavedData,
		cancel,
		destroy
	};
}
