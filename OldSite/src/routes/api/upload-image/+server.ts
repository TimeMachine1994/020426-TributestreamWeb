import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminStorage } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Auth check - only admins can upload
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const path = formData.get('path') as string;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		if (!path) {
			return json({ error: 'No storage path provided' }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			return json({ error: 'File must be an image' }, { status: 400 });
		}

		// Validate file size (5MB max)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return json({ error: 'File size must be less than 5MB' }, { status: 400 });
		}

		// Generate unique filename
		const timestamp = Date.now();
		const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const fileName = `${timestamp}-${sanitizedFileName}`;
		const storagePath = `${path}/${fileName}`;

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to Firebase Storage
		const bucket = adminStorage.bucket();
		const fileRef = bucket.file(storagePath);

		await fileRef.save(buffer, {
			metadata: {
				contentType: file.type,
				metadata: {
					uploadedBy: locals.user.email || 'unknown',
					uploadedAt: new Date().toISOString()
				}
			}
		});

		// Make file publicly accessible
		await fileRef.makePublic();

		// Get public URL
		const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

		console.log('✅ Image uploaded successfully:', {
			path: storagePath,
			size: file.size,
			type: file.type,
			url: publicUrl
		});

		return json({
			success: true,
			url: publicUrl,
			path: storagePath,
			fileName
		});
	} catch (error) {
		console.error('❌ Error uploading image:', error);
		return json(
			{
				error: 'Failed to upload image',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
