"use client"

import React, { useEffect, useMemo, useState } from "react";
import { Search, Image as ImageIcon, Video, Send, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserName } from "@/components/UserName";
import { getPosts, getUsers, addPost, getUserById, formatTimeAgo, likePost, getCurrentUser } from "@/lib/social";

export default function HomeFeed(){
  const [users, setUsers] = useState(getUsers());
  const [posts, setPosts] = useState(getPosts());
  const me = useMemo(()=>getCurrentUser(), []);

  useEffect(()=>{
    // Refresh from localStorage when window gains focus
    const onFocus = () => { setUsers(getUsers()); setPosts(getPosts()); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const [composer, setComposer] = useState({ text: "", imageUrl: "", videoUrl: "" });

  function publish(){
    if(!composer.text.trim() && !composer.imageUrl && !composer.videoUrl) return;
    addPost({ authorId: me.id, text: composer.text.trim(), imageUrl: composer.imageUrl || undefined, videoUrl: composer.videoUrl || undefined });
    setComposer({ text: "", imageUrl: "", videoUrl: "" });
    setPosts(getPosts());
  }

  function onLike(id: string){ likePost(id); setPosts(getPosts()); }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 grid place-items-center text-white font-bold">S</div>
          <span className="font-bold">SocialLift</span>
          <div className="flex-1" />
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input placeholder="Search SocialLift" className="pl-9 w-72" />
          </div>
          <a href="/admin/login" className="text-sm text-gray-600">Admin</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-[1fr_2fr_1fr] gap-4">
        <aside className="hidden md:block">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <img src={me.avatarUrl} alt={me.name} className="w-10 h-10 rounded-full" />
              <UserName name={me.name} verified={me.verified} />
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          <Card className="bg-white">
            <CardContent className="p-4 space-y-3">
              <Input placeholder="What's on your mind, {me.name.split(' ')[0]}?" value={composer.text} onChange={e=>setComposer({...composer, text:e.target.value})} />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={()=>setComposer({...composer, imageUrl: prompt("Image URL (optional)!") || ""})} className="gap-2"><ImageIcon className="w-4 h-4" /> Image</Button>
                  <Button variant="outline" onClick={()=>setComposer({...composer, videoUrl: prompt("Video URL (YouTube/Vimeo) optional!") || ""})} className="gap-2"><Video className="w-4 h-4" /> Video</Button>
                </div>
                <Button onClick={publish} className="gap-2"><Send className="w-4 h-4" /> Post</Button>
              </div>
              {(composer.imageUrl || composer.videoUrl) && (
                <div className="text-xs text-gray-600">Attachment: {composer.imageUrl || composer.videoUrl}</div>
              )}
            </CardContent>
          </Card>

          {posts.map(p=>{
            const user = getUserById(p.authorId)!;
            return (
              <Card key={p.id} className="bg-white">
                <CardContent className="p-0">
                  <div className="p-4 flex items-start gap-3">
                    <img src={user?.avatarUrl} alt={user?.name} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <UserName name={user.name} verified={user.verified} />
                        <span className="text-xs text-gray-500">{formatTimeAgo(p.createdAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{p.text}</p>
                    </div>
                  </div>
                  {p.imageUrl && <img src={p.imageUrl} alt="post" className="w-full max-h-[520px] object-cover" />}
                  {p.videoUrl && (
                    <div className="p-4">
                      <a href={p.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">Open video</a>
                    </div>
                  )}
                  <div className="px-4 py-2 text-sm text-gray-600">{p.likes} Likes · {p.comments} Comments · {p.shares} Shares</div>
                  <div className="flex items-center justify-between px-2 py-1 border-t">
                    <Button variant="ghost" className="gap-2" onClick={()=>onLike(p.id)}><ThumbsUp className="w-4 h-4" /> Like</Button>
                    <Button variant="ghost" className="gap-2"><MessageCircle className="w-4 h-4" /> Comment</Button>
                    <Button variant="ghost" className="gap-2"><Share2 className="w-4 h-4" /> Share</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <aside className="hidden md:block space-y-3">
          <Card>
            <CardContent className="p-3">
              <p className="font-semibold mb-2">Contacts</p>
              <div className="space-y-2">
                {users.map(u=> (
                  <div key={u.id} className="flex items-center gap-2">
                    <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full" />
                    <UserName name={u.name} verified={u.verified} className="text-sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
