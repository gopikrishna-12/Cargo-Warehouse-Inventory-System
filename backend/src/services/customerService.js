import { customerRepository } from "../repositories/customerRepository.js";
import { auditService } from "./auditService.js";

export const customerService = {
  async getCustomers({ search }) {
    return await customerRepository.findAll({ search });
  },

  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new Error("Customer record not found.");
    return customer;
  },

  async createCustomer(customerData, requestedByUser) {
    const customer = await customerRepository.create(customerData);

    await auditService.log({
      userId: requestedByUser,
      action: `Registered Customer: ${customer.company_name}`,
      entityName: "customers",
      entityId: customer.id,
      newValue: customer
    });

    return customer;
  },

  async updateCustomer(id, customerData, requestedByUser) {
    const oldCustomer = await customerRepository.findById(id);
    if (!oldCustomer) throw new Error("Customer record not found.");

    const updatedCustomer = await customerRepository.update(id, customerData);

    await auditService.log({
      userId: requestedByUser,
      action: `Updated Customer Profile: ${updatedCustomer.company_name}`,
      entityName: "customers",
      entityId: id,
      previousValue: oldCustomer,
      newValue: updatedCustomer
    });

    return updatedCustomer;
  },

  async deleteCustomer(id, requestedByUser) {
    const oldCustomer = await customerRepository.findById(id);
    if (!oldCustomer) throw new Error("Customer record not found.");

    await customerRepository.delete(id);

    await auditService.log({
      userId: requestedByUser,
      action: `Deleted Customer: ${oldCustomer.company_name}`,
      entityName: "customers",
      entityId: id,
      previousValue: oldCustomer
    });

    return true;
  },

  async getCustomerHistory(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new Error("Customer not found.");

    const cargoHistory = await customerRepository.findCargoHistory(id);
    const invoiceHistory = await customerRepository.findInvoiceHistory(id);

    return {
      customer,
      cargoHistory,
      invoiceHistory
    };
  },

  async createInvoice(customerId, invoiceData, requestedByUser) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new Error("Customer not found.");

    const generatedNumber = "INV-" + Math.floor(100000 + Math.random() * 900000);
    const fullInvoiceData = {
      invoice_number: generatedNumber,
      amount: parseFloat(invoiceData.amount),
      due_date: invoiceData.due_date,
      customer_id: customerId
    };

    const invoice = await customerRepository.createInvoice(fullInvoiceData);

    await auditService.log({
      userId: requestedByUser,
      action: `Billed ${customer.company_name}: ${generatedNumber} for $${invoiceData.amount}`,
      entityName: "invoices",
      entityId: invoice.id,
      newValue: invoice
    });

    return invoice;
  }
};
