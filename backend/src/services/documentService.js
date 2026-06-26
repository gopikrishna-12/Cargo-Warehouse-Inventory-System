import { documentRepository } from "../repositories/documentRepository.js";
import { auditService } from "./auditService.js";

export const documentService = {
  async getDocuments({ search, userEmail, userRole }) {
    return await documentRepository.findAll({ search, userEmail, userRole });
  },

  async createDocument(documentData, requestedByUser) {
    const document = await documentRepository.create(documentData);

    // Extract title
    let title = "";
    let type = "";
    try {
      const parsed = new URL(document.file_url);
      type = parsed.searchParams.get("type") || "Manifest";
      title = parsed.searchParams.get("title") || "Cargo_Certificate.pdf";
    } catch (e) {
      if (document.file_url && document.file_url.includes("?")) {
        const parts = document.file_url.split("?");
        const params = new URLSearchParams(parts[1]);
        type = params.get("type") || "Manifest";
        title = params.get("title") || parts[0].split("/").pop() || "Document.pdf";
      } else {
        type = "Manifest";
        title = document.file_url ? document.file_url.split("/").pop() : "document.pdf";
      }
    }

    await auditService.log({
      userId: requestedByUser,
      action: `Uploaded ${type}: ${title.slice(0, 30)}`,
      entityName: "documents",
      entityId: document.id,
      newValue: document
    });

    return document;
  },

  async deleteDocument(id, requestedByUser) {
    const oldDocument = await documentRepository.findById(id);
    if (!oldDocument) throw new Error("Document link not found.");

    await documentRepository.delete(id);

    // Parse title
    let title = "";
    try {
      const parsed = new URL(oldDocument.file_url);
      title = parsed.searchParams.get("title") || "Document.pdf";
    } catch (e) {
      if (oldDocument.file_url && oldDocument.file_url.includes("?")) {
        const parts = oldDocument.file_url.split("?");
        const params = new URLSearchParams(parts[1]);
        title = params.get("title") || parts[0].split("/").pop() || "Document.pdf";
      } else {
        title = oldDocument.file_url ? oldDocument.file_url.split("/").pop() : "document.pdf";
      }
    }

    await auditService.log({
      userId: requestedByUser,
      action: `Removed Document Reference: ${title.slice(0, 30)}`,
      entityName: "documents",
      entityId: id,
      previousValue: oldDocument
    });

    return true;
  }
};
