"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import {
  Users,
  UserPlus,
  Trash2,
  Edit,
  X,
  Save,
  Mail,
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const { profile: currentUser } = useAuth();
  const { roles, getRoleLabel, getRoleColor } = useRoles();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const supabase = createClient();

  // New user form
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "tong_hop",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  // Edit user form
  const [editUser, setEditUser] = useState({
    fullName: "",
    role: "tong_hop",
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);


      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching users:", error);
        setError(error.message);
      }

      if (!error && data) {
        setUsers(data as UserProfile[]);
      }

      setLoading(false);
    } catch (err) {
      console.error("Exception in fetchUsers:", err);
      setError("Có lỗi khi tải danh sách người dùng");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAddingUser(true);

    if (newUser.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setAddingUser(false);
      return;
    }

    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Phiên đăng nhập hết hạn");
        setAddingUser(false);
        return;
      }

      // Call server-side API to create user (won't cause auto-login or screen flash)
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          fullName: newUser.fullName,
          role: newUser.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Có lỗi xảy ra");
        setAddingUser(false);
        return;
      }

      setSuccess("Tạo tài khoản thành công!");
      setShowAddModal(false);
      setNewUser({ email: "", password: "", fullName: "", role: "tong_hop" });
      fetchUsers();
      setAddingUser(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setAddingUser(false);
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUpdatingUser(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editUser.fullName,
        role: editUser.role,
      })
      .eq("id", selectedUser.id);

    if (error) {
      setError(error.message);
      setUpdatingUser(false);
      return;
    }

    setSuccess("Cập nhật thành công!");
    setShowEditModal(false);
    setSelectedUser(null);
    fetchUsers();
    setUpdatingUser(false);
    setTimeout(() => setSuccess(""), 3000);
  };

  // Delete user - open confirmation modal
  const handleDeleteUser = (userId: string) => {
    // Can't delete yourself
    if (userId === currentUser?.id) {
      setError("Không thể xóa tài khoản của chính mình!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setDeletingUserId(userId);
    setShowDeleteConfirm(true);
  };

  // Confirm delete user - delete from both auth and profiles
  const confirmDeleteUser = async () => {
    if (!deletingUserId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Phiên đăng nhập hết hạn!");
        setTimeout(() => setError(""), 3000);
        return;
      }

      const response = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: deletingUserId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Lỗi xóa tài khoản!");
        setTimeout(() => setError(""), 3000);
      } else {
        setSuccess("Đã xóa tài khoản!");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Lỗi kết nối server!");
      setTimeout(() => setError(""), 3000);
    }

    setShowDeleteConfirm(false);
    setDeletingUserId(null);
  };

  const openEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setEditUser({
      fullName: user.full_name,
      role: user.role,
    });
    setShowEditModal(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Users size={24} />
            <div>
              <h2 className="text-lg font-bold">Quản lý tài khoản</h2>
              <p className="text-blue-100 text-sm">
                Thêm, sửa, xóa tài khoản nhân viên
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <UserPlus size={18} />
            Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
          <Check size={18} />
          {success}
        </div>
      )}

      {/* User List */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Chưa có tài khoản nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Họ tên
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 ${
                        isCurrentUser ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.full_name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-blue-600">
                                  (Bạn)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700`}
                        >
                          <span className={`w-2 h-2 rounded-full ${getRoleColor(user.role)}`}></span>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Sửa"
                          >
                            <Edit size={18} />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus size={20} />
                Thêm tài khoản mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, fullName: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tối thiểu 6 ký tự"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Shield className="inline mr-1" size={14} />
                  Vai trò
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: r.id })}
                      className={`p-2 rounded-lg border-2 transition-all text-center text-sm font-medium ${
                        newUser.role === r.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingUser ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  {addingUser ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit size={20} />
                Chỉnh sửa tài khoản
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <Mail className="inline mr-2" size={14} />
                {selectedUser.email}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={editUser.fullName}
                    onChange={(e) =>
                      setEditUser({ ...editUser, fullName: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Shield className="inline mr-1" size={14} />
                  Vai trò
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        setEditUser({ ...editUser, role: r.id })
                      }
                      className={`p-2 rounded-lg border-2 transition-all text-center text-sm font-medium ${
                        editUser.role === r.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingUser}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updatingUser ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {updatingUser ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingUserId(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa tài khoản này?"
        confirmText="Xóa"
        type="danger"
      />
    </div>
  );
}
