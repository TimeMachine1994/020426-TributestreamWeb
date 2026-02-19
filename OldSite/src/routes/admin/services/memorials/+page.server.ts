import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params for filtering/sorting
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDir = url.searchParams.get('sortDir') || 'desc';
	const searchQuery = (url.searchParams.get('q') || '').trim().toLowerCase();

	// Load memorials (we'll filter deleted ones client-side since not all docs have isDeleted field)
	let snapshot;
	try {
		let query = adminDb.collection('memorials').orderBy(sortBy, sortDir as any).limit(limit);
		snapshot = await query.get();
	} catch (error) {
		console.error('Error loading memorials with sorting:', error);
		// Fallback to no sorting if index doesn't exist
		let query = adminDb.collection('memorials').limit(limit);
		snapshot = await query.get();
	}

	const rawMemorials = snapshot.docs
		.filter((doc) => {
			const data = doc.data();
			// Client-side filter for deleted memorials (in case fallback query loaded them)
			return !data.isDeleted;
		})
		.map((doc) => {
			const data = doc.data();
			
			// Extract scheduled start time (main service)
			let scheduledStartTime = null;
			if (
				data.services?.main?.time?.date &&
				data.services?.main?.time?.time &&
				!data.services.main.time.isUnknown
			) {
				scheduledStartTime = `${data.services.main.time.date}T${data.services.main.time.time}`;
			}

			// Extract location summary
			const mainLocationName = data.services?.main?.location?.name as string | undefined;
			const additionalServices = Array.isArray(data.services?.additional)
				? data.services.additional
				: [];
			const additionalLocationNames = additionalServices
				.map((service: { location?: { name?: string } }) => service?.location?.name)
				.filter((name: string | undefined): name is string => Boolean(name));

			let location: string;
			if (mainLocationName) {
				location = mainLocationName;
				if (additionalLocationNames.length > 0) {
					location += ` (+${additionalLocationNames.length} more)`;
				}
			} else if (additionalLocationNames.length > 0) {
				location = additionalLocationNames[0];
				if (additionalLocationNames.length > 1) {
					location += ` (+${additionalLocationNames.length - 1} more)`;
				}
			} else {
				location = 'Not specified';
			}

			// Payment status
			const isPaid = data.isPaid || data.calculatorConfig?.isPaid || false;

			return {
				id: doc.id,
				lovedOneName: data.lovedOneName || 'Unknown',
				customTitle: data.customTitle || null,
				fullSlug: data.fullSlug,
				creatorEmail: data.creatorEmail || '',
				creatorName: data.creatorName || '',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				isPublic: data.isPublic !== false,
				isComplete: data.isComplete || false,
				isPaid,
				scheduledStartTime,
				location,
				paymentAmount: data.calculatorConfig?.totalPrice || null
			};
		});

	// In-memory search across key fields (memorial + owner) for now
	const memorials = searchQuery
		? rawMemorials.filter((memorial) => {
			const haystack = [
				memorial.lovedOneName,
				memorial.fullSlug,
				memorial.creatorEmail,
				memorial.creatorName,
				memorial.location
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();

			return haystack.includes(searchQuery);
		})
		: rawMemorials;

	return {
		memorials,
		searchQuery,
		pagination: {
			page,
			limit,
			total: memorials.length
		}
	};
};
