import { createContext, useContext, useEffect, useState } from "react";
import { apiService } from "../services/api";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // Apply theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Sync theme with backend when user session changes or theme updates
  const syncThemeWithBackend = async (themeVal) => {
    const token = localStorage.getItem("orbem_token");
    if (token) {
      try {
        await apiService.setTheme(themeVal);
      } catch (err) {
        console.error("Failed to sync theme preference to backend:", err.message);
      }
    }
  };

  const loadThemeFromBackend = async () => {
    const token = localStorage.getItem("orbem_token");
    if (token) {
      try {
        const data = await apiService.getTheme();
        if (data && data.theme) {
          setTheme(data.theme);
        }
      } catch (err) {
        console.error("Failed to load theme preference from backend:", err.message);
      }
    }
  };

  // Attempt to load preference on initial session load
  useEffect(() => {
    loadThemeFromBackend();
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    syncThemeWithBackend(nextTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loadThemeFromBackend }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

