import type { Timestamp } from 'firebase/firestore';

export interface Invitation {
	id: string;
	memorialId: string;
	inviteeEmail: string;
	roleToAssign: 'owner'; // V1: Simplified to owner role only
	status: 'pending' | 'accepted';
	invitedByUid: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}
