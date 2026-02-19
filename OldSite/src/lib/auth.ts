import { writable } from 'svelte/store';

export interface User {
	uid: string;
	email: string | null;
	displayName?: string;
	role: 'admin' | 'owner' | 'funeral_director' | 'viewer';
	isAdmin: boolean;
	isViewer?: boolean;
	isOwner?: boolean;
	hasPaidForMemorial?: boolean;
	memorialCount?: number;
}

export const user = writable<User | null>(null);
