import { supabase } from "../config/database/supabaseClient.js";

function isValidUuid(str) {
  if (typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const auditService = {
  async log({ userId, action, entityName, entityId, previousValue, newValue }) {
    try {
      // 1. Resolve user_id: must be a valid UUID for the database column type
      let dbUserId = null;
      if (userId && isValidUuid(userId)) {
        dbUserId = userId;
      }

      // 2. Resolve entity_id: must be a numeric integer for the bigint column type
      let dbEntityId = null;
      if (entityId) {
        if (typeof entityId === "number") {
          dbEntityId = entityId;
        } else if (typeof entityId === "string") {
          const cleanDigits = entityId.replace(/\D/g, "");
          if (cleanDigits) {
            dbEntityId = parseInt(cleanDigits, 10);
          }
        }
      }

      if (dbEntityId && isNaN(dbEntityId)) {
        dbEntityId = null;
      }

      // Serialize previous and new values if they exist, and append to the action text
      // to keep it within the database schema fields.
      let detailedAction = action;
      if (previousValue || newValue) {
        const diff = {};
        if (previousValue) diff.old = previousValue;
        if (newValue) diff.new = newValue;
        detailedAction = `${action} | Diff: ${JSON.stringify(diff)}`;
      }

      const { error } = await supabase
        .from("activity_logs")
        .insert({
          user_id: dbUserId,
          action: detailedAction,
          entity_name: entityName || null,
          entity_id: dbEntityId
        });

      if (error) {
        console.error("Audit log failed to write to database:", error.message);
      }
    } catch (err) {
      console.error("Error writing audit log:", err.message);
    }
  }
};
