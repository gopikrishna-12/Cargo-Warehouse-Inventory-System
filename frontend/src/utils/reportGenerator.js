export function generateOrbemReport(customer, cargoList = [], shipmentList = [], invoiceList = []) {
  const reportId = "ORB-" + Math.floor(100000 + Math.random() * 900000);
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  let activeCustomer = customer;
  if (!activeCustomer) {
    activeCustomer = {
      id: null,
      company_name: "ORBEM Logistics Client",
      email: "client@orbem.com",
      address: "WMS Client Destination"
    };
  }

  // Resolve customer profile mapping for user role
  const resolvedCustomer = {
    id: activeCustomer.id,
    company_name: activeCustomer.company_name || activeCustomer.name || "ORBEM Logistics Client",
    email: activeCustomer.email || "client@orbem.com",
    address: activeCustomer.address || "WMS Client Destination"
  };

  // If activeCustomer has user format (e.g. from users.json, email customer@orbem.com)
  // scan cargoList, shipmentList, or invoiceList to extract the true database customer ID and details
  let dbCustomer = null;
  if (cargoList && cargoList.length > 0) {
    const cargoWithCust = cargoList.find(c => c.customers && c.customers.company_name);
    if (cargoWithCust) {
      dbCustomer = {
        id: cargoWithCust.customer_id,
        company_name: cargoWithCust.customers.company_name,
        address: cargoWithCust.customers.address
      };
    }
  }

  if (!dbCustomer && shipmentList && shipmentList.length > 0) {
    const shipmentWithCust = shipmentList.find(s => s.cargo?.customers && s.cargo.customers.company_name);
    if (shipmentWithCust) {
      dbCustomer = {
        id: shipmentWithCust.cargo.customer_id,
        company_name: shipmentWithCust.cargo.customers.company_name,
        address: shipmentWithCust.cargo.customers.address
      };
    }
  }

  if (!dbCustomer && invoiceList && invoiceList.length > 0) {
    const invoiceWithCust = invoiceList.find(i => i.customers && i.customers.company_name);
    if (invoiceWithCust) {
      dbCustomer = {
        id: invoiceWithCust.customer_id,
        company_name: invoiceWithCust.customers.company_name,
        address: invoiceWithCust.customers.address
      };
    }
  }

  if (dbCustomer) {
    resolvedCustomer.id = dbCustomer.id;
    resolvedCustomer.company_name = dbCustomer.company_name;
    if (dbCustomer.address) resolvedCustomer.address = dbCustomer.address;
  }

  activeCustomer = resolvedCustomer;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download/print the official WMS manifest report.");
    return;
  }

  // Filter cargo for this customer if needed
  const customerCargo = cargoList.filter(c => c.customer_id === activeCustomer.id || !c.customer_id);
  
  // Parse description for cargo
  const parseCargoDesc = (raw) => {
    try {
      const data = JSON.parse(raw);
      return {
        description: data.text || data.description || "Logistics Package",
        weight: data.weight || 0,
        quantity: data.quantity || 0,
        warehouse_zone: data.warehouse_zone || "N/A",
        arrival_date: data.arrival_date || "N/A"
      };
    } catch (e) {
      return {
        description: raw || "Logistics Package",
        weight: 0,
        quantity: 0,
        warehouse_zone: "N/A",
        arrival_date: "N/A"
      };
    }
  };

  const parsedCargo = customerCargo.map(c => ({
    id: c.id,
    status: c.status || "stored",
    ...parseCargoDesc(c.description)
  }));

  const customerInvoices = invoiceList.filter(i => i.customer_id === activeCustomer.id);
  const customerShipments = shipmentList.filter(s => s.cargo?.customer_id === activeCustomer.id || s.cargo_id && parsedCargo.some(pc => pc.id === s.cargo_id));

  const totalBilled = customerInvoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const cargoRows = parsedCargo.length > 0 
    ? parsedCargo.map(c => `
      <tr>
        <td><strong>#${String(c.id).slice(0, 8).toUpperCase()}</strong></td>
        <td>${c.description}</td>
        <td>${c.weight} Tons</td>
        <td>${c.quantity} Units</td>
        <td>${c.warehouse_zone}</td>
        <td><span class="status-badge status-${c.status.toLowerCase()}">${c.status.toUpperCase()}</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="6" class="text-center text-muted">No cargo records found.</td></tr>`;

  const shipmentRows = customerShipments.length > 0
    ? customerShipments.map(s => {
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

        let desc = "Cargo Asset";
        try {
          const p = JSON.parse(s.cargo?.description);
          desc = p.text || p.description;
        } catch (e) {
          desc = s.cargo?.description || desc;
        }

        return `
          <tr>
            <td><strong>#${String(s.id).slice(0, 8).toUpperCase()}</strong></td>
            <td>${desc}</td>
            <td>${originAddress} &rarr; ${destAddress}</td>
            <td>${carrier} (<code class="tracking">${trackingId}</code>)</td>
            <td><span class="status-badge status-${s.status.toLowerCase().replace(" ", "-")}">${s.status.toUpperCase()}</span></td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="5" class="text-center text-muted">No shipment dispatches found.</td></tr>`;

  const invoiceRows = customerInvoices.length > 0
    ? customerInvoices.map(i => `
      <tr>
        <td><strong>${i.invoice_number}</strong></td>
        <td>$${i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td>${new Date(i.due_date).toLocaleDateString()}</td>
        <td><span class="status-badge status-unpaid">UNPAID</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="text-center text-muted">No billings or outstanding invoices found.</td></tr>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Orbem Logistics - WMS Manifest Report</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          background: #ffffff;
          padding: 40px;
          line-height: 1.5;
          font-size: 12px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        
        /* Corporate Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-box {
          width: 36px;
          height: 36px;
          background: #2563eb;
          border-radius: 8px;
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-inner {
          width: 14px;
          height: 14px;
          border: 2px solid #ffffff;
          border-radius: 2px;
          transform: rotate(-45deg);
        }
        .brand-name {
          font-weight: 800;
          font-size: 18px;
          letter-spacing: 0.05em;
          color: #0f172a;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 9px;
          color: #64748b;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          margin-top: 2px;
        }
        .manifest-title-section {
          text-align: right;
        }
        .manifest-title {
          font-size: 20px;
          font-weight: 800;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .meta-text {
          color: #64748b;
          font-size: 10px;
          margin-top: 4px;
          font-family: monospace;
        }

        /* Profile details */
        .profile-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .profile-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .profile-value {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }
        .profile-subvalue {
          font-size: 11px;
          color: #475569;
          margin-top: 2px;
        }

        /* Metrics summary widgets */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .metric-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 15px;
          text-align: center;
          background: #ffffff;
        }
        .metric-label {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.05em;
        }
        .metric-val {
          font-size: 18px;
          font-weight: 800;
          color: #2563eb;
          margin-top: 5px;
        }

        /* Tables styles */
        .section-header {
          font-size: 13px;
          font-weight: 800;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          border-left: 3px solid #2563eb;
          padding-left: 10px;
          margin-top: 25px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        th, td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9px;
          color: #475569;
          letter-spacing: 0.03em;
        }
        td {
          font-size: 11px;
          color: #334155;
        }
        tr:nth-child(even) td {
          background: #f8fafc/50;
        }
        .text-center {
          text-align: center;
        }
        .text-muted {
          color: #94a3b8;
        }
        
        /* Badges */
        .status-badge {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 3px 6px;
          border-radius: 4px;
          letter-spacing: 0.03em;
          display: inline-block;
        }
        .status-stored, .status-delivered {
          background: #dcfce7;
          color: #15803d;
        }
        .status-in_transit, .status-in-transit {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .status-pending {
          background: #fef9c3;
          color: #854d0e;
        }
        .status-unpaid {
          background: #fee2e2;
          color: #b91c1c;
        }
        .tracking {
          font-family: monospace;
          background: #f1f5f9;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 10px;
        }

        /* Signatures and print styles */
        .footer-note {
          margin-top: 40px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          color: #64748b;
          font-size: 9px;
          text-align: center;
          line-height: 1.6;
        }
        .seal-block {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding: 0 10px;
        }
        .signature-line {
          width: 200px;
          border-top: 1px dashed #94a3b8;
          margin-top: 45px;
          text-align: center;
          font-size: 10px;
          color: #64748b;
          padding-top: 5px;
        }

        @media print {
          body {
            padding: 20px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo-box">
              <div class="logo-inner"></div>
            </div>
            <div>
              <div class="brand-name">Orbem Logistics</div>
              <div class="brand-sub">WMS Client Portal</div>
            </div>
          </div>
          <div class="manifest-title-section">
            <div class="manifest-title">WMS Manifest Report</div>
            <div class="meta-text">REF ID: ${reportId}</div>
            <div class="meta-text">ISSUED: ${currentDate}</div>
          </div>
        </div>

        <!-- Profile details -->
        <div class="profile-card">
          <div>
            <div class="profile-title">Shipment Consignee / Client</div>
            <div class="profile-value">${activeCustomer.company_name}</div>
            <div class="profile-subvalue">${activeCustomer.address || "No address on file."}</div>
            <div class="profile-subvalue">Email: ${activeCustomer.email}</div>
          </div>
          <div style="text-align: right;">
            <div class="profile-title">WMS Facility Provider</div>
            <div class="profile-value">Orbem Solutions Ltd.</div>
            <div class="profile-subvalue">Orbem North-Zone Warehouse Center</div>
            <div class="profile-subvalue">Seattle, WA 98101</div>
            <div class="profile-subvalue">support@orbem.com</div>
          </div>
        </div>

        <!-- Metrics summary widgets -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Stocked Cargo</div>
            <div class="metric-val">${parsedCargo.length} Packages</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Active Shipment Routes</div>
            <div class="metric-val">${customerShipments.filter(s => ["in transit", "pending"].includes(s.status.toLowerCase())).length} Active</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Outstanding Invoices Balance</div>
            <div class="metric-val">$${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <!-- Cargo Table -->
        <div class="section-header">Stocked Cargo Inventory Ledger</div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%">Cargo ID</th>
              <th>Description</th>
              <th style="width: 15%">Weight</th>
              <th style="width: 15%">Quantity</th>
              <th style="width: 15%">Location</th>
              <th style="width: 15%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${cargoRows}
          </tbody>
        </table>

        <!-- Shipments Table -->
        <div class="section-header">Active Couriers & Dispatches</div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%">Shipment ID</th>
              <th style="width: 25%">Cargo Description</th>
              <th>Routing details</th>
              <th style="width: 25%">Carrier / Tracking</th>
              <th style="width: 15%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${shipmentRows}
          </tbody>
        </table>

        <!-- Invoices Table -->
        <div class="section-header">Financial Ledger & Invoices</div>
        <table>
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Billed Amount</th>
              <th>Payment Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows}
          </tbody>
        </table>

        <!-- Seal and signatures -->
        <div class="seal-block">
          <div class="signature-line">
            Authorized WMS Scanner / Agent
          </div>
          <div class="signature-line">
            Client Representative Signature
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-note">
          This is a system-generated official manifest report by ORBEM Logistics WMS. 
          All records match exact barcode intake logs and GPS tracking scans registered in the database. 
          For billing questions or logistics inquiries, please contact ops@orbem.com.
        </div>

      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
