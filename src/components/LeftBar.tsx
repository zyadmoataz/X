'use client';

import Link from "next/link";
import Image from "./Image";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const menuList = [
    {
      id: 1,
      name: "Home",
      link: "/",
      icon: "home.svg",
    },
    {
      id: 2,
      name: "Explore",
      link: "/explore",
      icon: "explore.svg",
    },
    {
      id: 3,
      name: "Notifications",
      link: "/notifications",
      icon: "notification.svg",
    },
    {
      id: 4,
      name: "Messages",
      link: "/messages",
      icon: "message.svg",
    },
    {
      id: 5,
      name: "Bookmarks",
      link: "/bookmarks",
      icon: "bookmark.svg",
    },
    {
      id: 6,
      name: "Jobs",
      link: "/jobs",
      icon: "job.svg",
    },
    {
      id: 7,
      name: "Communities",
      link: "/communities",
      icon: "community.svg",
    },
    {
      id: 8,
      name: "Premium",
      link: "/premium",
      icon: "logo.svg",
    },
    {
      id: 9,
      name: "Profile",
      link: "/profile",
      icon: "profile.svg",
    },
    {
      id: 10,
      name: "More",
      link: "/more",
      icon: "more.svg",
    },
  ];

export default function LeftBar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

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
                {menuList.map((item) => {
                  const isActive = pathname === item.link ||
                    (item.link === '/profile' && pathname.startsWith('/profile/'));
                  
                  return (
                    <Link 
                      href={item.link} 
                      key={item.id} 
                      className={`flex items-center gap-4 p-2 rounded-full hover:bg-[#181818] ${isActive ? 'font-bold' : ''}`}
                    >
                      <Image path={`/icons/${item.icon}`} alt={item.name} w={24} h={24}/>
                      <span className="hidden xxl:inline">{item.name}</span>
                    </Link>
                  );
                })}
            </div>
            {/* Post Button */}
            <Link href="/compose/post" className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center xxl:hidden">
                <Image path="/icons/post.svg" alt="new post" w={24} h={24}/>
            </Link>
            <Link href="/compose/post" className="hidden xxl:block bg-white text-black rounded-full font-bold py-2 px-20">
                Post
            </Link>
            {/* Post buttons remain, but removed separate sign out button */}
        </div>
        {/* User */}
        {user ? (
          <div className="relative">
            {/* User info that serves as dropdown toggle */}
            <button 
              onClick={() => {
                const dropdown = document.getElementById('user-dropdown');
                if (dropdown) {
                  dropdown.classList.toggle('hidden');
                }
              }} 
              className="flex items-center justify-between w-full cursor-pointer p-2 rounded-full hover:bg-[#181818]"
            >
              <div className="flex items-center gap-2">
                {/* Image of the user */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image 
                    path={user.avatar_url || "/general/avatar.png"} 
                    alt={user.name || "user"} 
                    w={100} 
                    h={100} 
                    className="object-cover" 
                    tr={true}
                  />
                </div>
                {/* Name of the user */}
                <div className="hidden xxl:flex flex-col">
                  <span className="font-bold">{user.name || "User"}</span>
                  <span className="text-sm text-textGray">@{user.username || "user"}</span>
                  {user.following_count && (
                    <span className="text-sm text-white">
                      <span className="font-bold">{user.following_count}</span> Following
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden xxl:block font-bold">
                ...
              </div>
            </button>
            
            {/* Dropdown menu - toggled by click */}
            <div id="user-dropdown" className="absolute bottom-full left-0 mb-2 w-64 bg-black border border-borderGray rounded-xl shadow-lg z-50 hidden">
              <div className="p-4 border-b border-borderGray">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image 
                      path={user.avatar_url || "/general/avatar.png"} 
                      alt={user.name || "user"} 
                      w={100} 
                      h={100} 
                      className="object-cover" 
                      tr={true}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold">{user.name || "User"}</span>
                    <span className="text-sm text-textGray">@{user.username || "user"}</span>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <Link href={`/profile/${user.username}/following`} className="hover:underline">
                    <span className="font-bold">{user.following_count || 0}</span> Following
                  </Link>
                  <Link href={`/profile/${user.username}/followers`} className="hover:underline">
                    <span className="font-bold">{user.followers_count || 0}</span> Followers
                  </Link>
                </div>
              </div>
              <div className="py-2">
                <Link href={`/profile/${user.username}`} className="block px-4 py-2 hover:bg-[#181818]">
                  Profile
                </Link>
                <Link href="/settings/profile" className="block px-4 py-2 hover:bg-[#181818]">
                  Settings
                </Link>
                <Link href="/premium" className="block px-4 py-2 hover:bg-[#181818]">
                  Premium
                </Link>
                <button 
                  onClick={signOut} 
                  className="block w-full text-left px-4 py-2 hover:bg-[#181818] text-red-500"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-white hover:text-blue-400">
              Log in
            </Link>
            <span className="text-gray-500">|</span>
            <Link href="/signup" className="text-white hover:text-blue-400">
              Sign up
            </Link>
          </div>
        )}
    </div>
  )
}
