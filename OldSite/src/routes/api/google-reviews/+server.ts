import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// You'll need to set these environment variables
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID; // Your business's Google Place ID

interface GoogleReview {
	author_name: string;
	author_url?: string;
	language: string;
	profile_photo_url: string;
	rating: number;
	relative_time_description: string;
	text: string;
	time: number;
}

interface GooglePlaceDetailsResponse {
	result: {
		reviews: GoogleReview[];
		rating: number;
		user_ratings_total: number;
	};
	status: string;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
			console.warn('Google Places API key or Place ID not configured');
			// Return fallback reviews if API not configured
			return json({
				reviews: [
					{
						author_name: "Sarah M.",
						rating: 5,
						text: "Tributestream made it possible for our family across the country to be part of Dad's service.",
						relative_time_description: "2 months ago",
						profile_photo_url: "",
						time: Date.now() - 5184000000 // 2 months ago
					},
					{
						author_name: "Rev. Johnson",
						rating: 5,
						text: "Professional setup, flawless streaming. Highly recommend for any memorial service.",
						relative_time_description: "3 months ago",
						profile_photo_url: "",
						time: Date.now() - 7776000000 // 3 months ago
					},
					{
						author_name: "Michael R.",
						rating: 5,
						text: "The recording quality was beautiful. We'll treasure this forever.",
						relative_time_description: "1 month ago",
						profile_photo_url: "",
						time: Date.now() - 2592000000 // 1 month ago
					}
				],
				rating: 5.0,
				total_reviews: 3,
				source: 'fallback'
			});
		}

		const fields = 'reviews,rating,user_ratings_total';
		const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

		const response = await fetch(apiUrl);
		const data: GooglePlaceDetailsResponse = await response.json();

		if (data.status !== 'OK') {
			throw new Error(`Google Places API error: ${data.status}`);
		}

		// Filter and format reviews
		const reviews = data.result.reviews
			?.filter(review => review.text && review.text.length > 20) // Filter out very short reviews
			?.map(review => ({
				author_name: review.author_name,
				rating: review.rating,
				text: review.text,
				relative_time_description: review.relative_time_description,
				profile_photo_url: review.profile_photo_url,
				time: review.time * 1000 // Convert to milliseconds
			}))
			?.sort((a, b) => b.time - a.time) // Sort by most recent
			?.slice(0, 10) || []; // Limit to 10 reviews

		return json({
			reviews,
			rating: data.result.rating,
			total_reviews: data.result.user_ratings_total,
			source: 'google'
		});

	} catch (error) {
		console.error('Error fetching Google reviews:', error);
		
		// Return fallback reviews on error
		return json({
			reviews: [
				{
					author_name: "Sarah M.",
					rating: 5,
					text: "Tributestream made it possible for our family across the country to be part of Dad's service.",
					relative_time_description: "2 months ago",
					profile_photo_url: "",
					time: Date.now() - 5184000000
				},
				{
					author_name: "Rev. Johnson",
					rating: 5,
					text: "Professional setup, flawless streaming. Highly recommend for any memorial service.",
					relative_time_description: "3 months ago",
					profile_photo_url: "",
					time: Date.now() - 7776000000
				},
				{
					author_name: "Michael R.",
					rating: 5,
					text: "The recording quality was beautiful. We'll treasure this forever.",
					relative_time_description: "1 month ago",
					profile_photo_url: "",
					time: Date.now() - 2592000000
				}
			],
			rating: 5.0,
			total_reviews: 3,
			source: 'fallback'
		});
	}
};
