import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { masterApi } from '../services/api';
import type { MasterItem } from '../types';
import { Modal } from '../components/ui/Modal';
import {
  Sliders,
  Plus,
  CheckCircle,
  XCircle,
  Edit2,
  Lock,
  Layers,
  Tag,
  Briefcase,
  Users2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { TableLoader, ButtonSpinner } from '../components/ui/LoadingSpinner';

type MasterCategory = 'TEAM' | 'TASK_TYPE' | 'LEAD_STATUS' | 'DEAL_STAGE';

const CATEGORIES: { key: MasterCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'TEAM', label: 'Teams / Departments', icon: Users2 },
  { key: 'TASK_TYPE', label: 'Task Types', icon: Tag },
  { key: 'LEAD_STATUS', label: 'Lead Statuses', icon: Layers },
  { key: 'DEAL_STAGE', label: 'Deal Stages', icon: Briefcase },
];

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<MasterCategory>('TEAM');
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formKeyCode, setFormKeyCode] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number>(1);
  const [toastMsg, setToastMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    loadMasters();
  }, [activeCategory]);

  const loadMasters = async () => {
    setLoading(true);
    try {
      const data = await masterApi.getMasters(activeCategory);
      setItems(data);
    } catch (e) {
      console.error('Failed to load master items', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormKeyCode('');
    setFormSortOrder(items.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MasterItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormKeyCode(item.keyCode || '');
    setFormSortOrder(item.sortOrder);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const updated = await masterApi.updateMaster(editingItem.id, {
          name: formName.trim(),
          keyCode: formKeyCode.trim().toUpperCase(),
          sortOrder: formSortOrder,
        });
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
        showToast(`Updated "${updated.name}" successfully!`);
      } else {
        const created = await masterApi.createMaster({
          category: activeCategory,
          name: formName.trim(),
          keyCode: formKeyCode.trim().toUpperCase(),
          sortOrder: formSortOrder,
          isActive: true,
        });
        setItems((prev) => [...prev, created]);
        showToast(`Added "${created.name}" successfully!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save master record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: MasterItem) => {
    try {
      const updated = await masterApi.toggleMaster(item.id);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      showToast(`Set "${updated.name}" to ${updated.isActive ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (item: MasterItem) => {
    if (!window.confirm(`Are you sure you want to delete master value "${item.name}"?`)) return;
    try {
      await masterApi.deleteMaster(item.id);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      showToast(`Deleted "${item.name}" successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete master item');
    }
  };

  if (user?.roleName !== 'ROLE_ADMIN') {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Access Restricted</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Master Settings are restricted exclusively to System Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Master Data & Configurations</h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure system masters (Teams, Task Types, Lead Statuses, Deal Stages). Hard deletion is disabled; records are toggled Active or Inactive.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Master Value
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-border-custom pb-2 overflow-x-auto">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-purple-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Masters Table */}
      <div className="bg-white rounded-2xl border border-border-custom shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50 text-text-secondary font-bold uppercase tracking-wider border-b border-border-custom">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Key Code</th>
                <th className="px-5 py-3.5">Sort Order</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {loading ? (
                <TableLoader colSpan={6} message="Loading master records from database..." />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-text-secondary">
                    No master records found for this category. Click "Add Master Value" above to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-text-secondary font-semibold">#{item.id}</td>
                    <td className="px-5 py-4 font-bold text-text-primary">{item.name}</td>
                    <td className="px-5 py-4 font-mono text-xs text-primary font-bold">
                      {item.keyCode || '—'}
                    </td>
                    <td className="px-5 py-4 text-text-secondary font-semibold">{item.sortOrder}</td>
                    <td className="px-5 py-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-primary font-bold rounded-lg border border-purple-200 transition-colors cursor-pointer"
                        title="Edit Master"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggle(item)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                          item.isActive
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        title="Delete Master Item"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Master: ${editingItem.name}` : `Add New ${CATEGORIES.find((c) => c.key === activeCategory)?.label}`}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Mobile Engineering or Qualified"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Key Code (Identifier)</label>
            <input
              type="text"
              value={formKeyCode}
              onChange={(e) => setFormKeyCode(e.target.value)}
              placeholder="e.g. MOBILE or QUALIFIED"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Sort Order</label>
            <input
              type="number"
              min={1}
              required
              value={formSortOrder}
              onChange={(e) => setFormSortOrder(Number(e.target.value))}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <ButtonSpinner text="Saving Master..." />
            ) : editingItem ? (
              'Save Changes'
            ) : (
              'Create Master Record'
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};
