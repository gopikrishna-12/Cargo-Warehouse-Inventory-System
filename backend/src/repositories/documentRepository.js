import { supabase } from "../config/database/supabaseClient.js";

export const documentRepository = {
  async findAll({ search, userEmail, userRole }) {
    let query = supabase
      .from("documents")
      .select(`
        id,
        file_url,
        cargo_id,
        uploaded_at,
        cargo (
          description,
          customer_id,
          customers (
            company_name
          )
        )
      `)
      .order("uploaded_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data || [];

    // Filter documents for Customer role
    if (userRole === "Customer" && userEmail) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();

      if (!customer) return [];
      filtered = filtered.filter((doc) => doc.cargo?.customer_id === customer.id);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((doc) => {
        // Parse doc details
        let title = "";
        let type = "";
        try {
          const parsed = new URL(doc.file_url);
          type = parsed.searchParams.get("type") || "Manifest";
          title = parsed.searchParams.get("title") || "Cargo_Certificate.pdf";
        } catch (e) {
          if (doc.file_url && doc.file_url.includes("?")) {
            const parts = doc.file_url.split("?");
            const params = new URLSearchParams(parts[1]);
            type = params.get("type") || "Manifest";
            title = params.get("title") || parts[0].split("/").pop() || "Document.pdf";
          } else {
            type = "Manifest";
            title = doc.file_url ? doc.file_url.split("/").pop() : "document.pdf";
          }
        }

        const matchesId = doc.id?.toLowerCase().includes(lowerSearch);
        const matchesTitle = title.toLowerCase().includes(lowerSearch);
        const matchesType = type.toLowerCase().includes(lowerSearch);
        const matchesCargo = doc.cargo?.description?.toLowerCase().includes(lowerSearch);

        return matchesId || matchesTitle || matchesType || matchesCargo;
      });
    }

    return filtered;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async create(documentData) {
    const { data, error } = await supabase
      .from("documents")
      .insert(documentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
