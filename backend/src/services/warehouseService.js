import { warehouseRepository } from "../repositories/warehouseRepository.js";
import { auditService } from "./auditService.js";

export const warehouseService = {
  async getWarehouses() {
    return await warehouseRepository.findAll();
  },

  async getWarehouseById(id) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) throw new Error("Warehouse zone not found.");
    return warehouse;
  },

  async createWarehouse(warehouseData, requestedByUser) {
    const warehouse = await warehouseRepository.create(warehouseData);

    await auditService.log({
      userId: requestedByUser,
      action: `Added Warehouse Zone: ${warehouse.address.slice(0, 30)}`,
      entityName: "warehouses",
      entityId: warehouse.id,
      newValue: warehouse
    });

    return warehouse;
  },

  async updateWarehouse(id, warehouseData, requestedByUser) {
    const oldWarehouse = await warehouseRepository.findById(id);
    if (!oldWarehouse) throw new Error("Warehouse zone not found.");

    const updatedWarehouse = await warehouseRepository.update(id, warehouseData);

    await auditService.log({
      userId: requestedByUser,
      action: `Modified Warehouse Zone ID: ${id.slice(0, 8).toUpperCase()}`,
      entityName: "warehouses",
      entityId: id,
      previousValue: oldWarehouse,
      newValue: updatedWarehouse
    });

    return updatedWarehouse;
  },

  async deleteWarehouse(id, requestedByUser) {
    const oldWarehouse = await warehouseRepository.findById(id);
    if (!oldWarehouse) throw new Error("Warehouse zone not found.");

    await warehouseRepository.delete(id);

    await auditService.log({
      userId: requestedByUser,
      action: `Deleted Warehouse ID: ${id.slice(0, 8).toUpperCase()}`,
      entityName: "warehouses",
      entityId: id,
      previousValue: oldWarehouse
    });

    return true;
  }
};
