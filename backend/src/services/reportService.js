import { supabase } from "../config/database/supabaseClient.js";

export const reportService = {
  async getDashboardStats() {
    // Run queries in parallel for performance
    const [
      cargoCountRes,
      shipmentCountRes,
      customerCountRes,
      warehouseCountRes,
      invoicesRes,
      recentCargoRes,
      recentShipmentsRes,
      recentActivitiesRes
    ] = await Promise.all([
      supabase.from("cargo").select("id", { count: "exact", head: true }),
      supabase.from("shipments").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("warehouses").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("id, invoice_number, amount, due_date, created_at, customer_id, customers(company_name)").order("created_at", { ascending: false }),
      supabase.from("cargo").select("*, customers(company_name)").order("created_at", { ascending: false }).limit(5),
      supabase.from("shipments").select("*, cargo(description, customers(company_name))").order("created_at", { ascending: false }).limit(5),
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5)
    ]);

    const cargoCount = cargoCountRes.count || 0;
    const shipmentCount = shipmentCountRes.count || 0;
    const customerCount = customerCountRes.count || 0;
    const warehouseCount = warehouseCountRes.count || 0;
    
    const invoices = invoicesRes.data || [];
    const revenueSum = invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      stats: {
        cargoCount,
        shipmentCount,
        customerCount,
        warehouseCount,
        revenue: revenueSum
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
