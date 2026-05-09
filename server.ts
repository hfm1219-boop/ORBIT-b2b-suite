import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dismel-secret-key-2024";
const FLASK_API_BASE_URL = process.env.FLASK_API_BASE_URL || "http://localhost:5000";
const USE_DEMO_FALLBACK = process.env.USE_DEMO_FALLBACK === "true" || true;

const geminiAi = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(cors());
  app.use(express.json());

  // Helper for Proxying
  const proxyRequest = async (req: any, res: any, targetPath: string, method: 'get' | 'post' | 'put' | 'delete' = 'get') => {
    if (USE_DEMO_FALLBACK) {
      return null; // Signals to use local fallback
    }

    try {
      const url = `${FLASK_API_BASE_URL}${targetPath}`;
      const config = {
        method,
        url,
        data: req.body,
        params: req.query,
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      };
      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      console.error(`Error proxying to ${targetPath}:`, error.message);
      throw error;
    }
  };

  // --- MOCK DATABASE ---
  const users = [
    {
      id: "1",
      phone: "3001234567",
      password: "password123", 
      name: "Asesor Demo",
      role: "advisor",
      advisor_id: "A001",
      phone_number_id: "PN123456",
      zone_number: "Z01"
    }
  ];

  // --- API ROUTES ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date(), demo: USE_DEMO_FALLBACK });
  });

  app.post("/api/auth/login", (req, res) => {
    const { phone, password } = req.body;
    const user = users.find(u => u.phone === phone && u.password === password);

    if (user) {
      const token = jwt.sign({ 
        id: user.id, 
        role: user.role,
        advisor_id: user.advisor_id,
        phone_number_id: user.phone_number_id 
      }, JWT_SECRET, { expiresIn: "24h" });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  });

  // Middleware for token validation
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- PROXY ROUTES ---

  app.get("/api/advisor/customers", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, "/orders/advisor/customers");
    if (data) return res.json(data);

    // Fallback Demo
    res.json([
      { id: "101", nit: "900.123.456-1", name: "ALMACENES ÉXITO S.A.", commercial_name: "ÉXITO", totalDebt: 12500000, priceList: "General", address: "Calle 45 # 10-20", distance: 450, city: "Bogotá" },
      { id: "102", nit: "800.555.777-2", name: "SUPER TIENDAS OLÍMPICA", commercial_name: "OLÍMPICA", totalDebt: 0, priceList: "Premium", address: "Av. 30 # 22-10", distance: 120, city: "Bogotá" },
      { id: "103", nit: "901.888.999-0", name: "ANILLO PEREIRA HECTOR-REST.LA CASA DE SOCORRO", totalDebt: 248475, priceList: "General", address: "Cra 7 # 12-45", distance: 890, city: "Socorro" }
    ]);
  });

  app.get("/api/advisor/customers/:customerId/dashboard", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, `/orders/advisor/customer-dashboard?customer_partner_id=${req.params.customerId}`);
    if (data) return res.json(data);

    // Fallback Demo for Customer 360
    const customerId = req.params.customerId;
    res.json({
      ok: true,
      demo: true,
      customer: {
        id: customerId,
        name: "ANILLO PEREIRA HECTOR-REST.LA CASA DE SOCORRO",
        vat: "80.456.789-1",
        phone: "3103445566",
        street: "Cra 7 # 12-45",
        city: "Socorro",
        pricelist_name: "General",
        advisor_name: "Asesor Demo"
      },
      credit: {
        total_due: 4500000,
        overdue_total: 1200000,
        not_due_total: 3300000,
        max_days_overdue: 34,
        status: "blocked",
        label: "Bloqueado por cartera",
        reason: "Tiene facturas con más de 30 días de mora"
      },
      purchase_summary: {
        last_order_date: "2024-10-05",
        last_order_amount: 248475,
        orders_30d: 4,
        orders_60d: 12,
        orders_90d: 18,
        sales_30d: 1540000,
        sales_60d: 4200000,
        sales_90d: 6800000,
        avg_ticket_90d: 377000
      },
      alerts: [
        { id: "a1", type: "danger", title: "Cartera Vencida", message: "Cliente presenta 34 días de mora.", date: "Hoy" },
        { id: "a2", type: "info", title: "Próxima Recompra", message: "Producto U.L.C. AV00274 sugerido para hoy.", date: "Ayer" }
      ],
      frequent_products: [
        { id: "p1", code: "ULC20", name: "U.L.C. AV00274 GFA X 20 LTS", price: 120000, stock: 45, category: "Limpieza", brand: "Dismel", tax: 19, purchase_count_90d: 12, avg_qty: 2 },
        { id: "p2", code: "BOL50", name: "BOLSA DE PAPELERA BLANCA 50 X 55", price: 15000, stock: 120, category: "Insumos", brand: "Genérico", tax: 19, purchase_count_90d: 8, avg_qty: 5 }
      ],
      repurchase_suggestions: [
        { product_id: "p1", name: "U.L.C. AV00274 GFA X 20 LTS", last_purchase: "2024-09-15", avg_frequency_days: 15, days_since_last: 14, urgency: "high", reason: "Frecuencia de compra de 15 días cumplida", current_price: 120000, stock: 45 }
      ],
      recent_orders: [
        { id: "S86342", date: "2024-10-05", amount: 248475, status: "Enviado", invoice_number: "FVTB43489" }
      ]
    });
  });

  app.get("/api/advisor/repurchase-suggestions", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, "/orders/advisor/repurchase-suggestions");
    if (data) return res.json(data);

    // Fallback Demo
    const { customer_id } = req.query;
    
    const allSuggestions = [
      {
        id: "demo-1",
        customer_id: "103",
        customer_name: "ANILLO PEREIRA HECTOR-REST.LA CASA DE SOCORRO",
        product_id: "p1",
        sku: "ULC20",
        product_name: "U.L.C. AV00274 GFA X 20 LTS",
        category: "Limpieza",
        last_purchase_date: "2024-09-15",
        avg_frequency_days: 15,
        days_since_last_purchase: 16,
        score: 1.06,
        urgency: "high",
        urgency_label: "Recompra atrasada",
        reason: "Frecuencia de compra de 15 días cumplida",
        suggested_qty: 2,
        current_price: 120000,
        available_qty: 45,
        can_add_to_order: true
      },
      {
        id: "demo-1-extra",
        customer_id: "103",
        customer_name: "ANILLO PEREIRA HECTOR-REST.LA CASA DE SOCORRO",
        product_id: "p3",
        sku: "DET10",
        product_name: "DETERGENTE LÍQUIDO X 10 LTS",
        category: "Limpieza",
        last_purchase_date: "2024-10-10",
        avg_frequency_days: 20,
        days_since_last_purchase: 22,
        score: 1.1,
        urgency: "medium",
        urgency_label: "Recompra esperada",
        suggested_qty: 1,
        current_price: 45000,
        available_qty: 80,
        can_add_to_order: true
      },
      {
        id: "demo-2",
        customer_id: "102",
        customer_name: "SUPER TIENDAS OLÍMPICA",
        product_id: "p2",
        sku: "BOL50",
        product_name: "BOLSA DE PAPELERA BLANCA 50 X 55",
        category: "Insumos",
        last_purchase_date: "2024-10-01",
        avg_frequency_days: 7,
        days_since_last_purchase: 6,
        score: 0.85,
        urgency: "low",
        urgency_label: "Próxima recompra",
        reason: "Suele comprar este producto cada 7 días.",
        suggested_qty: 10,
        current_price: 15000,
        available_qty: 120,
        can_add_to_order: true
      },
      {
        id: "demo-3",
        customer_id: "102",
        customer_name: "SUPER TIENDAS OLÍMPICA",
        product_id: "p1",
        sku: "ULC20",
        product_name: "U.L.C. AV00274 GFA X 20 LTS",
        category: "Limpieza",
        last_purchase_date: "2024-09-20",
        avg_frequency_days: 30,
        days_since_last_purchase: 31,
        score: 1.03,
        urgency: "medium",
        urgency_label: "Recompra esperada",
        suggested_qty: 5,
        current_price: 115000,
        available_qty: 30,
        can_add_to_order: true
      }
    ];

    let filtered = allSuggestions;
    if (customer_id) {
      filtered = allSuggestions.filter(s => s.customer_id === customer_id);
    }

    res.json({
      ok: true,
      demo: true,
      items: filtered
    });
  });

  app.get("/api/advisor/route/today", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, "/orders/advisor/route/today");
    if (data) return res.json(data);

    // Fallback Demo
    const today = new Date().toISOString().split('T')[0];
    res.json({
      ok: true,
      demo: true,
      date: today,
      summary: {
        total_planned: 5,
        completed: 1,
        in_progress: 0,
        pending: 4,
        skipped: 0,
        orders_created: 1,
        validated_visits: 1
      },
      items: [
        {
          id: "visit-1",
          customer_id: "101",
          customer_name: "ALMACENES ÉXITO S.A.",
          customer_vat: "890900608-9",
          customer_phone: "3001234567",
          address: "Carrera 48 # 32Sur-29",
          city: "Envigado",
          latitude: 6.1759,
          longitude: -75.5917,
          planned_date: today,
          planned_sequence: 1,
          status: "completed",
          checkin_time: `${today}T08:30:00Z`,
          checkout_time: `${today}T09:15:00Z`,
          location_validated: true,
          distance_meters: 45,
          credit_status: {
            status: "can_order",
            label: "Puede comprar",
            overdue_total: 0,
            max_days_overdue: 0
          },
          commercial_alerts: [],
          repurchase_count: 0,
          last_order_date: "2024-10-01",
          days_without_order: 37,
          result_type: "order_created",
          result_note: "Pedido semanal estándar completado."
        },
        {
          id: "visit-2",
          customer_id: "102",
          customer_name: "SUPER TIENDAS OLÍMPICA",
          customer_vat: "890100577-6",
          customer_phone: "3109876543",
          address: "Calle 72 # 54-35",
          city: "Barranquilla",
          latitude: 10.9922,
          longitude: -74.8069,
          planned_date: today,
          planned_sequence: 2,
          status: "planned",
          credit_status: {
            status: "review",
            label: "En revisión",
            overdue_total: 1500000,
            max_days_overdue: 12
          },
          commercial_alerts: [
            {
              type: "repurchase",
              severity: "high",
              title: "Recompra crítica",
              message: "Cliente sin comprar su producto top hace 15 días."
            }
          ],
          repurchase_count: 2,
          last_order_date: "2024-09-20",
          days_without_order: 48
        },
        {
          id: "visit-3",
          customer_id: "103",
          customer_name: "ANILLO PEREIRA HECTOR-REST.LA CASA DE SOCORRO",
          customer_vat: "73155822-1",
          customer_phone: "3201234567",
          address: "Calle del Socorro # 8-12",
          city: "Cartagena",
          latitude: 10.4214,
          longitude: -75.5484,
          planned_date: today,
          planned_sequence: 3,
          status: "planned",
          credit_status: {
            status: "can_order",
            label: "Cupo disponible",
            overdue_total: 0,
            max_days_overdue: 0
          },
          commercial_alerts: [
            {
              type: "promo",
              severity: "low",
              title: "Nueva promo Limpieza",
              message: "Aplica 5% extra en galones x 20 lts."
            }
          ],
          repurchase_count: 1,
          last_order_date: "2024-09-15",
          days_without_order: 53
        },
        {
          id: "visit-4",
          customer_id: "104",
          customer_name: "TIENDAS ARA - JERÓNIMO MARTINS",
          address: "Avenida Principal # 45-12",
          city: "Pereira",
          latitude: null, // Cliente sin ubicación
          longitude: null,
          planned_date: today,
          planned_sequence: 4,
          status: "planned",
          credit_status: {
            status: "blocked",
            label: "Bloqueado",
            overdue_total: 4500000,
            max_days_overdue: 45
          },
          commercial_alerts: [],
          repurchase_count: 5,
          last_order_date: "2024-08-30",
          days_without_order: 69
        }
      ]
    });
  });

  app.post("/api/advisor/visits/:visitId/check-in", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, `/orders/advisor/visits/${req.params.visitId}/check-in`, "post");
    if (data) return res.json(data);

    res.json({ ok: true, status: "in_progress", message: "Check-in demo exitoso" });
  });

  app.post("/api/advisor/visits/:visitId/check-out", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, `/orders/advisor/visits/${req.params.visitId}/check-out`, "post");
    if (data) return res.json(data);

    res.json({ ok: true, status: "completed", message: "Check-out demo exitoso" });
  });

  app.post("/api/advisor/customers/:customerId/location", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, `/orders/advisor/customers/${req.params.customerId}/location`, "post");
    if (data) return res.json(data);

    res.json({ ok: true, message: "Ubicación actualizada demo exitosamente" });
  });

  app.get("/api/advisor/products", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, "/orders/advisor/products");
    if (data) return res.json(data);

    // Fallback Demo
    res.json([
      { id: "p1", code: "ULC20", name: "U.L.C. AV00274 GFA X 20 LTS", price: 120000, stock: 45, category: "Limpieza", brand: "Dismel", tax: 19 },
      { id: "p2", code: "BOL50", name: "BOLSA DE PAPELERA BLANCA 50 X 55", price: 15000, stock: 120, category: "Insumos", brand: "Genérico", tax: 19 }
    ]);
  });

  app.post("/api/advisor/orders", authenticateToken, async (req, res) => {
    const data = await proxyRequest(req, res, "/orders/advisor/order", 'post');
    if (data) return res.json(data);

    res.json({ ok: true, order_id: "S-88899", name: "SO/00123" });
  });

  // --- COPILOT (Gemini server-side proxy) ---
  app.post("/api/copilot/suggest", authenticateToken, async (req, res) => {
    if (!geminiAi) {
      return res.status(503).json({ error: "Copilot no disponible: GEMINI_API_KEY no configurada en servidor." });
    }
    const { history, lastMessage } = req.body || {};
    if (typeof lastMessage !== "string" || !Array.isArray(history)) {
      return res.status(400).json({ error: "Faltan history (array) o lastMessage (string)." });
    }
    try {
      const response = await geminiAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: history.map((h: any) => ({ text: `${h.role}: ${h.content}` })) },
          { role: "user", parts: [{ text: `Mensaje del cliente: ${lastMessage}. Como asistente comercial de Dismel, sugiere una respuesta profesional, corta y vendedora en español. No inventes precios ni stock. Solo UNA pregunta al final.` }] }
        ],
        config: {
          systemInstruction: "Eres el Copiloto Comercial de Dismel. Ayudas al asesor a responder clientes de forma profesional y clara.",
          temperature: 0.7,
        }
      });
      res.json({ text: response.text || null });
    } catch (err: any) {
      console.error("Copilot Gemini error:", err?.message || err);
      res.status(500).json({ error: "Error generando sugerencia" });
    }
  });

  // --- SOCKET.IO HANDLERS ---
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_pnid", (pnid) => {
      socket.join(pnid);
      console.log(`Socket ${socket.id} joined room ${pnid}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
