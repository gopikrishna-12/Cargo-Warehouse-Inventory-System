import { shipmentRepository } from "../repositories/shipmentRepository.js";
import { cargoRepository } from "../repositories/cargoRepository.js";
import { auditService } from "./auditService.js";

export const shipmentService = {
  async getShipments({ search, status, userEmail, userRole }) {
    return await shipmentRepository.findAll({ search, status, userEmail, userRole });
  },

  async getShipmentById(id) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw new Error("Shipment tracking not found.");
    return shipment;
  },

  async createShipment(shipmentData, requestedByUser) {
    const shipment = await shipmentRepository.create(shipmentData);

    // Sync linked cargo status
    if (shipment.status !== "Pending" && shipment.cargo_id) {
      const cargoStatus = shipment.status === "Delivered" ? "Delivered" : "Dispatched";
      await cargoRepository.update(shipment.cargo_id, { status: cargoStatus });
    }

    // Parse destination to get tracking ID
    let trackingId = "";
    let carrier = "";
    try {
      const destParsed = JSON.parse(shipment.destination);
      trackingId = destParsed.tracking_id || "";
      carrier = destParsed.carrier || "";
    } catch (e) {
      trackingId = shipment.id;
    }

    await auditService.log({
      userId: requestedByUser,
      action: `Shipment Dispatched: ${trackingId} via ${carrier || "fleet"}`,
      entityName: "shipments",
      entityId: shipment.id,
      newValue: shipment
    });

    return shipment;
  },

  async updateShipment(id, shipmentData, requestedByUser) {
    const oldShipment = await shipmentRepository.findById(id);
    if (!oldShipment) throw new Error("Shipment record not found.");

    const updatedShipment = await shipmentRepository.update(id, shipmentData);

    // Sync cargo status
    if (updatedShipment.cargo_id) {
      let cargoStatus = "Ready for Dispatch";
      if (updatedShipment.status === "Delivered") {
        cargoStatus = "Delivered";
      } else if (updatedShipment.status === "In Transit") {
        cargoStatus = "Dispatched";
      }
      await cargoRepository.update(updatedShipment.cargo_id, { status: cargoStatus });
    }

    let trackingId = "";
    try {
      const destParsed = JSON.parse(updatedShipment.destination);
      trackingId = destParsed.tracking_id || "";
    } catch (e) {
      trackingId = id;
    }

    await auditService.log({
      userId: requestedByUser,
      action: `Updated Shipment tracking: ${trackingId}`,
      entityName: "shipments",
      entityId: id,
      previousValue: oldShipment,
      newValue: updatedShipment
    });

    return updatedShipment;
  },

  async deleteShipment(id, requestedByUser) {
    const oldShipment = await shipmentRepository.findById(id);
    if (!oldShipment) throw new Error("Shipment record not found.");

    await shipmentRepository.delete(id);

    await auditService.log({
      userId: requestedByUser,
      action: `Decommissioned Shipment Ref: ${id.slice(0, 8).toUpperCase()}`,
      entityName: "shipments",
      entityId: id,
      previousValue: oldShipment
    });

    return true;
  }
};
