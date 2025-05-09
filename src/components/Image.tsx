"use client";

import { IKImage } from "imagekitio-next";

type ImageType = {
  path: string;
  w?: number;
  h?: number;
  alt: string;
  className?: string;
  tr?: boolean;
};

const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT;

if (!urlEndpoint) {
  throw new Error('Error: Please add urlEndpoint to .env or .env.local')
}

const Image = ({ path, w, h, alt, className, tr }: ImageType) => {
  return (
    <IKImage
      urlEndpoint={urlEndpoint}
      path={path}
    //When tr={true}: Uses ImageKit's transformation engine to resize the image on-demand.
        //Generates a new image URL with w and h as transformation parameters (e.g., /tr:w-300,h-200/image.jpg).
        //Ideal for dynamic resizing (e.g., thumbnails) without storing multiple versions.
    //When tr={false} or undefined: Uses native HTML width and height attributes.
        //The browser resizes the original image (less efficient for large images).
    //Use tr={true} for server-side resizing (better performance).
    //Use tr={false} only if you need the original image (e.g., for download).
      {...(tr
        ? { transformation: [{ width: `${w}`, height: `${h}` }] }
        : { width: w, height: h })}
    //LQIP (Low-Quality Image Placeholder)
    //Improves perceived loading speed by showing a blurred preview while the full image loads.
        //active: true: Enables LQIP.
        //quality: 20: Uses a very low-quality (20%) placeholder (small file size).
    //lqip enhances UX by preventing layout shifts and showing immediate feedback.
    //we can see the low quality image while still loading the full image
      lqip={{ active: true, quality: 20 }}
      alt={alt}
      className={className}
    />
  );
};

export default Image;