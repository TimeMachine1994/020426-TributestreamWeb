import { env } from '$env/dynamic/private';
import sgMail from '@sendgrid/mail';
import { shouldMockEmails } from '$lib/utils/environment';
import { devLog } from '$lib/config/dev-mode';
import { logEmailSent, logEmailFailed, logEmailMocked, buildLogParams } from './emailAudit';
import type { EmailType } from '$lib/types/email-audit';

const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
const FROM_EMAIL = env.FROM_EMAIL || 'noreply@tributestream.com';

if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key') {
	sgMail.setApiKey(SENDGRID_API_KEY);
}

// SendGrid Dynamic Template IDs from environment variables
export const SENDGRID_TEMPLATES = {
	ENHANCED_REGISTRATION: env.SENDGRID_TEMPLATE_ENHANCED_REGISTRATION || 'placeholder',
	BASIC_REGISTRATION: env.SENDGRID_TEMPLATE_BASIC_REGISTRATION || 'placeholder',
	INVITATION: env.SENDGRID_TEMPLATE_INVITATION || 'placeholder',
	EMAIL_CHANGE_CONFIRMATION: env.SENDGRID_TEMPLATE_EMAIL_CHANGE || 'placeholder',
	PAYMENT_CONFIRMATION: env.SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION || 'placeholder',
	PAYMENT_ACTION_REQUIRED: env.SENDGRID_TEMPLATE_PAYMENT_ACTION || 'placeholder',
	PAYMENT_FAILURE: env.SENDGRID_TEMPLATE_PAYMENT_FAILURE || 'placeholder',
	CONTACT_SUPPORT: env.SENDGRID_TEMPLATE_CONTACT_SUPPORT || 'placeholder',
	CONTACT_CONFIRMATION: env.SENDGRID_TEMPLATE_CONTACT_CONFIRMATION || 'placeholder',
	PASSWORD_RESET: env.SENDGRID_TEMPLATE_PASSWORD_RESET || 'placeholder',
	OWNER_WELCOME: env.SENDGRID_TEMPLATE_OWNER_WELCOME || 'placeholder',
	FUNERAL_DIRECTOR_WELCOME: env.SENDGRID_TEMPLATE_FUNERAL_DIRECTOR_WELCOME || 'placeholder'
};

export interface EnhancedRegistrationEmailData {
	email: string;
	lovedOneName: string;
	memorialUrl: string;
	ownerName: string;
	password: string; // Add password for the enhanced email
	magicLink?: string; // Optional magic link for one-click access to memorial page
}

export interface InvitationEmailData {
	to: string;
	fromName: string;
	memorialName: string;
	invitationId: string;
}

export interface EmailChangeConfirmationData {
	to: string;
	userName: string;
	confirmationUrl: string;
}

export interface PaymentEmailData {
	memorialId: string;
	paymentIntentId: string;
	customerEmail: string;
	lovedOneName: string;
	amount?: number;
	paymentDate?: Date;
	nextActionUrl?: string;
	failureReason?: string;
}

export interface ContactFormData {
	name: string;
	email: string;
	subject: string;
	message: string;
	timestamp?: Date;
}

export interface PasswordResetEmailData {
	email: string;
	displayName: string;
	resetLink: string;
}

export interface OwnerWelcomeEmailData {
	email: string;
	displayName: string;
}

export interface FuneralDirectorWelcomeEmailData {
	email: string;
	displayName: string;
}

export interface BasicRegistrationEmailData {
	email: string;
	lovedOneName: string;
	memorialUrl: string;
	familyName: string;
	password?: string; // Optional - only for new users
	additionalNotes?: string;
}

export interface FuneralDirectorRegistrationEmailData {
	email: string;
	familyName: string;
	lovedOneName: string;
	memorialUrl: string;
	password: string;
	additionalNotes?: string;
	calculatorMagicLink?: string; // Magic link for one-click calculator access
}

export async function sendEnhancedRegistrationEmail(
	data: EnhancedRegistrationEmailData,
	context?: { memorialId?: string; userId?: string }
) {
	const templateData = {
		lovedOneName: data.lovedOneName,
		ownerName: data.ownerName,
		memorialUrl: data.memorialUrl,
		email: data.email,
		password: data.password,
		magicLink: data.magicLink || ''
	};

	const logParams = buildLogParams(
		'enhanced_registration' as EmailType,
		data.email,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.ENHANCED_REGISTRATION,
			templateName: 'ENHANCED_REGISTRATION',
			triggeredBy: 'registration',
			memorialId: context?.memorialId,
			userId: context?.userId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Enhanced Registration Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Enhanced Registration');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.email);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Welcome to Tributestream - Memorial Created');
		console.log('Template ID:', SENDGRID_TEMPLATES.ENHANCED_REGISTRATION);
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			lovedOneName: data.lovedOneName,
			ownerName: data.ownerName,
			memorialUrl: data.memorialUrl,
			email: data.email,
			password: data.password,
			magicLink: data.magicLink || '(none)'
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.ENHANCED_REGISTRATION || SENDGRID_TEMPLATES.ENHANCED_REGISTRATION === 'placeholder') {
		console.error('💥 Enhanced registration template not configured. Template ID:', SENDGRID_TEMPLATES.ENHANCED_REGISTRATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_ENHANCED_REGISTRATION environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.ENHANCED_REGISTRATION,
		dynamicTemplateData: {
			lovedOneName: data.lovedOneName,
			ownerName: data.ownerName,
			memorialUrl: data.memorialUrl,
			memorialSlug: data.memorialUrl.replace('https://tributestream.com/', ''),
			email: data.email,
			password: data.password,
			magicLink: data.magicLink || '', // Include magic link for one-click access
			hasMagicLink: !!data.magicLink, // Boolean flag for template conditional logic
			currentYear: new Date().getFullYear()
		},
		// Disable click tracking to prevent URL mangling
		trackingSettings: {
			clickTracking: {
				enable: false
			}
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Enhanced registration email sent via dynamic template to:', data.email);
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending enhanced registration email:', error);
		throw error;
	}
}

export async function sendRegistrationEmail(
	data: BasicRegistrationEmailData,
	context?: { memorialId?: string; userId?: string }
) {
	const templateData = {
		familyName: data.familyName,
		lovedOneName: data.lovedOneName,
		memorialUrl: data.memorialUrl,
		email: data.email,
		password: data.password || '',
		additionalNotes: data.additionalNotes || ''
	};

	const logParams = buildLogParams(
		'basic_registration' as EmailType,
		data.email,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.BASIC_REGISTRATION,
			templateName: 'BASIC_REGISTRATION',
			triggeredBy: 'registration',
			memorialId: context?.memorialId,
			userId: context?.userId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Basic Registration Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Basic Registration');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.email);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Welcome to Tributestream');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			familyName: data.familyName,
			lovedOneName: data.lovedOneName,
			memorialUrl: data.memorialUrl,
			email: data.email,
			password: data.password || '(not provided)'
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.BASIC_REGISTRATION || SENDGRID_TEMPLATES.BASIC_REGISTRATION === 'placeholder') {
		console.error('💥 Basic registration template not configured. Template ID:', SENDGRID_TEMPLATES.BASIC_REGISTRATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_BASIC_REGISTRATION environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.BASIC_REGISTRATION,
		dynamicTemplateData: {
			familyName: data.familyName,
			lovedOneName: data.lovedOneName,
			memorialUrl: data.memorialUrl,
			email: data.email,
			password: data.password || '', // Empty string if not provided
			additionalNotes: data.additionalNotes || '',
			hasAdditionalNotes: !!data.additionalNotes,
			currentYear: new Date().getFullYear()
		},
		// Disable click tracking to prevent URL mangling
		trackingSettings: {
			clickTracking: {
				enable: false
			}
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Basic registration email sent via dynamic template to:', data.email);
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending registration email:', error);
		throw error;
	}
}

export async function sendFuneralDirectorRegistrationEmail(
	data: FuneralDirectorRegistrationEmailData,
	context?: { memorialId?: string; userId?: string }
) {
	const templateData = {
		familyName: data.familyName,
		lovedOneName: data.lovedOneName,
		memorialUrl: data.memorialUrl,
		email: data.email,
		password: data.password,
		additionalNotes: data.additionalNotes || '',
		calculatorMagicLink: data.calculatorMagicLink || ''
	};

	const logParams = buildLogParams(
		'funeral_director_registration' as EmailType,
		data.email,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.ENHANCED_REGISTRATION,
			templateName: 'FUNERAL_DIRECTOR_REGISTRATION',
			triggeredBy: 'funeral_director_registration',
			memorialId: context?.memorialId,
			userId: context?.userId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Funeral Director Registration Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Funeral Director Registration');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.email);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Memorial Created - Family Registration');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			familyName: data.familyName,
			lovedOneName: data.lovedOneName,
			memorialUrl: data.memorialUrl,
			email: data.email,
			password: data.password
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.ENHANCED_REGISTRATION || SENDGRID_TEMPLATES.ENHANCED_REGISTRATION === 'placeholder') {
		console.error('💥 Enhanced registration template not configured. Template ID:', SENDGRID_TEMPLATES.ENHANCED_REGISTRATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_ENHANCED_REGISTRATION environment variable.');
	}

	// Sanitize data to prevent SendGrid template errors with special characters
	const sanitizeForTemplate = (str: string) => {
		if (!str) return '';
		// Replace problematic characters that might cause SendGrid template errors
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.ENHANCED_REGISTRATION,
		dynamicTemplateData: {
			familyName: sanitizeForTemplate(data.familyName),
			lovedOneName: sanitizeForTemplate(data.lovedOneName),
			memorialUrl: data.memorialUrl,
			memorialSlug: data.memorialUrl.replace('https://tributestream.com/', ''),
			email: data.email,
			password: data.password,
			additionalNotes: sanitizeForTemplate(data.additionalNotes || ''),
			hasAdditionalNotes: !!data.additionalNotes,
			calculatorMagicLink: data.calculatorMagicLink || '', // Magic link for calculator
			hasCalculatorMagicLink: !!data.calculatorMagicLink, // Boolean flag for template
			currentYear: new Date().getFullYear()
		},
		// Disable click tracking to prevent URL mangling
		trackingSettings: {
			clickTracking: {
				enable: false
			}
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Funeral director registration email sent to:', data.email);
	} catch (error: any) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending funeral director registration email:', error);
		// Log detailed SendGrid error information
		if (error.response?.body?.errors) {
			console.error('💥 SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
		}
		// Don't throw - allow registration to complete even if email fails
		console.warn('⚠️ Registration will complete despite email failure');
	}
}

export async function sendInvitationEmail(
	data: InvitationEmailData,
	context?: { memorialId?: string; userId?: string }
) {
	const invitationUrl = `https://tributestream.com/invite/${data.invitationId}`;
	const templateData = {
		fromName: data.fromName,
		memorialName: data.memorialName,
		invitationUrl: invitationUrl,
		invitationId: data.invitationId
	};

	const logParams = buildLogParams(
		'invitation' as EmailType,
		data.to,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.INVITATION,
			templateName: 'INVITATION',
			triggeredBy: 'invitation',
			memorialId: context?.memorialId,
			userId: context?.userId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Invitation Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Invitation');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.to);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Invitation to Memorial');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			fromName: data.fromName,
			memorialName: data.memorialName,
			invitationId: data.invitationId
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.INVITATION || SENDGRID_TEMPLATES.INVITATION === 'placeholder') {
		console.error('💥 Invitation template not configured. Template ID:', SENDGRID_TEMPLATES.INVITATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_INVITATION environment variable.');
	}

	const msg = {
		to: data.to,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.INVITATION,
		dynamicTemplateData: {
			fromName: data.fromName,
			memorialName: data.memorialName,
			invitationUrl: invitationUrl,
			currentYear: new Date().getFullYear()
		},
		// Disable click tracking to prevent URL mangling
		trackingSettings: {
			clickTracking: {
				enable: false
			}
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Invitation email sent via dynamic template to:', data.to);
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending invitation email:', error);
		throw error;
	}
}

export async function sendEmailChangeConfirmation(
	data: EmailChangeConfirmationData,
	context?: { userId?: string }
) {
	const templateData = {
		userName: data.userName,
		confirmationUrl: data.confirmationUrl
	};

	const logParams = buildLogParams(
		'email_change_confirmation' as EmailType,
		data.to,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.EMAIL_CHANGE_CONFIRMATION,
			templateName: 'EMAIL_CHANGE_CONFIRMATION',
			triggeredBy: 'email_change',
			userId: context?.userId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Email Change Confirmation (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Email Change Confirmation');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.to);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Confirm Email Change');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			userName: data.userName,
			confirmationUrl: data.confirmationUrl
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.EMAIL_CHANGE_CONFIRMATION || SENDGRID_TEMPLATES.EMAIL_CHANGE_CONFIRMATION === 'placeholder') {
		console.error('💥 Email change confirmation template not configured. Template ID:', SENDGRID_TEMPLATES.EMAIL_CHANGE_CONFIRMATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_EMAIL_CHANGE_CONFIRMATION environment variable.');
	}

	const msg = {
		to: data.to,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.EMAIL_CHANGE_CONFIRMATION,
		dynamicTemplateData: {
			userName: data.userName,
			confirmationUrl: data.confirmationUrl,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Email change confirmation sent via dynamic template to:', data.to);
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending email change confirmation:', error);
		throw error;
	}
}

/**
 * Send payment confirmation email using dynamic template
 */
export async function sendPaymentConfirmationEmail(data: PaymentEmailData) {
	const templateData = {
		lovedOneName: data.lovedOneName,
		paymentIntentId: data.paymentIntentId,
		amount: data.amount?.toFixed(2) || '0.00',
		paymentDate: data.paymentDate?.toLocaleDateString() || new Date().toLocaleDateString(),
		customerEmail: data.customerEmail,
		memorialId: data.memorialId
	};

	const logParams = buildLogParams(
		'payment_confirmation' as EmailType,
		data.customerEmail,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.PAYMENT_CONFIRMATION,
			templateName: 'PAYMENT_CONFIRMATION',
			triggeredBy: 'payment_webhook',
			memorialId: data.memorialId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Payment Confirmation Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Payment Confirmation');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.customerEmail);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Payment Confirmed');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			lovedOneName: data.lovedOneName,
			amount: data.amount,
			paymentIntentId: data.paymentIntentId
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.PAYMENT_CONFIRMATION || SENDGRID_TEMPLATES.PAYMENT_CONFIRMATION === 'placeholder') {
		console.error('💥 Payment confirmation template not configured. Template ID:', SENDGRID_TEMPLATES.PAYMENT_CONFIRMATION);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_PAYMENT_CONFIRMATION environment variable.');
	}

	const msg = {
		to: data.customerEmail,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.PAYMENT_CONFIRMATION,
		dynamicTemplateData: {
			lovedOneName: data.lovedOneName,
			paymentIntentId: data.paymentIntentId,
			amount: data.amount?.toFixed(2) || '0.00',
			paymentDate: data.paymentDate?.toLocaleDateString() || new Date().toLocaleDateString(),
			customerEmail: data.customerEmail,
			memorialId: data.memorialId,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Payment confirmation email sent via dynamic template');
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending payment confirmation email:', error);
		throw error;
	}
}

/**
 * Send payment action required email using dynamic template
 */
export async function sendPaymentActionRequiredEmail(data: PaymentEmailData) {
	const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
	const fallbackUrl = `${baseUrl}/schedule/${data.memorialId}`;

	const templateData = {
		lovedOneName: data.lovedOneName,
		paymentIntentId: data.paymentIntentId,
		actionDate: new Date().toLocaleDateString(),
		nextActionUrl: data.nextActionUrl || fallbackUrl,
		fallbackUrl: fallbackUrl
	};

	const logParams = buildLogParams(
		'payment_action_required' as EmailType,
		data.customerEmail,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.PAYMENT_ACTION_REQUIRED,
			templateName: 'PAYMENT_ACTION_REQUIRED',
			triggeredBy: 'payment_webhook',
			memorialId: data.memorialId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Payment Action Required Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Payment Action Required');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.customerEmail);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Payment Action Required');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			lovedOneName: data.lovedOneName,
			paymentIntentId: data.paymentIntentId,
			nextActionUrl: data.nextActionUrl
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	const msg = {
		to: data.customerEmail,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.PAYMENT_ACTION_REQUIRED,
		dynamicTemplateData: {
			lovedOneName: data.lovedOneName,
			paymentIntentId: data.paymentIntentId,
			actionDate: new Date().toLocaleDateString(),
			nextActionUrl: data.nextActionUrl || fallbackUrl,
			fallbackUrl: fallbackUrl,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Payment action required email sent via dynamic template');
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending payment action required email:', error);
		throw error;
	}
}

/**
 * Send payment failure email using dynamic template
 */
export async function sendPaymentFailureEmail(data: PaymentEmailData) {
	const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
	const retryUrl = `${baseUrl}/schedule/${data.memorialId}`;

	const templateData = {
		lovedOneName: data.lovedOneName,
		paymentIntentId: data.paymentIntentId,
		failureReason: data.failureReason || 'Payment processing error',
		failureDate: new Date().toLocaleDateString(),
		retryUrl: retryUrl
	};

	const logParams = buildLogParams(
		'payment_failure' as EmailType,
		data.customerEmail,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.PAYMENT_FAILURE,
			templateName: 'PAYMENT_FAILURE',
			triggeredBy: 'payment_webhook',
			memorialId: data.memorialId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Payment Failure Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Payment Failure');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.customerEmail);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Payment Failed');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			lovedOneName: data.lovedOneName,
			paymentIntentId: data.paymentIntentId,
			failureReason: data.failureReason
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	const msg = {
		to: data.customerEmail,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.PAYMENT_FAILURE,
		dynamicTemplateData: {
			lovedOneName: data.lovedOneName,
			paymentIntentId: data.paymentIntentId,
			failureReason: data.failureReason || 'Payment processing error',
			failureDate: new Date().toLocaleDateString(),
			retryUrl: retryUrl,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Payment failure email sent via dynamic template');
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending payment failure email:', error);
		throw error;
	}
}

/**
 * Send password reset email using dynamic template
 */
export async function sendPasswordResetEmail(
	data: PasswordResetEmailData,
	context?: { userId?: string }
) {
	const templateData = {
		displayName: data.displayName || 'User',
		email: data.email,
		resetLink: data.resetLink
	};

	const logParams = buildLogParams(
		'password_reset' as EmailType,
		data.email,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.PASSWORD_RESET,
			templateName: 'PASSWORD_RESET',
			triggeredBy: 'password_reset',
			userId: context?.userId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Password Reset Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Password Reset');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.email);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Reset Your Tributestream Password');
		console.log('Template ID:', SENDGRID_TEMPLATES.PASSWORD_RESET);
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			displayName: data.displayName,
			email: data.email,
			resetLink: data.resetLink
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.PASSWORD_RESET || SENDGRID_TEMPLATES.PASSWORD_RESET === 'placeholder') {
		console.error('💥 Password reset template not configured. Template ID:', SENDGRID_TEMPLATES.PASSWORD_RESET);
		throw new Error('Password reset email template not configured. Please check SENDGRID_TEMPLATE_PASSWORD_RESET environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.PASSWORD_RESET,
		dynamicTemplateData: {
			displayName: data.displayName || 'User',
			email: data.email,
			resetLink: data.resetLink,
			currentYear: new Date().getFullYear()
		},
		// Disable click tracking to prevent URL mangling
		trackingSettings: {
			clickTracking: {
				enable: false
			}
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Password reset email sent via dynamic template to:', data.email);
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending password reset email:', error);
		throw error;
	}
}

/**
 * Send owner welcome email after registration
 */
export async function sendOwnerWelcomeEmail(
	data: OwnerWelcomeEmailData,
	context?: { userId?: string }
) {
	const templateData = {
		displayName: data.displayName,
		email: data.email
	};

	const logParams = buildLogParams(
		'owner_welcome' as EmailType,
		data.email,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.OWNER_WELCOME,
			templateName: 'OWNER_WELCOME',
			triggeredBy: 'registration',
			userId: context?.userId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Owner Welcome Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Owner Welcome');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.email);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Welcome to Tributestream');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			displayName: data.displayName,
			email: data.email
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.OWNER_WELCOME || SENDGRID_TEMPLATES.OWNER_WELCOME === 'placeholder') {
		console.error('💥 Owner welcome template not configured. Template ID:', SENDGRID_TEMPLATES.OWNER_WELCOME);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_OWNER_WELCOME environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.OWNER_WELCOME,
		dynamicTemplateData: {
			displayName: data.displayName,
			email: data.email,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Owner welcome email sent to:', data.email);
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending owner welcome email:', error);
		throw error;
	}
}

/**
 * Send funeral director welcome email after registration
 */
export async function sendFuneralDirectorWelcomeEmail(
	data: FuneralDirectorWelcomeEmailData,
	context?: { userId?: string }
) {
	const templateData = {
		displayName: data.displayName,
		email: data.email
	};

	const logParams = buildLogParams(
		'funeral_director_welcome' as EmailType,
		data.email,
		templateData,
		{
			templateId: SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME,
			templateName: 'FUNERAL_DIRECTOR_WELCOME',
			triggeredBy: 'registration',
			userId: context?.userId
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Funeral Director Welcome Email (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Funeral Director Welcome');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('To:', data.email);
		console.log('From:', FROM_EMAIL);
		console.log('Subject: Welcome to Tributestream');
		console.log('\nTemplate Data:');
		console.log(JSON.stringify({
			displayName: data.displayName,
			email: data.email
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(logParams);
		return;
	}

	// Check if template is configured
	if (!SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME || SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME === 'placeholder') {
		console.error('💥 Funeral director welcome template not configured. Template ID:', SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME);
		throw new Error('Email template not configured. Please check SENDGRID_TEMPLATE_FUNERAL_DIRECTOR_WELCOME environment variable.');
	}

	const msg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.FUNERAL_DIRECTOR_WELCOME,
		dynamicTemplateData: {
			displayName: data.displayName,
			email: data.email,
			currentYear: new Date().getFullYear()
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Funeral director welcome email sent to:', data.email);
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending funeral director welcome email:', error);
		throw error;
	}
}

/**
 * Send contact form emails using dynamic templates
 */
export async function sendContactFormEmails(data: ContactFormData) {
	const timestamp = data.timestamp || new Date();

	const supportTemplateData = {
		name: data.name,
		email: data.email,
		subject: data.subject,
		message: data.message,
		submittedAt: timestamp.toLocaleString()
	};

	const confirmationTemplateData = {
		name: data.name,
		subject: data.subject,
		message: data.message,
		submittedAt: timestamp.toLocaleString()
	};

	const supportLogParams = buildLogParams(
		'contact_form_support' as EmailType,
		'austinbryanfilm@gmail.com',
		supportTemplateData,
		{
			templateId: SENDGRID_TEMPLATES.CONTACT_SUPPORT,
			templateName: 'CONTACT_SUPPORT',
			triggeredBy: 'contact_form'
		}
	);

	const confirmationLogParams = buildLogParams(
		'contact_form_confirmation' as EmailType,
		data.email,
		confirmationTemplateData,
		{
			templateId: SENDGRID_TEMPLATES.CONTACT_CONFIRMATION,
			templateName: 'CONTACT_CONFIRMATION',
			triggeredBy: 'contact_form'
		}
	);

	// DEV MODE MOCK: Log email to console instead of sending
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key' || shouldMockEmails()) {
		devLog.mock('Email', 'Contact Form Emails (not sent)');
		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('📧 [DEV MODE] Email Mock - Contact Form');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('Support Email To: austinbryanfilm@gmail.com');
		console.log('Confirmation Email To:', data.email);
		console.log('From:', FROM_EMAIL);
		console.log('\nForm Data:');
		console.log(JSON.stringify({
			name: data.name,
			email: data.email,
			subject: data.subject,
			message: data.message,
			timestamp: data.timestamp?.toLocaleString() || new Date().toLocaleString()
		}, null, 2));
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
		await logEmailMocked(supportLogParams);
		await logEmailMocked(confirmationLogParams);
		return;
	}

	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('[EMAIL] 🚀 Starting sendContactFormEmails');
	console.log('[EMAIL] 📋 Form Data:', { 
		name: data.name, 
		email: data.email, 
		subject: data.subject,
		messageLength: data.message?.length || 0
	});

	// Step 1: Check SendGrid API Key
	console.log('[EMAIL] 🔑 Step 1: Checking SendGrid API Key...');
	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('[EMAIL] ⚠️ SendGrid client not initialized. Skipping contact form emails.');
		console.log('[EMAIL] SENDGRID_API_KEY status:', SENDGRID_API_KEY ? 'Set' : 'Not set');
		return;
	}
	console.log('[EMAIL] ✅ SendGrid API key is configured');
	console.log('[EMAIL] FROM_EMAIL:', FROM_EMAIL);

	// Step 2: Log Template IDs
	console.log('[EMAIL] 📝 Step 2: Checking Template IDs...');
	console.log('[EMAIL] Template Configuration:', {
		support: SENDGRID_TEMPLATES.CONTACT_SUPPORT,
		confirmation: SENDGRID_TEMPLATES.CONTACT_CONFIRMATION
	});

	// Step 3: Validate Templates
	console.log('[EMAIL] ✔️ Step 3: Validating templates...');
	const templateValidation = validateContactFormTemplates();
	if (!templateValidation.valid) {
		console.error('[EMAIL] 💥 Contact form templates not configured properly:', templateValidation.missing);
		throw new Error(`Contact form templates not configured: ${templateValidation.missing.join(', ')}`);
	}
	console.log('[EMAIL] ✅ Both templates validated successfully');

	// Step 4: Build Support Email Message
	console.log('[EMAIL] 📧 Step 4: Building support email message...');
	const supportMsg = {
		to: 'austinbryanfilm@gmail.com',
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.CONTACT_SUPPORT,
		dynamicTemplateData: {
			name: data.name,
			email: data.email,
			subject: data.subject,
			message: data.message,
			submittedAt: timestamp.toLocaleString(),
			currentYear: new Date().getFullYear()
		}
	};
	console.log('[EMAIL] 📧 Support message built:', {
		to: supportMsg.to,
		from: supportMsg.from,
		templateId: supportMsg.templateId,
		dataKeys: Object.keys(supportMsg.dynamicTemplateData)
	});

	// Step 5: Build Confirmation Email Message
	console.log('[EMAIL] 📧 Step 5: Building confirmation email message...');
	const confirmationMsg = {
		to: data.email,
		from: FROM_EMAIL,
		templateId: SENDGRID_TEMPLATES.CONTACT_CONFIRMATION,
		dynamicTemplateData: {
			name: data.name,
			subject: data.subject,
			message: data.message,
			submittedAt: timestamp.toLocaleString(),
			currentYear: new Date().getFullYear()
		}
	};
	console.log('[EMAIL] 📧 Confirmation message built:', {
		to: confirmationMsg.to,
		from: confirmationMsg.from,
		templateId: confirmationMsg.templateId,
		dataKeys: Object.keys(confirmationMsg.dynamicTemplateData)
	});

	try {
		// Step 6: Send Both Emails
		console.log('[EMAIL] 📤 Step 6: Sending emails...');
		console.log('[EMAIL] 📤 Attempting to send SUPPORT email to:', supportMsg.to);
		console.log('[EMAIL] 📤 Attempting to send CONFIRMATION email to:', confirmationMsg.to);
		console.log('[EMAIL] Using Promise.allSettled for independent sending...');

		// Send emails individually with separate tracking
		const results = await Promise.allSettled([
			sgMail.send(supportMsg).then(result => {
				console.log('[EMAIL] ✅ SUPPORT email sent successfully!');
				console.log('[EMAIL] Support email SendGrid response:', JSON.stringify(result, null, 2));
				return { type: 'support', success: true, result };
			}).catch(error => {
				console.error('[EMAIL] ❌ SUPPORT email FAILED:', error);
				if (error && typeof error === 'object' && 'response' in error) {
					const sgError = error as any;
					console.error('[EMAIL] Support email SendGrid error body:', sgError.response?.body);
				}
				throw error;
			}),
			sgMail.send(confirmationMsg).then(result => {
				console.log('[EMAIL] ✅ CONFIRMATION email sent successfully!');
				console.log('[EMAIL] Confirmation email SendGrid response:', JSON.stringify(result, null, 2));
				return { type: 'confirmation', success: true, result };
			}).catch(error => {
				console.error('[EMAIL] ❌ CONFIRMATION email FAILED:', error);
				if (error && typeof error === 'object' && 'response' in error) {
					const sgError = error as any;
					console.error('[EMAIL] Confirmation email SendGrid error body:', sgError.response?.body);
					console.error('[EMAIL] Confirmation email SendGrid status:', sgError.response?.statusCode);
					console.error('[EMAIL] Confirmation email SendGrid headers:', sgError.response?.headers);
				}
				throw error;
			})
		]);

		console.log('[EMAIL] 📊 Email sending results:', results);

		// Check individual results
		const supportResult = results[0];
		const confirmationResult = results[1];

		// Log results
		if (supportResult.status === 'fulfilled') {
			console.log('[EMAIL] ✅ Support email: SUCCESS');
			await logEmailSent(supportLogParams);
		} else {
			console.error('[EMAIL] ❌ Support email: FAILED -', supportResult.reason);
			await logEmailFailed(supportLogParams, supportResult.reason as Error);
		}

		if (confirmationResult.status === 'fulfilled') {
			console.log('[EMAIL] ✅ Confirmation email: SUCCESS');
			await logEmailSent(confirmationLogParams);
		} else {
			console.error('[EMAIL] ❌ Confirmation email: FAILED -', confirmationResult.reason);
			await logEmailFailed(confirmationLogParams, confirmationResult.reason as Error);
		}

		// If either failed, throw error
		if (supportResult.status === 'rejected' || confirmationResult.status === 'rejected') {
			const errors = [];
			if (supportResult.status === 'rejected') errors.push(`Support: ${supportResult.reason}`);
			if (confirmationResult.status === 'rejected') errors.push(`Confirmation: ${confirmationResult.reason}`);
			throw new Error(`Email sending failed: ${errors.join(', ')}`);
		}

		console.log('[EMAIL] ✅✅ Both contact form emails sent successfully via dynamic templates');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	} catch (error) {
		console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.error('[EMAIL] 💥💥 EXCEPTION in sendContactFormEmails');
		console.error('[EMAIL] Error type:', typeof error);
		console.error('[EMAIL] Error:', error);
		if (error && typeof error === 'object' && 'response' in error) {
			const sgError = error as any;
			console.error('[EMAIL] 💥 SendGrid error details:', sgError.response?.body);
			console.error('[EMAIL] 💥 SendGrid status code:', sgError.response?.statusCode);
		}
		console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		throw error;
	}
}

/**
 * Utility function to test if dynamic templates are configured
 */
export function isDynamicTemplatesConfigured(): boolean {
	return Object.values(SENDGRID_TEMPLATES).every(templateId => 
		templateId && templateId !== 'placeholder' && !templateId.startsWith('d-xxxxxxxxxx')
	);
}

/**
 * Get all configured template IDs for debugging
 */
export function getTemplateIds() {
	return SENDGRID_TEMPLATES;
}

/**
 * Validate that all required templates are configured
 */
export function validateTemplateConfiguration(): { valid: boolean; missing: string[] } {
	const missing: string[] = [];
	
	Object.entries(SENDGRID_TEMPLATES).forEach(([key, templateId]) => {
		if (!templateId || templateId === 'placeholder' || templateId.startsWith('d-xxxxxxxxxx') || templateId === 'undefined') {
			missing.push(key);
		}
	});
	
	return {
		valid: missing.length === 0,
		missing
	};
}

/**
 * Validate that contact form templates specifically are configured
 */
export function validateContactFormTemplates(): { valid: boolean; missing: string[] } {
	const missing: string[] = [];
	const requiredTemplates = ['CONTACT_SUPPORT', 'CONTACT_CONFIRMATION'];
	
	requiredTemplates.forEach(key => {
		const templateId = SENDGRID_TEMPLATES[key as keyof typeof SENDGRID_TEMPLATES];
		if (!templateId || templateId === 'placeholder' || templateId.startsWith('d-xxxxxxxxxx') || templateId === 'undefined') {
			missing.push(key);
		}
	});
	
	return {
		valid: missing.length === 0,
		missing
	};
}

// ============================================================
// INVOICE EMAIL FUNCTIONS (Simple HTML - No Template Required)
// ============================================================

export interface InvoiceEmailData {
	customerEmail: string;
	customerName?: string;
	invoiceId: string;
	items: Array<{ name: string; quantity: number; price: number; total: number }>;
	total: number;
	paymentUrl: string;
}

export interface InvoiceReceiptEmailData {
	customerEmail: string;
	customerName?: string;
	invoiceId: string;
	items: Array<{ name: string; quantity: number; price: number; total: number }>;
	total: number;
	paidAt: Date;
	paymentIntentId: string;
	receiptUrl: string;
}

function formatCentsToUSD(cents: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(cents / 100);
}

/**
 * Send invoice email with payment link (simple HTML, no template)
 */
export async function sendInvoiceEmail(data: InvoiceEmailData) {
	const templateData = {
		customerEmail: data.customerEmail,
		customerName: data.customerName || '',
		invoiceId: data.invoiceId,
		items: data.items,
		total: formatCentsToUSD(data.total),
		paymentUrl: data.paymentUrl
	};

	const logParams = buildLogParams(
		'invoice' as EmailType,
		data.customerEmail,
		templateData,
		{
			subject: `Invoice from Tributestream - ${formatCentsToUSD(data.total)}`,
			cc: ['tributestream@gmail.com'],
			triggeredBy: 'admin_invoice',
			invoiceId: data.invoiceId
		}
	);

	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping invoice email.');
		await logEmailMocked(logParams);
		return;
	}

	const itemsHtml = data.items
		.map(
			(item) =>
				`<tr>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCentsToUSD(item.total)}</td>
				</tr>`
		)
		.join('');

	const htmlContent = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
	<div style="text-align: center; margin-bottom: 30px;">
		<h1 style="color: #1e293b; margin: 0;">Tributestream</h1>
		<p style="color: #64748b; margin: 5px 0;">Invoice</p>
	</div>
	
	<p>Hi${data.customerName ? ` ${data.customerName}` : ''},</p>
	
	<p>You have received an invoice from Tributestream for <strong>${formatCentsToUSD(data.total)}</strong>.</p>
	
	<div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
		<p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">Invoice ID: ${data.invoiceId}</p>
		
		<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
			<thead>
				<tr style="background: #e2e8f0;">
					<th style="padding: 8px; text-align: left;">Description</th>
					<th style="padding: 8px; text-align: center;">Qty</th>
					<th style="padding: 8px; text-align: right;">Amount</th>
				</tr>
			</thead>
			<tbody>
				${itemsHtml}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="2" style="padding: 12px 8px; font-weight: bold;">Total</td>
					<td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 18px;">${formatCentsToUSD(data.total)}</td>
				</tr>
			</tfoot>
		</table>
	</div>
	
	<div style="text-align: center; margin: 30px 0;">
		<a href="${data.paymentUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
			Pay ${formatCentsToUSD(data.total)} Now
		</a>
	</div>
	
	<p style="color: #64748b; font-size: 14px;">
		Or copy this link: <a href="${data.paymentUrl}" style="color: #2563eb;">${data.paymentUrl}</a>
	</p>
	
	<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
	
	<p style="color: #94a3b8; font-size: 12px; text-align: center;">
		Thank you for choosing Tributestream.<br>
		Questions? Contact us at support@tributestream.com
	</p>
</body>
</html>
`;

	const textContent = `
Tributestream Invoice

Hi${data.customerName ? ` ${data.customerName}` : ''},

You have received an invoice from Tributestream for ${formatCentsToUSD(data.total)}.

Invoice ID: ${data.invoiceId}

Items:
${data.items.map((item) => `- ${item.name} (x${item.quantity}): ${formatCentsToUSD(item.total)}`).join('\n')}

Total: ${formatCentsToUSD(data.total)}

Pay now: ${data.paymentUrl}

Thank you for choosing Tributestream.
Questions? Contact us at support@tributestream.com
`;

	const msg = {
		to: data.customerEmail,
		cc: 'tributestream@gmail.com',
		from: FROM_EMAIL,
		subject: `Invoice from Tributestream - ${formatCentsToUSD(data.total)}`,
		text: textContent,
		html: htmlContent,
		trackingSettings: {
			clickTracking: { enable: false }
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Invoice email sent to:', data.customerEmail, '(CC: tributestream@gmail.com)');
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending invoice email:', error);
		throw error;
	}
}

/**
 * Send invoice receipt email after payment (simple HTML, no template)
 */
export async function sendInvoiceReceiptEmail(data: InvoiceReceiptEmailData) {
	const paidDate = data.paidAt.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	const templateData = {
		customerEmail: data.customerEmail,
		customerName: data.customerName || '',
		invoiceId: data.invoiceId,
		items: data.items,
		total: formatCentsToUSD(data.total),
		paidAt: paidDate,
		paymentIntentId: data.paymentIntentId,
		receiptUrl: data.receiptUrl
	};

	const logParams = buildLogParams(
		'invoice_receipt' as EmailType,
		data.customerEmail,
		templateData,
		{
			subject: 'Payment Received - Tributestream',
			triggeredBy: 'payment_webhook',
			invoiceId: data.invoiceId
		}
	);

	if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'mock_key') {
		console.warn('⚠️ SendGrid client not initialized. Skipping invoice receipt email.');
		await logEmailMocked(logParams);
		return;
	}

	const itemsHtml = data.items
		.map(
			(item) =>
				`<tr>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCentsToUSD(item.total)}</td>
				</tr>`
		)
		.join('');

	const htmlContent = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
	<div style="text-align: center; margin-bottom: 30px;">
		<h1 style="color: #1e293b; margin: 0;">Tributestream</h1>
		<p style="color: #16a34a; margin: 5px 0;">✓ Payment Received</p>
	</div>
	
	<p>Hi${data.customerName ? ` ${data.customerName}` : ''},</p>
	
	<p>Thank you for your payment of <strong>${formatCentsToUSD(data.total)}</strong>.</p>
	
	<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
		<p style="margin: 0 0 5px; color: #64748b; font-size: 14px;">Invoice ID: ${data.invoiceId}</p>
		<p style="margin: 0 0 5px; color: #64748b; font-size: 14px;">Payment Date: ${paidDate}</p>
		<p style="margin: 0; color: #64748b; font-size: 14px;">Reference: ${data.paymentIntentId}</p>
	</div>
	
	<div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
		<table style="width: 100%; border-collapse: collapse;">
			<thead>
				<tr style="background: #e2e8f0;">
					<th style="padding: 8px; text-align: left;">Description</th>
					<th style="padding: 8px; text-align: center;">Qty</th>
					<th style="padding: 8px; text-align: right;">Amount</th>
				</tr>
			</thead>
			<tbody>
				${itemsHtml}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="2" style="padding: 12px 8px; font-weight: bold;">Total Paid</td>
					<td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">${formatCentsToUSD(data.total)}</td>
				</tr>
			</tfoot>
		</table>
	</div>
	
	<div style="text-align: center; margin: 30px 0;">
		<a href="${data.receiptUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
			View Receipt
		</a>
	</div>
	
	<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
	
	<p style="color: #94a3b8; font-size: 12px; text-align: center;">
		Thank you for choosing Tributestream.<br>
		Questions? Contact us at support@tributestream.com
	</p>
</body>
</html>
`;

	const textContent = `
Tributestream - Payment Received

Hi${data.customerName ? ` ${data.customerName}` : ''},

Thank you for your payment of ${formatCentsToUSD(data.total)}.

Invoice ID: ${data.invoiceId}
Payment Date: ${paidDate}
Reference: ${data.paymentIntentId}

Items:
${data.items.map((item) => `- ${item.name} (x${item.quantity}): ${formatCentsToUSD(item.total)}`).join('\n')}

Total Paid: ${formatCentsToUSD(data.total)}

View your receipt: ${data.receiptUrl}

Thank you for choosing Tributestream.
Questions? Contact us at support@tributestream.com
`;

	const msg = {
		to: data.customerEmail,
		from: FROM_EMAIL,
		subject: `Payment Received - Tributestream`,
		text: textContent,
		html: htmlContent,
		trackingSettings: {
			clickTracking: { enable: false }
		}
	};

	try {
		const [response] = await sgMail.send(msg);
		const messageId = response?.headers?.['x-message-id'];
		await logEmailSent(logParams, messageId);
		console.log('✅ Invoice receipt email sent to:', data.customerEmail);
	} catch (error) {
		await logEmailFailed(logParams, error as Error);
		console.error('💥 Exception sending invoice receipt email:', error);
		throw error;
	}
}
