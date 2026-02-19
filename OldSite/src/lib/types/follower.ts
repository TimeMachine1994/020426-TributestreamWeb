import type { Timestamp } from 'firebase/firestore';

export interface Follower {
	uid: string;
	followedAt: Timestamp;
}
