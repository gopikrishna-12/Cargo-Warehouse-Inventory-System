import { supabase } from "../config/database/supabaseClient.js";

export const warehouseRepository = {
  async findAll() {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async create(warehouseData) {
    const { data, error } = await supabase
      .from("warehouses")
      .insert(warehouseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, warehouseData) {
    const { data, error } = await supabase
      .from("warehouses")
      .update(warehouseData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from("warehouses")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
