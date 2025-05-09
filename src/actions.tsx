"use server";
// everything will run on the server

import { imagekit } from "./utils";

export const shareAction = async (
  formData: FormData,
  settings: { type: "original" | "wide" | "square"; sensitive: boolean }
) => {
  const file = formData.get("file") as File;
//   const desc = formData.get("desc") as string;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

//   any way it will be 600 only we will change the aspect ratio
//height will be the same at square and 16:9 in wide and other wise change nothing as this is the original image
  const transformation = `w-600, ${
    settings.type === "square"
      ? "ar-1-1"
      : settings.type === "wide"
      ? "ar-16-9"
      : ""
  }`;

//   pass our file through the upload function
// file could be image or video or audio
  imagekit.upload(
    {
      file: buffer,
      fileName: file.name,
      folder: "/posts",
    //   transform our image while uploading 
    // we must check file type if its image then apply transformation as we have videos
      ...(file.type.includes("image") && {
        transformation: {
          pre: transformation,
        },
      }),
    //we created in image kit a custom metadata from settings > Media library > custom metadata > > field label and field name is called sensitive, and its manadtory and  type boolean
      customMetadata: {
        sensitive: settings.sensitive,
      },
    },
    function (error, result) {
      if (error) console.log(error);
      else console.log(result);
    }
  );
};