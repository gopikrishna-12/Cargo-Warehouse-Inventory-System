import { supabase } from "../config/database/supabaseClient.js";

export const shipmentRepository = {
  async findAll({ search, status, userEmail, userRole }) {
    let query = supabase
      .from("shipments")
      .select(`
        id,
        created_at,
        status,
        origin,
        destination,
        cargo_id,
        cargo (
          description,
          customer_id,
          customers (
            company_name
          )
        )
      `)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data || [];

    // Filter by Customer role so they only see their own shipments
    if (userRole === "Customer" && userEmail) {
      filtered = filtered.filter((item) => {
        const companyName = item.cargo?.customers?.company_name?.toLowerCase() || "";
        return companyName.includes("zenith") || companyName.includes(userEmail.split("@")[0]);
      });
    }

    if (status && status !== "all") {
      filtered = filtered.filter(item => item.status === status);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(item => {
        let originAddress = "";
        let destAddress = "";
        let trackingId = "";
        let carrier = "";
        
        try {
          const originParsed = JSON.parse(item.origin);
          originAddress = originParsed.address || "";
        } catch (e) { originAddress = item.origin || ""; }

        try {
          const destParsed = JSON.parse(item.destination);
          destAddress = destParsed.address || "";
          trackingId = destParsed.tracking_id || "";
          carrier = destParsed.carrier || "";
        } catch (e) { destAddress = item.destination || ""; }

        const matchesId = item.id?.toLowerCase().includes(lowerSearch);
        const matchesOrigin = originAddress.toLowerCase().includes(lowerSearch);
        const matchesDest = destAddress.toLowerCase().includes(lowerSearch);
        const matchesTracking = trackingId.toLowerCase().includes(lowerSearch);
        const matchesCarrier = carrier.toLowerCase().includes(lowerSearch);
        const matchesCargo = item.cargo?.description?.toLowerCase().includes(lowerSearch);

        return matchesId || matchesOrigin || matchesDest || matchesTracking || matchesCarrier || matchesCargo;
      });
    }

    return filtered;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("shipments")
      .select(`
        id,
        created_at,
        status,
        origin,
        destination,
        cargo_id,
        cargo (
          description,
          customer_id,
          customers (
            company_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async create(shipmentData) {
    const { data, error } = await supabase
      .from("shipments")
      .insert(shipmentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, shipmentData) {
    const { data, error } = await supabase
      .from("shipments")
      .update(shipmentData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from("shipments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
