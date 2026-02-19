// frontend/src/routes/blog/+page.server.ts

import { adminDb, adminStorage } from '$lib/server/admin';
import type { PageServerLoad } from './$types';

// Helper function to convert storage path to public URL
async function getStorageUrl(storagePath: string): Promise<string> {
    try {
        if (!storagePath) return '';
        
        // If it's already a full URL, return as-is
        if (storagePath.startsWith('http')) {
            return storagePath;
        }
        
        // Get download URL from Firebase Storage
        const file = adminStorage.bucket().file(storagePath);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491' // Far future date for public images
        });
        
        return url;
    } catch (err) {
        console.error('Error getting storage URL for:', storagePath, err);
        return storagePath; // Return original path as fallback
    }
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    authorName: string;
    authorEmail: string;
    authorBio?: string;
    authorAvatar?: string;
    featuredImage?: string;
    featuredImageAlt?: string;
    category: string;
    tags?: string[];
    status: string;
    publishedAt?: Date;
    featured: boolean;
    viewCount: number;
    readingTime?: number;
    createdAt: Date;
    updatedAt: Date;
}

export const load: PageServerLoad = async () => {
    try {
        console.log('🔍 Fetching blog posts from Firestore...');
        
        // First, let's see ALL blog posts to debug
        const allBlogPosts = await adminDb.collection('blog').limit(10).get();
        console.log('📊 Total blog documents found:', allBlogPosts.size);
        
        // Debug: Show what posts we found
        console.log(`📊 Found ${allBlogPosts.size} blog posts in Firestore`);
        
        // Now try the published query
        const allPostsQuery = adminDb.collection('blog')
            .where('status', '==', 'published')
            .limit(20);
        
        const allSnapshot = await allPostsQuery.get();
        console.log('📊 Published posts found:', allSnapshot.size);
        
        const allPosts = await Promise.all(
            allSnapshot.docs.map(async (doc) => {
                const postData = doc.data();
                const post = {
                    id: doc.id,
                    ...postData,
                    publishedAt: postData.publishedAt?.toDate() || null,
                    createdAt: postData.createdAt?.toDate() || new Date(),
                    updatedAt: postData.updatedAt?.toDate() || new Date()
                } as BlogPost;

                // Convert storage paths to proper URLs
                if (post.featuredImage) {
                    post.featuredImage = await getStorageUrl(post.featuredImage);
                }
                if (post.authorAvatar) {
                    post.authorAvatar = await getStorageUrl(post.authorAvatar);
                }

                return post;
            })
        );
        
        // Sort and filter posts in JavaScript instead of Firestore
        const sortedPosts = allPosts.sort((a, b) => {
            const dateA = a.publishedAt || a.createdAt;
            const dateB = b.publishedAt || b.createdAt;
            return dateB.getTime() - dateA.getTime();
        });
        
        const featuredPosts = sortedPosts.filter(post => post.featured).slice(0, 3);
        const latestPosts = sortedPosts.filter(post => !post.featured).slice(0, 9);
        
        const categoryCounts: Record<string, number> = {};
        allPosts.forEach((post: BlogPost) => {
            if (post.category) {
                categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
            }
        });
        
        console.log('✅ Successfully loaded blog posts:', {
            featured: featuredPosts.length,
            latest: latestPosts.length,
            total: featuredPosts.length + latestPosts.length
        });
        
        return {
            featuredPosts,
            latestPosts,
            categoryCounts,
            totalPosts: featuredPosts.length + latestPosts.length,
            usingMockData: false
        };
        
    } catch (error) {
        console.error('❌ Error fetching blog posts:', error);
        
        // Fallback to empty data if Firestore fails
        return { 
            featuredPosts: [], 
            latestPosts: [], 
            categoryCounts: {}, 
            totalPosts: 0,
            usingMockData: false,
            error: 'Failed to load blog posts'
        };
    }
};
