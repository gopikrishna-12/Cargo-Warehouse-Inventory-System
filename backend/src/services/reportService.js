import { supabase } from "../config/database/supabaseClient.js";

export const reportService = {
  async getDashboardStats({ userEmail, userRole } = {}) {
    if (userRole === "Customer" && userEmail) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();

      if (!customer) {
        return {
          stats: {
            cargoCount: 0,
            shipmentCount: 0,
            customerCount: 1,
            warehouseCount: 0,
            revenue: 0,
            documentsCount: 0
          },
          recentCargo: [],
          recentShipments: [],
          recentActivities: [],
          invoices: []
        };
      }

      // Fetch customer's cargo IDs for shipment query
      const { data: myCargo } = await supabase
        .from("cargo")
        .select("id")
        .eq("customer_id", customer.id);

      const myCargoIds = myCargo ? myCargo.map(c => c.id) : [];

      // Run customer specific queries in parallel
      const [
        cargoCountRes,
        shipmentCountRes,
        invoicesRes,
        recentCargoRes,
        recentShipmentsRes,
        recentActivitiesRes,
        docCountRes
      ] = await Promise.all([
        supabase.from("cargo").select("id", { count: "exact", head: true }).eq("customer_id", customer.id),
        myCargoIds.length > 0
          ? supabase.from("shipments").select("id", { count: "exact", head: true }).in("cargo_id", myCargoIds)
          : { count: 0 },
        supabase.from("invoices").select("id, invoice_number, amount, due_date, created_at, customer_id, customers(company_name)").eq("customer_id", customer.id).order("created_at", { ascending: false }),
        supabase.from("cargo").select("*, customers(company_name)").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(5),
        myCargoIds.length > 0
          ? supabase.from("shipments").select("*, cargo(description, customers(company_name))").in("cargo_id", myCargoIds).order("created_at", { ascending: false }).limit(5)
          : { data: [] },
        supabase.from("activity_logs").select("*").eq("user_id", userEmail).order("created_at", { ascending: false }).limit(5),
        myCargoIds.length > 0
          ? supabase.from("documents").select("id", { count: "exact", head: true }).in("cargo_id", myCargoIds)
          : { count: 0 }
      ]);

      const cargoCount = cargoCountRes.count || 0;
      const shipmentCount = shipmentCountRes.count || 0;
      const docCount = docCountRes.count || 0;
      const invoices = invoicesRes.data || [];
      const revenueSum = invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      return {
        stats: {
          cargoCount,
          shipmentCount,
          customerCount: 1,
          warehouseCount: 0,
          revenue: revenueSum,
          documentsCount: docCount
        },
        recentCargo: recentCargoRes.data || [],
        recentShipments: recentShipmentsRes.data || [],
        recentActivities: recentActivitiesRes.data || [],
        invoices
      };
    }

    // Run global queries in parallel for performance (Admin/Staff role)
    const [
      cargoCountRes,
      shipmentCountRes,
      customerCountRes,
      warehouseCountRes,
      invoicesRes,
      recentCargoRes,
      recentShipmentsRes,
      recentActivitiesRes,
      docCountRes
    ] = await Promise.all([
      supabase.from("cargo").select("id", { count: "exact", head: true }),
      supabase.from("shipments").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("warehouses").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("id, invoice_number, amount, due_date, created_at, customer_id, customers(company_name)").order("created_at", { ascending: false }),
      supabase.from("cargo").select("*, customers(company_name)").order("created_at", { ascending: false }).limit(5),
      supabase.from("shipments").select("*, cargo(description, customers(company_name))").order("created_at", { ascending: false }).limit(5),
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("documents").select("id", { count: "exact", head: true })
    ]);

    const cargoCount = cargoCountRes.count || 0;
    const shipmentCount = shipmentCountRes.count || 0;
    const customerCount = customerCountRes.count || 0;
    const warehouseCount = warehouseCountRes.count || 0;
    const docCount = docCountRes.count || 0;
    
    const invoices = invoicesRes.data || [];
    const revenueSum = invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      stats: {
        cargoCount,
        shipmentCount,
        customerCount,
        warehouseCount,
        revenue: revenueSum,
        documentsCount: docCount
      },
      recentCargo: recentCargoRes.data || [],
      recentShipments: recentShipmentsRes.data || [],
      recentActivities: recentActivitiesRes.data || [],
      invoices
    };
  },

  async getReportData(table) {
    if (!["cargo", "shipments", "customers", "invoices", "documents"].includes(table)) {
      throw new Error("Invalid table reference.");
    }
    
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    return data || [];
  }
};
