import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase';
import type { CalculatorFormData, CalculatorConfig } from '$lib/types/livestream';
import { Timestamp } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	console.log('💾 Auto-save schedule API called for memorial:', params.memorialId);

	try {
		// Check authentication
		if (!locals.user) {
			console.log('❌ No authenticated user');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { memorialId } = params;
		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Parse request body
		const { services, calculatorData, timestamp } = await request.json();
		if (!services && !calculatorData) {
			return json({ error: 'Services or calculator data is required' }, { status: 400 });
		}

		console.log('📝 Auto-saving schedule data:', {
			memorialId,
			userId: locals.user.uid,
			timestamp,
			hasServices: !!services,
			hasCalculatorData: !!calculatorData
		});

		// Verify user has permission to edit this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('❌ Memorial not found:', memorialId);
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		// Check permissions (V1: simplified roles)
		const hasPermission =
			userRole === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ User lacks permission to edit memorial:', {
				userRole,
				userId,
				ownerUid: memorial?.ownerUid,
				funeralDirectorUid: memorial?.funeralDirectorUid
			});
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Prepare update data
		const updateData: any = {
			updatedAt: Timestamp.now(),
			lastModifiedBy: userId
		};

		// Update Memorial.services if provided
		if (services) {
			updateData['services.main'] = services.main;
			updateData['services.additional'] = services.additional || [];
		}

		// Update calculator config if provided
		if (calculatorData) {
			const calculatorConfig: Partial<CalculatorConfig> = {
				formData: {
					...(calculatorData as CalculatorFormData),
					memorialId,
					updatedAt: new Date(),
					autoSaved: true
				},
				lastModified: new Date(),
				lastModifiedBy: userId,
				status: 'draft',
				autoSave: {
					formData: calculatorData as CalculatorFormData,
					lastModified: new Date(),
					lastModifiedBy: userId,
					timestamp: timestamp || Date.now(),
					autoSave: true
				}
			};
			updateData.calculatorConfig = calculatorConfig;
		}

		// Save to memorial
		await memorialRef.update(updateData);

		console.log('✅ Schedule auto-saved successfully for memorial:', memorialId);

		return json({
			success: true,
			timestamp: timestamp || Date.now(),
			message: 'Schedule auto-saved successfully'
		});
	} catch (error) {
		console.error('💥 Error in schedule auto-save:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async ({ params, locals }) => {
	console.log('📖 Get auto-saved schedule for memorial:', params.memorialId);

	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { memorialId } = params;
		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Get memorial and check permissions
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		// Check permissions (V1: simplified roles)
		const hasPermission =
			userRole === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Return services and calculator config data
		const services = memorial?.services;
		const calculatorConfig = memorial?.calculatorConfig;

		if (services || (calculatorConfig && calculatorConfig.autoSave)) {
			console.log('✅ Auto-saved schedule found for memorial:', memorialId);
			return json({
				success: true,
				services: services || null,
				autoSave: calculatorConfig?.autoSave || null,
				hasAutoSave: true,
				calculatorConfig: calculatorConfig || null
			});
		} else {
			console.log('ℹ️ No auto-saved schedule found for memorial:', memorialId);
			return json({
				success: true,
				hasAutoSave: false
			});
		}
	} catch (error) {
		console.error('💥 Error getting auto-saved schedule:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
