import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectApi, userApi, taskApi } from '../services/api';
import type { Project, User, Task } from '../types';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  UserCheck,
  X,
  AlertCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { PageLoader, ButtonSpinner } from '../components/ui/LoadingSpinner';

interface ProjectsPageProps {
  onNavigateTab: (tab: any, projectId?: number) => void;
}

interface MultiSelectUserDropdownProps {
  label: string;
  sublabel: string;
  placeholder: string;
  users: User[];
  selectedIds: number[];
  onChange: (newIds: number[]) => void;
  icon: React.ReactNode;
  accentColor: 'indigo' | 'emerald';
  emptyMessage: string;
}

const MultiSelectUserDropdown: React.FC<MultiSelectUserDropdownProps> = ({
  label,
  sublabel,
  placeholder,
  users,
  selectedIds,
  onChange,
  icon,
  accentColor,
  emptyMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.teamTag || '').toLowerCase().includes(q)
    );
  });

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  const toggleUser = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allIds = Array.from(new Set([...selectedIds, ...filteredUsers.map((u) => u.id)]));
    onChange(allIds);
  };

  const handleClearAll = () => {
    const filteredIdSet = new Set(filteredUsers.map((u) => u.id));
    onChange(selectedIds.filter((id) => !filteredIdSet.has(id)));
  };

  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.includes(u.id));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isIndigo = accentColor === 'indigo';

  return (
    <div className="pt-2 border-t border-gray-100" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </label>
        <span className="text-[11px] text-text-secondary font-normal">{sublabel}</span>
      </div>

      {/* Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3.5 py-2.5 text-xs bg-purple-50/60 hover:bg-purple-50 text-text-primary rounded-xl border ${
            isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border-custom hover:border-purple-300'
          } flex items-center justify-between transition-all cursor-pointer`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedIds.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              <span className="font-semibold text-text-primary">
                {selectedIds.length} {selectedIds.length === 1 ? 'member' : 'members'} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {selectedIds.length > 0 && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                isIndigo ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {selectedIds.length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Selected Members Chips */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
            {selectedUsers.map((u) => (
              <span
                key={u.id}
                className={`inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-lg text-[11px] font-medium border ${
                  isIndigo
                    ? 'bg-indigo-50/90 text-indigo-900 border-indigo-200/80'
                    : 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${
                  isIndigo ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}>
                  {getInitials(u.fullName)}
                </span>
                <span className="truncate max-w-[120px]">{u.fullName}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUser(u.id);
                  }}
                  className="hover:text-red-500 text-gray-400 p-0.5 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedUsers.length > 1 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] text-gray-400 hover:text-red-500 underline ml-1 self-center cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:bg-white outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between px-1 text-[11px] text-gray-500 border-b border-gray-100 pb-1.5">
              <span>{filteredUsers.length} available</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isAllSelected ? handleClearAll : handleSelectAll}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* User List */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredUsers.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400">
                  {users.length === 0 ? emptyMessage : 'No members match your search.'}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isChecked = selectedIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? isIndigo
                            ? 'bg-indigo-50/80 text-indigo-950 font-medium'
                            : 'bg-emerald-50/80 text-emerald-950 font-medium'
                          : 'hover:bg-gray-50 text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                          isIndigo ? 'bg-indigo-600' : 'bg-emerald-600'
                        }`}>
                          {getInitials(u.fullName)}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold truncate leading-tight">{u.fullName}</p>
                          <p className="text-[10px] text-text-secondary truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {u.teamTag && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono">
                            {u.teamTag}
                          </span>
                        )}
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? isIndigo
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigateTab }) => {
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.roleName === 'ROLE_ADMIN';
  const canCreateProject = isAdmin || hasPermission('PROJECT_CREATE');
  const canEditProject = isAdmin || hasPermission('PROJECT_EDIT') || hasPermission('PROJECT_CREATE');
  const canDeleteProject = isAdmin;

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Create / Edit Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectKeyCode, setProjectKeyCode] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectStatus, setProjectStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Quick Assignment Modal
  const [assignmentModalProject, setAssignmentModalProject] = useState<Project | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, userRes, taskRes] = await Promise.allSettled([
        projectApi.getProjects(),
        userApi.getUsers(),
        taskApi.getTasks(),
      ]);

      if (projRes.status === 'fulfilled') {
        setProjects(projRes.value || []);
      } else {
        console.error('Failed to load projects', projRes.reason);
      }

      if (userRes.status === 'fulfilled') {
        setUsers(userRes.value || []);
      } else {
        console.error('Failed to load users', userRes.reason);
      }

      if (taskRes.status === 'fulfilled') {
        setTasks(taskRes.value || []);
      } else {
        console.error('Failed to load tasks', taskRes.reason);
      }
    } catch (e) {
      console.error('Failed to load project data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRole = (u: any) => (u.roleName || u.role?.name || u.role || '').toUpperCase();
  const managers = users.filter((u) => getRole(u).includes('MANAGER'));
  const employees = users.filter((u) => getRole(u).includes('EMPLOYEE') || (!getRole(u).includes('ADMIN') && !getRole(u).includes('MANAGER')));

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectKeyCode('');
    setProjectDesc('');
    setProjectStatus('ACTIVE');
    setSelectedManagerIds([]);
    setSelectedEmployeeIds([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setProjectName(proj.name);
    setProjectKeyCode(proj.keyCode);
    setProjectDesc(proj.description || '');
    setProjectStatus(proj.status || 'ACTIVE');
    setSelectedManagerIds(proj.managerIds || []);
    setSelectedEmployeeIds(proj.employeeIds || []);
    setFormError('');
    setIsModalOpen(true);
  };

  const openQuickAssignment = (proj: Project) => {
    setAssignmentModalProject(proj);
    setSelectedManagerIds(proj.managerIds || []);
    setSelectedEmployeeIds(proj.employeeIds || []);
    setFormError('');
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setFormError('Project name is required');
      return;
    }
    if (!projectKeyCode.trim()) {
      setFormError('Project key code is required (e.g. CRM, MOB, ERP)');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (editingProject) {
        const updated = await projectApi.updateProject(editingProject.id, {
          name: projectName.trim(),
          keyCode: projectKeyCode.trim().toUpperCase(),
          description: projectDesc.trim(),
          status: projectStatus,
          managerIds: selectedManagerIds,
          employeeIds: selectedEmployeeIds,
        });
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await projectApi.createProject({
          name: projectName.trim(),
          keyCode: projectKeyCode.trim().toUpperCase(),
          description: projectDesc.trim(),
          status: projectStatus,
          managerIds: selectedManagerIds,
          employeeIds: selectedEmployeeIds,
        });
        setProjects((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignments = async () => {
    if (!assignmentModalProject) return;
    setSaving(true);
    try {
      const updated = await projectApi.updateProject(assignmentModalProject.id, {
        managerIds: selectedManagerIds,
        employeeIds: selectedEmployeeIds,
      });
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setAssignmentModalProject(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project? Associated tasks will remain intact.')) return;
    try {
      await projectApi.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        p.keyCode.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Project Master & Assignments</h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Centralized organizational project repository, manager delegation, and team member mapping.
              </p>
            </div>
          </div>
        </div>

        {canCreateProject && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>TOTAL PROJECTS</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-2">{projects.length}</div>
          <div className="text-xs text-text-secondary mt-1">Managed organizational workspaces</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>ACTIVE STATUS</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-2">
            {projects.filter((p) => p.status === 'ACTIVE').length}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Currently active sprint pipelines</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>ASSIGNED MANAGERS</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-2">{managers.length}</div>
          <div className="text-xs text-blue-600 mt-1 font-medium">Project delivery leaders</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>TOTAL SPRINT TASKS</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-text-primary mt-2">{tasks.length}</div>
          <div className="text-xs text-text-secondary mt-1">Cross-project task items</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border-custom shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name or key..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-purple-50 text-text-primary rounded-xl border border-border-custom focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-text-secondary">Status:</span>
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-purple-50 text-text-secondary hover:text-text-primary border border-border-custom'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List Grid */}
      {loading ? (
        <PageLoader message="Loading project workspace masters..." />
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-custom p-12 text-center shadow-xs">
          <FolderKanban className="w-12 h-12 text-primary/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-text-primary">No Projects Found</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            {searchTerm ? 'No projects match your search criteria.' : 'Create your first organizational project master.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const inProgressCount = projectTasks.filter((t) => t.status === 'IN_PROGRESS').length;
            const projectManagers = users.filter((u) => project.managerIds?.includes(u.id));
            const projectEmployees = users.filter((u) => project.employeeIds?.includes(u.id));

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-border-custom p-6 shadow-xs hover:shadow-soft transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold border border-primary/20">
                        {project.keyCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          project.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>

                    {(canEditProject || canDeleteProject) && (
                      <div className="flex items-center gap-1">
                        {canEditProject && (
                          <button
                            onClick={() => openEditModal(project)}
                            className="p-1 text-text-secondary hover:text-primary rounded-md hover:bg-purple-50 transition-colors"
                            title="Edit Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteProject && (
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-1 text-text-secondary hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-text-primary tracking-tight">{project.name}</h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="my-4 pt-4 border-t border-gray-100 space-y-3">
                    {/* Assigned Managers */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary mb-1.5">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Assigned Managers:</span>
                        </span>
                        <span className="font-bold text-blue-600">{projectManagers.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {projectManagers.length === 0 ? (
                          <span className="text-[11px] text-text-secondary/70 italic">No managers assigned</span>
                        ) : (
                          projectManagers.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-medium"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              <span>{m.fullName}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Assigned Employees */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary mb-1.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Assigned Employees:</span>
                        </span>
                        <span className="font-bold text-emerald-600">{projectEmployees.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {projectEmployees.length === 0 ? (
                          <span className="text-[11px] text-text-secondary/70 italic">No employees assigned</span>
                        ) : (
                          projectEmployees.map((e) => (
                            <span
                              key={e.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              <span>{e.fullName}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Stats & Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-text-secondary">
                    <span className="font-bold text-text-primary">{projectTasks.length}</span> tasks (
                    <span className="text-primary font-semibold">{inProgressCount} in progress</span>)
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => openQuickAssignment(project)}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-primary text-xs font-semibold rounded-lg border border-purple-200 transition-colors"
                        title="Manage Assigned Team Members"
                      >
                        <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                        <span>Assign</span>
                      </button>
                    )}
                    <button
                      onClick={() => onNavigateTab('tasks', project.id)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                    >
                      <span>Tasks</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProject ? 'Edit Project Master' : 'Create New Project'}
                </h3>
                <p className="text-xs text-gray-500">Configure project details and team member delegations</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-primary mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Enterprise Mobile App"
                    className="w-full px-3.5 py-2 text-xs bg-purple-50 text-text-primary rounded-xl border border-border-custom focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Key Code *</label>
                  <input
                    type="text"
                    required
                    value={projectKeyCode}
                    onChange={(e) => setProjectKeyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MOB"
                    maxLength={6}
                    className="w-full px-3.5 py-2 text-xs bg-purple-50 font-mono font-bold text-primary rounded-xl border border-border-custom focus:border-primary outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Description</label>
                <textarea
                  rows={2}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Summary of project goals and deliverables..."
                  className="w-full px-3.5 py-2 text-xs bg-purple-50 text-text-primary rounded-xl border border-border-custom focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Status</label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs bg-purple-50 text-text-primary rounded-xl border border-border-custom focus:border-primary outline-none"
                >
                  <option value="ACTIVE">ACTIVE - Currently Operational</option>
                  <option value="ARCHIVED">ARCHIVED - Read Only</option>
                </select>
              </div>

              {/* Assign Managers Multiselect Dropdown */}
              <MultiSelectUserDropdown
                label="Assign Project Managers"
                sublabel="Select managers to oversee this project"
                placeholder="Choose managers (e.g. Jayshree Jadhao)..."
                users={managers}
                selectedIds={selectedManagerIds}
                onChange={setSelectedManagerIds}
                icon={<ShieldCheck className="w-4 h-4 text-primary" />}
                accentColor="indigo"
                emptyMessage="No managers found in database. Add managers in User Management."
              />

              {/* Assign Team Employees Multiselect Dropdown */}
              <MultiSelectUserDropdown
                label="Assign Team Employees"
                sublabel="Select contributors for this project"
                placeholder="Choose team employees (e.g. Rahaa Malhotra)..."
                users={employees}
                selectedIds={selectedEmployeeIds}
                onChange={setSelectedEmployeeIds}
                icon={<Users className="w-4 h-4 text-emerald-600" />}
                accentColor="emerald"
                emptyMessage="No employees found in database. Add employees in User Management."
              />

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <ButtonSpinner text="Saving Project..." />
                  ) : editingProject ? (
                    'Update Project'
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Assignment Modal */}
      {assignmentModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setAssignmentModalProject(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-primary border border-purple-200 flex items-center justify-center shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Manage Team Assignments</h3>
                <p className="text-xs text-gray-500">{assignmentModalProject.name} ({assignmentModalProject.keyCode})</p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              <MultiSelectUserDropdown
                label="Assigned Project Managers"
                sublabel="Overseeing this project"
                placeholder="Choose managers (e.g. Jayshree Jadhao)..."
                users={managers}
                selectedIds={selectedManagerIds}
                onChange={setSelectedManagerIds}
                icon={<ShieldCheck className="w-4 h-4 text-primary" />}
                accentColor="indigo"
                emptyMessage="No managers found in database."
              />

              <MultiSelectUserDropdown
                label="Assigned Team Employees"
                sublabel="Contributors on this project"
                placeholder="Choose team employees (e.g. Rahaa Malhotra)..."
                users={employees}
                selectedIds={selectedEmployeeIds}
                onChange={setSelectedEmployeeIds}
                icon={<Users className="w-4 h-4 text-emerald-600" />}
                accentColor="emerald"
                emptyMessage="No employees found in database."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAssignmentModalProject(null)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAssignments}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
