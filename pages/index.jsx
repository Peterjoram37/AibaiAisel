import { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>AibaiAisel Mall 🛒</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "8px" }}>
            <img src={p.image} alt={p.name} width="150" />
            <h3>{p.name}</h3>
            <p>${p.price}</p>
            <button onClick={() => setSelected(p)}>Click product for details</button>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{
          position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", width: "400px" }}>
            <h2>{selected.name}</h2>
            <img src={selected.image} alt={selected.name} width="200" />
            <p>{selected.description}</p>
            <p><b>Price:</b> ${selected.price}</p>
            <a href={selected.affiliate} target="_blank" rel="noreferrer">
              <button>Checkout / Buy Now</button>
            </a>
            <br /><br />
            <button onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
