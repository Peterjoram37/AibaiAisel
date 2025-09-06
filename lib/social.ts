"use client";

export type User = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  verified: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: number;
  likes: number;
  comments: number;
  shares: number;
};

const USERS_KEY = "sl_users";
const POSTS_KEY = "sl_posts";

const demoUsers: User[] = [
  { id: "u1", name: "Peter Sichilima", username: "peter", verified: true, avatarUrl: "https://ui-avatars.com/api/?name=Peter+S&background=0D8ABC&color=fff" },
  { id: "u2", name: "Regina William", username: "regina", verified: false, avatarUrl: "https://ui-avatars.com/api/?name=Regina+W&background=1d4ed8&color=fff" },
  { id: "u3", name: "Temi Nyanda", username: "temi", verified: false, avatarUrl: "https://ui-avatars.com/api/?name=Temi+N&background=0ea5e9&color=fff" },
];

const demoPosts: Post[] = [
  { id: "po1", authorId: "u2", text: "Wasameheee ila usisahau funzo walilo kuachia...", imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1400&auto=format&fit=crop", createdAt: Date.now()-1000*60*60*5, videoUrl: undefined, likes: 9, comments: 3, shares: 1 },
  { id: "po2", authorId: "u1", text: "Karibu SocialLift! Post picha, video na updates zako hapa.", createdAt: Date.now()-1000*60*60*14, imageUrl: undefined, videoUrl: undefined, likes: 15, comments: 6, shares: 4 },
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function getUsers(): User[] {
  return readLocal<User[]>(USERS_KEY, demoUsers);
}

export function getPosts(): Post[] {
  // newest first
  const posts = readLocal<Post[]>(POSTS_KEY, demoPosts);
  return posts.sort((a,b)=>b.createdAt-a.createdAt);
}

export function setUsers(users: User[]) {
  writeLocal(USERS_KEY, users);
}

export function setPosts(posts: Post[]) {
  writeLocal(POSTS_KEY, posts);
}

export function toggleUserVerified(userId: string, isVerified: boolean) {
  const users = getUsers().map(u => u.id === userId ? { ...u, verified: isVerified } : u);
  setUsers(users);
  return users;
}

export function addPost(input: { authorId: string; text: string; imageUrl?: string; videoUrl?: string; }): Post {
  const posts = getPosts();
  const post: Post = {
    id: `p_${Date.now()}`,
    authorId: input.authorId,
    text: input.text,
    imageUrl: input.imageUrl,
    videoUrl: input.videoUrl,
    createdAt: Date.now(),
    likes: 0,
    comments: 0,
    shares: 0,
  };
  const updated = [post, ...posts];
  setPosts(updated);
  return post;
}

export function likePost(postId: string) {
  const posts = getPosts().map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p);
  setPosts(posts);
}

export function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function getCurrentUser(): User {
  // For demo, assume the first user is the current user
  const users = getUsers();
  return users[0];
}

