"use client";

// to upload anything on image kit we will need a backend server and we need to be authenticated 
// npm i imagekit
//we will be using our server actions andnupload our media on the backend
import React, { useState } from "react";
import Image from "./Image";
import NextImage from "next/image";
import { shareAction } from "@/actions";
import ImageEditor from "./ImageEditor";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const Share = () => {
  const { user } = useAuth();
  // we will store the image we wanna upload in the media state, at the beginning it will be null and its type is file or null
  const [media, setMedia] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  // we will store the settings in the settings state
  // type can be original, wide or square and sensitive can be true or false and if its sensitive then it will be blurred
  const [settings, setSettings] = useState<{
    type: "original" | "wide" | "square";
    sensitive: boolean;
  }>({
    type: "original",
    sensitive: false,
  });

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // check if its a file or not if its a file then check if its not null
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
      // console.log(e.target.files[0]);  
      // e.target means the input element > files means the files that are selected > [0] means the first file and files come from the input element
      // File {name: 'virtual-assitant.jpg', lastModified: 1731367435385, lastModifiedDate: Tue Nov 12 2024 01:23:55 GMT+0200 (Eastern European Standard Time), webkitRelativePath: '', size: 490453, …}
    }
  };

  // this is to show the preview of the media while uploading
  // we will be able to see it without uploading it
  const previewURL = media ? URL.createObjectURL(media) : null;

  // States for additional features
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [postText, setPostText] = useState<string>('');

  // Submit state to manage loading and feedback
  const [submitState, setSubmitState] = useState<{
    isSubmitting: boolean;
    message: string;
    success?: boolean;
  }>({
    isSubmitting: false,
    message: '',
  });

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="p-4 flex flex-col gap-4 items-center border-b border-borderGray">
        <h2 className="text-lg font-bold text-white">Join the conversation</h2>
        <p className="text-textGray text-center mb-2">
          You need to be logged in to post. Join X today to share your thoughts with the world.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/login" 
            className="bg-white text-black font-bold rounded-full py-2 px-6 hover:bg-gray-200 transition-colors"
          >
            Log in
          </Link>
          <Link 
            href="/signup" 
            className="bg-transparent text-white font-bold rounded-full py-2 px-6 border border-white hover:bg-white/10 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }
  
  // Handle adding emoji to text
  const handleAddEmoji = (emoji: string) => {
    setPostText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  
  // Handle adding location
  const handleAddLocation = () => {
    const userLocation = prompt('Enter your location:');
    if (userLocation) setLocation(userLocation);
  };
  
  // Handle scheduling post
  const handleSchedulePost = () => {
    const userDate = prompt('Enter date and time (YYYY-MM-DD HH:MM):');
    if (userDate) setScheduleDate(userDate);
  };

  return (
    // this should be a form because we need to submit the form to upload the media on the backend server
    //by default its sending that form data but we will send it like this to add the settings
    <form
      className="p-4 flex gap-4"
      action={async (formData) => {
        try {
          // Prevent multiple submissions
          if (submitState.isSubmitting) return;

          setSubmitState({
            isSubmitting: true,
            message: 'Creating your post...',
            success: undefined
          });
          
          // Log auth state for debugging
          console.log('User auth state:', user ? 'Logged in' : 'Not logged in');
          console.log('Media state:', media ? `File selected: ${media.name}` : 'No media');

          // Add the extra fields to formData
          if (location) {
            formData.set('location', location);
          }
          
          if (scheduleDate) {
            formData.set('scheduleDate', scheduleDate);
          }

          // Use the current state value for text content
          formData.set('desc', postText);
          
          // Add authentication information directly to the form data
          if (user) {
            // Pass the user ID directly
            formData.set('userId', user.id);
            
            // Try to get the auth token from the session
            try {
              const { data } = await supabase.auth.getSession();
              if (data?.session?.access_token) {
                formData.set('authToken', data.session.access_token);
                console.log('Added auth token to form data');
              }
            } catch (error) {
              console.error('Error getting auth token:', error);
            }
          } else {
            console.error('No user found in auth context');
            setSubmitState({
              isSubmitting: false,
              message: 'You must be logged in to create a post',
              success: false
            });
            return; // Stop form submission if not logged in
          }
          
          // Only add file to formData if it exists
          if (media) {
            try {
              console.log('Adding media to form:', {
                name: media.name,
                size: media.size,
                type: media.type
              });
              
              // Add the file directly to formData
              formData.set('file', media);
              
              // Add media type and name for reference
              formData.set('mediaType', media.type);
              formData.set('mediaName', media.name);
              
              console.log('File added to form data successfully');
            } catch (error) {
              console.error('Error preparing file for upload:', error);
              setSubmitState({
                isSubmitting: false,
                message: 'Failed to prepare file for upload: ' + (error instanceof Error ? error.message : 'Unknown error'),
                success: false
              });
              return;
            }
          }

          // Call the server action with the form data and settings
          try {
            const response = await shareAction(formData, settings);
            
            if (!response) {
              throw new Error('No response received from server');
            }
            
            // Check if response is an error object
            if (response instanceof Error) {
              throw response;
            }
            
            if (response.success) {
              setSubmitState({
                isSubmitting: false,
                message: 'Post created successfully!',
                success: true
              });
              
              // Reset form on success
              setMedia(null);
              setPostText('');
              setLocation('');
              setScheduleDate('');
              
              // Show success message briefly before refreshing
              setTimeout(() => {
                // Refresh the page to show the new post
                window.location.href = '/';
              }, 1500);
            } else {
              // Handle auth errors
              if (response.requiresAuth) {
                setSubmitState({
                  isSubmitting: false,
                  message: 'Please log in to create posts',
                  success: false
                });
                // Redirect to login after a short delay
                setTimeout(() => {
                  window.location.href = '/login';
                }, 1500);
              } else {
                setSubmitState({
                  isSubmitting: false,
                  message: response.message || 'Failed to create post',
                  success: false
                });
              }
            }
          } catch (error) {
            console.error('Error during post creation:', error);
            setSubmitState({
              isSubmitting: false,
              message: error instanceof Error ? error.message : 'An unexpected error occurred during post creation',
              success: false
            });
          }
        } catch (error) {
          console.error('Error posting:', error);
          setSubmitState({
            isSubmitting: false,
            message: 'An unexpected error occurred',
            success: false
          });
        }
      }}
    >
      {/* AVATAR */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden">
        {user?.avatar_url ? (
          <Image path={user.avatar_url} alt="" w={100} h={100} tr={true} />
        ) : (
          <Image path="general/avatar.png" alt="" w={100} h={100} tr={true} />
        )}
      </div>
      {/* OTHERS */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Feedback Message */}
        {submitState.message && (
          <div className={`text-sm ${
            submitState.success === true 
              ? 'text-green-500' 
              : submitState.success === false 
                ? 'text-red-500' 
                : 'text-blue-500'
          }`}>
            {submitState.message}
          </div>
        )}
        
        <input
          type="text"
          name="desc"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          placeholder="What is happening?!"
          className="bg-transparent outline-none placeholder:text-textGray text-xl"
        />
        


        {/* Display scheduled date if any */}
        {scheduleDate && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <g><path d="M6 3V2h2v1h6V2h2v1h1.5C18.88 3 20 4.119 20 5.5v2h-2v-2c0-.276-.22-.5-.5-.5H16v1h-2V5H8v1H6V5H4.5c-.28 0-.5.224-.5.5v12c0 .276.22.5.5.5h3v2h-3C3.12 20 2 18.881 2 17.5v-12C2 4.119 3.12 3 4.5 3H6zm9.5 8c-2.49 0-4.5 2.015-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.01-4.5-4.5-4.5zM9 15.5C9 11.91 11.91 9 15.5 9s6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5S9 19.09 9 15.5zm5.5-2.5h2v2.086l1.71 1.707-1.42 1.414-2.29-2.293V13z"></path></g>
            </svg>
            <span>Scheduled for: {scheduleDate}</span>
            <button onClick={() => setScheduleDate('')} className="text-red-500 font-bold">
              X
            </button>
          </div>
        )}
        {/* PREVIEW IMAGE */}
        {/* if media exists and its type inside the media object includes image then do the following  */}
        {media?.type.includes("image") && previewURL && (
          <div className="relative rounded-xl overflow-hidden">
            {/* use NextImage instead of Image because it's a next component  */}
            <NextImage
              src={previewURL}
              alt=""
              width={600}
              height={600}
              // this is after we click on edit and its edited then show the edited image
              className={`w-full ${
                settings.type === "original"
                  ? "h-full object-contain"
                  : settings.type === "square"
                  ? "aspect-square object-cover"
                  : "aspect-video object-cover"
              }`}
            />
            {/* Button to edit the image */}
            <div
              className="absolute top-2 left-2 bg-black bg-opacity-50 text-white py-1 px-4 rounded-full font-bold text-sm cursor-pointer"
              onClick={() => setIsEditorOpen(true)}
            >
              Edit
            </div>
            <div
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white h-8 w-8 flex items-center justify-center rounded-full cursor-pointer font-bold text-sm"
              onClick={() => setMedia(null)}
            >
              X
            </div>
          </div>
        )}
        {/* PREVIEW Video */}
        {/* if media exists and its a video */}
        {media?.type.includes("video") && previewURL && (
          <div className="relative">
            <video src={previewURL} controls />
            <div
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white h-8 w-8 flex items-center justify-center rounded-full cursor-pointer font-bold text-sm"
              onClick={() => setMedia(null)}
            >
              X
            </div>
          </div>
        )}
        {isEditorOpen && previewURL && (
          <ImageEditor
            onClose={() => setIsEditorOpen(false)}
            previewURL={previewURL}
            settings={settings}
            setSettings={setSettings}
          />
        )}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* MEDIA */}
          <div className="flex gap-4 flex-wrap">
            <input
              type="file"
              name="file"
              onChange={handleMediaChange}
              className="hidden"
              id="file"
              // make it accept only image and video
              accept="image/*,video/*"
            />
            <label htmlFor="file">
              <Image
                path="icons/image.svg"
                alt=""
                w={20}
                h={20}
                className="cursor-pointer"
              />
            </label>
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-blue-400 hover:text-blue-600 transition-colors"
              title="Add emoji"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <g><path d="M12 22.75C6.072 22.75 1.25 17.928 1.25 12S6.072 1.25 12 1.25 22.75 6.072 22.75 12 17.928 22.75 12 22.75zm0-20C6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25s9.25-4.15 9.25-9.25S17.1 2.75 12 2.75z"></path><path d="M12 17.115c-2.35 0-4.344-1.608-4.9-3.865h1.52c.567 1.308 1.89 2.142 3.38 2.142s2.813-.834 3.38-2.142h1.52c-.554 2.257-2.55 3.865-4.9 3.865z"></path><circle cx="14.738" cy="10.115" r="1.115"></circle><circle cx="9.262" cy="10.115" r="1.115"></circle></g>
              </svg>
            </button>
            {showEmojiPicker && (
              <div className=" z-10">
                <div className="absolute w-full bottom-full mb-2 bg-gray-800 p-2 rounded-lg border border-gray-700 shadow-lg">
                  <div className="grid grid-cols-8 gap-2">
                    {[
                      "😀", "😂", "😍", "🥰", "😊", "🙄", "🤔", "😎",
                      "👍", "🔥", "❤️", "🎉", "✨", "🌟", "💯", "🙏"
                    ].map((emoji, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => handleAddEmoji(emoji)}
                        className="text-2xl hover:bg-gray-700 p-1 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowEmojiPicker(false)}
                    className="mt-1 text-xs text-gray-400 hover:text-white w-full text-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* POST */}
          <button 
            type="submit"
            disabled={submitState.isSubmitting || (!postText && !media)}
            className={`bg-white text-black font-bold rounded-full py-2 px-4 ${
              submitState.isSubmitting || (!postText && !media) 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-200'
            }`}
          >
            {submitState.isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default Share;