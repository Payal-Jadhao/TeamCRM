import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import type { User } from '../types';
import { TeamTagChip } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Key,
  Lock,
  Mail,
  Sliders,
  AlertTriangle,
  Edit3,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<{ id: number; code: string; module: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Password visibility & copy states
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleShowPassword = (id: number) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPassword = (id: number, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Password copied to clipboard!');
  };

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('ROLE_EMPLOYEE');
  const [newTeamTag, setNewTeamTag] = useState('FRONTEND');
  const [newTempPassword, setNewTempPassword] = useState('Welcome123!');
  const [newPhone, setNewPhone] = useState('');

  // Edit User Modal
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('ROLE_EMPLOYEE');
  const [editTeamTag, setEditTeamTag] = useState('FRONTEND');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userForReset, setUserForReset] = useState<User | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('Welcome123!');

  // Deactivate / Soft Delete Modal
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Permission Matrix Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, perms] = await Promise.all([
        userApi.getUsers(),
        userApi.getAllPermissions(),
      ]);
      setUsers(u);
      setPermissions(perms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await userApi.createUser({
        email: newEmail.trim().toLowerCase(),
        fullName: newFullName.trim(),
        roleName: newRole,
        teamTag: newTeamTag,
        tempPassword: newTempPassword.trim(),
        phone: newPhone.trim(),
      });
      setUsers((prev) => [...prev, created]);
      setIsCreateModalOpen(false);
      setNewEmail('');
      setNewFullName('');
      showToast(`Created account for ${created.fullName}!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const openEditUser = (u: User) => {
    setEditUserId(u.id);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditPassword('');
    setEditRole(u.roleName);
    setEditTeamTag(u.teamTag || 'FRONTEND');
    setEditPhone(u.phone || '');
    setEditIsActive(u.isActive);
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserId) return;
    try {
      const payload: any = {
        fullName: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        roleName: editRole,
        teamTag: editTeamTag,
        phone: editPhone.trim(),
        isActive: editIsActive,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      const updated = await userApi.updateUser(editUserId, payload);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? {
                ...u,
                ...updated,
                initialPassword: editPassword.trim() || updated.initialPassword || u.initialPassword,
              }
            : u
        )
      );
      setIsEditUserModalOpen(false);
      showToast(`User ${updated.fullName} updated successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const openResetModal = (u: User) => {
    setUserForReset(u);
    setResetPasswordInput('Welcome123!');
    setIsResetModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForReset) return;
    const pwd = resetPasswordInput.trim();
    try {
      const res: any = await userApi.resetPassword(userForReset.id, pwd);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userForReset.id
            ? { ...u, ...(res || {}), initialPassword: pwd }
            : u
        )
      );
      setIsResetModalOpen(false);
      showToast(`Password successfully reset for ${userForReset.fullName}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleSoftDeleteUser = async (userId: number) => {
    try {
      await userApi.deleteUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: false } : u))
      );
      setUserToDelete(null);
      showToast('Employee account deactivated and logged to audit trail.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await userApi.toggleStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const openPermissionMatrix = (targetUser: User) => {
    setSelectedUser(targetUser);
    setSelectedPerms(targetUser.permissions || []);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      await userApi.updatePermissions(selectedUser.id, selectedPerms);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, permissions: selectedPerms } : u))
      );
      setSelectedUser(null);
      showToast('Permissions updated and logged to audit trail!');
    } catch (e) {
      console.error(e);
    }
  };

  const groupedPerms = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, typeof permissions>);

  if (currentUser?.roleName === 'ROLE_EMPLOYEE') {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Access Restricted</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Team Management & Access Control is only available for Company Administrators and Managers. Please contact your manager if you need changes to your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Team & Permissions</h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage employees, credentials, departmental tags (@frontend, @backend), and permissions.
          </p>
        </div>

        {currentUser?.roleName === 'ROLE_ADMIN' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Provision Employee
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-border-custom shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50 text-text-secondary font-bold uppercase tracking-wider border-b border-border-custom">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Corporate Email</th>
                <th className="px-5 py-3.5">Credentials</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {users.map((u) => {
                const isTargetAdmin = u.roleName === 'ROLE_ADMIN';
                const canSeePassword =
                  currentUser?.roleName === 'ROLE_ADMIN' ||
                  (currentUser?.roleName === 'ROLE_MANAGER' && !isTargetAdmin);
                const pwd =
                  u.initialPassword ||
                  (u.email === 'payaldjadhao@gmail.com' ? '1234' : '••••••');
                const isRevealed = !!showPasswordMap[u.id];

                return (
                  <tr key={u.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-text-primary flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-primary font-bold text-xs flex items-center justify-center border border-purple-200">
                        {u.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{u.fullName}</span>
                    </td>
                    <td className="px-5 py-4 text-text-secondary font-mono">{u.email}</td>

                    {/* Credentials / Password Column */}
                    <td className="px-5 py-4">
                      {canSeePassword ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs px-2 py-1 bg-purple-50 border border-purple-200 rounded-md text-text-primary font-semibold select-all">
                            {isRevealed ? pwd : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(u.id)}
                            className="p-1 hover:bg-purple-100 text-text-secondary hover:text-primary rounded cursor-pointer transition-colors"
                            title={isRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(u.id, pwd)}
                            className="p-1 hover:bg-purple-100 text-text-secondary hover:text-primary rounded cursor-pointer transition-colors"
                            title="Copy Password"
                          >
                            {copiedId === u.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Protected</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-primary uppercase">
                        {u.roleName.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <TeamTagChip tag={u.teamTag} />
                    </td>
                    <td className="px-5 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Deactivated
                        </span>
                      )}
                    </td>
                  <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                    {currentUser?.roleName === 'ROLE_ADMIN' ? (
                      <>
                        <button
                          onClick={() => openResetModal(u)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer text-xs"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5 inline mr-1" /> Reset Password
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-primary font-bold rounded-lg border border-purple-200 transition-colors cursor-pointer"
                          title="Edit User Info"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => openPermissionMatrix(u)}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-primary font-bold rounded-lg border border-purple-200 transition-colors cursor-pointer"
                          title="Fine-grained permissions"
                        >
                          <Sliders className="w-3.5 h-3.5 inline mr-1" /> Perms
                        </button>
                        {u.roleName !== 'ROLE_ADMIN' && u.email !== 'payaldjadhao@gmail.com' && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                u.isActive
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer"
                              title="Soft Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-text-secondary text-[11px] italic">Admin restricted</span>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROVISION EMPLOYEE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Employee Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Corporate Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="employee@company.com"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-semibold text-primary"
              >
                <option value="ROLE_EMPLOYEE">Employee (Contributor)</option>
                <option value="ROLE_MANAGER">Manager (Department)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Department Tag</label>
              <select
                value={newTeamTag}
                onChange={(e) => setNewTeamTag(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-bold"
              >
                <option value="FRONTEND">FRONTEND</option>
                <option value="BACKEND">BACKEND</option>
                <option value="QA">QA</option>
                <option value="SALES">SALES</option>
                <option value="DESIGN">DESIGN</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Temporary Initial Password</label>
            <input
              type="text"
              required
              value={newTempPassword}
              onChange={(e) => setNewTempPassword(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono"
            />
            <p className="text-[11px] text-text-secondary mt-1">
              User will be required to change their password on first login.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Provision Employee
          </button>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password: ${userForReset?.fullName || ''}`}
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
            <span className="font-bold">Security Notice:</span> The user's password will be encrypted using BCrypt in the database. The user will be required to update it on their next login.
          </div>

          <div>
            <label className="block font-semibold mb-1">New Temporary Password</label>
            <input
              type="text"
              required
              value={resetPasswordInput}
              onChange={(e) => setResetPasswordInput(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Confirm Password Reset
          </button>
        </form>
      </Modal>

      {/* FINE-GRAINED PERMISSION MATRIX MODAL */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Fine-Grained Permissions: ${selectedUser.fullName}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-bold">Base Role:</span> {selectedUser.roleName}. Custom permissions checked below will be added to the employee's active token.
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {Object.entries(groupedPerms).map(([moduleName, perms]) => (
                <div key={moduleName} className="p-3.5 bg-white border border-border-custom rounded-xl">
                  <h5 className="font-bold text-xs text-primary uppercase tracking-wider mb-2.5">
                    {moduleName} Module
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((p) => {
                      const isChecked = selectedPerms.includes(p.code);
                      return (
                        <label
                          key={p.id}
                          className="flex items-start gap-2 p-1.5 rounded hover:bg-purple-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPerms((prev) => [...prev, p.code]);
                              } else {
                                setSelectedPerms((prev) => prev.filter((c) => c !== p.code));
                              }
                            }}
                            className="mt-0.5 accent-primary cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-text-primary">{p.code}</div>
                            <div className="text-[10px] text-text-secondary">{p.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSavePermissions}
              className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Save Permissions Matrix
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        title="Edit Employee Account"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Corporate Email</label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">New Password (Leave blank to keep existing)</label>
            <input
              type="text"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Type new password to update..."
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                disabled={editRole === 'ROLE_ADMIN'}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-semibold text-primary disabled:opacity-60"
              >
                {editRole === 'ROLE_ADMIN' ? (
                  <option value="ROLE_ADMIN">Admin (Super Admin)</option>
                ) : (
                  <>
                    <option value="ROLE_EMPLOYEE">Employee (Contributor)</option>
                    <option value="ROLE_MANAGER">Manager</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Department Tag</label>
              <select
                value={editTeamTag}
                onChange={(e) => setEditTeamTag(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-bold"
              >
                <option value="FRONTEND">FRONTEND</option>
                <option value="BACKEND">BACKEND</option>
                <option value="QA">QA</option>
                <option value="SALES">SALES</option>
                <option value="DESIGN">DESIGN</option>
                <option value="DEVOPS">DEVOPS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Phone</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Account Status</label>
              <select
                value={editIsActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setEditIsActive(e.target.value === 'ACTIVE')}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-semibold"
              >
                <option value="ACTIVE">Active Account</option>
                <option value="INACTIVE">Deactivated</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Save User Changes
          </button>
        </form>
      </Modal>

      {/* CONFIRM SOFT-DELETE USER MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-custom space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-text-primary">Deactivate Employee Account?</h3>
              <p className="text-xs text-text-secondary">
                Are you sure you want to soft-delete and deactivate <span className="font-bold text-text-primary">"{userToDelete.fullName}"</span> ({userToDelete.email})? Historical tasks and time logs are preserved. This action will be logged in the company audit trail.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-text-secondary font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSoftDeleteUser(userToDelete.id)}
                className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
