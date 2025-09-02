"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UserSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    location: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("userSession");
      if (u) router.push("/");
    } catch {}
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      if (users.some((u: any) => u.username === form.username)) {
        setError("Username already exists");
        setLoading(false);
        return;
      }
      if (users.some((u: any) => u.email === form.email)) {
        setError("Email already used");
        setLoading(false);
        return;
      }
      const newUser = { id: `u${Date.now()}`, ...form, createdAt: new Date().toISOString() };
      localStorage.setItem("users", JSON.stringify([...users, newUser]));
      localStorage.setItem("userSession", JSON.stringify({ id: newUser.id, username: newUser.username, email: newUser.email, phone: newUser.phone, location: newUser.location }));
      setTimeout(() => router.push("/"), 300);
    } catch (err) {
      setError("Unexpected error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 grid place-items-center p-4">
      <Card className="w-full max-w-md bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-center">Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} className="bg-slate-900 border-slate-800" required />
            <Input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="bg-slate-900 border-slate-800" required />
            <Input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="bg-slate-900 border-slate-800" required />
            <Input placeholder="Location (eneo)" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} className="bg-slate-900 border-slate-800" required />
            <Input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="bg-slate-900 border-slate-800" required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading? 'Creating...' : 'Sign Up'}</Button>
            <p className="text-sm text-slate-400 text-center">Already have an account? <a className="underline" href="/auth/login">Login</a></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

