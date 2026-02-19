import type { Timestamp } from 'firebase/firestore';

export interface ScheduleEditRequest {
	id: string;
	memorialId: string;
	memorialName: string;
	requestedBy: string;
	requestedByEmail: string;
	requestDetails: string;
	status: 'pending' | 'approved' | 'denied' | 'completed';
	createdAt: Timestamp | string;
	reviewedAt?: Timestamp | string;
	reviewedBy?: string;
	reviewedByEmail?: string;
	adminNotes?: string;
	currentConfig: {
		tier: string;
		services: any;
		bookingItems: Array<{
			name: string;
			price: number;
			quantity?: number;
			total: number;
		}>;
		total: number;
	};
}

export type EditRequestStatus = 'pending' | 'approved' | 'denied' | 'completed';
