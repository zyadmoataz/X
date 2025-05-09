"use client";
import { IKVideo } from "imagekitio-next";

const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT;

type VideoTypes = {
  path: string;
  className?: string;
};

// we need no width and heigh to see the full video
const Video = ({ path, className }: VideoTypes) => {
  return (
    <IKVideo
      urlEndpoint={urlEndpoint}
      path={path}
      className={className}
      transformation={[
        // quality 90%
        { width: "1920", height: "1080", q: "90" },
        // layer type is text, layer input is the website name or what i want to write, we can add the font size and color white, and at last we should add layer end
        { raw: "l-text,i-ZyadMoataz,fs-100,co-white,l-end" },
        // {  raw: "l-image,i-avatar.png,w-100,b-10_10CDDC39,l-end"  },
      ]}
      controls
    />
  );
};

export default Video;