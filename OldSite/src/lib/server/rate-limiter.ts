/**
 * Rate Limiting Utility for Spam Prevention
 * Implements in-memory rate limiting with IP-based tracking
 */

interface RateLimitEntry {
	count: number;
	firstAttempt: number;
	lastAttempt: number;
}

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxAttempts: number; // Maximum attempts allowed in window
	blockDurationMs?: number; // How long to block after exceeding limit
}

// In-memory storage (consider Redis for production multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();
const blockedIPs = new Map<string, number>(); // IP -> unblock timestamp

// Cleanup old entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	const fiveMinutesAgo = now - 5 * 60 * 1000;

	// Cleanup rate limit entries
	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.lastAttempt < fiveMinutesAgo) {
			rateLimitStore.delete(key);
		}
	}

	// Cleanup expired blocks
	for (const [ip, unblockTime] of blockedIPs.entries()) {
		if (now > unblockTime) {
			blockedIPs.delete(ip);
		}
	}
}, 5 * 60 * 1000);

/**
 * Check if an IP is currently blocked
 */
export function isIPBlocked(ip: string): boolean {
	const unblockTime = blockedIPs.get(ip);
	if (!unblockTime) return false;

	if (Date.now() > unblockTime) {
		blockedIPs.delete(ip);
		return false;
	}

	return true;
}

/**
 * Block an IP for a specified duration
 */
export function blockIP(ip: string, durationMs: number): void {
	const unblockTime = Date.now() + durationMs;
	blockedIPs.set(ip, unblockTime);
	console.warn(`🚫 IP ${ip} blocked until ${new Date(unblockTime).toISOString()}`);
}

/**
 * Check rate limit for a specific identifier (usually IP address)
 * Returns { allowed: boolean, retryAfter?: number }
 */
export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig
): { allowed: boolean; retryAfter?: number; remaining?: number } {
	const now = Date.now();

	// Check if IP is blocked
	if (isIPBlocked(identifier)) {
		const unblockTime = blockedIPs.get(identifier)!;
		return {
			allowed: false,
			retryAfter: Math.ceil((unblockTime - now) / 1000)
		};
	}

	const key = identifier;
	const entry = rateLimitStore.get(key);

	if (!entry) {
		// First attempt
		rateLimitStore.set(key, {
			count: 1,
			firstAttempt: now,
			lastAttempt: now
		});
		return { allowed: true, remaining: config.maxAttempts - 1 };
	}

	const windowExpired = now - entry.firstAttempt > config.windowMs;

	if (windowExpired) {
		// Window expired, reset counter
		rateLimitStore.set(key, {
			count: 1,
			firstAttempt: now,
			lastAttempt: now
		});
		return { allowed: true, remaining: config.maxAttempts - 1 };
	}

	// Within window, check if limit exceeded
	if (entry.count >= config.maxAttempts) {
		const retryAfter = Math.ceil((entry.firstAttempt + config.windowMs - now) / 1000);

		// If blockDuration is set, block the IP
		if (config.blockDurationMs) {
			blockIP(identifier, config.blockDurationMs);
		}

		return { allowed: false, retryAfter };
	}

	// Increment counter
	entry.count++;
	entry.lastAttempt = now;
	rateLimitStore.set(key, entry);

	return { allowed: true, remaining: config.maxAttempts - entry.count };
}

/**
 * Extract client IP from request
 */
export function getClientIP(request: Request): string {
	// Check Cloudflare headers first
	const cfConnectingIp = request.headers.get('cf-connecting-ip');
	if (cfConnectingIp) return cfConnectingIp;

	// Check standard forwarding headers
	const xForwardedFor = request.headers.get('x-forwarded-for');
	if (xForwardedFor) {
		const ips = xForwardedFor.split(',').map(ip => ip.trim());
		return ips[0]; // Return first IP (original client)
	}

	const xRealIp = request.headers.get('x-real-ip');
	if (xRealIp) return xRealIp;

	// Fallback to 'unknown' if no IP found
	return 'unknown';
}

/**
 * Predefined rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
	// Memorial registration: 3 attempts per hour, block for 24 hours if exceeded
	MEMORIAL_REGISTRATION: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxAttempts: 3,
		blockDurationMs: 24 * 60 * 60 * 1000 // 24 hours
	},

	// Login attempts: 5 per 15 minutes
	LOGIN: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxAttempts: 5,
		blockDurationMs: 60 * 60 * 1000 // 1 hour
	},

	// Contact form: 5 per hour
	CONTACT_FORM: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxAttempts: 5,
		blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours
	},

	// API requests: 100 per 5 minutes
	API_GENERAL: {
		windowMs: 5 * 60 * 1000, // 5 minutes
		maxAttempts: 100
	}
} as const;

/**
 * Get remaining time for blocked IP in human-readable format
 */
export function getBlockedTimeRemaining(ip: string): string | null {
	const unblockTime = blockedIPs.get(ip);
	if (!unblockTime) return null;

	const remaining = unblockTime - Date.now();
	if (remaining <= 0) return null;

	const hours = Math.floor(remaining / (60 * 60 * 1000));
	const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

	if (hours > 0) {
		return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
	}
	return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
