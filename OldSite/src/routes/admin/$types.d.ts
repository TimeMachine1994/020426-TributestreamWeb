import type { PageServerLoad } from './$types';

export type PageData = {
	user: any;
	memorials: any[];
	allUsers: { uid: string; email: string; displayName: string; role?: string }[];
	pendingFuneralDirectors: any[];
	approvedFuneralDirectors: any[];
	stats: {
		totalMemorials: number;
		totalUsers: number;
		activeStreams: number;
		recentMemorials: number;
		pendingDirectors: number;
		approvedDirectors: number;
	};
	error?: string;
};
