import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const tables = ["customers", "cargo", "invoices", "shipments", "documents"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) {
      console.error(`Error fetching ${t}:`, error);
    } else {
      console.log(`=== TABLE: ${t} (${data.length} rows) ===`);
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

main();
