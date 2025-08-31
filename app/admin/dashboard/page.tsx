"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  Settings,
  TrendingUp,
  Package,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Mock data - replace with real API calls
const mockProducts = [
  { id: "p1", name: "Vodacom Airtime", price: 2000, category: "airtime", stock: 50, sales: 120 },
  { id: "p2", name: "Airtel Bundles 3GB", price: 4500, category: "airtime", stock: 30, sales: 85 },
  { id: "p3", name: "DSTV Compact (1 Mo)", price: 49000, category: "tv", stock: 15, sales: 45 },
  { id: "p4", name: "LUKU Token 10k", price: 10000, category: "utility", stock: 25, sales: 60 },
  { id: "p5", name: "PlayStation Plus 3 Mo", price: 35000, category: "gaming", stock: 10, sales: 25 },
  { id: "p6", name: "Netflix Gift Card $25", price: 75000, category: "vouchers", stock: 20, sales: 40 },
];

const mockOrders = [
  { id: "o1", customer: "John Doe", phone: "+255 741 123 456", email: "john@example.com", total: 6500, status: "pending", date: "2024-01-15", items: ["Vodacom Airtime", "Airtel Bundles 3GB"] },
  { id: "o2", customer: "Jane Smith", phone: "+255 742 789 012", email: "jane@example.com", total: 49000, status: "completed", date: "2024-01-14", items: ["DSTV Compact (1 Mo)"] },
  { id: "o3", customer: "Mike Johnson", phone: "+255 743 345 678", email: "mike@example.com", total: 10000, status: "processing", date: "2024-01-13", items: ["LUKU Token 10k"] },
  { id: "o4", customer: "Sarah Wilson", phone: "+255 744 901 234", email: "sarah@example.com", total: 35000, status: "completed", date: "2024-01-12", items: ["PlayStation Plus 3 Mo"] },
  { id: "o5", customer: "David Brown", phone: "+255 745 567 890", email: "david@example.com", total: 75000, status: "pending", date: "2024-01-11", items: ["Netflix Gift Card $25"] },
];

const mockAnalytics = {
  visitors: 1247,
  orders: 156,
  revenue: 2845000,
  conversion: 12.5
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState(mockProducts);
  const [orders, setOrders] = useState(mockOrders);
  const [analytics, setAnalytics] = useState(mockAnalytics);
  const [paymentSettings, setPaymentSettings] = useState({
    mpesaNumber: "+255 753033342",
    mpesaName: "Peter Sichilima",
    airtelNumber: "+255 689 489 845",
    airtelName: "Peter Sichilima",
    tigoNumber: "+255 0677780801",
    tigoName: "Peter Sichilima"
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "airtime",
    stock: ""
  });
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    router.push("/admin/login");
  };

  const addProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.stock) {
      const product = {
        id: `p${Date.now()}`,
        name: newProduct.name,
        price: parseInt(newProduct.price),
        category: newProduct.category,
        stock: parseInt(newProduct.stock),
        sales: 0
      };
      setProducts([...products, product]);
      setNewProduct({ name: "", price: "", category: "airtime", stock: "" });
    }
  };

  const updateProduct = () => {
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id ? editingProduct : p
      ));
      setEditingProduct(null);
    }
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateOrderStatus = (id: string, status: string) => {
    setOrders(orders.map(o => 
      o.id === id ? { ...o, status } : o
    ));
  };

  const updatePaymentSettings = () => {
    // Save payment settings
    localStorage.setItem("paymentSettings", JSON.stringify(paymentSettings));
    alert("Payment settings updated successfully!");
  };

  const formatTZS = (n: number) => new Intl.NumberFormat("sw-TZ", { 
    style: "currency", 
    currency: "TZS", 
    maximumFractionDigits: 0 
  }).format(n);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 grid place-items-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Niandalie Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Welcome back, {localStorage.getItem("adminUsername")}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payments">Payment Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="bg-slate-950 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Visitors</CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.visitors.toLocaleString()}</div>
                  <p className="text-xs text-slate-400">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-950 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.orders}</div>
                  <p className="text-xs text-slate-400">+8% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-950 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTZS(analytics.revenue)}</div>
                  <p className="text-xs text-slate-400">+15% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-950 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.conversion}%</div>
                  <p className="text-xs text-slate-400">+2% from last month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-950 border-slate-800">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 border border-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-sm text-slate-400">{order.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatTZS(order.total)}</p>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950 border-slate-800">
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {products.sort((a, b) => b.sales - a.sales).slice(0, 5).map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 border border-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-slate-400">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatTZS(product.price)}</p>
                          <p className="text-sm text-slate-400">{product.sales} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-slate-800">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Product name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="bg-slate-900 border-slate-800"
                    />
                    <Input
                      placeholder="Price (TZS)"
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="bg-slate-900 border-slate-800"
                    />
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-md"
                    >
                      <option value="airtime">Airtime & Bundles</option>
                      <option value="tv">TV & Entertainment</option>
                      <option value="utility">Utilities</option>
                      <option value="gaming">Gaming</option>
                      <option value="vouchers">Gift Vouchers</option>
                    </select>
                    <Input
                      placeholder="Stock quantity"
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      className="bg-slate-900 border-slate-800"
                    />
                    <Button onClick={addProduct} className="w-full">Add Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-slate-950 border-slate-800">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left p-4">Product</th>
                        <th className="text-left p-4">Category</th>
                        <th className="text-left p-4">Price</th>
                        <th className="text-left p-4">Stock</th>
                        <th className="text-left p-4">Sales</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b border-slate-800">
                          <td className="p-4">{product.name}</td>
                          <td className="p-4">
                            <Badge variant="outline">{product.category}</Badge>
                          </td>
                          <td className="p-4">{formatTZS(product.price)}</td>
                          <td className="p-4">{product.stock}</td>
                          <td className="p-4">{product.sales}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-950 border-slate-800">
                                  <DialogHeader>
                                    <DialogTitle>Edit Product</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Input
                                      placeholder="Product name"
                                      value={editingProduct?.name || ""}
                                      onChange={(e) => setEditingProduct({...editingProduct!, name: e.target.value})}
                                      className="bg-slate-900 border-slate-800"
                                    />
                                    <Input
                                      placeholder="Price (TZS)"
                                      type="number"
                                      value={editingProduct?.price || ""}
                                      onChange={(e) => setEditingProduct({...editingProduct!, price: parseInt(e.target.value)})}
                                      className="bg-slate-900 border-slate-800"
                                    />
                                    <Input
                                      placeholder="Stock quantity"
                                      type="number"
                                      value={editingProduct?.stock || ""}
                                      onChange={(e) => setEditingProduct({...editingProduct!, stock: parseInt(e.target.value)})}
                                      className="bg-slate-900 border-slate-800"
                                    />
                                    <Button onClick={updateProduct} className="w-full">Update Product</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteProduct(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold">Order Management</h2>
            <Card className="bg-slate-950 border-slate-800">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left p-4">Order ID</th>
                        <th className="text-left p-4">Customer</th>
                        <th className="text-left p-4">Contact</th>
                        <th className="text-left p-4">Items</th>
                        <th className="text-left p-4">Total</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Date</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-b border-slate-800">
                          <td className="p-4">{order.id}</td>
                          <td className="p-4">{order.customer}</td>
                          <td className="p-4">
                            <div>
                              <p className="text-sm">{order.phone}</p>
                              <p className="text-xs text-slate-400">{order.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {order.items.join(", ")}
                            </div>
                          </td>
                          <td className="p-4">{formatTZS(order.total)}</td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="p-1 bg-slate-900 border border-slate-800 rounded text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4">{order.date}</td>
                          <td className="p-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Website Analytics</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-950 border-slate-800">
                <CardHeader>
                  <CardTitle>Visitor Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Visitors</span>
                      <span className="font-bold">{analytics.visitors.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Unique Visitors</span>
                      <span className="font-bold">{(analytics.visitors * 0.8).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Page Views</span>
                      <span className="font-bold">{(analytics.visitors * 2.5).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bounce Rate</span>
                      <span className="font-bold">32%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950 border-slate-800">
                <CardHeader>
                  <CardTitle>Sales Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Orders</span>
                      <span className="font-bold">{analytics.orders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Revenue</span>
                      <span className="font-bold">{formatTZS(analytics.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Order Value</span>
                      <span className="font-bold">{formatTZS(Math.round(analytics.revenue / analytics.orders))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Conversion Rate</span>
                      <span className="font-bold">{analytics.conversion}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payments" className="space-y-6">
            <h2 className="text-2xl font-bold">Payment Settings</h2>
            <Card className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle>Mobile Money Payment Details</CardTitle>
                <p className="text-sm text-slate-400">Configure payment details that customers will see during checkout</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-400" />
                      M-PESA
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Phone Number</label>
                        <Input
                          value={paymentSettings.mpesaNumber}
                          onChange={(e) => setPaymentSettings({...paymentSettings, mpesaNumber: e.target.value})}
                          className="bg-slate-900 border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Account Name</label>
                        <Input
                          value={paymentSettings.mpesaName}
                          onChange={(e) => setPaymentSettings({...paymentSettings, mpesaName: e.target.value})}
                          className="bg-slate-900 border-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="w-5 h-5 text-red-400" />
                      Airtel Money
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Phone Number</label>
                        <Input
                          value={paymentSettings.airtelNumber}
                          onChange={(e) => setPaymentSettings({...paymentSettings, airtelNumber: e.target.value})}
                          className="bg-slate-900 border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Account Name</label>
                        <Input
                          value={paymentSettings.airtelName}
                          onChange={(e) => setPaymentSettings({...paymentSettings, airtelName: e.target.value})}
                          className="bg-slate-900 border-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-400" />
                    Tigo Pesa
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-slate-300">Phone Number</label>
                      <Input
                        value={paymentSettings.tigoNumber}
                        onChange={(e) => setPaymentSettings({...paymentSettings, tigoNumber: e.target.value})}
                        className="bg-slate-900 border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300">Account Name</label>
                      <Input
                        value={paymentSettings.tigoName}
                        onChange={(e) => setPaymentSettings({...paymentSettings, tigoName: e.target.value})}
                        className="bg-slate-900 border-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={updatePaymentSettings} className="w-full gap-2">
                  <Settings className="w-4 h-4" />
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
