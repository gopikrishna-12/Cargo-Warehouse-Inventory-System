import { supabase } from "../config/database/supabaseClient.js";

export const chatService = {
  async askAI({ message, userEmail, userRole }) {
    // 1. Retrieve the corresponding customer profile from database
    let customer = null;
    
    // Look up customer by email
    const { data: searchCust, error: custErr } = await supabase
      .from("customers")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();
      
    if (custErr) {
      console.error("Supabase customer lookup error:", custErr);
    }

    if (searchCust) {
      customer = searchCust;
    } else {
      // Fallback: If logged in user is Admin/Staff (who doesn't have a customer record),
      // look up the Zenith Shipping Client (email: customer@orbem.com) so they can test.
      const { data: zenithCust } = await supabase
        .from("customers")
        .select("*")
        .eq("email", "customer@orbem.com")
        .maybeSingle();
        
      if (zenithCust) {
        customer = zenithCust;
      } else {
        // Fallback to first available customer in database
        const { data: allCusts } = await supabase
          .from("customers")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1);
          
        if (allCusts && allCusts.length > 0) {
          customer = allCusts[0];
        }
      }
    }

    // If no customer details found in database, return general message
    if (!customer) {
      return "Hello! I am your ORBEM AI Assistant. I couldn't find any registered customer accounts linked to your profile in the database. Please contact system administrators to register your company client profile.";
    }

    // 2. Fetch all associated cargo, invoices, and shipments for this customer
    const [cargoRes, invoicesRes, shipmentsRes] = await Promise.all([
      supabase.from("cargo").select("*").eq("customer_id", customer.id),
      supabase.from("invoices").select("*").eq("customer_id", customer.id),
      supabase.from("shipments").select(`
        *,
        cargo (
          id,
          description,
          customer_id
        )
      `)
    ]);

    const cargo = cargoRes.data || [];
    const invoices = invoicesRes.data || [];
    const allShipments = shipmentsRes.data || [];
    const shipments = allShipments.filter(s => s.cargo?.customer_id === customer.id);

    // 3. Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY") {
      try {
        // Call official Google Gemini API using native fetch
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `System context: You are ORBEM AI, the WMS customer assistant. Help the customer with their questions.
Customer Profile:
- Company Name: ${customer.company_name}
- Email: ${customer.email}
- Contact Phone: ${customer.phone || "N/A"}
- Address: ${customer.address || "N/A"}

Customer Cargo (${cargo.length} items):
${JSON.stringify(cargo.map(c => {
  let desc = c.description;
  try { desc = JSON.parse(c.description); } catch(e){}
  return { id: c.id, details: desc, status: c.status, created_at: c.created_at };
}), null, 2)}

Customer Invoices (${invoices.length} items):
${JSON.stringify(invoices.map(i => ({ invoice_number: i.invoice_number, amount: i.amount, due_date: i.due_date })), null, 2)}

Customer Shipments (${shipments.length} items):
${JSON.stringify(shipments.map(s => {
  let origin = s.origin;
  let destination = s.destination;
  try { origin = JSON.parse(s.origin); } catch(e){}
  try { destination = JSON.parse(s.destination); } catch(e){}
  return { id: s.id, origin, destination, status: s.status, cargo_description: s.cargo?.description };
}), null, 2)}

Instructions:
1. Answer the user's query clearly.
2. Use markdown bullet points, bold text, or tables to format your response.
3. Be specific: mention tracking IDs, invoice numbers, amounts, and cargo names from the data.
4. If no records exist, politely mention it.
5. Keep answers professional and brief.
6. If the customer asks to download, print, or generate a report, invoice summary, or cargo manifest, include the exact token "[DOWNLOAD_REPORT_BUTTON]" in your response so the user can trigger it.

User Query: "${message}"`
                    }
                  ]
                }
              ]
            })
          }
        );

        const resData = await response.json();
        if (resData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return resData.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.error("Gemini API Error, falling back to local simulation:", err.message);
      }
    }

    // 4. Local Simulation Fallback Mode
    const query = message.toLowerCase();
    
    // Greeting
    if (query.match(/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/)) {
      return `Hello! Welcome to the **ORBEM AI Chat Assistant**. 
I have fetched your company profile (**${customer.company_name}**). 

Here are some quick things you can ask me:
* **Cargo**: "Give me a summary of my stocked cargo"
* **Shipments**: "Show the status of my deliveries"
* **Invoices**: "Are there any billing invoices due?"

How can I help you today?`;
    }

    // Cargo keywords
    if (query.includes("cargo") || query.includes("stock") || query.includes("inventory") || query.includes("item") || query.includes("warehous")) {
      if (cargo.length === 0) {
        return `I checked our WMS records and found **no stocked cargo items** for **${customer.company_name}**. If you recently sent cargo, it may still be in the intake queue.`;
      }
      
      let reply = `### Cargo Inventory Summary for **${customer.company_name}**\n\n`;
      reply += `I found **${cargo.length} cargo item(s)** registered in our system:\n\n`;
      reply += `| Cargo Item | Weight | Qty | Warehouse Zone | Storage Status |\n`;
      reply += `| :--- | :---: | :---: | :---: | :---: |\n`;
      
      cargo.forEach(c => {
        let details = { description: "Logistics Package", weight: 0, quantity: 0, warehouse_zone: "Zone A" };
        try {
          details = JSON.parse(c.description);
        } catch (e) {
          details.description = c.description;
        }
        
        const name = details.text || details.description || "Cargo Item";
        const weight = details.weight ? `${details.weight} Tons` : "N/A";
        const qty = details.quantity || 1;
        const zone = details.warehouse_zone || "N/A";
        const status = c.status ? c.status.toUpperCase() : "PENDING";
        
        reply += `| **${name}** | ${weight} | ${qty} | ${zone} | \`${status}\` |\n`;
      });
      
      return reply;
    }

    // Shipment keywords
    if (query.includes("shipment") || query.includes("track") || query.includes("route") || query.includes("deliver") || query.includes("transit") || query.includes("carrier")) {
      if (shipments.length === 0) {
        return `I checked our dispatch ledger and found **no shipments** currently active or completed for **${customer.company_name}**.`;
      }
      
      let reply = `### Transit & Dispatch Shipments for **${customer.company_name}**\n\n`;
      reply += `There are **${shipments.length} shipment(s)** linked to your account:\n\n`;
      
      shipments.forEach(s => {
        let originAddress = "Origin Port";
        let destAddress = "Destination Address";
        let trackingId = "N/A";
        let carrier = "DHL/FedEx";
        
        try { originAddress = JSON.parse(s.origin).address || s.origin; } catch (e) { originAddress = s.origin; }
        try {
          const destParsed = JSON.parse(s.destination);
          destAddress = destParsed.address || s.destination;
          trackingId = destParsed.tracking_id || "N/A";
          carrier = destParsed.carrier || "N/A";
        } catch (e) {
          destAddress = s.destination;
        }
        
        let cargoDesc = "Logistics Cargo";
        try {
          const cargoParsed = JSON.parse(s.cargo?.description);
          cargoDesc = cargoParsed.text || cargoParsed.description;
        } catch (e) {
          cargoDesc = s.cargo?.description || cargoDesc;
        }

        reply += `* **Shipment Reference**: \`${String(s.id).slice(0, 8).toUpperCase()}\`\n`;
        reply += `  * **Cargo Content**: ${cargoDesc}\n`;
        reply += `  * **Route**: ${originAddress} ➔ **${destAddress}**\n`;
        reply += `  * **Carrier / Tracking**: ${carrier} (Tracking: \`${trackingId}\`)\n`;
        reply += `  * **Current Status**: **${s.status.toUpperCase()}**\n\n`;
      });
      
      return reply;
    }

    // Report or Manifest keywords
    if (query.includes("report") || query.includes("manifest") || query.includes("download") || query.includes("print")) {
      return `Here is your official ORBEM Logistics WMS Manifest Report. 
You can view, save, or print a professional PDF version of your cargo inventory, courier shipments, and outstanding billings ledger below:

[DOWNLOAD_REPORT_BUTTON]`;
    }

    // Invoice keywords
    if (query.includes("invoice") || query.includes("billing") || query.includes("unpaid") || query.includes("pay") || query.includes("due") || query.includes("money") || query.includes("fee") || query.includes("charge")) {
      if (invoices.length === 0) {
        return `I found **no outstanding invoices** or billing charges on file for **${customer.company_name}**. Your account is currently in good standing!`;
      }
      
      let totalAmount = 0;
      let reply = `### Invoice & Billings Summary for **${customer.company_name}**\n\n`;
      reply += `I retrieved **${invoices.length} invoice receipt(s)** from our ledger:\n\n`;
      reply += `| Invoice No. | Amount Due | Due Date | Status |\n`;
      reply += `| :--- | :---: | :---: | :---: |\n`;
      
      invoices.forEach(i => {
        totalAmount += i.amount;
        const formattedAmount = `$${i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const dueDate = new Date(i.due_date).toLocaleDateString();
        reply += `| **${i.invoice_number}** | ${formattedAmount} | ${dueDate} | \`UNPAID\` |\n`;
      });
      
      reply += `\n**Total Billed Balance**: **$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n\n*Please ensure payments are wired by the respective due dates to prevent shipping holds.*`;
      return reply;
    }

    // Profile keywords
    if (query.includes("profile") || query.includes("my company") || query.includes("about me") || query.includes("who am i")) {
      return `### Account Profile for **${customer.company_name}**
* **Registered Email**: ${customer.email}
* **Contact Phone**: ${customer.phone || "N/A"}
* **Billing Address**: ${customer.address || "N/A"}
* **Customer Account ID**: \`${customer.id}\`
* **WMS Database Entry**: ${new Date(customer.created_at).toLocaleDateString()}`;
    }

    // Help or fallback
    return `Hello! I am the **ORBEM AI Chat Assistant** (running in *Local Simulation Mode*). 

I have loaded your customer profile for **${customer.company_name}** and can query your specific cargo and transit logs. I didn't quite catch your query, but here is what you can ask me:

1. 📦 **Cargo Inventory**: "What is in my cargo inventory?" or "Summarize my stocked cargo."
2. 🚚 **Shipment Tracking**: "Show the status of my shipments" or "Where is my cargo going?"
3. 💳 **Billings & Invoices**: "How many invoices do I have?" or "What is my total outstanding balance?"
4. 🏢 **Profile Info**: "Show my account profile."

*(Note: To enable advanced conversational questions, ask your administrator to configure a \`GEMINI_API_KEY\` in the backend environment).*`;
  }
};
