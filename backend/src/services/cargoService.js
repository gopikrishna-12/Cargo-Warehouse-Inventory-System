import { cargoRepository } from "../repositories/cargoRepository.js";
import { auditService } from "./auditService.js";

export const cargoService = {
  async getCargoList({ search, status }) {
    return await cargoRepository.findAll({ search, status });
  },

  async getCargoById(id) {
    const cargo = await cargoRepository.findById(id);
    if (!cargo) throw new Error("Cargo record not found.");
    return cargo;
  },

  async createCargo(cargoData, requestedByUser) {
    const cargo = await cargoRepository.create(cargoData);
    
    // Parse description for readable log action
    let descText = "";
    try {
      const parsed = JSON.parse(cargo.description);
      descText = parsed.text || parsed.description || "";
    } catch (e) {
      descText = cargo.description;
    }

    await auditService.log({
      userId: requestedByUser,
      action: `Cargo Intake Scanned: ${descText.slice(0, 30)}`,
      entityName: "cargo",
      entityId: cargo.id,
      newValue: cargo
    });

    return cargo;
  },

  async updateCargo(id, cargoData, requestedByUser) {
    const oldCargo = await cargoRepository.findById(id);
    if (!oldCargo) throw new Error("Cargo record not found.");

    const updatedCargo = await cargoRepository.update(id, cargoData);

    // Calculate diff
    let oldDesc = oldCargo.description;
    let newDesc = updatedCargo.description;
    try {
      const p1 = JSON.parse(oldCargo.description);
      const p2 = JSON.parse(updatedCargo.description);
      oldDesc = p1.text || p1.description || oldCargo.description;
      newDesc = p2.text || p2.description || updatedCargo.description;
    } catch (e) {}

    await auditService.log({
      userId: requestedByUser,
      action: `Cargo Upgraded: ${String(id).slice(0, 8).toUpperCase()} (${oldDesc} -> ${newDesc})`,
      entityName: "cargo",
      entityId: id,
      previousValue: oldCargo,
      newValue: updatedCargo
    });

    return updatedCargo;
  },

  async deleteCargo(id, requestedByUser) {
    const oldCargo = await cargoRepository.findById(id);
    if (!oldCargo) throw new Error("Cargo record not found.");

    try {
      await cargoRepository.delete(id);
    } catch (error) {
      if (error.code === "23503") {
        const errorText = `${error.message || ""} ${error.details || ""}`.toLowerCase();
        if (errorText.includes("shipments")) {
          throw new Error("Cannot delete cargo because it is currently linked to one or more active shipments.");
        } else if (errorText.includes("documents")) {
          throw new Error("Cannot delete cargo because it has associated documents in the repository.");
        } else {
          throw new Error("Cannot delete cargo because it is referenced by other system records.");
        }
      }
      throw error;
    }

    let descText = "";
    try {
      const parsed = JSON.parse(oldCargo.description);
      descText = parsed.text || parsed.description || "";
    } catch (e) {
      descText = oldCargo.description;
    }

    await auditService.log({
      userId: requestedByUser,
      action: `Decommissioned Cargo ID: ${String(id).slice(0, 8).toUpperCase()} (${descText})`,
      entityName: "cargo",
      entityId: id,
      previousValue: oldCargo
    });

    return true;
  }
};
