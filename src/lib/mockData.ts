// Mock data for the Twitter clone app
// This file provides realistic data to simulate a full social media experience

// Define types for our mock data
export type MockUser = {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  bio?: string;
  cover_url?: string;
  location?: string;
  website?: string;
  followers_count: number;
  following_count: number;
  joined_date: string;
};

export type MockPost = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  media_urls?: string[] | null;
  media_types?: string[] | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  hashtags?: string[];
  users: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
  };
};

export type MockTrendingTopic = {
  id: string;
  tag: string;
  posts_count: number;
  category: string;
  image_url?: string;
};

export type MockCommunity = {
  id: string;
  name: string;
  description: string;
  members_count: number;
  image_url: string;
  is_private: boolean;
  created_at: string;
};

// Generate 10 mock users
export const mockUsers: MockUser[] = [
  {
    id: 'user1',
    username: 'techguru',
    name: 'Tech Guru',
    avatar_url: '/general/user1.png',
    bio: 'Software engineer and tech enthusiast. Building the future one line of code at a time.',
    cover_url: '/general/cover1.jpg',
    location: 'San Francisco, CA',
    website: 'https://techguru.dev',
    followers_count: 15432,
    following_count: 1254,
    joined_date: '2020-03-15'
  },
  {
    id: 'user2',
    username: 'designmaster',
    name: 'Design Master',
    avatar_url: '/general/user2.png',
    bio: 'UI/UX Designer. Creating beautiful, functional, and accessible designs.',
    cover_url: '/general/cover2.jpg',
    location: 'New York, NY',
    website: 'https://designmaster.io',
    followers_count: 8976,
    following_count: 867,
    joined_date: '2019-07-22'
  },
  {
    id: 'user3',
    username: 'airesearcher',
    name: 'AI Researcher',
    avatar_url: '/general/user3.png',
    bio: 'Studying artificial intelligence and machine learning. PhD in Computer Science.',
    cover_url: '/general/cover3.jpg',
    location: 'Boston, MA',
    website: 'https://ai-research.org',
    followers_count: 12345,
    following_count: 543,
    joined_date: '2018-11-05'
  },
  {
    id: 'user4',
    username: 'newsreporter',
    name: 'News Reporter',
    avatar_url: '/general/user4.png',
    bio: 'Breaking news and technology trends. Journalist for TechDaily.',
    cover_url: '/general/cover4.jpg',
    location: 'Washington, DC',
    website: 'https://techdaily.com',
    followers_count: 25678,
    following_count: 1876,
    joined_date: '2017-05-12'
  },
  {
    id: 'user5',
    username: 'startupfounder',
    name: 'Startup Founder',
    avatar_url: '/general/user5.png',
    bio: 'CEO and Founder of TechStartup. Building the next unicorn.',
    cover_url: '/general/cover5.jpg',
    location: 'Austin, TX',
    website: 'https://techstartup.io',
    followers_count: 9876,
    following_count: 765,
    joined_date: '2019-02-28'
  },
  {
    id: 'user6',
    username: 'dataanalyst',
    name: 'Data Analyst',
    avatar_url: '/general/user6.png',
    bio: 'Finding insights in data. Passionate about statistics and visualization.',
    cover_url: '/general/cover6.jpg',
    location: 'Chicago, IL',
    website: 'https://datainsights.co',
    followers_count: 7654,
    following_count: 876,
    joined_date: '2020-01-15'
  },
  {
    id: 'user7',
    username: 'webdeveloper',
    name: 'Web Developer',
    avatar_url: '/general/user7.png',
    bio: 'Full-stack developer specializing in React and Node.js.',
    cover_url: '/general/cover7.jpg',
    location: 'Seattle, WA',
    website: 'https://webdev.codes',
    followers_count: 5432,
    following_count: 654,
    joined_date: '2021-04-10'
  },
  {
    id: 'user8',
    username: 'cryptoenthusiast',
    name: 'Crypto Enthusiast',
    avatar_url: '/general/user8.png',
    bio: 'Blockchain technology advocate. Investing in the future of finance.',
    cover_url: '/general/cover8.jpg',
    location: 'Miami, FL',
    website: 'https://crypto-future.net',
    followers_count: 11234,
    following_count: 987,
    joined_date: '2018-09-20'
  },
  {
    id: 'user9',
    username: 'productmanager',
    name: 'Product Manager',
    avatar_url: '/general/user9.png',
    bio: 'Building products that solve real problems. User-centric and data-driven.',
    cover_url: '/general/cover9.jpg',
    location: 'Portland, OR',
    website: 'https://productbuilder.io',
    followers_count: 8765,
    following_count: 876,
    joined_date: '2019-11-11'
  },
  {
    id: 'user10',
    username: 'gamingpro',
    name: 'Gaming Pro',
    avatar_url: '/general/user10.png',
    bio: 'Professional gamer and streamer. Join me on Twitch!',
    cover_url: '/general/cover10.jpg',
    location: 'Los Angeles, CA',
    website: 'https://twitch.tv/gamingpro',
    followers_count: 32145,
    following_count: 1243,
    joined_date: '2017-12-05'
  }
];

// Popular hashtags
const popularHashtags = [
  '#Programming',
  '#JavaScript',
  '#React',
  '#NextJS',
  '#WebDev',
  '#AI',
  '#MachineLearning',
  '#DataScience',
  '#Blockchain',
  '#Crypto',
  '#TechNews',
  '#ProductDevelopment',
  '#UX',
  '#Design',
  '#StartupLife',
  '#Gaming',
  '#WorkFromHome',
  '#Technology',
  '#Innovation',
  '#SoftwareEngineering'
];

// Helper function to get random hashtags
const getRandomHashtags = (count: number = 3) => {
  const shuffled = [...popularHashtags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper to generate random date within the last month
const getRandomRecentDate = () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  return pastDate.toISOString();
};

// Generate 10 posts for each user
export const generateMockPosts = (): MockPost[] => {
  const posts: MockPost[] = [];
  
  mockUsers.forEach(user => {
    for (let i = 1; i <= 10; i++) {
      const hashtags = getRandomHashtags(Math.floor(Math.random() * 3) + 1);
      const hashtagsText = hashtags.join(' ');
      
      const postContent = [
        `Just published my latest article on ${hashtagsText}. Check it out and let me know what you think!`,
        `Excited to share my latest project using ${hashtagsText}. It's been an amazing journey!`,
        `Attending a conference on ${hashtagsText} next week. Anyone else going?`,
        `My thoughts on the future of ${hashtagsText} - I believe we're just scratching the surface.`,
        `Looking for recommendations on learning ${hashtagsText}. What resources did you find helpful?`,
        `Just solved a challenging problem with ${hashtagsText}. So satisfying when the code finally works!`,
        `Great discussion today about ${hashtagsText} with some brilliant minds in the industry.`,
        `New tutorial on ${hashtagsText} is now available. Link in bio!`,
        `What's your favorite tool for ${hashtagsText}? I'm currently using XYZ and loving it.`,
        `Hot take: ${hashtagsText} is changing faster than most can keep up with. Focus on fundamentals!`
      ][Math.floor(Math.random() * 10)];
      
      posts.push({
        id: `post_${user.id}_${i}`,
        user_id: user.id,
        content: postContent,
        created_at: getRandomRecentDate(),
        media_urls: Math.random() > 0.7 ? ['/general/post_image.jpg'] : null,
        media_types: Math.random() > 0.7 ? ['image'] : null,
        likes_count: Math.floor(Math.random() * 1000),
        comments_count: Math.floor(Math.random() * 100),
        reposts_count: Math.floor(Math.random() * 50),
        hashtags: hashtags,
        users: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar_url: user.avatar_url
        }
      });
    }
  });
  
  // Sort posts by created_at date (newest first)
  return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

// Generate trending topics based on hashtags
export const generateTrendingTopics = (): MockTrendingTopic[] => {
  return [
    {
      id: '1',
      tag: '#Programming',
      posts_count: 12500,
      category: 'Technology',
      image_url: '/general/trending1.jpg'
    },
    {
      id: '2',
      tag: '#AI',
      posts_count: 8740,
      category: 'Technology',
    },
    {
      id: '3',
      tag: '#WebDev',
      posts_count: 5230,
      category: 'Technology',
    },
    {
      id: '4',
      tag: '#Blockchain',
      posts_count: 3890,
      category: 'Cryptocurrency',
    },
    {
      id: '5',
      tag: '#WorkFromHome',
      posts_count: 2150,
      category: 'Lifestyle',
    },
    {
      id: '6',
      tag: '#NextJS',
      posts_count: 1850,
      category: 'Technology',
    },
    {
      id: '7',
      tag: '#Gaming',
      posts_count: 4320,
      category: 'Entertainment',
    },
    {
      id: '8',
      tag: '#UX',
      posts_count: 1750,
      category: 'Design',
    },
    {
      id: '9',
      tag: '#StartupLife',
      posts_count: 2250,
      category: 'Business',
    },
    {
      id: '10',
      tag: '#Innovation',
      posts_count: 3100,
      category: 'Business',
    }
  ];
};

// Generate mock communities
export const mockCommunities = [
  {
    id: 'community1',
    name: 'JavaScript Developers',
    description: 'A community for JavaScript developers to share knowledge, ask questions, and collaborate on projects.',
    members_count: 12580,
    image_url: '/general/community1.jpg',
    is_private: false,
    created_at: '2020-01-15'
  },
  {
    id: 'community2',
    name: 'UI/UX Designers',
    description: 'Share your designs, get feedback, and discuss the latest trends in UI/UX design.',
    members_count: 8750,
    image_url: '/general/community2.jpg',
    is_private: false,
    created_at: '2020-03-22'
  },
  {
    id: 'community3',
    name: 'AI Researchers',
    description: 'Discuss artificial intelligence research, share papers, and collaborate on AI projects.',
    members_count: 5430,
    image_url: '/general/community3.jpg',
    is_private: false,
    created_at: '2019-11-05'
  },
  {
    id: 'community4',
    name: 'Startup Founders',
    description: 'Connect with other startup founders, share your experiences, and get advice.',
    members_count: 6780,
    image_url: '/general/community4.jpg',
    is_private: false,
    created_at: '2021-02-18'
  },
  {
    id: 'community5',
    name: 'Blockchain Developers',
    description: 'A community for blockchain developers to discuss technology, projects, and opportunities.',
    members_count: 4320,
    image_url: '/general/community5.jpg',
    is_private: false,
    created_at: '2020-08-10'
  }
];

// Helper function to filter posts by hashtag
export const filterPostsByHashtag = (posts: MockPost[], hashtag: string): MockPost[] => {
  // Remove the # if it's included in the search
  const searchTag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
  
  return posts.filter(post => 
    post.hashtags?.some(tag => 
      tag.toLowerCase() === searchTag.toLowerCase()
    ) || post.content.toLowerCase().includes(searchTag.toLowerCase())
  );
};

// Helper function to filter posts by user
export const filterPostsByUser = (posts: MockPost[], userId: string): MockPost[] => {
  return posts.filter(post => post.user_id === userId);
};

// Helper function to get posts for a user's feed (posts from users they follow)
export const getUserFeedPosts = (posts: MockPost[], followingIds: string[]): MockPost[] => {
  return posts.filter(post => followingIds.includes(post.user_id));
};

// Export all mock data and utilities
export const mockData = {
  users: mockUsers,
  posts: generateMockPosts(),
  trendingTopics: generateTrendingTopics(),
  communities: mockCommunities,
  filterPostsByHashtag,
  filterPostsByUser,
  getUserFeedPosts
};

export default mockData;
