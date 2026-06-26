import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getDbPath(fileName) {
  return path.join(__dirname, "../database", fileName);
}

export function readJsonFile(fileName) {
  const filePath = getDbPath(fileName);
  try {
    if (!fs.existsSync(filePath)) {
      // Ensure folder exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error(`Error reading database file ${fileName}:`, error);
    return [];
  }
}

export function writeJsonFile(fileName, data) {
  const filePath = getDbPath(fileName);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(`Error writing database file ${fileName}:`, error);
    return false;
  }
}
