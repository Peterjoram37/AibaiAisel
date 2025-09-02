"use client"

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrdersPage(){
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(()=>{
    try {
      const u = localStorage.getItem("userSession");
      const all = JSON.parse(localStorage.getItem("orders") || "[]");
      const parsed = u ? JSON.parse(u) : null;
      setUser(parsed);
      setOrders(parsed ? all.filter((o:any)=>o.userId===parsed.id) : []);
    } catch {}
  },[]);

  if(!user){
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        <div className="grid gap-4">
          {orders.length===0 && <p className="text-slate-400">No orders yet.</p>}
          {orders.map((o:any)=> (
            <Card key={o.id} className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Order #{o.id} • {new Date(o.createdAt).toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">Status: <span className="font-semibold">{o.status}</span></p>
                <p className="text-slate-300">Total: <span className="font-semibold">{new Intl.NumberFormat("sw-TZ", { style: "currency", currency: "TZS", maximumFractionDigits: 0 }).format(o.total)}</span></p>
                <ul className="list-disc pl-5 mt-2 text-slate-300">
                  {o.items.map((it:any)=> <li key={it.id}>{it.name} × {it.qty}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

