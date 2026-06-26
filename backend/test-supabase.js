import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key defined:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Attempting to connect to Supabase and query the 'cargo' table...");
  try {
    const { data, error } = await supabase
      .from("cargo")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase API returned an error:", error);
      
      // Let's also try querying customers if cargo table doesn't exist
      console.log("Attempting to query the 'customers' table as fallback...");
      const { data: custData, error: custError } = await supabase
        .from("customers")
        .select("id")
        .limit(1);
      
      if (custError) {
        console.error("Supabase API returned an error for customers as well:", custError);
        process.exit(1);
      } else {
        console.log("Successfully connected! Querying 'customers' table succeeded. Data sample:", custData);
      }
    } else {
      console.log("Successfully connected! Querying 'cargo' table succeeded. Data sample:", data);
    }
  } catch (err) {
    console.error("An unexpected error occurred while connecting:", err);
    process.exit(1);
  }
}

testConnection();
