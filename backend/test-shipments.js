import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  // Let's find a cargo item to use as cargo_id
  const { data: cargo } = await supabase.from("cargo").select("id").limit(1);
  if (!cargo || cargo.length === 0) {
    console.log("No cargo found to test shipments. Please seed cargo first.");
    return;
  }
  
  const statuses = ["Pending", "In Transit", "Delayed", "Delivered", "pending", "in_transit", "delayed", "delivered"];
  for (const status of statuses) {
    const { error } = await supabase.from("shipments").insert({
      status,
      origin: JSON.stringify({ address: "Test Origin" }),
      destination: JSON.stringify({ address: "Test Destination" }),
      cargo_id: cargo[0].id
    });
    if (error) {
      console.log(`Shipment status [${status}] FAILED:`, error.message);
    } else {
      console.log(`Shipment status [${status}] SUCCESS!`);
      await supabase.from("shipments").delete().eq("status", status);
    }
  }
}

test();
