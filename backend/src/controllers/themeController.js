import { themeService } from "../services/themeService.js";
import { supabase } from "../config/database/supabaseClient.js";

export const themeController = {
  getTheme(req, res, next) {
    try {
      const email = req.user.email;
      const theme = themeService.getTheme(email);
      return res.status(200).json({ theme });
    } catch (error) {
      next(error);
    }
  },

  async setTheme(req, res, next) {
    try {
      const { theme } = req.body;
      if (theme !== "light" && theme !== "dark") {
        return res.status(400).json({ error: "Theme must be either 'light' or 'dark'." });
      }
      const updatedTheme = await themeService.setTheme(req.user.email, theme, req.user.email);
      return res.status(200).json({ theme: updatedTheme });
    } catch (error) {
      next(error);
    }
  },

  async getNotifications(req, res, next) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (error) {
      next(error);
    }
  },

  async markNotificationsRead(req, res, next) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(200).json({ message: "No notifications to mark read." });
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);

      if (error) throw error;
      return res.status(200).json({ message: "Notifications marked read." });
    } catch (error) {
      next(error);
    }
  }
};
