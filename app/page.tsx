"use client"

import React, { useMemo, useState, useEffect } from "react";
import { ShoppingCart, Search, Menu, X, ChevronRight, Star, Trash2, CreditCard, Package, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// --- Demo Data (replace with your API later) ---
const CATEGORIES = [
  { id: "airtime", name: "Airtime & Bundles" },
  { id: "tv", name: "TV & Entertainment" },
  { id: "utility", name: "Utilities" },
  { id: "gaming", name: "Gaming" },
  { id: "vouchers", name: "Gift Vouchers" },
];

const PRODUCTS = [
  { id: "p1", category: "airtime", name: "Vodacom Airtime", price: 2000, rating: 4.6, img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop", tags:["Instant","Promo"], desc:"Top up Vodacom instantly – codes delivered in seconds." },
  { id: "p2", category: "airtime", name: "Airtel Bundles 3GB", price: 4500, rating: 4.4, img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop", tags:["Data"], desc:"Affordable data bundle. Activation guide included." },
  { id: "p3", category: "tv", name: "DSTV Compact (1 Mo)", price: 49000, rating: 4.8, img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop", tags:["Subscription"], desc:"Renew your DSTV Compact fast and securely." },
  { id: "p4", category: "utility", name: "LUKU Token 10k", price: 10000, rating: 4.7, img: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1200&auto=format&fit=crop", tags:["Instant"], desc:"Buy pre-paid electricity tokens – instant code delivery." },
  { id: "p5", category: "gaming", name: "PlayStation Plus 3 Mo", price: 35000, rating: 4.5, img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop", tags:["Code"], desc:"Get online and free games with PS+ membership." },
  { id: "p6", category: "vouchers", name: "Netflix Gift Card $25", price: 75000, rating: 4.9, img: "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1200&auto=format&fit=crop", tags:["Gift"], desc:"Perfect for family & friends. Digital delivery." },
];

// --- Helpers ---
const formatTZS = (n: number) => new Intl.NumberFormat("sw-TZ", { style: "currency", currency: "TZS", maximumFractionDigits: 0 }).format(n);

function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try { 
      const v = localStorage.getItem(key); 
      return v ? JSON.parse(v) : initial; 
    } catch { 
      return initial; 
    }
  });
  
  useEffect(() => { 
    try { 
      localStorage.setItem(key, JSON.stringify(value)); 
    } catch {} 
  }, [key, value]);
  
  return [value, setValue];
}

export default function App() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useLocalStorage("cart", [] as any[]);
  const [openProduct, setOpenProduct] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const items = useMemo(() => {
    return PRODUCTS.filter(p => (cat === "all" || p.category === cat) && p.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, cat]);

  const cartTotal = useMemo(() => cart.reduce((s, it) => s + it.price * it.qty, 0), [cart]);

  useEffect(() => {
    try {
      const u = localStorage.getItem("userSession");
      setUser(u ? JSON.parse(u) : null);
    } catch {}
  }, []);

  function ensureAuthed() {
    if (!user) {
      window.location.href = "/auth/login";
      return false;
    }
    return true;
  }

  function addToCart(p: any, qty = 1){
    if (!ensureAuthed()) return;
    setCart(prev => {
      const i = prev.findIndex(x => x.id === p.id);
      if(i >= 0){ const cp=[...prev]; cp[i].qty += qty; return cp; }
      return [...prev, { id: p.id, name: p.name, price: p.price, img: p.img, qty }];
    });
  }
  function updateQty(id: string, qty: number){ setCart(prev => prev.map(it => it.id===id?{...it, qty: Math.max(1, qty)}:it)); }
  function removeItem(id: string){ setCart(prev => prev.filter(it => it.id!==id)); }
  function clearCart(){ setCart([]); }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden"><Menu /></Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 grid place-items-center">
              <Package className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight">AibaiMall</span>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..." className="pl-9 w-72 bg-slate-900 border-slate-800" />
            </div>
            <a href="/admin/login" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
              Admin
            </a>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" className="gap-2"><ShoppingCart className="w-4 h-4" /> Cart {cart.length? <Badge className="ml-1" variant="default">{cart.reduce((s,it)=>s+it.qty,0)}</Badge>:null}</Button>
            </SheetTrigger>
            <SheetContent className="bg-slate-950 border-slate-800">
              <SheetHeader>
                <SheetTitle className="text-left">Your Cart</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 overflow-y-auto max-h-[65vh] pr-2">
                {cart.length===0 && (
                  <p className="text-slate-400">Your cart is empty.</p>
                )}
                {cart.map(it => (
                  <div key={it.id} className="flex gap-3 items-center border border-slate-800 rounded-xl p-3">
                    <img src={it.img} alt={it.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-medium leading-tight">{it.name}</p>
                      <p className="text-sm text-slate-400">{formatTZS(it.price)} x {it.qty}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={()=>updateQty(it.id, it.qty-1)}>-</Button>
                        <span className="w-6 text-center">{it.qty}</span>
                        <Button size="sm" variant="outline" onClick={()=>updateQty(it.id, it.qty+1)}>+</Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatTZS(it.qty*it.price)}</p>
                      <Button size="icon" variant="ghost" onClick={()=>removeItem(it.id)} className="mt-1"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4 bg-slate-800" />
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Subtotal</span>
                <span className="text-xl font-bold">{formatTZS(cartTotal)}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex-1 gap-2" disabled={!cart.length || !user}><CreditCard className="w-4 h-4" /> Checkout</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-slate-800">
                    <DialogHeader>
                      <DialogTitle>Checkout</DialogTitle>
                    </DialogHeader>
                    <CheckoutForm total={cartTotal} onSuccess={()=>{ clearCart(); }} />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="flex-1" onClick={clearCart} disabled={!cart.length}>Clear</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:.4}}>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">Instant Digital Products for Tanzania</h1>
            <p className="text-slate-300 mt-3">Airtime, subscriptions, vouchers, and more — delivered in seconds. Safe payments, fast support.</p>
            <div className="flex gap-2 mt-5">
              <Button onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} className="gap-2">Shop Now <ChevronRight className="w-4 h-4"/></Button>
              <Button variant="outline" onClick={()=>setCat("airtime")}>Browse Airtime</Button>
            </div>
            <div className="mt-4 hidden md:block">
              <Tabs defaultValue="all" onValueChange={v=>setCat(v)} value={cat}>
                <TabsList className="bg-slate-900">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {CATEGORIES.map(c=> <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:.4, delay:.05}} className="rounded-2xl overflow-hidden border border-slate-800">
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1600&auto=format&fit=crop" alt="Hero" className="w-full h-[260px] md:h-[360px] object-cover" />
          </motion.div>
        </div>
      </section>

      {/* Search (mobile) */}
      <div className="md:hidden max-w-6xl mx-auto px-4 -mt-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
          <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..." className="pl-9 bg-slate-900 border-slate-800" />
        </div>
        <div className="overflow-x-auto no-scrollbar py-3 flex gap-2">
          <button onClick={()=>setCat("all")} className={`px-3 py-1.5 rounded-full border ${cat==="all"?"bg-blue-600 border-blue-500":"border-slate-700"}`}>All</button>
          {CATEGORIES.map(c=> (
            <button key={c.id} onClick={()=>setCat(c.id)} className={`px-3 py-1.5 rounded-full border whitespace-nowrap ${cat===c.id?"bg-blue-600 border-blue-500":"border-slate-700"}`}>{c.name}</button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <section id="products" className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {items.map(p => (
              <motion.div key={p.id} layout initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
                <Card className="bg-slate-950 border-slate-800 overflow-hidden">
                  <div className="relative">
                    <img src={p.img} alt={p.name} className="w-full h-44 object-cover" />
                    <div className="absolute top-2 left-2 flex gap-2">
                      {p.tags.map((t: string)=> <Badge key={t} className="bg-blue-600/20 border-blue-500/30">{t}</Badge>)}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg leading-tight line-clamp-1">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 line-clamp-2 min-h-[2.5rem]">{p.desc}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-extrabold text-xl">{formatTZS(p.price)}</span>
                      <span className="text-sm flex items-center gap-1 text-yellow-400/90"><Star className="w-4 h-4" />{p.rating}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1" onClick={()=>addToCart(p)}>Add to cart</Button>
                      <Button variant="outline" onClick={()=>setOpenProduct(p)}>Details</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-6 text-sm text-slate-300">
          <div>
            <p className="font-bold mb-2">AibaiMall</p>
            <p className="text-slate-400">Fast digital deliveries for East Africa. Secure, simple, instant.</p>
          </div>
          <div>
            <p className="font-bold mb-2">Support</p>
            <ul className="space-y-1">
              <li>WhatsApp: +255 689 489 845</li>
              <li>Email: peterjoram897@gmail.com</li>
              <li>Dar es Salaam, TZ</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-2">Payments</p>
            <ul className="space-y-1">
              <li>M-PESA: +255 753033342 (Peter Sichilima)</li>
              <li>Tigo Pesa, Airtel Money</li>
              <li>Card & Mobile</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-2">Legal</p>
            <ul className="space-y-1">
              <li>Terms & Conditions</li>
              <li>Privacy Policy</li>
              <li>Refund Policy</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-slate-500 text-xs mt-6">© {new Date().getFullYear()} AibaiMall. All rights reserved.</p>
      </footer>

      {/* Product Dialog */}
      <AnimatePresence>
        {openProduct && (
          <Dialog open onOpenChange={(o)=>!o && setOpenProduct(null)}>
            <DialogContent className="bg-slate-950 border-slate-800 max-w-3xl">
              <DialogHeader>
                <DialogTitle>{openProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <img src={openProduct.img} alt={openProduct.name} className="w-full h-64 object-cover rounded-xl" />
                <div>
                  <p className="text-slate-300">{openProduct.desc}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {openProduct.tags.map((t: string)=> <Badge key={t}>{t}</Badge>)}
                  </div>
                  <p className="text-2xl font-extrabold mt-4">{formatTZS(openProduct.price)}</p>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={()=>addToCart(openProduct)} className="flex-1">Add to cart</Button>
                    <Button variant="outline" onClick={()=>setOpenProduct(null)} className="flex-1">Close</Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Delivery: Instant via on-screen code & email receipt.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckoutForm({ total, onSuccess }: { total: number, onSuccess: () => void }){
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    method: "mpesa",
    note: "",
  });
  const [user, setUser] = useState<any>(null);

  useEffect(()=>{
    try {
      const u = localStorage.getItem("userSession");
      setUser(u? JSON.parse(u): null);
    } catch {}
  },[]);

  async function submit(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    // Simulate payment/submit
    setTimeout(()=>{
      try {
        const items = JSON.parse(localStorage.getItem("cart") || "[]");
        const orders = JSON.parse(localStorage.getItem("orders") || "[]");
        const order = {
          id: `o${Date.now()}`,
          userId: user?.id,
          customer: form.name || user?.username,
          phone: form.phone || user?.phone,
          email: form.email || user?.email,
          location: user?.location,
          total,
          status: "pending",
          createdAt: new Date().toISOString(),
          items: items.map((it:any)=>({ id: it.id, name: it.name, qty: it.qty, price: it.price }))
        };
        localStorage.setItem("orders", JSON.stringify([order, ...orders]));
      } catch {}
      setLoading(false);
      alert("Order received! Payment instructions sent to WhatsApp/Email.");
      onSuccess?.();
      try { window.location.href = "/orders"; } catch {}
    }, 900);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="bg-slate-900 border-slate-800" />
        <Input required placeholder="Phone (WhatsApp)" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="bg-slate-900 border-slate-800" />
      </div>
      <Input type="email" placeholder="Email (optional)" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="bg-slate-900 border-slate-800" />
      <div className="grid md:grid-cols-3 gap-2">
        <label className={`border rounded-xl px-3 py-2 cursor-pointer ${form.method==='mpesa'? 'border-blue-500 bg-blue-500/10':'border-slate-700'}`}>
          <input type="radio" name="method" className="hidden" checked={form.method==='mpesa'} onChange={()=>setForm({...form, method:'mpesa'})} />
          M-PESA
        </label>
        <label className={`border rounded-xl px-3 py-2 cursor-pointer ${form.method==='tigo'? 'border-blue-500 bg-blue-500/10':'border-slate-700'}`}>
          <input type="radio" name="method" className="hidden" checked={form.method==='tigo'} onChange={()=>setForm({...form, method:'tigo'})} />
          Tigo Pesa
        </label>
        <label className={`border rounded-xl px-3 py-2 cursor-pointer ${form.method==='card'? 'border-blue-500 bg-blue-500/10':'border-slate-700'}`}>
          <input type="radio" name="method" className="hidden" checked={form.method==='card'} onChange={()=>setForm({...form, method:'card'})} />
          Card / Bank
        </label>
      </div>
      <Input placeholder="Order note (eg. Decoder number, Account ID...)" value={form.note} onChange={e=>setForm({...form, note:e.target.value})} className="bg-slate-900 border-slate-800" />

      <div className="flex items-center justify-between pt-2">
        <span className="text-slate-300">Total</span>
        <span className="text-2xl font-extrabold">{formatTZS(total)}</span>
      </div>
      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading? 'Processing...' : 'Place Order'}
        <Send className="w-4 h-4" />
      </Button>
      <p className="text-xs text-slate-500 text-center">Pay to M-PESA +255 753033342 (Peter Sichilima) then send receipt.</p>
    </form>
  );
}
