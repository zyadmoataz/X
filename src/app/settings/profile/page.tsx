'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Image from '@/components/Image';
import Link from 'next/link';

export default function ProfileSettings() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            name: data.name || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
          });
          setAvatarPreview(data.avatar_url || null);
          setCoverPreview(data.cover_url || null);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      let avatarUrl = user.avatar_url;
      let coverUrl = user.cover_url;
      
      // Upload avatar if changed
      if (avatarFile) {
        const avatarFileName = `avatar-${user.id}-${Date.now()}`;
        const { data: avatarData, error: avatarError } = await supabase.storage
          .from('profiles')
          .upload(avatarFileName, avatarFile);
          
        if (avatarError) throw avatarError;
        
        const { data: avatarUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(avatarFileName);
          
        avatarUrl = avatarUrlData.publicUrl;
      }
      
      // Upload cover if changed
      if (coverFile) {
        const coverFileName = `cover-${user.id}-${Date.now()}`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from('profiles')
          .upload(coverFileName, coverFile);
          
        if (coverError) throw coverError;
        
        const { data: coverUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(coverFileName);
          
        coverUrl = coverUrlData.publicUrl;
      }
      
      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setSuccess('Profile updated successfully!');
      
      // Update session if available
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.updateUser({
          data: { 
            name: formData.name,
            avatar_url: avatarUrl
          }
        });
      }
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 flex items-center justify-between border-b border-borderGray">
          <div className="flex items-center gap-6">
            <Link href={`/profile/${user?.username}`} className="text-xl">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <g>
                  <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path>
                </g>
              </svg>
            </Link>
            <h1 className="text-xl font-bold">Edit profile</h1>
          </div>
          <button 
            type="submit"
            form="profile-form"
            disabled={isSaving}
            className="px-4 py-1.5 rounded-full font-bold bg-white text-black hover:bg-gray-200 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      {/* Form */}
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-900/50 border border-red-600 text-white px-4 py-3 rounded-md my-4 mx-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/50 border border-green-600 text-white px-4 py-3 rounded-md my-4 mx-4">
            {success}
          </div>
        )}
        
        <form id="profile-form" onSubmit={handleSubmit}>
          {/* Cover Image */}
          <div className="relative">
            <div className="h-48 bg-gray-800">
              {coverPreview && (
                <img 
                  src={coverPreview} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <label className="bg-black/50 text-white rounded-full p-2 cursor-pointer hover:bg-black/70">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                  <g>
                    <path d="M9.697 3H14.303c.5 0 .9.405.9.905v3.19c0 .5-.4.905-.9.905H9.697c-.5 0-.9-.405-.9-.905v-3.19c0-.5.4-.905.9-.905zm-4.997 8h14.6c.5 0 .9.405.9.905v8.19c0 .5-.4.905-.9.905h-14.6c-.5 0-.9-.405-.9-.905v-8.19c0-.5.4-.905.9-.905zM3 12v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2h-4.5V7H15c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2h1.5v3H5c-1.1 0-2 .9-2 2zm8.5-3h1V6h-1v3zM12 14c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"></path>
                  </g>
                </svg>
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </label>
            </div>
            
            {/* Avatar */}
            <div className="absolute -bottom-16 left-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-black">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Image 
                    path="/general/avatar.png" 
                    alt="Default avatar" 
                    w={128} 
                    h={128} 
                    className="object-cover" 
                  />
                )}
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current text-white">
                      <g>
                        <path d="M9.697 3H14.303c.5 0 .9.405.9.905v3.19c0 .5-.4.905-.9.905H9.697c-.5 0-.9-.405-.9-.905v-3.19c0-.5.4-.905.9-.905zm-4.997 8h14.6c.5 0 .9.405.9.905v8.19c0 .5-.4.905-.9.905h-14.6c-.5 0-.9-.405-.9-.905v-8.19c0-.5.4-.905.9-.905zM3 12v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2h-4.5V7H15c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2h1.5v3H5c-1.1 0-2 .9-2 2zm8.5-3h1V6h-1v3zM12 14c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"></path>
                      </g>
                    </svg>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Form Fields */}
          <div className="mt-20 px-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={50}
                className="w-full bg-transparent border border-borderGray rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Add your name"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">{formData.name.length}/50</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                maxLength={160}
                rows={3}
                className="w-full bg-transparent border border-borderGray rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Add your bio"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">{formData.bio.length}/160</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                maxLength={30}
                className="w-full bg-transparent border border-borderGray rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Add your location"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full bg-transparent border border-borderGray rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Add your website"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
