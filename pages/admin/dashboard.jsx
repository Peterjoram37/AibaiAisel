import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    image: "",
    stock: "",
    affiliate: ""
  });

  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      router.push("/admin/login");
    } else {
      fetchProducts();
    }
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  }

  async function addProduct(e) {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ name:"", category:"", description:"", price:"", image:"", stock:"", affiliate:"" });
    fetchProducts();
  }

  async function deleteProduct(id) {
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    fetchProducts();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Add Product Form */}
      <form onSubmit={addProduct} className="bg-slate-800 p-6 rounded mb-6">
        <h2 className="text-xl font-bold mb-3">Add Product</h2>
        <input
          className="w-full mb-2 p-2 rounded text-black"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full mb-2 p-2 rounded text-black"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <textarea
          className="w-full mb-2 p-2 rounded text-black"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="number"
          className="w-full mb-2 p-2 rounded text-black"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <input
          className="w-full mb-2 p-2 rounded text-black"
          placeholder="Image URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />
        <input
          type="number"
          className="w-full mb-2 p-2 rounded text-black"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <input
          className="w-full mb-2 p-2 rounded text-black"
          placeholder="Affiliate Link"
          value={form.affiliate}
          onChange={(e) => setForm({ ...form, affiliate: e.target.value })}
        />
        <button className="bg-blue-500 p-2 rounded w-full">Add Product</button>
      </form>

      {/* Product List */}
      <h2 className="text-xl font-bold mb-3">Products</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id} className="flex justify-between bg-slate-800 p-3 mb-2 rounded">
            <span>{p.name} - ${p.price}</span>
            <button
              onClick={() => deleteProduct(p.id)}
              className="bg-red-500 px-3 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
