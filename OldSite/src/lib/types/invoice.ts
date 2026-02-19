import type { Timestamp } from 'firebase/firestore';

export interface InvoiceItem {
	name: string;
	quantity: number;
	price: number; // Unit price in cents
	total: number; // quantity * price in cents
}

export interface Invoice {
	id: string;
	items: InvoiceItem[];
	total: number; // Total in cents
	customerEmail: string;
	customerName?: string;
	status: 'pending' | 'paid' | 'expired' | 'cancelled';
	createdAt: Timestamp;
	paidAt?: Timestamp;
	createdBy: string; // Admin UID who created it
	memorialId?: string; // Optional link to memorial
	stripeSessionId?: string;
	paymentIntentId?: string;
	expiresAt?: Timestamp; // Optional expiration date
}

export interface CreateInvoiceRequest {
	items: Omit<InvoiceItem, 'total'>[];
	customerEmail: string;
	customerName?: string;
	memorialId?: string;
	sendEmail?: boolean; // Whether to send invoice email
}

export interface CreateInvoiceResponse {
	invoiceId: string;
	paymentUrl: string;
}

export interface InvoicePublicData {
	id: string;
	items: InvoiceItem[];
	total: number;
	customerEmail: string;
	customerName?: string;
	status: Invoice['status'];
	createdAt: string; // ISO string for public
}
