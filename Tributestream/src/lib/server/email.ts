/**
 * Email service stub.
 * TODO: Replace with Resend/SendGrid integration and RESEND_API_KEY env var.
 */

interface RegistrationEmailParams {
	email: string;
	displayName: string;
	password: string;
	lovedOneName: string;
	memorialUrl: string;
}

export async function sendRegistrationEmail(params: RegistrationEmailParams): Promise<void> {
	console.log('');
	console.log('═══════════════════════════════════════════════════');
	console.log('📧  REGISTRATION EMAIL (STUB)');
	console.log('═══════════════════════════════════════════════════');
	console.log(`  To:        ${params.email}`);
	console.log(`  Name:      ${params.displayName}`);
	console.log(`  Password:  ${params.password}`);
	console.log(`  Memorial:  ${params.lovedOneName}`);
	console.log(`  URL:       ${params.memorialUrl}`);
	console.log('═══════════════════════════════════════════════════');
	console.log('');
}
