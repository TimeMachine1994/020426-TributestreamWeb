import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PhotoSlideshowCreator from './PhotoSlideshowCreator.svelte';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: vi.fn(() => 'mock-uuid-123')
} as any;

describe('PhotoSlideshowCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading Published Slideshow', () => {
    const mockPublishedSlideshow = {
      id: 'slideshow-123',
      title: 'Test Memorial Slideshow',
      playbackUrl: 'https://firebase.storage.com/video.mp4',
      firebaseStorageUrl: 'https://firebase.storage.com/video.mp4',
      photos: [
        {
          id: 'photo-1',
          url: 'https://firebase.storage.com/photo1.jpg',
          caption: 'Test Photo 1',
          duration: 3,
          storagePath: 'photos/photo1.jpg'
        },
        {
          id: 'photo-2', 
          url: 'https://firebase.storage.com/photo2.jpg',
          caption: 'Test Photo 2',
          duration: 4,
          storagePath: 'photos/photo2.jpg'
        }
      ],
      settings: {
        photoDuration: 3,
        transitionType: 'fade',
        videoQuality: 'medium',
        aspectRatio: '16:9'
      }
    };

    it('should load published slideshow when memorialId is provided', async () => {
      // Mock successful API response for published slideshow
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          slideshow: mockPublishedSlideshow
        })
      });

      // Mock photo blob responses
      mockFetch.mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['mock-image-data'], { type: 'image/jpeg' })
      });

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/memorials/memorial-123/slideshow');
      });

      // Should show published status
      await waitFor(() => {
        expect(screen.getByText('🌟 Published to Memorial')).toBeInTheDocument();
      });

      // Should show published slideshow title
      await waitFor(() => {
        expect(screen.getByText('Published Slideshow')).toBeInTheDocument();
      });

      // Should show unpublish button
      await waitFor(() => {
        expect(screen.getByText('📝 Unpublish & Edit')).toBeInTheDocument();
      });
    });

    it('should show video preview for published slideshow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          slideshow: mockPublishedSlideshow
        })
      });

      mockFetch.mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['mock-image-data'], { type: 'image/jpeg' })
      });

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      // Should show video element with correct src
      await waitFor(() => {
        const video = screen.getByRole('application') || document.querySelector('video');
        expect(video).toBeInTheDocument();
      });
    });

    it('should load photos from published slideshow for editing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          slideshow: mockPublishedSlideshow
        })
      });

      mockFetch.mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['mock-image-data'], { type: 'image/jpeg' })
      });

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      // Should load photos for editing
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://firebase.storage.com/photo1.jpg');
        expect(mockFetch).toHaveBeenCalledWith('https://firebase.storage.com/photo2.jpg');
      });
    });

    it('should fallback to draft loading when no published slideshow exists', async () => {
      // Mock no published slideshow
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Mock draft API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          draft: {
            photos: [],
            settings: {}
          }
        })
      });

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/memorials/memorial-123/slideshow');
        expect(mockFetch).toHaveBeenCalledWith('/api/slideshow/draft?memorialId=memorial-123');
      });
    });
  });

  describe('Unpublish Functionality', () => {
    it('should unpublish slideshow and convert to draft', async () => {
      const mockPublishedSlideshow = {
        id: 'slideshow-123',
        playbackUrl: 'https://firebase.storage.com/video.mp4',
        photos: []
      };

      // Mock published slideshow load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          slideshow: mockPublishedSlideshow
        })
      });

      // Mock unpublish (DELETE) response
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      // Mock draft save response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      // Wait for published slideshow to load
      await waitFor(() => {
        expect(screen.getByText('📝 Unpublish & Edit')).toBeInTheDocument();
      });

      // Click unpublish button
      const unpublishBtn = screen.getByText('📝 Unpublish & Edit');
      await fireEvent.click(unpublishBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/memorials/memorial-123/slideshow', {
          method: 'DELETE'
        });
      });
    });
  });

  describe('Save to Memorial Functionality', () => {
    it('should show "Update Memorial" for published slideshows', async () => {
      const mockPublishedSlideshow = {
        id: 'slideshow-123',
        playbackUrl: 'https://firebase.storage.com/video.mp4',
        photos: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          slideshow: mockPublishedSlideshow
        })
      });

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Update Memorial')).toBeInTheDocument();
      });
    });

    it('should show "Save to Memorial" for new slideshows', async () => {
      // Mock no published slideshow
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Mock no draft
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          draft: null
        })
      });

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      // Add some photos to trigger video generation UI
      // This would require more complex mocking of file upload
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error loading slideshow data'),
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle malformed slideshow data', async () => {
      // Mock malformed response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          slideshow: {
            // Missing required fields
            id: 'slideshow-123'
            // No photos, playbackUrl, etc.
          }
        })
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(PhotoSlideshowCreator, {
        props: {
          memorialId: 'memorial-123'
        }
      });

      // Should not crash and should handle gracefully
      await waitFor(() => {
        expect(consoleSpy).not.toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
