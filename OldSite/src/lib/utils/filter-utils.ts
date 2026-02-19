/**
 * FILTER UTILITY FUNCTIONS
 * 
 * Apply FilterBuilder rules to data arrays for client-side filtering
 */

export interface FilterRule {
	field: string;
	operator: string;
	value: any;
	type: string;
}

/**
 * Apply filter rules to data array (client-side filtering)
 * 
 * @param data - Array of data objects to filter
 * @param rules - Array of filter rules to apply
 * @returns Filtered array matching all rules (AND logic)
 */
export function applyFilters<T extends Record<string, any>>(
	data: T[],
	rules: FilterRule[]
): T[] {
	if (!rules || rules.length === 0) {
		return data;
	}

	return data.filter((item) => {
		return rules.every((rule) => matchesRule(item, rule));
	});
}

/**
 * Check if a single item matches a filter rule
 * 
 * @param item - Data object to check
 * @param rule - Filter rule to apply
 * @returns True if item matches the rule
 */
function matchesRule<T extends Record<string, any>>(item: T, rule: FilterRule): boolean {
	const fieldValue = item[rule.field];

	switch (rule.operator) {
		// String operators
		case 'eq':
			return fieldValue === rule.value;

		case 'ne':
			return fieldValue !== rule.value;

		case 'contains':
			return String(fieldValue || '')
				.toLowerCase()
				.includes(String(rule.value).toLowerCase());

		case 'startsWith':
			return String(fieldValue || '')
				.toLowerCase()
				.startsWith(String(rule.value).toLowerCase());

		case 'isNull':
			return !fieldValue || fieldValue === '';

		case 'isNotNull':
			return !!fieldValue && fieldValue !== '';

		// Number operators
		case 'gt':
			return Number(fieldValue) > Number(rule.value);

		case 'gte':
			return Number(fieldValue) >= Number(rule.value);

		case 'lt':
			return Number(fieldValue) < Number(rule.value);

		case 'lte':
			return Number(fieldValue) <= Number(rule.value);

		default:
			console.warn(`Unknown filter operator: ${rule.operator}`);
			return true;
	}
}

/**
 * Build URL search parameters from filter rules
 * 
 * @param rules - Filter rules to encode
 * @returns URLSearchParams object
 */
export function buildFilterParams(rules: FilterRule[]): URLSearchParams {
	const params = new URLSearchParams();

	rules.forEach((rule, index) => {
		params.set(`filter[${index}][field]`, rule.field);
		params.set(`filter[${index}][operator]`, rule.operator);
		params.set(`filter[${index}][value]`, String(rule.value));
		params.set(`filter[${index}][type]`, rule.type);
	});

	return params;
}

/**
 * Parse URL search parameters into filter rules
 * 
 * @param searchParams - URLSearchParams to parse
 * @returns Array of filter rules
 */
export function parseFilterParams(searchParams: URLSearchParams): FilterRule[] {
	const rules: FilterRule[] = [];
	const indices = new Set<number>();

	for (const key of searchParams.keys()) {
		const match = key.match(/^filter\[(\d+)\]/);
		if (match) {
			indices.add(parseInt(match[1]));
		}
	}

	for (const index of Array.from(indices).sort()) {
		const field = searchParams.get(`filter[${index}][field]`);
		const operator = searchParams.get(`filter[${index}][operator]`);
		const value = searchParams.get(`filter[${index}][value]`);
		const type = searchParams.get(`filter[${index}][type]`);

		if (field && operator && type) {
			rules.push({
				field,
				operator,
				value: parseValue(value, type),
				type
			});
		}
	}

	return rules;
}

/**
 * Parse value based on field type
 * 
 * @param value - String value from URL params
 * @param type - Field type
 * @returns Parsed value
 */
function parseValue(value: string | null, type: string): any {
	if (value === null) return '';

	switch (type) {
		case 'number':
			return Number(value);
		case 'boolean':
			return value === 'true';
		default:
			return value;
	}
}
