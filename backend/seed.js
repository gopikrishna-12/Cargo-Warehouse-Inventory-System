import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting database seed script...");

  // 1. Ensure Zenith Shipping Client customer exists
  console.log("Ensuring Customer 'Zenith Shipping Client' (email: customer@orbem.com) exists...");
  let zenithCustomerId;
  const { data: existingCust, error: getCustError } = await supabase
    .from("customers")
    .select("id")
    .eq("email", "customer@orbem.com")
    .maybeSingle();

  if (getCustError) {
    console.error("Error reading customers:", getCustError);
    process.exit(1);
  }

  if (!existingCust) {
    const { data: newCust, error: insertCustError } = await supabase
      .from("customers")
      .insert({
        company_name: "Zenith Shipping Client",
        email: "customer@orbem.com",
        phone: "+1 (555) 901-2345",
        address: "456 Skyline Boulevard, Suite 100, Seattle, WA"
      })
      .select()
      .single();

    if (insertCustError) {
      console.error("Error inserting Zenith customer:", insertCustError);
      process.exit(1);
    }
    zenithCustomerId = newCust.id;
    console.log(`Customer 'Zenith Shipping Client' registered successfully with ID: ${zenithCustomerId}`);
  } else {
    zenithCustomerId = existingCust.id;
    console.log(`Customer 'Zenith Shipping Client' already exists with ID: ${zenithCustomerId}`);
  }


  // 2. Seed Cargo
  console.log("Checking if 'cargo' table requires seeding...");
  const { data: cargoList, error: cargoError } = await supabase.from("cargo").select("id").limit(1);
  if (cargoError) {
    console.error("Error reading cargo:", cargoError);
    process.exit(1);
  }

  let cargoIds = {};

  if (cargoList.length === 0) {
    console.log("Seeding cargo items...");
    
    // Zenith Cargo items
    const rawCargo = [
      {
        description: JSON.stringify({
          text: "Industrial Steel Pipes",
          weight: 8.5,
          quantity: 12,
          warehouse_zone: "Zone B",
          arrival_date: "2026-06-10"
        }),
        status: "stored",
        customer_id: zenithCustomerId
      },
      {
        description: JSON.stringify({
          text: "Lithium-Ion Battery Modules",
          weight: 2.3,
          quantity: 45,
          warehouse_zone: "Zone A",
          arrival_date: "2026-06-18"
        }),
        status: "in_transit",
        customer_id: zenithCustomerId
      },
      {
        description: JSON.stringify({
          text: "Precision Medical Instruments",
          weight: 0.6,
          quantity: 30,
          warehouse_zone: "Zone C",
          arrival_date: "2026-06-22"
        }),
        status: "stored",
        customer_id: zenithCustomerId
      },
      // ABC Cargo items
      {
        description: JSON.stringify({
          text: "Raw Coffee Beans",
          weight: 15.0,
          quantity: 150,
          warehouse_zone: "Zone D",
          arrival_date: "2026-06-12"
        }),
        status: "stored",
        customer_id: 1
      }
    ];

    const { data: insertedCargo, error: insertCargoError } = await supabase
      .from("cargo")
      .insert(rawCargo)
      .select();

    if (insertCargoError) {
      console.error("Error seeding cargo:", insertCargoError);
      process.exit(1);
    }
    
    console.log(`Seeded ${insertedCargo.length} cargo items.`);

    // Map by desc text to use for shipment linking
    insertedCargo.forEach(c => {
      try {
        const parsed = JSON.parse(c.description);
        cargoIds[parsed.text] = c.id;
      } catch (e) {
        cargoIds[c.description] = c.id;
      }
    });

  } else {
    console.log("Cargo table already has records. Skipping cargo seeding.");
    // Retrieve existing cargo IDs for mapping shipments (if cargo was already seeded)
    const { data: existingCargo } = await supabase.from("cargo").select("id, description");
    existingCargo?.forEach(c => {
      try {
        const parsed = JSON.parse(c.description);
        cargoIds[parsed.text] = c.id;
      } catch (e) {
        cargoIds[c.description] = c.id;
      }
    });
  }

  // 3. Seed Invoices
  console.log("Checking if 'invoices' table requires seeding...");
  const { data: invoiceList, error: invoiceError } = await supabase.from("invoices").select("id").limit(1);
  if (invoiceError) {
    console.error("Error reading invoices:", invoiceError);
    process.exit(1);
  }

  if (invoiceList.length === 0) {
    console.log("Seeding invoices...");
    const rawInvoices = [
      {
        invoice_number: "INV-ZN-2026-001",
        amount: 4500.00,
        due_date: "2026-07-15",
        customer_id: zenithCustomerId
      },
      {
        invoice_number: "INV-ZN-2026-002",
        amount: 1250.00,
        due_date: "2026-07-30",
        customer_id: zenithCustomerId
      },
      {
        invoice_number: "INV-ABC-2026-001",
        amount: 8200.00,
        due_date: "2026-07-10",
        customer_id: 1
      }
    ];

    const { data: insertedInvoices, error: insertInvoiceError } = await supabase
      .from("invoices")
      .insert(rawInvoices)
      .select();

    if (insertInvoiceError) {
      console.error("Error seeding invoices:", insertInvoiceError);
      process.exit(1);
    }
    console.log(`Seeded ${insertedInvoices.length} billing invoices.`);
  } else {
    console.log("Invoices table already has records. Skipping invoice seeding.");
  }

  // 4. Seed Shipments
  console.log("Checking if 'shipments' table requires seeding...");
  const { data: shipmentList, error: shipmentError } = await supabase.from("shipments").select("id").limit(1);
  if (shipmentError) {
    console.error("Error reading shipments:", shipmentError);
    process.exit(1);
  }

  if (shipmentList.length === 0) {
    console.log("Seeding shipments...");
    const rawShipments = [];

    // Let's check which cargo IDs we have mapped
    const batteryCargoId = cargoIds["Lithium-Ion Battery Modules"];
    const instrumentCargoId = cargoIds["Precision Medical Instruments"];
    const steelCargoId = cargoIds["Industrial Steel Pipes"];

    if (batteryCargoId) {
      rawShipments.push({
        status: "In Transit",
        origin: JSON.stringify({ address: "Boston Port, MA", carrier: "DHL Express" }),
        destination: JSON.stringify({ address: "JFK Airport, NY", tracking_id: "TRK-DHL-99281", carrier: "DHL Express" }),
        cargo_id: batteryCargoId
      });
    }

    if (instrumentCargoId) {
      rawShipments.push({
        status: "Pending",
        origin: JSON.stringify({ address: "Seattle Port, WA", carrier: "FedEx Freight" }),
        destination: JSON.stringify({ address: "O'Hare Airport, Chicago, IL", tracking_id: "TRK-FDX-11283", carrier: "FedEx Freight" }),
        cargo_id: instrumentCargoId
      });
    }

    if (steelCargoId) {
      rawShipments.push({
        status: "Delivered",
        origin: JSON.stringify({ address: "Oakland Terminal, CA", carrier: "Maersk Logistics" }),
        destination: JSON.stringify({ address: "Seattle Warehouse, WA", tracking_id: "TRK-MSK-55610", carrier: "Maersk Logistics" }),
        cargo_id: steelCargoId
      });
    }

    if (rawShipments.length > 0) {
      const { data: insertedShipments, error: insertShipmentError } = await supabase
        .from("shipments")
        .insert(rawShipments)
        .select();

      if (insertShipmentError) {
        console.error("Error seeding shipments:", insertShipmentError);
        process.exit(1);
      }
      console.log(`Seeded ${insertedShipments.length} courier shipments.`);
    } else {
      console.warn("No cargo matching descriptions for shipments seeding. Skipping.");
    }
  } else {
    console.log("Shipments table already has records. Skipping shipment seeding.");
  }

  console.log("Database seeding completed successfully!");
}

seed();
