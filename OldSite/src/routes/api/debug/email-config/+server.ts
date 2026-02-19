import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { 
	SENDGRID_TEMPLATES, 
	validateTemplateConfiguration, 
	getTemplateIds,
	isDynamicTemplatesConfigured 
} from '$lib/server/email';
import { env } from '$env/dynamic/private';

const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
const FROM_EMAIL = env.FROM_EMAIL;

export const GET: RequestHandler = async () => {
	try {
		const validation = validateTemplateConfiguration();
		const templateIds = getTemplateIds();
		const isConfigured = isDynamicTemplatesConfigured();
		
		return json({
			success: true,
			sendgridConfigured: !!SENDGRID_API_KEY && SENDGRID_API_KEY !== 'mock_key',
			fromEmail: FROM_EMAIL || 'NOT_SET',
			templatesConfigured: isConfigured,
			validation,
			templateIds,
			environment: process.env.NODE_ENV || 'unknown'
		});
	} catch (error) {
		console.error('Email config debug error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			sendgridConfigured: false,
			templatesConfigured: false
		});
	}
};
