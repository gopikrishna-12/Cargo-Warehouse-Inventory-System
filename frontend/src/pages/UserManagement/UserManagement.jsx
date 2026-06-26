import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import toast from "react-hot-toast";
import {
  FaUserCog,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaTimes,
  FaShieldAlt,
  FaCheck,
  FaBan
} from "react-icons/fa";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals control
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Selection
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Warehouse Staff",
    isActive: true,
    description: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      setUsers(data || []);
    } catch (e) {
      toast.error("Failed to load WMS users: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // Create User
  async function handleAddUser(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in name and email fields.");
      return;
    }

    const emailExists = users.some((u) => u.email.toLowerCase() === formData.email.toLowerCase().trim());
    if (emailExists) {
      toast.error("User with this email already exists.");
      return;
    }

    try {
      setLoading(true);
      const newUser = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        isActive: formData.isActive,
        description: formData.description.trim() || `${formData.role} user profile.`,
        password: "password123", // default simulation password
      };

      await apiService.createUser(newUser);
      toast.success("New user profile registered successfully!");
      setAddModalOpen(false);
      resetForm();
      await loadUsers();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to register user: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Edit User
  async function handleEditUser(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("User Name is required.");
      return;
    }

    try {
      setLoading(true);
      const updatedFields = {
        name: formData.name.trim(),
        role: formData.role,
        isActive: formData.isActive,
        description: formData.description.trim() || selectedUser.description,
      };

      await apiService.updateUser(selectedUser.id, updatedFields);
      toast.success("User credentials modified successfully!");
      setEditModalOpen(false);
      resetForm();
      await loadUsers();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to modify user: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Delete User
  async function handleDeleteUser() {
    try {
      setLoading(true);
      await apiService.deleteUser(selectedUser.id);
      toast.success("User profile removed from WMS console.");
      setDeleteModalOpen(false);
      resetForm();
      await loadUsers();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to delete user: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Toggle active
  async function toggleUserStatus(userToToggle) {
    try {
      setLoading(true);
      const updatedUser = await apiService.toggleUserStatus(userToToggle.id);
      toast.success(`User is now ${updatedUser.isActive ? "Active" : "Deactivated"}`);
      await loadUsers();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to toggle status: " + msg);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(u) {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      description: u.description || "",
    });
    setEditModalOpen(true);
  }

  function openDeleteModal(u) {
    setSelectedUser(u);
    setDeleteModalOpen(true);
  }

  function resetForm() {
    setFormData({
      name: "",
      email: "",
      role: "Warehouse Staff",
      isActive: true,
      description: "",
    });
    setSelectedUser(null);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Assign administrative roles, register warehouse crew, and manage customer accounts.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm shadow-xs transition-colors cursor-pointer"
        >
          <FaPlus />
          <span>Add User Profile</span>
        </button>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xs rounded-xl overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4">Name / Profile</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-650 dark:text-slate-300">
                {users.map((u) => (
                  <tr key={u.id || u.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-755 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-850 dark:text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">{u.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg">
                        <FaShieldAlt className="text-[10px]" />
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                          u.isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                            : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30"
                        }`}
                      >
                        {u.isActive ? <FaCheck className="text-[9px]" /> : <FaBan className="text-[9px]" />}
                        <span>{u.isActive ? "Active" : "Disabled"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(u)}
                          className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <FaTrashAlt className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Add User Profile</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Operator Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Login Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@orbem.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Admin">Admin</option>
                  <option value="Operations Staff">Operations Staff</option>
                  <option value="Warehouse Staff">Warehouse Staff</option>
                  <option value="Documentation Executive">Documentation Executive</option>
                  <option value="Accounts Staff">Accounts Staff</option>
                  <option value="Customer">Customer</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Profile Description</label>
                <input
                  type="text"
                  placeholder="e.g. Floor scanner and sorter lead."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-350"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-600 dark:text-slate-450 cursor-pointer">Activate user immediately</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  Confirm Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Edit User Profile</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Operator Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Login Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Admin">Admin</option>
                  <option value="Operations Staff">Operations Staff</option>
                  <option value="Warehouse Staff">Warehouse Staff</option>
                  <option value="Documentation Executive">Documentation Executive</option>
                  <option value="Accounts Staff">Accounts Staff</option>
                  <option value="Customer">Customer</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Profile Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-350"
                />
                <label htmlFor="isActiveEdit" className="text-xs font-semibold text-slate-600 dark:text-slate-450 cursor-pointer">Account is Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER MODAL */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Confirm Deletion</h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-655 dark:text-slate-400 leading-normal">
                Are you sure you want to remove user reference <strong className="text-slate-850 dark:text-white">{selectedUser.name}</strong> ({selectedUser.email})?
                This deletes the operator credentials from the simulated login panel.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-750">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
