"use client";

import { useState, useEffect } from "react";
import { CreditCard, Banknote, Landmark, CheckCircle, Clock, Users, Package, History, Trash2, Plus, Minus, FileText, CalendarClock, Search, Receipt, Truck, Store } from "lucide-react";
import toast from "react-hot-toast";
import { getPendingOrders, processPayment, cancelOrder, searchCustomerOrdersForPayment } from "@/actions/payments";
import { getCustomerOrders } from "@/actions/customers";

type Order = Awaited<ReturnType<typeof getPendingOrders>>[0];
type CustomerOrder = Awaited<ReturnType<typeof getCustomerOrders>>[0];

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Editable Cart State (solo si es PENDING)
  const [editableItems, setEditableItems] = useState<{id: string, productId: string, name: string, quantity: number, unitPrice: number, stock: number}[]>([]);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO"); // EFECTIVO, TARJETA, TRANSFERENCIA, CREDITO
  const [paymentBank, setPaymentBank] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [creditProvider, setCreditProvider] = useState("");
  const [creditDays, setCreditDays] = useState(30);
  const [receiptType, setReceiptType] = useState("VOUCHER"); // FACTURA, VOUCHER
  const [amountToPay, setAmountToPay] = useState(0);
  const [priceTier, setPriceTier] = useState<"NORMAL" | "FRECUENTE" | "VOLUMEN" | "CORPORATIVO">("NORMAL");

  const handlePriceTierChange = (newTier: string) => {
    setPriceTier(newTier as any);
    if (!selectedOrder) return;

    setEditableItems(prev => prev.map((item: any) => {
      const original = selectedOrder.items.find((i: any) => i.id === item.id);
      if (!original) return item;
      
      let finalPrice = original.product.price;
      if (!original.product.sku.startsWith("ESP-")) {
        const freq = original.product.freqClientDiscount ?? 5;
        const vol = original.product.volumeDiscount ?? 10;
        const corp = original.product.corporateDiscount ?? 15;
        
        if (newTier === "FRECUENTE") finalPrice = finalPrice - (finalPrice * freq / 100);
        else if (newTier === "VOLUMEN") finalPrice = finalPrice - (finalPrice * vol / 100);
        else if (newTier === "CORPORATIVO") finalPrice = finalPrice - (finalPrice * corp / 100);
      } else {
        finalPrice = original.unitPrice;
      }

      return { ...item, unitPrice: Math.round(finalPrice) };
    }));
  };

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const loadOrders = async () => {
    if (isSearching) return; // Si hay búsqueda activa, no auto-refrescar la cola general
    try {
      const data = await getPendingOrders();
      setOrders(data);
      updateSelectedOrderIfPresent(data);
    } catch (error) {
      toast.error("Error al cargar cola de pagos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      loadOrders();
      return;
    }
    setIsSearching(true);
    setIsLoading(true);
    try {
      const results = await searchCustomerOrdersForPayment(searchQuery);
      setOrders(results as any);
      updateSelectedOrderIfPresent(results as any);
    } catch(err) {
      toast.error("Error en búsqueda");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSelectedOrderIfPresent = (data: Order[]) => {
    if (selectedOrder) {
      const stillExists = data.find(o => o.id === selectedOrder.id);
      if (!stillExists) {
        setSelectedOrder(null);
        setEditableItems([]);
      } else {
        // Actualizar balance
        const balance = stillExists.totalAmount - stillExists.amountPaid;
        setAmountToPay(balance);
        setSelectedOrder(stillExists);
      }
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      if (!isSearching) loadOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditableItems(order.items.map((i: any) => ({
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      stock: i.product.stock 
    })));
    // Reset payment states
    setPaymentMethod("EFECTIVO");
    setPaymentBank("");
    setTransactionId("");
    setCreditProvider("");
    setCreditDays(30);
    setReceiptType(order.receiptType || "VOUCHER");
    setPriceTier("NORMAL");
    const balance = order.totalAmount - order.amountPaid;
    setAmountToPay(balance);
  };

  const updateQuantity = (id: string, delta: number) => {
    setEditableItems(prev => prev.map((item: any) => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setEditableItems(prev => prev.filter(item => item.id !== id));
  };

  // Calcular balance basado en edición en vivo (si aplica)
  const isPending = selectedOrder?.status === 'PENDING';
  const currentTotal = isPending 
    ? editableItems.reduce((acc: any, item: any) => acc + (item.quantity * item.unitPrice), 0)
    : (selectedOrder?.totalAmount || 0);
  
  const currentBalance = currentTotal - (selectedOrder?.amountPaid || 0);

  // Sincronizar amountToPay si el carrito cambia (solo para PENDING)
  useEffect(() => {
    if (isPending) {
       setAmountToPay(currentBalance);
    }
  }, [currentTotal, isPending]);


  const handleApprove = async () => {
    if (!selectedOrder) return;
    if (isPending && editableItems.length === 0) {
      toast.error("El ticket no puede estar vacío");
      return;
    }

    if (amountToPay <= 0 || amountToPay > currentBalance) {
      toast.error("Monto de abono inválido");
      return;
    }

    if (paymentMethod === "TARJETA" || paymentMethod === "TRANSFERENCIA") {
      if (!paymentBank) { toast.error("Debe seleccionar un banco"); return; }
      if (!transactionId) { toast.error("Debe ingresar el número de comprobante"); return; }
    }

    if (paymentMethod === "CREDITO") {
      if (!creditProvider) { toast.error("Debe seleccionar la entidad de crédito"); return; }
    }
    
    setIsProcessing(true);
    const tid = toast.loading("Procesando pago...");

    try {
      const paymentData = {
        amount: amountToPay,
        method: paymentMethod,
        bank: paymentBank,
        transactionId,
        creditProvider,
        creditDays: creditProvider === "Directo" ? creditDays : undefined,
        receiptType
      };

      const res = await processPayment(selectedOrder.id, paymentData, isPending ? editableItems : undefined);
      if (res.success) {
        
        // Enviar WhatsApp
        const customer = selectedOrder.customer;
        if (customer?.phone) {
          const receiptUrl = `${window.location.origin}/receipt/${selectedOrder.id}`;
          const text = `Hola ${customer.name}, hemos recibido tu pago de $${amountToPay.toLocaleString('de-DE')} en DISTRIELECTRICOS. 🧾 Puedes ver y descargar tu recibo aquí: ${receiptUrl}`;
          const cleanPhone = customer.phone.replace(/\D/g, '');
          const phonePrefix = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
          const waUrl = `https://wa.me/${phonePrefix}?text=${encodeURIComponent(text)}`;
          window.open(waUrl, '_blank');
        }

        if (amountToPay < currentBalance) {
          toast.success(`Abono exitoso. Saldo pendiente: $${(currentBalance - amountToPay).toLocaleString('de-DE')}`, { id: tid });
        } else {
          toast.success("Pago total exitoso. Ticket cerrado.", { id: tid });
          setSelectedOrder(null);
          setEditableItems([]);
        }
        
        if (isSearching) handleSearch();
        else loadOrders();

      } else {
        toast.error(res.error || "Error al procesar", { id: tid });
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado", { id: tid });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("¿Está seguro de anular este ticket? (El cliente desistió)")) return;
    const tid = toast.loading("Anulando ticket...");
    const res = await cancelOrder(id);
    if (res.success) {
      toast.success("Ticket anulado", { id: tid });
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
        setEditableItems([]);
      }
      if (isSearching) handleSearch();
      else loadOrders();
    } else {
      toast.error(res.error || "Error al anular", { id: tid });
    }
  };

  const openHistoryModal = async () => {
    if (!selectedOrder?.customer) return;
    setIsHistoryModalOpen(true);
    setIsLoadingOrders(true);
    try {
      const ordersHistory = await getCustomerOrders(selectedOrder.customer.id);
      setCustomerOrders(ordersHistory);
    } catch (error) {
      toast.error("Error al cargar historial");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning">Esperando Pago</span>;
      case 'PREPARING': return <span className="badge" style={{ background: "#3b82f6", color: "white" }}>En Bodega</span>;
      case 'READY': return <span className="badge badge-success">Listo para Retirar</span>;
      case 'DELIVERED': return <span className="badge" style={{ background: "var(--color-light-gray)", color: "var(--color-text-main)" }}>Entregado</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Anulado</span>;
      case 'OPEN_INVOICE': return <span className="badge" style={{ background: "var(--color-secondary)", color: "white" }}>Crédito / Abierto</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px - 4rem)", gap: "1.5rem" }}>
      
      {/* LEFT COLUMN: PENDING QUEUE & SEARCH */}
      <div className="card" style={{ flex: "1 1 40%", display: "flex", flexDirection: "column", padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-background)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={20} />
              Tickets Pendientes
            </h2>
            {!isSearching && <span className="badge badge-warning" style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>{orders.length}</span>}
            {isSearching && <button onClick={() => { setIsSearching(false); setSearchQuery(""); loadOrders(); }} className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}>Volver a Cola General</button>}
          </div>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
             <div style={{ position: "relative", flex: 1 }}>
               <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
               <input 
                 type="text" 
                 className="form-input" 
                 placeholder="Buscar CC/NIT cliente para abonos..." 
                 style={{ paddingLeft: "2.25rem" }}
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
             </div>
             <button type="submit" className="btn btn-primary" style={{ padding: "0 1rem" }}>Buscar</button>
          </form>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isLoading ? (
             <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>Buscando...</div>
          ) : orders.length === 0 ? (
             <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
               {isSearching ? "Este cliente no tiene deudas pendientes." : "No hay tickets pendientes de pago."}
             </div>
          ) : (
            orders.map((order: any) => {
              const balance = order.totalAmount - order.amountPaid;
              return (
                <div 
                  key={order.id} 
                  onClick={() => handleSelectOrder(order)}
                  style={{ 
                    padding: "1rem", 
                    border: "2px solid",
                    borderColor: selectedOrder?.id === order.id ? "var(--color-primary)" : "var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: selectedOrder?.id === order.id ? "rgba(32,53,98,0.03)" : "white",
                    transition: "all 0.2s"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      Ticket #{order.id.slice(-6).toUpperCase()}
                      {getStatusBadge(order.status)}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Users size={14} /> {order.customer?.name || "Consumidor Final"}
                    </div>
                    {order.amountPaid > 0 && (
                       <div style={{ fontSize: "0.85rem", color: "var(--color-secondary)", marginTop: "0.25rem", fontWeight: 600 }}>
                         Abonado: ${order.amountPaid.toLocaleString('de-DE')}
                       </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 600 }}>SALDO</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>${balance.toLocaleString('de-DE')}</div>
                    {order.status === 'PENDING' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }}
                        style={{ background: "none", border: "none", color: "var(--color-danger)", fontSize: "0.85rem", cursor: "pointer", marginTop: "0.5rem", textDecoration: "underline" }}
                      >
                        Anular Ticket
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CHECKOUT PANEL */}
      <div className="card" style={{ flex: "1 1 60%", display: "flex", flexDirection: "column", padding: "0" }}>
        
        {selectedOrder ? (
          <>
            {/* Header: Customer Info */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-background)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                    {isPending ? "Nueva Venta" : "Recaudo de Abono"} - Ticket #{selectedOrder.id.slice(-6).toUpperCase()}
                  </h2>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Users size={14} /> {selectedOrder.customer?.name || "Consumidor Final"}
                  </div>
                </div>
                {selectedOrder.customer && (
                  <button 
                    onClick={openHistoryModal}
                    className="btn btn-outline"
                    style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem" }}
                  >
                    <History size={16} /> Ver Historial
                  </button>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              
              {selectedOrder.notes && (
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "rgba(245, 158, 11, 0.05)", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <FileText color="#f59e0b" size={20} style={{ marginTop: "0.2rem" }} />
                  <div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#d97706", margin: 0 }}>Observaciones del Pedido</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--color-text-main)", marginTop: "0.25rem", margin: 0 }}>{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Delivery Type Display */}
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {selectedOrder.deliveryType === "DOMICILIO" ? (
                  <Truck color="var(--color-primary)" size={20} />
                ) : (
                  <Store color="var(--color-primary)" size={20} />
                )}
                <div>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-main)", margin: 0 }}>Tipo de Entrega</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: "0.1rem", margin: 0 }}>
                    {selectedOrder.deliveryType === "DOMICILIO" ? "Envío a Domicilio" : "Retiro en Tienda"}
                  </p>
                </div>
              </div>

              {/* Items List (Editable only if PENDING) */}
              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
                
                {/* Selector de Precios (NUEVO) */}
                {isPending && (
                  <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--color-background)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "0.5rem", display: "block" }}>Aplicar Lista de Precios</label>
                    <select 
                      className="form-input" 
                      value={priceTier} 
                      onChange={(e) => handlePriceTierChange(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-md)" }}
                    >
                      <option value="NORMAL">Precio Público (Normal)</option>
                      <option value="FRECUENTE">Cliente Frecuente</option>
                      <option value="VOLUMEN">Precio Volumen</option>
                      <option value="CORPORATIVO">Precio Corporativo</option>
                    </select>
                  </div>
                )}

                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-primary)" }}>
                    {isPending ? "Auditoría de Artículos" : "Artículos Despachados"}
                  </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {editableItems.map((item: any) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--color-border)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: isPending ? "inherit" : "var(--color-text-muted)" }}>{item.name}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>${item.unitPrice.toLocaleString('de-DE')} c/u</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                        
                        {isPending ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--color-background)", borderRadius: "var(--radius-md)", padding: "0.25rem" }}>
                            <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeItem(item.id)} style={{ padding: "0.25rem", borderRadius: "4px", background: "white", border: "1px solid var(--color-border)" }}>
                              {item.quantity > 1 ? <Minus size={14} /> : <Trash2 size={14} color="var(--color-danger)" />}
                            </button>
                            <span style={{ fontSize: "0.9rem", fontWeight: 600, width: "24px", textAlign: "center" }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: "0.25rem", borderRadius: "4px", background: "white", border: "1px solid var(--color-border)" }}>
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-muted)" }}>{item.quantity} Und</div>
                        )}

                        <div style={{ fontWeight: 600, width: "80px", textAlign: "right" }}>${(item.quantity * item.unitPrice).toLocaleString('de-DE')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historial de Pagos previos si los hay */}
              {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "rgba(16, 185, 129, 0.03)" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-success)" }}>Abonos Anteriores</h3>
                  {selectedOrder.payments.map((p: any) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem", color: "var(--color-text-muted)" }}>
                      <span>{new Date(p.createdAt).toLocaleDateString()} - {p.method} {p.bank ? `(${p.bank})` : ""}</span>
                      <span style={{ fontWeight: 600 }}>${p.amount.toLocaleString('de-DE')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Receipt Type Selection */}
              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Receipt size={18} /> Tipo de Comprobante
                </h3>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", border: `2px solid ${receiptType === 'VOUCHER' ? 'var(--color-primary)' : 'var(--color-border)'}`, padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", flex: 1, background: receiptType === 'VOUCHER' ? 'rgba(32,53,98,0.05)' : 'white' }}>
                    <input type="radio" name="receiptType" value="VOUCHER" checked={receiptType === "VOUCHER"} onChange={() => setReceiptType("VOUCHER")} style={{ accentColor: "var(--color-primary)" }} />
                    <span style={{ fontWeight: 500 }}>Voucher Interno (Tirilla)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", border: `2px solid ${receiptType === 'FACTURA' ? 'var(--color-primary)' : 'var(--color-border)'}`, padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", flex: 1, background: receiptType === 'FACTURA' ? 'rgba(32,53,98,0.05)' : 'white' }}>
                    <input type="radio" name="receiptType" value="FACTURA" checked={receiptType === "FACTURA"} onChange={() => setReceiptType("FACTURA")} style={{ accentColor: "var(--color-primary)" }} />
                    <span style={{ fontWeight: 500 }}>Factura Electrónica (API)</span>
                  </label>
                </div>
              </div>

              {/* Payment Form */}
              <div style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-primary)" }}>Monto y Método de Recaudo</h3>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main)" }}>Monto a Pagar (Abono):</label>
                  <div style={{ position: "relative", flex: 1, maxWidth: "200px" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--color-text-muted)" }}>$</span>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ paddingLeft: "2rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)" }} 
                      value={amountToPay || ""}
                      onChange={e => setAmountToPay(Number(e.target.value))}
                      max={currentBalance}
                    />
                  </div>
                  {amountToPay < currentBalance && (
                    <span className="badge badge-warning">Quedará saldo de ${(currentBalance - amountToPay).toLocaleString('de-DE')}</span>
                  )}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <button onClick={() => setPaymentMethod("EFECTIVO")} className={`btn ${paymentMethod === "EFECTIVO" ? "btn-primary" : "btn-outline"}`} style={{ flex: 1, minWidth: "120px" }}>
                    <Banknote size={18} /> Efectivo
                  </button>
                  <button onClick={() => setPaymentMethod("TARJETA")} className={`btn ${paymentMethod === "TARJETA" ? "btn-primary" : "btn-outline"}`} style={{ flex: 1, minWidth: "120px" }}>
                    <CreditCard size={18} /> Tarjeta
                  </button>
                  <button onClick={() => setPaymentMethod("TRANSFERENCIA")} className={`btn ${paymentMethod === "TRANSFERENCIA" ? "btn-primary" : "btn-outline"}`} style={{ flex: 1, minWidth: "120px" }}>
                    <Landmark size={18} /> Transf.
                  </button>
                  <button onClick={() => setPaymentMethod("CREDITO")} className={`btn ${paymentMethod === "CREDITO" ? "btn-primary" : "btn-outline"}`} style={{ flex: 1, minWidth: "120px" }}>
                    <CalendarClock size={18} /> Crédito Ext.
                  </button>
                </div>

                {/* Sub-forms depending on method */}
                {(paymentMethod === "TARJETA" || paymentMethod === "TRANSFERENCIA") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--color-surface)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Entidad Bancaria</label>
                      <select className="form-input" value={paymentBank} onChange={e => setPaymentBank(e.target.value)}>
                        <option value="">Seleccione banco...</option>
                        <option value="Bancolombia">Bancolombia</option>
                        <option value="Davivienda">Davivienda</option>
                        <option value="Nequi">Nequi</option>
                        <option value="Daviplata">Daviplata</option>
                        <option value="Banco de Bogotá">Banco de Bogotá</option>
                        <option value="Otro">Otro...</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">N° de Comprobante / Voucher</label>
                      <input type="text" className="form-input" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Ej: 90234812" />
                    </div>
                  </div>
                )}

                {paymentMethod === "CREDITO" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--color-surface)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Entidad Proveedora</label>
                      <select className="form-input" value={creditProvider} onChange={e => setCreditProvider(e.target.value)}>
                        <option value="">Seleccione proveedor...</option>
                        <option value="Sistecredito">Sistecredito</option>
                        <option value="Addi">Addi</option>
                        <option value="Directo">Crédito Directo</option>
                      </select>
                    </div>
                    {creditProvider === "Directo" && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Días de Plazo</label>
                        <select className="form-input" value={creditDays} onChange={e => setCreditDays(Number(e.target.value))}>
                          <option value="15">15 días</option>
                          <option value="30">30 días</option>
                          <option value="45">45 días</option>
                          <option value="60">60 días</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-border)", background: "var(--color-background)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-muted)" }}>SALDO ACTUAL</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-main)" }}>${currentBalance.toLocaleString('de-DE')}</span>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: "100%", padding: "1.25rem", fontSize: "1.2rem", display: "flex", justifyContent: "center", gap: "0.75rem" }}
                onClick={handleApprove}
                disabled={isProcessing || (isPending && editableItems.length === 0)}
              >
                <CheckCircle size={24} />
                {isProcessing ? "Procesando..." : `RECAUDAR $${amountToPay.toLocaleString('de-DE')} Y GUARDAR`}
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", gap: "1rem", padding: "2rem", textAlign: "center" }}>
            <Banknote size={64} opacity={0.2} />
            <p style={{ fontSize: "1.1rem" }}>Selecciona un ticket de la cola para procesar el pago o abono.</p>
          </div>
        )}
      </div>

      {/* Modal Historial de Pedidos */}
      {isHistoryModalOpen && selectedOrder?.customer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <History size={20} />
                Historial de {selectedOrder.customer.name}
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
                  
                  {customerOrders.length > 0 && (
                    <div>
                      <div className="table-responsive">
                        <table className="table" style={{ fontSize: "0.9rem" }}>
                          <thead>
                            <tr>
                              <th>ID Orden</th>
                              <th>Fecha</th>
                              <th>Estado</th>
                              <th>Recibo</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerOrders.map((order: any) => (
                              <tr key={order.id}>
                                <td style={{ fontWeight: 500 }}>#{order.id.slice(-6).toUpperCase()}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>{getStatusBadge(order.status)}</td>
                                <td>{order.receiptType || "N/A"}</td>
                                <td style={{ fontWeight: 600 }}>${order.totalAmount.toLocaleString('de-DE')}</td>
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

    </div>
  );
}
