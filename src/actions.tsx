"use server";
// everything will run on the server

import { imagekit } from "./utils";
import { cookies } from "next/headers";

import { createClient } from "@supabase/supabase-js";
import { createPost } from "./services/post.service";

// Define response type for the shareAction function
interface ShareActionResponse {
  success: boolean;
  message?: string;
  requiresAuth?: boolean;
  data?: {
    id?: string;
    content?: string;
    media_url?: string;
    media_type?: string;
  };
};

// Helper function to get Supabase client in server actions with auth context
const getSupabaseClient = async () => {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Get all cookies that might contain the session
  const supabaseAuthToken = cookieStore.get('sb-auth-token');
  const supabaseAuthTokenFallback = cookieStore.get('supabase-auth-token');
  const sbAccessToken = cookieStore.get('sb-access-token');
  const sbRefreshToken = cookieStore.get('sb-refresh-token');
  
  // Debug cookie information
  console.log('Auth cookies available:', {
    'sb-auth-token': !!supabaseAuthToken,
    'supabase-auth-token': !!supabaseAuthTokenFallback,
    'sb-access-token': !!sbAccessToken,
    'sb-refresh-token': !!sbRefreshToken
  });
  
  // Prepare all possible cookies to include in the request
  const cookieHeader = [];
  if (supabaseAuthToken) cookieHeader.push(`sb-auth-token=${supabaseAuthToken.value}`);
  if (supabaseAuthTokenFallback) cookieHeader.push(`supabase-auth-token=${supabaseAuthTokenFallback.value}`);
  if (sbAccessToken) cookieHeader.push(`sb-access-token=${sbAccessToken.value}`);
  if (sbRefreshToken) cookieHeader.push(`sb-refresh-token=${sbRefreshToken.value}`);
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Cookie: cookieHeader.join('; ')
      },
    },
  });
};

export async function shareAction(
  formData: FormData,
  settings: { type: "original" | "wide" | "square"; sensitive: boolean }
): Promise<ShareActionResponse> {
  try {
    // Get auth token directly from the form data
    const authToken = formData.get('authToken') as string;
    const userId = formData.get('userId') as string;
    
    // Log authentication information
    console.log('Auth info received:', { hasToken: !!authToken, hasUserId: !!userId });
    
    // Get file from formData and validate it's a File object
    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;
    
    // For text-only posts, we don't need a file
    const content = formData.get('content') as string;
    const desc = formData.get("desc") as string;
    
    // If there's nothing in the post, return early
    if ((!file || !file.size) && !desc && !content) {
      return {
        success: false,
        message: 'Please add text or media to your post'
      };
    }

    // Create a post without media if no file is provided
    let uploadResult = null;
    let mediaUrl = null;
    let mediaType = null;
    
    // Only attempt to upload if there's a file
    if (file && file.size > 0) {
      try {
        // Get file type and name from formData
        const mediaType = formData.get('mediaType') as string;
        const mediaName = formData.get('mediaName') as string;
        
        // Make sure we have the required ImageKit credentials
        if (!process.env.PRIVATE_KEY) {
          console.error('Missing PRIVATE_KEY for ImageKit upload');
          return {
            success: false,
            message: 'Server configuration error: Missing ImageKit credentials'
          };
        }

        // Convert file to Buffer for ImageKit
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        
        // Create upload options
        const uploadOptions = {
          file: fileBuffer,
          fileName: `post-${Date.now()}-${mediaName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          folder: "/posts",
          customMetadata: {
            sensitive: settings.sensitive,
            fileType: mediaType,
            originalName: mediaName
          },
          useUniqueFileName: true,
          tags: ['post'],
          extensions: [
            {
              name: "removeAI",
              maxFileSize: 50 * 1024 * 1024,
              allowedFileTypes: ["image/*", "video/*"],
              maxDimensions: {
                height: 1080,
                width: 1920
              }
            }
          ]
        };

        // Attempt the upload
        const uploadResponse = await imagekit.upload(uploadOptions);
        
        // Extract the URL from the response
        const uploadedUrl = uploadResponse.url;
        
        console.log('ImageKit upload successful:', {
          url: uploadedUrl,
          fileId: uploadResponse.fileId,
          name: uploadResponse.name
        });
        
        // Store the URL and type
        mediaUrl = uploadedUrl;
        mediaType = mediaType;

        // Create post in Supabase with media
        const supabase = await getSupabaseClient();
        const { data: postData, error } = await supabase
          .from('posts')
          .insert([
            {
              content: desc || content,
              media_url: mediaUrl,
              media_type: mediaType,
              user_id: userId,
              created_at: new Date().toISOString(),
              sensitive: settings.sensitive
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Error creating post with media:', error);
          return {
            success: false,
            message: 'Failed to create post in database: ' + error.message
          };
        }

        return {
          success: true,
          message: 'Post with media created successfully',
          data: {
            id: postData.id,
            content: postData.content,
            media_url: mediaUrl,
            media_type: mediaType
          }
        };
      } catch (error: unknown) {
        console.error('Error during media upload:', error);
        
        // Return a user-friendly error instead of throwing
        return {
          success: false,
          message: 'Failed to upload media: ' + (error instanceof Error ? error.message : 'Unknown error')
        };
      }
    } else {
      // Create post in Supabase without media
      const supabase = await getSupabaseClient();
      const { data: postData, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: userId,
            content: content || desc || '',
            created_at: new Date().toISOString(),
            sensitive: settings.sensitive
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating text post:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create post'
        };
      }

      return {
        success: true,
        message: 'Post created successfully',
        data: {
          id: postData.id,
          content: postData.content
        }
      };
    }
  } catch (error: unknown) {
    console.error('Error in shareAction:', error);
    return {
      success: false,
      message: 'Error uploading media: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}