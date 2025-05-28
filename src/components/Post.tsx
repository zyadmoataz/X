"use client";

import { imagekit } from "@/utils";
import Image from "./Image";
import PostInfo from "./PostInfo";
import PostInteractions from "./PostInteractions";
import Video from "./Video";
import Link from "next/link";
import type { Post } from "@/types/supabase";
import { User } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";

//this is the file details
interface FileDetailsResponse {
  width: number;
  height: number;
  filePath: string;
  url: string;
  fileType: string;
  // this is the custom metadata that we added manual on image kit website
  customMetadata?: { sensitive: boolean };
}

interface PostProps {
  post?: Post;
  currentUser?: User | null;
  type?: "status" | "comment";
  isBookmarked?: boolean;
  onRemoveBookmark?: () => void;
}

const Post = ({ post, currentUser, type, isBookmarked, onRemoveBookmark }: PostProps) => {
  // Default data for when we're using static content (backwards compatibility)
  const postData = post as Post;

  // Generate a truly unique key for this post
  const uniquePostKey = post?.id || `post_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;

  // Get the first media URL if available
  const mediaUrl = post?.media_urls?.[0];
  const mediaType = post?.media_types?.[0] || "image";

  // Get file details if we have a media URL
  const fileDetails = mediaUrl ? {
    filePath: mediaUrl,
    fileType: mediaType,
    width: 600,
    height: 600,
    customMetadata: { sensitive: false }
  } : null;
  //   return new Promise((resolve, reject) => {
  //     imagekit.getFileDetails(fileId, function (error, result) {
  //       if (error) reject(error);
  //       else resolve(result as FileDetailsResponse);
  //     });
  //   });
  // };

  // const fileDetails = await getFileDetails("675d943be375273f6003858f");

  // console.log(fileDetails);

  return (
    <div className="p-4 border-y-[1px] border-borderGray">
      {/* POST TYPE */}
      {postData.is_repost && (
        <div className="flex items-center gap-2 text-sm text-textGray mb-2 font-bold">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
          >
            <path
              fill="#71767b"
              d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13V20H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 2.71H11V4h5.25c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3-4.603-4.3 1.706-1.82L18 15.62V8.25c0-.97-.784-1.75-1.75-1.75z"
            />
          </svg>
          <span>{postData.users?.name || 'User'} reposted</span>
        </div>
      )}
      {/*  POST CONTENT */}
      <div className={`flex gap-4 ${type === "status" && "flex-col"}`}>
        {/* AVATAR on the left side*/}
        <div
          className={`${
            type === "status" && "hidden"
          } relative w-10 h-10 rounded-full overflow-hidden`}
        >
          <Image
            path={postData.users?.avatar_url||"/general/avatar.png" }
            alt=""
            w={100}
            h={100}
            tr={true}
          />
        </div>
        {/* CONTENT on the right side*/}
        <div className="flex-1 flex flex-col gap-2">
          {/* TOP */}
          <div className="w-full flex justify-between">
            <Link href={`/zyadmoataz`} className="flex gap-4">
              <div
                className={`${
                  type !== "status" && "hidden"
                } relative w-10 h-10 rounded-full overflow-hidden`}
              >
                {postData.media_urls && Array.isArray(postData.media_urls) && postData.media_urls.length > 0 && (
                  <Image
                    path={postData.media_urls[0]}
                    alt="Post media"
                    w={100}
                    h={100}
                    tr={true}
                  />
                )}
              </div>
              {/* its important to use use items start  */}
              <div
                className={`flex items-center gap-2 flex-wrap ${
                  type === "status" && "flex-col gap-0 !items-start"
                }`}
              >
                <h1 className="text-md font-bold">{postData.users?.name || 'User'}</h1>
                <span
                  className={`text-textGray ${type === "status" && "text-sm"}`}
                >
                  @{postData.users?.username || 'username'}
                </span>
                {type !== "status" && (
                  <span className="text-textGray">
                    {postData.created_at ? formatDistanceToNow(new Date(postData.created_at), { addSuffix: true }) : '1 day ago'}
                  </span>
                )}
              </div>
            </Link>
            <PostInfo />
          </div>
          {/* TEXT & MEDIA */}
          <Link href={`/zyadmoataz/status/123`}>
            <p className={`${type === "status" && "text-lg"}`}>
              {postData.content}
            </p>
          </Link>
          {/* <Image path="general/post.jpeg" alt="" w={600} h={600} /> */}
          {/* POST MEDIA */}
          {fileDetails && (
            <div className="relative w-full">
              {fileDetails.fileType === "image" ? (
                <Image
                  path={fileDetails.filePath}
                  alt="Post media"
                  w={fileDetails.width}
                  h={fileDetails.height}
                  className={fileDetails.customMetadata?.sensitive ? "blur-lg" : ""}
                />
              ) : (
                <Video
                  path={fileDetails.filePath}
                  className={fileDetails.customMetadata?.sensitive ? "blur-lg" : ""}
                />
              )}
            </div>
          )}
          {type === "status" && (
            <span className="text-textGray">
              {postData.created_at
                ? new Date(postData.created_at).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : '8:41 PM · Dec 5, 2024'}
            </span>
          )}
          <PostInteractions post={postData} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default Post;