"use client";

// to upload anything on image kit we will need a backend server and we need to be authenticated 
// npm i imagekit
//we will be using our server actions andnupload our media on the backend
import React, { useState } from "react";
import Image from "./Image";
import NextImage from "next/image";
import { shareAction } from "@/actions";
import ImageEditor from "./ImageEditor";

const Share = () => {
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
      // File {name: 'virtual-assitant.jpg', lastModified: 1731367435385, lastModifiedDate: Tue Nov 12 2024 01:23:55 GMT+0200 (Eastern European Standard Time), webkitRelativePath: '', size: 490453, …}
    }
  };

  // this is to show the preview of the media while uploading
  // we will be able to see it without uploading it
  const previewURL = media ? URL.createObjectURL(media) : null;

  return (
    // this should be a form because we need to submit the form to upload the media on the backend server
    //by default its sending that form data but we will send it like this to add the settings
    <form
      className="p-4 flex gap-4"
      action={(formData) => shareAction(formData, settings)}
    >
      {/* AVATAR */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden">
        <Image path="general/avatar.png" alt="" w={100} h={100} tr={true} />
      </div>
      {/* OTHERS */}
      <div className="flex-1 flex flex-col gap-4">
        <input
          type="text"
          name="desc"
          placeholder="What is happening?!"
          className="bg-transparent outline-none placeholder:text-textGray text-xl"
        />
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
            <Image
              path="icons/gif.svg"
              alt=""
              w={20}
              h={20}
              className="cursor-pointer"
            />
            <Image
              path="icons/poll.svg"
              alt=""
              w={20}
              h={20}
              className="cursor-pointer"
            />
            <Image
              path="icons/emoji.svg"
              alt=""
              w={20}
              h={20}
              className="cursor-pointer"
            />
            <Image
              path="icons/schedule.svg"
              alt=""
              w={20}
              h={20}
              className="cursor-pointer"
            />
            <Image
              path="icons/location.svg"
              alt=""
              w={20}
              h={20}
              className="cursor-pointer"
            />
          </div>
          {/* POST */}
          <button className="bg-white text-black font-bold rounded-full py-2 px-4">
            Post
          </button>
        </div>
      </div>
    </form>
  );
};

export default Share;