import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "products.json");

function getProducts() {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
}

function saveProducts(products) {
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
}

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json(getProducts());
  }

  if (req.method === "POST") {
    const products = getProducts();
    const newProduct = { id: Date.now(), ...req.body };
    products.push(newProduct);
    saveProducts(products);
    return res.status(201).json(newProduct);
  }

  if (req.method === "PUT") {
    const products = getProducts();
    const index = products.findIndex((p) => p.id === req.body.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });
    products[index] = req.body;
    saveProducts(products);
    return res.status(200).json(req.body);
  }

  if (req.method === "DELETE") {
    const products = getProducts();
    const filtered = products.filter((p) => p.id !== req.body.id);
    saveProducts(filtered);
    return res.status(200).json({ success: true });
  }

  res.status(405).end(); // Method not allowed
}
