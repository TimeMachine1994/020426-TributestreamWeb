// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				uid: string;
				email: string | null;
				displayName?: string;
				role: 'admin' | 'owner' | 'funeral_director';
				isAdmin: boolean;
			} | null;
		}
		interface PageData {
			user: {
				uid: string;
				email: string | null;
				displayName?: string;
				role: 'admin' | 'owner' | 'funeral_director';
				isAdmin: boolean;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
