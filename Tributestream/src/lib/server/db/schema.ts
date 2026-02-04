import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Role enum values
export const USER_ROLES = ['admin', 'funeral_director', 'videographer', 'family_member', 'contributor', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Memorial status enum values
export const MEMORIAL_STATUSES = ['draft', 'scheduled', 'live', 'ended', 'archived'] as const;
export type MemorialStatus = (typeof MEMORIAL_STATUSES)[number];

// Device status enum values
export const DEVICE_STATUSES = ['connected', 'disconnected', 'streaming'] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

// ============================================================================
// USERS
// ============================================================================
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	email: text('email').unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role').$type<UserRole>().notNull().default('viewer'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// ============================================================================
// SESSIONS (with multi-device support)
// ============================================================================
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	deviceName: text('device_name'),
	deviceType: text('device_type') // 'browser', 'phone_camera', 'tablet'
});

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

// ============================================================================
// MEMORIALS
// ============================================================================
export const memorial = sqliteTable('memorial', {
	id: text('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	description: text('description'),
	scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
	status: text('status').$type<MemorialStatus>().notNull().default('draft'),
	funeralDirectorId: text('funeral_director_id').references(() => user.id),
	muxStreamKey: text('mux_stream_key'),
	muxPlaybackId: text('mux_playback_id'),
	chatEnabled: integer('chat_enabled', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export type Memorial = typeof memorial.$inferSelect;
export type NewMemorial = typeof memorial.$inferInsert;

// ============================================================================
// DEVICES (Camera Rig for Videographer)
// ============================================================================
export const device = sqliteTable('device', {
	id: text('id').primaryKey(),
	sessionToken: text('session_token').notNull().unique(),
	memorialId: text('memorial_id').references(() => memorial.id),
	userId: text('user_id').references(() => user.id),
	deviceName: text('device_name').notNull(),
	status: text('status').$type<DeviceStatus>().notNull().default('disconnected'),
	batteryLevel: integer('battery_level'),
	lastSeen: integer('last_seen', { mode: 'timestamp' })
});

export type Device = typeof device.$inferSelect;
export type NewDevice = typeof device.$inferInsert;

// ============================================================================
// AUDIT LOG (for SOC2 compliance)
// ============================================================================
export const auditLog = sqliteTable('audit_log', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id),
	action: text('action').notNull(), // e.g., 'memorial.created', 'user.role_changed'
	targetType: text('target_type'), // e.g., 'memorial', 'user'
	targetId: text('target_id'),
	metadata: text('metadata'), // JSON string for additional context
	ipAddress: text('ip_address'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
