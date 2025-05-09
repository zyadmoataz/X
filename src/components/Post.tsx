import { imagekit } from "@/utils";
import Image from "./Image";
import PostInfo from "./PostInfo";
import PostInteractions from "./PostInteractions";
import Video from "./Video";
// import Link from "next/link";

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

const Post = async ({ type }: { type?: "status" | "comment" }) => {
 
  // FETCH POST MEDIA

  // file id is gonna return a promise and this promise contains the file details in the interface
  const getFileDetails = async (
    fileId: string
  ): Promise<FileDetailsResponse> => {
    return new Promise((resolve, reject) => {
      imagekit.getFileDetails(fileId, function (error, result) {
        if (error) reject(error);
        else resolve(result as FileDetailsResponse);
      });
    });
  };

  // pass the file id
  // const fileDetails = await getFileDetails("681b8a68432c47641649138f"); //for image
  const fileDetails = await getFileDetails("681cd8d4432c476416d624f1"); //for video

  console.log(fileDetails);

  return (
    <div className="p-4 border-y-[1px] border-borderGray">
      {/* POST TYPE */}
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
        <span>Lama Dev reposted</span>
      </div>
      {/*  POST CONTENT */}
      <div className={`flex gap-4 ${type === "status" && "flex-col"}`}>
        {/* AVATAR on the left side*/}
        <div
          className={`${
            type === "status" && "hidden"
          } relative w-10 h-10 rounded-full overflow-hidden`}
        >
            {/* if we are using tranformation then parent should be relative */}
          <Image path="general/avatar.png" alt="" w={100} h={100} tr={true} />
        </div>
        {/* CONTENT on the right side*/}
        <div className="flex-1 flex flex-col gap-2">
          {/* TOP */}
          <div className="w-full flex justify-between">
            {/* <Link href={`/lamaWebDev`} className="flex gap-4"> */}
              {/* <div
                className={`${
                  type !== "status" && "hidden"
                } relative w-10 h-10 rounded-full overflow-hidden`}
              >
                <Image
                  path="general/avatar.png"
                  alt=""
                  w={100}
                  h={100}
                  tr={true}
                />
              </div> */}
              <div
                className={`flex items-center gap-2 flex-wrap ${
                  type === "status" && "flex-col gap-0 !items-start"
                }`}
              >
                <h1 className="text-md font-bold">Lama Dev</h1>
                <span
                  className={`text-textGray ${type === "status" && "text-sm"}`}
                >
                  @lamaWebDev
                </span>
                {type !== "status" && (
                  <span className="text-textGray">1 day ago</span>
                )}
              </div>
            {/* </Link> */}
            <PostInfo />
          </div>
          {/* TEXT & MEDIA */}
          {/* <Link href={`/lamaWebDev/status/123`}> */}
            <p className={`${type === "status" && "text-lg"}`}>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum,
              animi. Laborum commodi aliquam alias molestias odio, ab in,
              reprehenderit excepturi temporibus, ducimus necessitatibus fugiat
              iure nam voluptas soluta pariatur inventore.
            </p>
          {/* </Link> */}
          {/* <Image path="general/post.jpeg" alt="" w={600} h={600} /> */}
          {/* AFTER FETCHING THE POST MEDIA */}
          {fileDetails && fileDetails.fileType === "image" ? (
            <Image
              path={fileDetails.filePath}
              alt=""
              w={fileDetails.width}
              h={fileDetails.height}
              className={fileDetails.customMetadata?.sensitive ? "blur-lg" : ""}
            />
          ) :
          
           (
            <Video
              path={fileDetails.filePath}
              className={fileDetails.customMetadata?.sensitive ? "blur-lg" : ""}
            />
          )
          }
          {type === "status" && (
            <span className="text-textGray">8:41 PM · Dec 5, 2024</span>
          )}
          <PostInteractions />
        </div>
      </div>
    </div>
  );
};

export default Post;