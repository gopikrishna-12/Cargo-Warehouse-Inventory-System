import { themeRepository } from "../repositories/themeRepository.js";
import { auditService } from "./auditService.js";

export const themeService = {
  getTheme(email) {
    return themeRepository.findThemeByEmail(email);
  },

  async setTheme(email, theme, requestedByUser) {
    const updatedTheme = themeRepository.upsertTheme(email, theme);
    
    // Log theme change to audit logs
    await auditService.log({
      userId: requestedByUser,
      action: `Theme Switch: Preferred layout set to ${theme}`,
      entityName: "users"
    });

    return updatedTheme;
  }
};
