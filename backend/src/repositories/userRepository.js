import { readJsonFile, writeJsonFile } from "../utils/helpers.js";

const FILE_NAME = "users.json";

export const userRepository = {
  findAll() {
    return readJsonFile(FILE_NAME);
  },

  findByEmail(email) {
    const users = this.findAll();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  findById(id) {
    const users = this.findAll();
    return users.find((u) => u.id === id);
  },

  create(user) {
    const users = this.findAll();
    users.push(user);
    writeJsonFile(FILE_NAME, users);
    return user;
  },

  update(id, updatedFields) {
    const users = this.findAll();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updatedFields };
    writeJsonFile(FILE_NAME, users);
    return users[index];
  },

  delete(id) {
    const users = this.findAll();
    const filtered = users.filter((u) => u.id !== id);
    if (users.length === filtered.length) return false;

    writeJsonFile(FILE_NAME, filtered);
    return true;
  }
};
