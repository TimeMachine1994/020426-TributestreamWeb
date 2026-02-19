import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Role enum values
export const USER_ROLES = ['admin', 'funeral_director', 'videographer', 'family_member', 'contributor', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Memorial status enum values
export const MEMORIAL_STATUSES = ['draft', 'scheduled', 'live', 'ended', 'archived'] as const;
export type MemorialStatus = (typeof MEMORIAL_STATUSES)[number];

// Device status enum values
export const DEVICE_STATUSES = ['pending', 'connecting', 'connected', 'disconnected', 'streaming'] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

// Payment status enum values
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'manual', 'refunded'] as const;
export type PaymentStatusEnum = (typeof PAYMENT_STATUSES)[number];

// Stream status enum values
export const STREAM_STATUSES = ['idle', 'scheduled', 'live', 'ended', 'archived'] as const;
export type StreamStatusEnum = (typeof STREAM_STATUSES)[number];

// ============================================================================
// USERS
// ============================================================================
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	displayName: text('display_name'),
	phone: text('phone'),
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
	assignedVideographerId: text('assigned_videographer_id').references(() => user.id),
	muxStreamKey: text('mux_stream_key'),
	muxPlaybackId: text('mux_playback_id'),
	muxAssetId: text('mux_asset_id'),
	livekitRoomName: text('livekit_room_name'),
	egressId: text('egress_id'),
	chatEnabled: integer('chat_enabled', { mode: 'boolean' }).notNull().default(true),

	// --- Calculator / Booking fields ---
	lovedOneName: text('loved_one_name'),
	fullSlug: text('full_slug').unique(),
	ownerId: text('owner_id').references(() => user.id),
	isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
	imageUrl: text('image_url'),
	birthDate: text('birth_date'),
	deathDate: text('death_date'),
	content: text('content'),
	servicesJson: text('services_json'),
	calculatorConfigJson: text('calculator_config_json'),
	isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
	paymentStatus: text('payment_status').$type<PaymentStatusEnum>().default('unpaid'),
	totalPrice: real('total_price'),
	familyContactName: text('family_contact_name'),
	familyContactEmail: text('family_contact_email'),
	familyContactPhone: text('family_contact_phone'),
	directorFullName: text('director_full_name'),
	directorEmail: text('director_email'),
	funeralHomeName: text('funeral_home_name'),
	customPricingJson: text('custom_pricing_json'),

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
	token: text('token').notNull().unique(),
	memorialId: text('memorial_id')
		.notNull()
		.references(() => memorial.id),
	userId: text('user_id').references(() => user.id),
	name: text('name'),
	type: text('type').$type<'phone' | 'webcam' | 'rtmp'>().default('phone'),
	status: text('status').$type<DeviceStatus>().notNull().default('pending'),
	batteryLevel: integer('battery_level'),
	tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp' }).notNull(),
	connectedAt: integer('connected_at', { mode: 'timestamp' }),
	lastSeen: integer('last_seen', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
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

// ============================================================================
// STREAMS (one per service location/day, created by calculator)
// ============================================================================
export const stream = sqliteTable('stream', {
	id: text('id').primaryKey(),
	memorialId: text('memorial_id')
		.notNull()
		.references(() => memorial.id),
	title: text('title').notNull(),
	description: text('description'),
	status: text('status').$type<StreamStatusEnum>().notNull().default('idle'),
	scheduledStartTime: integer('scheduled_start_time', { mode: 'timestamp' }),
	muxLiveStreamId: text('mux_live_stream_id'),
	muxStreamKey: text('mux_stream_key'),
	muxPlaybackId: text('mux_playback_id'),
	muxRecordingReady: integer('mux_recording_ready', { mode: 'boolean' }).notNull().default(false),
	calculatorServiceType: text('calculator_service_type'),
	calculatorServiceIndex: integer('calculator_service_index'),
	createdBy: text('created_by').references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export type Stream = typeof stream.$inferSelect;
export type NewStream = typeof stream.$inferInsert;
