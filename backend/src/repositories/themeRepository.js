import { readJsonFile, writeJsonFile } from "../utils/helpers.js";

const FILE_NAME = "preferences.json";

export const themeRepository = {
  findThemeByEmail(email) {
    const preferences = readJsonFile(FILE_NAME);
    const pref = preferences.find((p) => p.email.toLowerCase() === email.toLowerCase());
    return pref ? pref.theme : "light";
  },

  upsertTheme(email, theme) {
    const preferences = readJsonFile(FILE_NAME);
    const index = preferences.findIndex((p) => p.email.toLowerCase() === email.toLowerCase());
    if (index !== -1) {
      preferences[index].theme = theme;
    } else {
      preferences.push({ email: email.toLowerCase(), theme });
    }
    writeJsonFile(FILE_NAME, preferences);
    return theme;
  }
};
