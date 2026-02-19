/**
 * Email Audit System Types
 * 
 * Types for tracking all emails sent from the system,
 * allowing admins to review email contents and verify correct data was sent.
 */

export type EmailType = 
  | 'enhanced_registration'
  | 'basic_registration'
  | 'funeral_director_registration'
  | 'invitation'
  | 'email_change_confirmation'
  | 'payment_confirmation'
  | 'payment_action_required'
  | 'payment_failure'
  | 'password_reset'
  | 'owner_welcome'
  | 'funeral_director_welcome'
  | 'contact_form_support'
  | 'contact_form_confirmation'
  | 'invoice'
  | 'invoice_receipt';

export type EmailStatus = 'sent' | 'failed' | 'mocked';

export type EmailEnvironment = 'production' | 'development' | 'test';

export interface EmailAuditLog {
  id: string;
  
  // Email identification
  type: EmailType;
  templateId?: string;
  templateName?: string;
  
  // Recipients
  to: string;
  cc?: string[];
  from: string;
  
  // Content
  subject?: string;
  templateData: Record<string, unknown>;
  
  // Timestamps
  sentAt: Date | string;
  
  // Context
  triggeredBy: string;
  triggeredByUserId?: string;
  triggeredByAdminId?: string;
  
  // Related entities
  memorialId?: string;
  userId?: string;
  invoiceId?: string;
  streamId?: string;
  
  // Status & tracking
  status: EmailStatus;
  error?: string;
  sendgridMessageId?: string;
  
  // Metadata
  environment: EmailEnvironment;
}

export interface LogEmailParams {
  type: EmailType;
  to: string;
  cc?: string[];
  templateId?: string;
  templateName?: string;
  subject?: string;
  templateData: Record<string, unknown>;
  triggeredBy: string;
  triggeredByUserId?: string;
  triggeredByAdminId?: string;
  memorialId?: string;
  userId?: string;
  invoiceId?: string;
  streamId?: string;
}

export interface EmailAuditLogListItem {
  id: string;
  type: EmailType;
  to: string;
  templateName?: string;
  subject?: string;
  sentAt: string;
  status: EmailStatus;
  memorialId?: string;
  error?: string;
}

export interface EmailAuditStats {
  total: number;
  sent: number;
  failed: number;
  mocked: number;
  byType: Record<EmailType, number>;
}
