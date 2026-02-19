import { redirect, fail } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { Actions } from './$types';

/**
 * SIMPLIFIED ADMIN DASHBOARD SERVER LOAD
 *
 * Purpose: Load essential data for admin operations:
 * 1. Recent memorials (for oversight)
 * 2. Funeral directors (all auto-approved)
 * 3. Basic system stats
 *
 * Follows established patterns from memorial flow analysis
 */
export const load = async ({ locals }: any) => {
	console.log('🔐 [ADMIN LOAD] Starting admin dashboard load for:', locals.user?.email);

	try {
		// === AUTHENTICATION & AUTHORIZATION ===
		// Following same pattern as memorial APIs
		if (!locals.user) {
			console.log('🚫 [ADMIN LOAD] No authenticated user - redirecting to login');
			throw redirect(302, '/login');
		}

		if (locals.user.role !== 'admin') {
			console.log('🚫 [ADMIN LOAD] User lacks admin privileges:', {
				uid: locals.user.uid,
				role: locals.user.role
			});
			throw redirect(302, '/profile');
		}

		console.log('✅ [ADMIN LOAD] Admin authentication verified for:', locals.user.email);

		// === DATA LOADING ===
		// Load comprehensive data for admin operations
		console.log('📊 [ADMIN LOAD] Loading comprehensive admin dashboard data...');

		const [recentMemorialsSnap, allUsersSnap, funeralDirectorsSnap] = await Promise.all([
			// Load recent memorials for oversight
			adminDb.collection('memorials').orderBy('createdAt', 'desc').limit(50).get(),
			// Load all users for user management
			adminDb.collection('users').orderBy('createdAt', 'desc').limit(100).get(),
			// Load funeral directors
			adminDb.collection('funeral_directors').get()
		]);

		// === PROCESS RECENT MEMORIALS ===
		// Following memorial collection structure from flow analysis
		const recentMemorials = recentMemorialsSnap.docs.map((doc) => {
			const data = doc.data();
			console.log(`💝 [ADMIN LOAD] Processing memorial: ${data.lovedOneName}`);

			// Extract scheduled start time from new or legacy structure
			let scheduledStartTime = null;
			if (data.services?.main?.time?.date && data.services?.main?.time?.time && !data.services.main.time.isUnknown) {
				scheduledStartTime = `${data.services.main.time.date}T${data.services.main.time.time}`;
			} else if (data.memorialDate && data.memorialTime) {
				// Fallback to legacy fields
				scheduledStartTime = `${data.memorialDate}T${data.memorialTime}`;
			}

			// Extract location from new or legacy structure
			const location = data.services?.main?.location?.name 
				|| data.memorialLocationName 
				|| 'Not specified';

			// Extract payment status - check multiple sources
			const isPaid = data.isPaid 
				|| data.calculatorConfig?.isPaid 
				|| data.paymentStatus === 'paid'
				|| false;

			return {
				id: doc.id,
				lovedOneName: data.lovedOneName || 'Unknown',
				fullSlug: data.fullSlug,
				creatorEmail: data.creatorEmail || '',
				creatorName: data.creatorName || '',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				isPublic: data.isPublic !== false,
				isComplete: data.isComplete || false, // Include completion status
				isArchived: data.isArchived || false, // Include archived status
				// Payment status from calculatorConfig (following established pattern)
				paymentStatus: data.calculatorConfig?.status || 'draft',
				// Check if has active livestream
				hasLivestream: !!data.livestream?.isActive,
				// NEW FIELDS for enhanced display
				scheduledStartTime,
				location,
				isPaid,
				paymentAmount: data.calculatorConfig?.totalPrice || null
			};
		});

		// === PROCESS USERS ===
		const allUsers = allUsersSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				uid: doc.id,
				email: data.email || '',
				displayName: data.displayName || data.name || '',
				role: data.role || 'owner',
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null
			};
		});

		// === PROCESS FUNERAL DIRECTORS ===
		const allFuneralDirectors = funeralDirectorsSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				companyName: data.companyName || '',
				contactPerson: data.contactPerson || '',
				email: data.email || '',
				phone: data.phone || '',
				licenseNumber: data.licenseNumber || '',
				businessType: data.businessType || '',
				status: data.status || 'approved', // V1: All auto-approved
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null
			};
		});

		// All FDs are auto-approved on registration (no approval workflow)
		const activeFuneralDirectors = allFuneralDirectors.filter(fd => fd.status === 'approved');
		const suspendedFuneralDirectors = allFuneralDirectors.filter(fd => fd.status === 'suspended');

		// === CALCULATE STATS ===
		// Get quick stats for dashboard overview
		const [totalMemorialsSnap, totalDirectorsSnap] = await Promise.all([
			adminDb.collection('memorials').count().get(),
			adminDb.collection('funeral_directors').count().get()
		]);

		const stats = {
			totalMemorials: totalMemorialsSnap.data().count,
			totalFuneralDirectors: totalDirectorsSnap.data().count,
			recentMemorials: recentMemorials.length
		};

		// Filter incomplete memorials (priority view) - exclude archived
		const incompleteMemorials = recentMemorials.filter(m => !m.isComplete && !m.isArchived);

		console.log('✅ [ADMIN LOAD] Dashboard data loaded successfully:', {
			recentMemorials: recentMemorials.length,
			incompleteMemorials: incompleteMemorials.length,
			allUsers: allUsers.length,
			activeFuneralDirectors: activeFuneralDirectors.length,
			stats
		});

		return {
			// Core admin data
			incompleteMemorials, // New: show incomplete first
			recentMemorials,
			allUsers,
			funeralDirectors: activeFuneralDirectors,
			suspendedFuneralDirectors,
			stats,
			// User context
			adminUser: {
				email: locals.user.email,
				uid: locals.user.uid
			}
		};
	} catch (error: any) {
		console.error('💥 [ADMIN LOAD] Error loading admin dashboard:', {
			error: error.message,
			stack: error.stack,
			user: locals.user?.email
		});

		// Return safe fallback data to prevent 500 errors
		return {
			incompleteMemorials: [],
			recentMemorials: [],
			allUsers: [],
			funeralDirectors: [],
			suspendedFuneralDirectors: [],
			stats: {
				totalMemorials: 0,
				totalFuneralDirectors: 0,
				recentMemorials: 0
			},
			adminUser: {
				email: locals.user?.email || '',
				uid: locals.user?.uid || ''
			},
			error: `Failed to load admin data: ${error.message}`
		};
	}
};

export const actions: Actions = {
	archive: async ({ request, locals }: { request: Request; locals: any }) => {
		console.log('📦 [ADMIN ACTION] Archive memorial action started');

		// Auth check
		if (!locals.user || locals.user.role !== 'admin') {
			console.log('🚫 [ADMIN ACTION] Unauthorized archive attempt');
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const memorialId = formData.get('memorialId') as string;

			if (!memorialId) {
				return fail(400, { error: 'Memorial ID is required' });
			}

			console.log('📦 [ADMIN ACTION] Archiving memorial:', memorialId);

			// Update memorial with archived status
			await adminDb.collection('memorials').doc(memorialId).update({
				isArchived: true,
				archivedAt: new Date(),
				archivedBy: locals.user.email,
				updatedAt: new Date()
			});

			console.log('✅ [ADMIN ACTION] Memorial archived successfully:', memorialId);

			return { success: true };
		} catch (error: any) {
			console.error('❌ [ADMIN ACTION] Error archiving memorial:', error);
			return fail(500, { 
				error: 'Failed to archive memorial', 
				details: error.message 
			});
		}
	}
};
