
import Link from "next/link";
import Image from "./Image";


const menuList = [
    {
      id: 1,
      name: "Homepage",
      link: "/",
      icon: "home.svg",
    },
    {
      id: 2,
      name: "Explore",
      link: "/",
      icon: "explore.svg",
    },
    {
      id: 3,
      name: "Notification",
      link: "/",
      icon: "notification.svg",
    },
    {
      id: 4,
      name: "Messages",
      link: "/",
      icon: "message.svg",
    },
    {
      id: 5,
      name: "Bookmarks",
      link: "/",
      icon: "bookmark.svg",
    },
    {
      id: 6,
      name: "Jobs",
      link: "/",
      icon: "job.svg",
    },
    {
      id: 7,
      name: "Communities",
      link: "/",
      icon: "community.svg",
    },
    {
      id: 8,
      name: "Premium",
      link: "/",
      icon: "logo.svg",
    },
    {
      id: 9,
      name: "Profile",
      link: "/",
      icon: "profile.svg",
    },
    {
      id: 10,
      name: "More",
      link: "/",
      icon: "more.svg",
    },
  ];

export default function LeftBar() {
  return (
    <div className="h-screen sticky top-0 flex flex-col justify-between pt-2 pb-8">
        {/* Logo menu button */}
        <div className="flex flex-col gap-4 text-lg items-center xxl:items-start">
            {/* Logo */}
            <Link href="/" className="p-2 rounded-full hover:bg-[#181818]">
                <Image path="/icons/logo.svg" alt="logo" w={24} h={24}/>
            </Link>
            {/* Menu List*/}
            <div className="flex flex-col gap-4">
                {menuList.map((item)=>(
                   <Link href={item.link} key={item.id} className="flex items-center gap-4 p-2 rounded-full hover:bg-[#181818]">
                        <Image path={`/icons/${item.icon}`} alt={item.name} w={24} h={24}/>
                        <span className="hidden xxl:inline">{item.name}</span> {/* By default span is displayed inline*/}
                   </Link> 
                ))}
            </div>
            {/* Button */}
            <Link href="/" className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center xxl:hidden">
                <Image path="/icons/post.svg" alt="new post" w={24} h={24}/>
            </Link>
            <Link href="/" className="hidden xxl:block bg-white text-black rounded-full font-bold py-2 px-20">
                Post
            </Link>
        </div>
        {/* User */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {/* Image of the user */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    {/* Instead of fill give any number u want in width and height and say transformation true */}
                    {/* <Image path="/general/avatar.png" alt="user" fill className="object-cover"/> */}
                    <Image path="/general/avatar.png" alt="user" w={100} h={100} className="object-cover" tr={true}/>
                </div>
                {/* Name of the user */}
                <div className="hidden xxl:flex flex-col">
                    <span className="font-bold">Username</span>
                    <span className="text-sm text-textGray">@User</span>
                </div>
            </div>
            <div className="hidden xxl:block cursor-pointer font-bold">
                {/* <Image src="/icons/more.svg" alt="user" width={24} height={24}/> */}
                ...
            </div>
        </div>
    </div>
  )
}
