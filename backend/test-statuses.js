import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const statuses = ["Pending", "Inspected", "Stored", "Ready for Dispatch", "Dispatched", "Delivered", "In Transit", "Pending Intake"];
  for (const status of statuses) {
    const { error } = await supabase.from("cargo").insert({
      description: JSON.stringify({ text: "Test item" }),
      status,
      customer_id: 1
    });
    if (error) {
      console.log(`Status [${status}] FAILED:`, error.message);
    } else {
      console.log(`Status [${status}] SUCCESS!`);
      // Delete the test item
      await supabase.from("cargo").delete().eq("status", status).eq("customer_id", 1);
    }
  }
}

test();
