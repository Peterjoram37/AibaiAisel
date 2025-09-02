"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UserLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: "", password: "" });
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
      const user = users.find((u: any) => (u.username === form.identifier || u.email === form.identifier || u.phone === form.identifier) && u.password === form.password);
      if (!user) {
        setError("Wrong credentials");
        setLoading(false);
        return;
      }
      localStorage.setItem("userSession", JSON.stringify({ id: user.id, username: user.username, email: user.email, phone: user.phone, location: user.location }));
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
          <CardTitle className="text-center">Login to AibaiMall</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Username / Email / Phone" value={form.identifier} onChange={e=>setForm({...form, identifier:e.target.value})} className="bg-slate-900 border-slate-800" required />
            <Input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="bg-slate-900 border-slate-800" required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading? 'Logging in...' : 'Login'}</Button>
            <p className="text-sm text-slate-400 text-center">No account? <a className="underline" href="/auth/signup">Create one</a></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

