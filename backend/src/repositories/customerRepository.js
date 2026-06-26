import { supabase } from "../config/database/supabaseClient.js";

export const customerRepository = {
  async findAll({ search }) {
    let query = supabase
      .from("customers")
      .select("*")
      .order("company_name", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data || [];

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.company_name?.toLowerCase().includes(lowerSearch) ||
        c.email?.toLowerCase().includes(lowerSearch) ||
        c.phone?.includes(lowerSearch)
      );
    }

    return filtered;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async create(customerData) {
    const { data, error } = await supabase
      .from("customers")
      .insert(customerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, customerData) {
    const { data, error } = await supabase
      .from("customers")
      .update(customerData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async findCargoHistory(customerId) {
    const { data, error } = await supabase
      .from("cargo")
      .select("id, description, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async findInvoiceHistory(customerId) {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, amount, due_date, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async findAllInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createInvoice(invoiceData) {
    const { data, error } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
