/**
 * Email Audit Logging Service
 * 
 * Tracks all emails sent from the system, storing full template data
 * for admin review and debugging purposes.
 */

import { adminDb } from './firebase';
import { env } from '$env/dynamic/private';
import type { EmailAuditLog, LogEmailParams, EmailEnvironment } from '$lib/types/email-audit';

const FROM_EMAIL = env.FROM_EMAIL || 'noreply@tributestream.com';
const NODE_ENV = env.NODE_ENV || 'development';

/**
 * Sanitize sensitive data before logging
 * Masks passwords but keeps first/last chars for verification
 */
function sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };
  
  // Mask password but keep first 2 and last 2 chars for verification
  if (sanitized.password && typeof sanitized.password === 'string') {
    const pwd = sanitized.password;
    if (pwd.length > 4) {
      sanitized.password = `${pwd.slice(0, 2)}${'*'.repeat(pwd.length - 4)}${pwd.slice(-2)}`;
    } else {
      sanitized.password = '****';
    }
    sanitized._passwordLength = pwd.length;
  }
  
  // Note presence of sensitive links without exposing full tokens
  if (sanitized.magicLink && typeof sanitized.magicLink === 'string') {
    sanitized._magicLinkIncluded = true;
    // Keep the base URL but mask the token
    const url = sanitized.magicLink as string;
    if (url.includes('?')) {
      sanitized.magicLink = url.split('?')[0] + '?token=***MASKED***';
    }
  }
  
  if (sanitized.resetLink && typeof sanitized.resetLink === 'string') {
    sanitized._resetLinkIncluded = true;
    const url = sanitized.resetLink as string;
    if (url.includes('?')) {
      sanitized.resetLink = url.split('?')[0] + '?token=***MASKED***';
    }
  }
  
  if (sanitized.confirmationUrl && typeof sanitized.confirmationUrl === 'string') {
    sanitized._confirmationUrlIncluded = true;
    const url = sanitized.confirmationUrl as string;
    if (url.includes('?')) {
      sanitized.confirmationUrl = url.split('?')[0] + '?token=***MASKED***';
    }
  }

  if (sanitized.calculatorMagicLink && typeof sanitized.calculatorMagicLink === 'string') {
    sanitized._calculatorMagicLinkIncluded = true;
    const url = sanitized.calculatorMagicLink as string;
    if (url.includes('?')) {
      sanitized.calculatorMagicLink = url.split('?')[0] + '?token=***MASKED***';
    }
  }
  
  return sanitized;
}

/**
 * Get the current environment
 */
function getEnvironment(): EmailEnvironment {
  if (NODE_ENV === 'production') return 'production';
  if (NODE_ENV === 'test') return 'test';
  return 'development';
}

/**
 * Log a successfully sent email
 */
export async function logEmailSent(
  params: LogEmailParams,
  sendgridMessageId?: string
): Promise<string> {
  try {
    const logEntry: Omit<EmailAuditLog, 'id'> = {
      type: params.type,
      to: params.to,
      cc: params.cc,
      from: FROM_EMAIL,
      templateId: params.templateId,
      templateName: params.templateName,
      subject: params.subject,
      templateData: sanitizeForLog(params.templateData),
      sentAt: new Date(),
      triggeredBy: params.triggeredBy,
      triggeredByUserId: params.triggeredByUserId,
      triggeredByAdminId: params.triggeredByAdminId,
      memorialId: params.memorialId,
      userId: params.userId,
      invoiceId: params.invoiceId,
      streamId: params.streamId,
      status: 'sent',
      sendgridMessageId,
      environment: getEnvironment()
    };

    const docRef = await adminDb.collection('email_audit_logs').add(logEntry);
    console.log(`📧 [EMAIL AUDIT] Logged sent email: ${params.type} to ${params.to} (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    // Don't let audit logging failures break email sending
    console.error('📧 [EMAIL AUDIT] Failed to log sent email:', error);
    return '';
  }
}

/**
 * Log a failed email attempt
 */
export async function logEmailFailed(
  params: LogEmailParams,
  error: Error | string
): Promise<string> {
  try {
    const errorMessage = error instanceof Error ? error.message : error;
    
    const logEntry: Omit<EmailAuditLog, 'id'> = {
      type: params.type,
      to: params.to,
      cc: params.cc,
      from: FROM_EMAIL,
      templateId: params.templateId,
      templateName: params.templateName,
      subject: params.subject,
      templateData: sanitizeForLog(params.templateData),
      sentAt: new Date(),
      triggeredBy: params.triggeredBy,
      triggeredByUserId: params.triggeredByUserId,
      triggeredByAdminId: params.triggeredByAdminId,
      memorialId: params.memorialId,
      userId: params.userId,
      invoiceId: params.invoiceId,
      streamId: params.streamId,
      status: 'failed',
      error: errorMessage,
      environment: getEnvironment()
    };

    const docRef = await adminDb.collection('email_audit_logs').add(logEntry);
    console.log(`📧 [EMAIL AUDIT] Logged FAILED email: ${params.type} to ${params.to} (${docRef.id})`);
    return docRef.id;
  } catch (logError) {
    // Don't let audit logging failures mask the original error
    console.error('📧 [EMAIL AUDIT] Failed to log failed email:', logError);
    return '';
  }
}

/**
 * Log a mocked email (dev mode)
 */
export async function logEmailMocked(params: LogEmailParams): Promise<string> {
  try {
    const logEntry: Omit<EmailAuditLog, 'id'> = {
      type: params.type,
      to: params.to,
      cc: params.cc,
      from: FROM_EMAIL,
      templateId: params.templateId,
      templateName: params.templateName,
      subject: params.subject,
      templateData: sanitizeForLog(params.templateData),
      sentAt: new Date(),
      triggeredBy: params.triggeredBy,
      triggeredByUserId: params.triggeredByUserId,
      triggeredByAdminId: params.triggeredByAdminId,
      memorialId: params.memorialId,
      userId: params.userId,
      invoiceId: params.invoiceId,
      streamId: params.streamId,
      status: 'mocked',
      environment: getEnvironment()
    };

    const docRef = await adminDb.collection('email_audit_logs').add(logEntry);
    console.log(`📧 [EMAIL AUDIT] Logged MOCKED email: ${params.type} to ${params.to} (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    // Don't let audit logging failures break the flow
    console.error('📧 [EMAIL AUDIT] Failed to log mocked email:', error);
    return '';
  }
}

/**
 * Helper to build log params from common email data patterns
 */
export function buildLogParams(
  type: LogEmailParams['type'],
  to: string,
  templateData: Record<string, unknown>,
  options: {
    templateId?: string;
    templateName?: string;
    subject?: string;
    cc?: string[];
    triggeredBy?: string;
    triggeredByUserId?: string;
    triggeredByAdminId?: string;
    memorialId?: string;
    userId?: string;
    invoiceId?: string;
    streamId?: string;
  } = {}
): LogEmailParams {
  return {
    type,
    to,
    templateData,
    templateId: options.templateId,
    templateName: options.templateName,
    subject: options.subject,
    cc: options.cc,
    triggeredBy: options.triggeredBy || type,
    triggeredByUserId: options.triggeredByUserId,
    triggeredByAdminId: options.triggeredByAdminId,
    memorialId: options.memorialId,
    userId: options.userId,
    invoiceId: options.invoiceId,
    streamId: options.streamId
  };
}
