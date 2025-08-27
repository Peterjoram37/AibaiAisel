import { useEffect, useState, useMemo } from "react";
import { ShoppingCart, Search, Star, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "Electronics", name: "Electronics" },
  { id: "Fashion", name: "Fashion" },
  { id: "Home", name: "Home" },
  { id: "Beauty", name: "Beauty" },
  { id: "Toys", name: "Toys" },
  { id: "Gadgets", name: "Gadgets" },
];

const formatUSD = (n) => `$${Number(n).toFixed(2)}`;

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
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

export default function Home() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useLocalStorage("cart", []);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const filtered = useMemo(() => {
    return products.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, cat, query]);

  const cartTotal = useMemo(
    () => cart.reduce((s, it) => s + it.price * it.qty, 0),
    [cart]
  );

  function addToCart(p) {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      if (i >= 0) {
        const cp = [...prev];
        cp[i].qty += 1;
        return cp;
      }
      return [...prev, { ...p, qty: 1 }];
    });
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((it) => it.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-slate-950/70 border-b border-slate-800 p-4 flex items-center justify-between">
        <h1 className="font-bold text-xl">AibaiAisel</h1>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="bg-slate-800 text-black"
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <ShoppingCart />
                Cart {cart.length > 0 && <Badge>{cart.reduce((s, i) => s + i.qty, 0)}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-slate-950 border-slate-800">
              <SheetHeader>
                <SheetTitle>Your Cart</SheetTitle>
              </SheetHeader>
              <div className="space-y-3">
                {cart.length === 0 && <p className="text-slate-400">Cart is empty</p>}
                {cart.map((c) => (
                  <div key={c.id} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                    <div>
                      <p>{c.name}</p>
                      <p>{formatUSD(c.price)} x {c.qty}</p>
                    </div>
                    <button onClick={() => removeItem(c.id)} className="bg-red-500 px-2 rounded">Remove</button>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{formatUSD(cartTotal)}</span>
              </div>
              <Button onClick={clearCart} className="w-full mt-3">Clear Cart</Button>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Categories */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`px-3 py-1 rounded-full border ${cat === c.id ? "bg-blue-600 border-blue-500" : "border-slate-700"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-slate-800 rounded p-3 flex flex-col">
            <img src={p.image} alt={p.name} className="h-40 w-full object-cover rounded mb-2 cursor-pointer" onClick={() => setSelectedProduct(p)} />
            <h3 className="font-bold">{p.name}</h3>
            <p className="text-slate-300 text-sm">{p.description}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold">{formatUSD(p.price)}</span>
              <button onClick={() => addToCart(p)} className="bg-blue-500 px-2 rounded">Add</button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <Dialog open onOpenChange={(o) => !o && setSelectedProduct(null)}>
          <DialogContent className="bg-slate-950 border-slate-800 max-w-2xl mx-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-60 object-cover rounded mb-3"/>
            <p className="text-slate-300">{selectedProduct.description}</p>
            <div className="flex gap-2 mt-3">
              <Button onClick={() => addToCart(selectedProduct)} className="flex-1">Add to Cart</Button>
              {selectedProduct.affiliate && (
                <a href={selectedProduct.affiliate} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full">Buy Now</Button>
                </a>
              )}
            </div>
            <Button variant="ghost" onClick={() => setSelectedProduct(null)} className="mt-3 w-full">
              <X /> Close
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
