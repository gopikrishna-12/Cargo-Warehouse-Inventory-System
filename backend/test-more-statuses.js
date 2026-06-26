import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const statuses = [
    "stored", "pending", "in transit", "in_transit", "dispatched", "delivered",
    "shipped", "inbound", "outbound", "active", "draft", "new", "intake",
    "inspected", "ready", "hold", "on hold", "on_hold", "stored_cargo",
    "Stored", "Pending", "In Transit", "Dispatched", "Delivered"
  ];
  
  for (const status of statuses) {
    const { error } = await supabase.from("cargo").insert({
      description: JSON.stringify({ text: "Test item" }),
      status,
      customer_id: 1
    });
    if (error) {
      // Just print if it's NOT a constraint violation, or print constraint failures
      if (!error.message.includes("check constraint")) {
        console.log(`Status [${status}] error:`, error.message);
      }
    } else {
      console.log(`Status [${status}] SUCCESS!`);
      await supabase.from("cargo").delete().eq("status", status).eq("customer_id", 1);
    }
  }
}

test();
