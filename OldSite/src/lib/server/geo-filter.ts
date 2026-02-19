/**
 * Geographic IP Filtering for Spam Prevention
 * Blocks or flags requests from suspicious countries
 */

// List of country codes to block (ISO 3166-1 alpha-2 codes)
// Based on spam patterns - adjust as needed
const BLOCKED_COUNTRIES = new Set([
	'SG', // Singapore - reported spam source
	'CN', // China - common bot source
	'RU', // Russia
	'UA', // Ukraine
	'VN', // Vietnam
	'ID', // Indonesia
	'PK', // Pakistan
	'BD', // Bangladesh
	'NG', // Nigeria
]);

// Countries to flag for extra scrutiny (still allow but log)
const SUSPICIOUS_COUNTRIES = new Set([
	'IN', // India
	'PH', // Philippines
	'BR', // Brazil
	'TH', // Thailand
]);

/**
 * Check if a country code is blocked
 */
export function isCountryBlocked(countryCode: string): boolean {
	return BLOCKED_COUNTRIES.has(countryCode.toUpperCase());
}

/**
 * Check if a country code is suspicious
 */
export function isCountrySuspicious(countryCode: string): boolean {
	return SUSPICIOUS_COUNTRIES.has(countryCode.toUpperCase());
}

/**
 * Get country code from Cloudflare headers
 */
export function getCountryFromRequest(request: Request): string | null {
	// Cloudflare provides country code in CF-IPCountry header
	const cfCountry = request.headers.get('cf-ipcountry');
	return cfCountry ? cfCountry.toUpperCase() : null;
}

/**
 * Check if request is from a blocked or suspicious country
 * Returns { blocked: boolean, suspicious: boolean, country: string | null, reason?: string }
 */
export function checkGeoLocation(request: Request): {
	blocked: boolean;
	suspicious: boolean;
	country: string | null;
	reason?: string;
} {
	const country = getCountryFromRequest(request);

	if (!country) {
		// No country information available
		return {
			blocked: false,
			suspicious: true, // Flag as suspicious since we can't verify
			country: null,
			reason: 'Country information unavailable'
		};
	}

	if (isCountryBlocked(country)) {
		return {
			blocked: true,
			suspicious: true,
			country,
			reason: `Registration from ${country} is currently blocked due to spam activity`
		};
	}

	if (isCountrySuspicious(country)) {
		return {
			blocked: false,
			suspicious: true,
			country,
			reason: `Registration from ${country} flagged for review`
		};
	}

	return {
		blocked: false,
		suspicious: false,
		country
	};
}

/**
 * Get country name from code (limited set)
 */
const COUNTRY_NAMES: Record<string, string> = {
	SG: 'Singapore',
	CN: 'China',
	RU: 'Russia',
	UA: 'Ukraine',
	VN: 'Vietnam',
	ID: 'Indonesia',
	PK: 'Pakistan',
	BD: 'Bangladesh',
	NG: 'Nigeria',
	IN: 'India',
	PH: 'Philippines',
	BR: 'Brazil',
	TH: 'Thailand',
	US: 'United States',
	CA: 'Canada',
	GB: 'United Kingdom',
	AU: 'Australia',
	NZ: 'New Zealand'
};

export function getCountryName(countryCode: string): string {
	return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode;
}

/**
 * Log suspicious activity to console (extend to external logging service)
 */
export function logSuspiciousActivity(data: {
	ip: string;
	country: string | null;
	email?: string;
	reason: string;
	endpoint: string;
}): void {
	const timestamp = new Date().toISOString();
	console.warn(
		`[SECURITY ALERT ${timestamp}] Suspicious activity detected:\n` +
		`  Endpoint: ${data.endpoint}\n` +
		`  IP: ${data.ip}\n` +
		`  Country: ${data.country ? `${getCountryName(data.country)} (${data.country})` : 'Unknown'}\n` +
		`  Email: ${data.email || 'N/A'}\n` +
		`  Reason: ${data.reason}`
	);

	// TODO: Send to external logging service (Sentry, LogRocket, etc.)
	// TODO: Send alert email to admin
	// TODO: Store in database for analysis
}

/**
 * Temporarily whitelist a country (for testing or legitimate users)
 */
const WHITELISTED_COUNTRIES = new Set<string>();

export function whitelistCountry(countryCode: string): void {
	WHITELISTED_COUNTRIES.add(countryCode.toUpperCase());
	console.log(`✅ Country ${getCountryName(countryCode)} (${countryCode}) whitelisted`);
}

export function removeCountryFromWhitelist(countryCode: string): void {
	WHITELISTED_COUNTRIES.delete(countryCode.toUpperCase());
	console.log(`❌ Country ${getCountryName(countryCode)} (${countryCode}) removed from whitelist`);
}

export function isCountryWhitelisted(countryCode: string): boolean {
	return WHITELISTED_COUNTRIES.has(countryCode.toUpperCase());
}

/**
 * Add country to block list dynamically
 */
export function blockCountry(countryCode: string): void {
	BLOCKED_COUNTRIES.add(countryCode.toUpperCase());
	console.warn(`🚫 Country ${getCountryName(countryCode)} (${countryCode}) added to block list`);
}

export function unblockCountry(countryCode: string): void {
	BLOCKED_COUNTRIES.delete(countryCode.toUpperCase());
	console.log(`✅ Country ${getCountryName(countryCode)} (${countryCode}) removed from block list`);
}
