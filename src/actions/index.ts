'use server';

import { Buffer } from 'buffer';
import { supabase } from '@/lib/supabase';
import { imagekit } from '@/utils';
import { revalidatePath } from 'next/cache';

interface ShareActionResponse {
  success: boolean;
  message?: string;
  requiresAuth?: boolean;
}

export async function shareAction(
  formData: FormData,
  settings: {
    type: "original" | "wide" | "square";
    sensitive: boolean;
  }
): Promise<ShareActionResponse> {
  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('No session found');
      return {
        success: false,
        requiresAuth: true,
        message: 'You must be logged in to create a post'
      };
    }

    const content = formData.get('desc') as string;
    const location = formData.get('location') as string;
    const scheduleDate = formData.get('scheduleDate') as string;
    const file = formData.get('file') as File | null;

    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];

    // Only attempt media upload if there's a file
    if (file && file.size > 0) {
      try {
        // Convert File to base64 string for ImageKit
        const arrayBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString('base64');
        const fileBase64 = `data:${file.type};base64,${base64String}`;

        // Upload to ImageKit
        const uploadResponse = await imagekit.upload({
          file: fileBase64,
          fileName: file.name,
          useUniqueFileName: true,
          folder: '/posts',
          customMetadata: {
            sensitive: settings.sensitive.toString()
          }
        });

        if (uploadResponse && uploadResponse.url) {
          mediaUrls.push(uploadResponse.url);
          mediaTypes.push(file.type.startsWith('image/') ? 'image' : 'video');
        } else {
          throw new Error('Failed to get upload URL from ImageKit');
        }
      } catch (error) {
        console.error('Error uploading media:', error);
        return {
          success: false,
          message: 'Failed to upload media: ' + (error instanceof Error ? error.message : JSON.stringify(error))
        };
      }
    }

    // Create the post in the database
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        content,
        user_id: session.user.id,
        media_urls: mediaUrls,
        media_types: mediaTypes,
        location,
        scheduled_for: scheduleDate ? new Date(scheduleDate).toISOString() : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

      if (error) {
        console.error('Error creating post:', error);
        return {
          success: false,
          message: 'Failed to create post: ' + (error instanceof Error ? error.message : JSON.stringify(error))
        };
      }

    // Revalidate the home and profile pages
    revalidatePath('/');
    revalidatePath(`/profile/${session.user.user_metadata.username}`);

    return {
      success: true,
      message: 'Post created successfully'
    };
  } catch (error) {
    console.error('Error in shareAction:', error);
    return {
      success: false,
      message: 'An unexpected error occurred'
    };
  }
}
