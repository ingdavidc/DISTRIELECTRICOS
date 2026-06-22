"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Plus, Minus, Trash2, Send, CheckCircle, UserPlus, Users, X, Flame, History, Package } from "lucide-react";
import toast from "react-hot-toast";
import { getPosProducts, submitOrderToCashier } from "@/actions/pos";
import { createSpecialRequest } from "@/actions/requests";
import { searchCustomers, createCustomer, getCustomerOrders } from "@/actions/customers";

import { Product } from "@prisma/client";
type Customer = Awaited<ReturnType<typeof searchCustomers>>[0];
type Order = Awaited<ReturnType<typeof getCustomerOrders>>[0];

interface CartItem extends Product {
  cartQuantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState("");
  const [deliveryType, setDeliveryType] = useState("RETIRO");

  // Customer State
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ identification: "", name: "", phone: "", email: "" });

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Special Product State
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);
  const [specialProduct, setSpecialProduct] = useState({ name: "", quantity: "1", customerName: "", customerPhone: "" });

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts("");
    searchInputRef.current?.focus();
  }, []);

  const fetchProducts = async (query: string) => {
    setIsLoading(true);
    try {
      const data = await getPosProducts(query);
      setProducts(data);
    } catch (err) {
      toast.error("Error al cargar productos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Customer Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerQuery.length > 2) {
        const results = await searchCustomers(customerQuery);
        setCustomerResults(results);
      } else {
        setCustomerResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`El producto ${product.name} no tiene stock disponible.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) {
          toast.error(`Solo hay ${product.stock} unidades de ${product.name}`);
          return prev;
        }
        return prev.map((item: any) => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map((item: any) => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        if (newQty <= 0) return item; 
        if (newQty > item.stock) {
          toast.error(`Solo hay ${item.stock} unidades disponibles`);
          return item;
        }
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum: any, item: any) => sum + (item.price * item.cartQuantity / (1 + (item.tax / 100))), 0);
  const total = cart.reduce((sum: any, item: any) => sum + (item.price * item.cartQuantity), 0);
  const taxes = total - subtotal;

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = toast.loading("Registrando cliente...");
    const res = await createCustomer(newCustomerForm);
    if (res.success && res.customer) {
      toast.success("Cliente registrado", { id: tid });
      setSelectedCustomer(res.customer);
      setIsCustomerModalOpen(false);
      setCustomerQuery("");
      setNewCustomerForm({ identification: "", name: "", phone: "", email: "" });
    } else {
      toast.error(res.error || "Error", { id: tid });
    }
  };

  const handleSendToCashier = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    const tid = toast.loading("Enviando orden a caja...");

    try {
      const items = cart.map((item: any) => ({
        productId: item.id,
        quantity: item.cartQuantity,
        unitPrice: item.price
      }));

      const res = await submitOrderToCashier(items, total, selectedCustomer?.id, notes, deliveryType);
      
      if (res.success) {
        toast.success(`Orden #${res.orderId} enviada a caja.`, { id: tid });
        setCart([]);
        setSearchQuery("");
        setSelectedCustomer(null);
        setCustomerQuery("");
        setNotes("");
        setDeliveryType("RETIRO");
        fetchProducts(""); 
        searchInputRef.current?.focus();
      } else {
        toast.error(res.error || "Error al enviar la orden", { id: tid });
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado", { id: tid });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSpecialProduct = async () => {
    if (!specialProduct.name || !specialProduct.quantity) return toast.error("Completa nombre y cantidad");
    setIsProcessing(true);
    const res = await createSpecialRequest({
      productName: specialProduct.name,
      quantity: Number(specialProduct.quantity),
      customerName: specialProduct.customerName,
      customerPhone: specialProduct.customerPhone
    });
    if (res.success) {
      setIsSpecialModalOpen(false);
      setSpecialProduct({ name: "", quantity: "1", customerName: "", customerPhone: "" });
      toast.success("Solicitud especial enviada a Compras");
    } else {
      toast.error(res.error || "Error al enviar solicitud especial");
    }
    setIsProcessing(false);
  };

  const openHistoryModal = async () => {
    if (!selectedCustomer) return;
    setIsHistoryModalOpen(true);
    setIsLoadingOrders(true);
    try {
      const orders = await getCustomerOrders(selectedCustomer.id);
      setCustomerOrders(orders);
    } catch (error) {
      toast.error("Error al cargar historial");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const activeOrders = customerOrders.filter(o => ['PENDING', 'PREPARING', 'READY'].includes(o.status));
  const pastOrders = customerOrders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning">Esperando Pago</span>;
      case 'PREPARING': return <span className="badge badge-danger">Por Alistar</span>;
      case 'READY': return <span className="badge badge-warning">Alistado</span>;
      case 'DELIVERED': return <span className="badge badge-success">Entregado</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Anulado</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px - 4rem)", gap: "1.5rem" }}>
      
      {/* LEFT COLUMN: CATALOG */}
      <div className="card" style={{ flex: "1 1 60%", display: "flex", flexDirection: "column", padding: "1.5rem", overflow: "hidden" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {searchQuery === "" ? <Flame color="#f59e0b" size={24} /> : null}
            {searchQuery === "" ? "Más Vendidos" : "Búsqueda Rápida"}
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              className="btn btn-outline" 
              onClick={() => setIsSpecialModalOpen(true)}
              style={{ padding: "0 1rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Plus size={16} /> Ítem Especial
            </button>
            <div className="search-bar" style={{ width: "350px", display: "flex", alignItems: "center", position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: "1rem", color: "var(--color-text-muted)" }} />
              <input 
                ref={searchInputRef}
                type="text" 
                className="form-input" 
                style={{ paddingLeft: "2.5rem" }} 
                placeholder="Escanear código o buscar producto..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", alignContent: "start", gap: "1rem", paddingRight: "0.5rem" }}>
          {isLoading ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>Buscando...</div>
          ) : products.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>No se encontraron productos.</div>
          ) : (
            products.map((product: any) => {
              const hasStock = product.stock > 0;
              const limit = product.minStockLimit || 10;
              
              let badgeClass = "badge-success";
              if (product.stock === 0) badgeClass = "badge-danger";
              else if (product.stock <= limit) badgeClass = "badge-warning";

              return (
                <div 
                  key={product.id} 
                  style={{ 
                    border: "1px solid var(--color-border)", 
                    borderRadius: "var(--radius-md)", 
                    padding: "1rem",
                    cursor: hasStock ? "pointer" : "not-allowed",
                    opacity: hasStock ? 1 : 0.6,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    transition: "all 0.2s",
                    backgroundColor: "white",
                  }}
                  onClick={() => hasStock && addToCart(product)}
                  onMouseOver={(e) => hasStock && (e.currentTarget.style.borderColor = "var(--color-primary)", e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
                  onMouseOut={(e) => hasStock && (e.currentTarget.style.borderColor = "var(--color-border)", e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{product.sku}</span>
                    <span className={`badge ${badgeClass}`}>
                      {hasStock ? `${product.stock} ${product.unit}` : "Agotado"}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0.25rem 0", flex: 1 }}>{product.name}</h3>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)" }}>
                    ${product.price.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: TICKET */}
      <div className="card" style={{ flex: "0 0 400px", display: "flex", flexDirection: "column", padding: "0" }}>
        
        {/* Customer Section */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-background)", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }}>
          {selectedCustomer ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "18px", background: "rgba(32,53,98,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", marginTop: "0.25rem" }}>
                  <Users size={18} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{selectedCustomer.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>CC/NIT: {selectedCustomer.identification}</div>
                  <button 
                    onClick={openHistoryModal}
                    style={{ background: "none", border: "none", padding: 0, color: "var(--color-primary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem", textDecoration: "underline" }}
                  >
                    <History size={14} /> Ver Estados e Historial
                  </button>
                </div>
              </div>
              <button className="btn btn-outline" style={{ padding: "0.35rem", borderRadius: "50%" }} onClick={() => setSelectedCustomer(null)} title="Cambiar Cliente">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "0.75rem", color: "var(--color-text-muted)" }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: "2.25rem", fontSize: "0.9rem" }} 
                  placeholder="Buscar cliente por CC/NIT o Nombre..." 
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
              </div>
              
              {/* Dropdown Results */}
              {customerQuery.length > 2 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", zIndex: 50, marginTop: "0.25rem", overflow: "hidden" }}>
                  {customerResults.length > 0 ? (
                    customerResults.map((c: any) => (
                      <div 
                        key={c.id} 
                        style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                        onClick={() => { setSelectedCustomer(c); setCustomerQuery(""); }}
                      >
                        <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{c.name}</span>
                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{c.identification}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "1rem", textAlign: "center" }}>
                      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>No encontrado</p>
                      <button className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "0.25rem 0.75rem" }} onClick={() => { setIsCustomerModalOpen(true); setNewCustomerForm({...newCustomerForm, identification: customerQuery}); }}>
                        <UserPlus size={14} /> Registrar "{customerQuery}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "white" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingCart size={18} />
            Ticket de Venta
          </h2>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {cart.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", gap: "1rem" }}>
              <ShoppingCart size={48} opacity={0.2} />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {cart.map((item: any) => (
                <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingBottom: "1rem", borderBottom: "1px dashed var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.9rem", flex: 1 }}>{item.name}</div>
                    <div style={{ fontWeight: 600 }}>${(item.price * item.cartQuantity).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>${item.price.toLocaleString()} c/u</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--color-background)", borderRadius: "var(--radius-md)", padding: "0.25rem" }}>
                      <button 
                        onClick={() => item.cartQuantity > 1 ? updateQuantity(item.id, -1) : removeFromCart(item.id)}
                        style={{ padding: "0.25rem", borderRadius: "4px", background: "white", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        {item.cartQuantity > 1 ? <Minus size={14} /> : <Trash2 size={14} color="var(--color-danger)" />}
                      </button>
                      <span style={{ fontSize: "0.9rem", fontWeight: 600, width: "24px", textAlign: "center" }}>{item.cartQuantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{ padding: "0.25rem", borderRadius: "4px", background: "white", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tipo de Entrega */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--color-border)", background: "white" }}>
          <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "0.5rem", display: "block" }}>Tipo de Entrega</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              className={`btn ${deliveryType === "RETIRO" ? "btn-primary" : "btn-outline"}`} 
              style={{ flex: 1 }}
              onClick={() => setDeliveryType("RETIRO")}
            >
              Retiro en Tienda
            </button>
            <button 
              className={`btn ${deliveryType === "DOMICILIO" ? "btn-primary" : "btn-outline"}`} 
              style={{ flex: 1 }}
              onClick={() => setDeliveryType("DOMICILIO")}
            >
              Envío Domicilio
            </button>
          </div>
        </div>

        {/* Observaciones */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--color-border)", background: "white" }}>
          <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "0.5rem", display: "block" }}>Observaciones / Notas del pedido</label>
          <textarea 
            className="form-input" 
            style={{ width: "100%", minHeight: "60px", resize: "none", fontSize: "0.9rem" }} 
            placeholder="Ej: Empacar para regalo, entregar a la 1pm..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Totals and Send */}
        <div style={{ padding: "1.5rem", background: "var(--color-background)", borderTop: "1px solid var(--color-border)", borderBottomLeftRadius: "var(--radius-lg)", borderBottomRightRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            <span>Subtotal (Sin IVA)</span>
            <span>${subtotal.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            <span>Impuestos (IVA)</span>
            <span>${taxes.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "2px dashed var(--color-border)" }}>
            <span>TOTAL</span>
            <span>${total.toLocaleString()}</span>
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ width: "100%", padding: "1.25rem", fontSize: "1.1rem", marginTop: "1rem", opacity: cart.length === 0 ? 0.5 : 1, display: "flex", justifyContent: "center", gap: "0.75rem", backgroundColor: "var(--color-primary)", color: "white" }}
            disabled={cart.length === 0 || isProcessing}
            onClick={handleSendToCashier}
          >
            <Send size={22} />
            {isProcessing ? "Enviando..." : `ENVIAR A CAJA`}
          </button>
        </div>

      </div>

      {/* Modal Express Cliente */}
      {isCustomerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h2 className="modal-title">Registrar Cliente</h2>
              <button className="btn-close" onClick={() => setIsCustomerModalOpen(false)}>×</button>
            </div>
            <form className="modal-body" onSubmit={handleCreateCustomer} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Identificación (CC/NIT) *</label>
                <input type="text" className="form-input" value={newCustomerForm.identification} onChange={e => setNewCustomerForm({...newCustomerForm, identification: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input type="text" className="form-input" autoFocus value={newCustomerForm.name} onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input type="text" className="form-input" value={newCustomerForm.phone} onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input type="email" className="form-input" value={newCustomerForm.email} onChange={e => setNewCustomerForm({...newCustomerForm, email: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>Guardar y Seleccionar</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Pedidos */}
      {isHistoryModalOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <History size={20} />
                Historial de {selectedCustomer.name}
              </h2>
              <button className="btn-close" onClick={() => setIsHistoryModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {isLoadingOrders ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>Consultando historial...</div>
              ) : customerOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>Este cliente no tiene compras registradas.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  
                  {/* Órdenes Activas */}
                  {activeOrders.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "1rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
                        Pedidos Activos
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {activeOrders.map((order: any) => (
                          <div key={order.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1rem", background: "var(--color-surface)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                              <div style={{ fontWeight: 600, fontSize: "1rem" }}>Orden #{order.id.slice(-6).toUpperCase()}</div>
                              {getStatusBadge(order.status)}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <Package size={14} /> {order.items.reduce((acc: any, item: any) => acc + item.quantity, 0)} artículos • Total: ${order.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historial Pasado */}
                  {pastOrders.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "1rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
                        Historial (Entregados y Anulados)
                      </h3>
                      <div className="table-responsive">
                        <table className="table" style={{ fontSize: "0.9rem" }}>
                          <thead>
                            <tr>
                              <th>ID Orden</th>
                              <th>Fecha</th>
                              <th>Estado</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pastOrders.map((order: any) => (
                              <tr key={order.id}>
                                <td style={{ fontWeight: 500 }}>#{order.id.slice(-6).toUpperCase()}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>{getStatusBadge(order.status)}</td>
                                <td style={{ fontWeight: 600 }}>${order.totalAmount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsHistoryModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Special Product Modal */}
      {isSpecialModalOpen && (
        <div className="modal-overlay" onClick={() => !isProcessing && setIsSpecialModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2>Solicitar Producto a Compras</h2>
              <button className="btn-close" onClick={() => setIsSpecialModalOpen(false)} disabled={isProcessing}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Descripción detallada del Artículo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. Cable X-500 Custom..." 
                  value={specialProduct.name}
                  onChange={(e) => setSpecialProduct({...specialProduct, name: e.target.value})}
                  disabled={isProcessing}
                />
              </div>
              <div className="form-group">
                <label>Cantidad Solicitada</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="1" 
                  value={specialProduct.quantity}
                  onChange={(e) => setSpecialProduct({...specialProduct, quantity: e.target.value})}
                  disabled={isProcessing}
                />
              </div>
              <div className="form-group">
                <label>Nombre del Cliente (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. Juan Pérez" 
                  value={specialProduct.customerName}
                  onChange={(e) => setSpecialProduct({...specialProduct, customerName: e.target.value})}
                  disabled={isProcessing}
                />
              </div>
              <div className="form-group">
                <label>Teléfono (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. 3001234567" 
                  value={specialProduct.customerPhone}
                  onChange={(e) => setSpecialProduct({...specialProduct, customerPhone: e.target.value})}
                  disabled={isProcessing}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsSpecialModalOpen(false)} disabled={isProcessing}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAddSpecialProduct} disabled={isProcessing}>
                {isProcessing ? "Enviando..." : "Enviar a Compras"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
