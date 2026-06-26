import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key defined:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Attempting to connect to Supabase and query the 'documents' table...");
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase API returned an error:", error);
    } else {
      console.log("Successfully connected! Querying 'documents' table succeeded. Data sample:", data);
    }
  } catch (err) {
    console.error("An unexpected error occurred while connecting:", err);
    process.exit(1);
  }
}

testConnection();
