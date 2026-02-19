import type { Timestamp } from 'firebase/firestore';

export interface FuneralDirector {
	id: string;

	// Basic Info
	companyName: string;
	contactPerson: string;
	email: string;
	phone: string;

	// Address (simplified)
	address: {
		street: string;
		city: string;
		state: string;
		zipCode: string;
	};

	// Account Status (V1: auto-approved)
	status: 'approved' | 'suspended' | 'inactive';

	// Metadata
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface ServiceDetails {
	date: string;
	time: string;
	location: string;
	address: string;
	officiant?: string;
	notes?: string;
}

export interface FuneralDirectorMemorialRequest {
	// Deceased Information (Enhanced)
	deceased: {
		firstName: string;
		lastName: string;
		middleName?: string;
		nickname?: string;
		dateOfBirth: string;
		dateOfDeath: string;
		placeOfBirth?: string;
		placeOfDeath?: string;
		causeOfDeath?: string;

		// Physical Description
		profilePhoto?: File;
		height?: string;
		eyeColor?: string;
		hairColor?: string;

		// Life Details
		occupation?: string;
		education?: string;
		militaryService?: boolean;
		militaryBranch?: string;
		militaryRank?: string;
	};

	// Family Information (Enhanced)
	family: {
		spouse?: {
			name: string;
			status: 'surviving' | 'predeceased';
			marriageDate?: string;
		};
		children?: Array<{
			name: string;
			relationship: 'son' | 'daughter' | 'stepson' | 'stepdaughter';
			status: 'surviving' | 'predeceased';
		}>;
		parents?: Array<{
			name: string;
			relationship: 'father' | 'mother' | 'stepfather' | 'stepmother';
			status: 'surviving' | 'predeceased';
		}>;
		siblings?: Array<{
			name: string;
			relationship: 'brother' | 'sister' | 'stepbrother' | 'stepsister';
			status: 'surviving' | 'predeceased';
		}>;
	};

	// Service Information
	services: {
		viewingDetails?: ServiceDetails;
		funeralDetails?: ServiceDetails;
		burialDetails?: ServiceDetails;
		memorialDetails?: ServiceDetails;
	};

	// Funeral Director Information (Auto-filled)
	funeralDirector: {
		id: string;
		companyName: string;
		contactPerson: string;
		phone: string;
		email: string;
		licenseNumber: string;
	};

	// Owner Information
	owner: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		relationship: string;
		address?: {
			street: string;
			city: string;
			state: string;
			zipCode: string;
		};
	};

	// Memorial Configuration
	memorial: {
		title?: string;
		description?: string;
		isPublic: boolean;
		allowComments: boolean;
		allowPhotos: boolean;
		allowTributes: boolean;
		customSlug?: string;
	};

	// Additional Options
	options: {
		sendNotifications: boolean;
		createGuestbook: boolean;
		enableDonations: boolean;
		donationRecipient?: string;
		enableFlowers: boolean;
		flowerProvider?: string;
	};
}
