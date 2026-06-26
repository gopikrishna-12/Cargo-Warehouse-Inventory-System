import { supabase } from "../config/database/supabaseClient.js";

export const cargoRepository = {
  async findAll({ search, status }) {
    let query = supabase
      .from("cargo")
      .select(`
        id,
        created_at,
        description,
        status,
        customer_id,
        customers (
          company_name
        )
      `)
      .order("created_at", { ascending: false });

    // Note: Search & Filter will be processed either in repo or service level.
    // Since PostgREST has some limits on complex JSON deserialization search filters,
    // we can retrieve the cargo and filter in-memory if needed, OR we can use direct supabase filters.
    // Let's implement robust filtering at the repository level:
    const { data, error } = await query;
    if (error) throw error;
    
    let filtered = data || [];

    if (status && status !== "all") {
      filtered = filtered.filter(item => item.status === status);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(item => {
        let desc = item.description;
        try {
          const parsed = JSON.parse(item.description);
          desc = parsed.text || parsed.description || item.description;
        } catch (e) {}

        const matchesId = item.id?.toLowerCase().includes(lowerSearch);
        const matchesDesc = desc?.toLowerCase().includes(lowerSearch);
        const matchesCompany = item.customers?.company_name?.toLowerCase().includes(lowerSearch);
        return matchesId || matchesDesc || matchesCompany;
      });
    }

    return filtered;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("cargo")
      .select(`
        id,
        created_at,
        description,
        status,
        customer_id,
        customers (
          company_name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  },

  async create(cargoData) {
    const { data, error } = await supabase
      .from("cargo")
      .insert(cargoData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, cargoData) {
    const { data, error } = await supabase
      .from("cargo")
      .update(cargoData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from("cargo")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
