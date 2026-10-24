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
  Briefcase
} from 'lucide-react';

interface ProjectsPageProps {
  onNavigateTab: (tab: any, projectId?: number) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.roleName === 'ROLE_ADMIN';
  const isManager = user?.roleName === 'ROLE_MANAGER';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projList, userList, taskList] = await Promise.all([
        projectApi.getProjects(),
        userApi.getUsers(),
        taskApi.getTasks(),
      ]);
      setProjects(projList);
      setUsers(userList);
      setTasks(taskList);
    } catch (e) {
      console.error('Failed to load project data', e);
    } finally {
      setLoading(false);
    }
  };

  const managers = users.filter((u) => u.roleName === 'ROLE_MANAGER' && u.isActive);
  const employees = users.filter((u) => u.roleName === 'ROLE_EMPLOYEE' && u.isActive);

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectKeyCode('');
    setProjectDesc('');
    setProjectStatus('ACTIVE');
    setSelectedManagerIds(managers.map((m) => m.id));
    setSelectedEmployeeIds(employees.map((e) => e.id));
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

        {isAdmin && (
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
        <div className="py-20 text-center text-sm text-text-secondary">Loading project masters...</div>
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

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(project)}
                          className="p-1 text-text-secondary hover:text-primary rounded-md hover:bg-purple-50 transition-colors"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1 text-text-secondary hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

              {/* Assign Managers */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                  <span>Assign Project Managers:</span>
                  <span className="text-[11px] text-text-secondary font-normal">Select managers to oversee this project</span>
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-purple-50/50 rounded-xl border border-border-custom">
                  {managers.map((m) => {
                    const isChecked = selectedManagerIds.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer hover:bg-purple-100/50 p-1.5 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedManagerIds((prev) => [...prev, m.id]);
                            } else {
                              setSelectedManagerIds((prev) => prev.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="font-semibold">{m.fullName}</span>
                        <span className="text-[10px] text-text-secondary">({m.email})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Assign Employees */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                  <span>Assign Team Employees:</span>
                  <span className="text-[11px] text-text-secondary font-normal">Select contributors for this project</span>
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-purple-50/50 rounded-xl border border-border-custom">
                  {employees.map((emp) => {
                    const isChecked = selectedEmployeeIds.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer hover:bg-purple-100/50 p-1.5 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeeIds((prev) => [...prev, emp.id]);
                            } else {
                              setSelectedEmployeeIds((prev) => prev.filter((id) => id !== emp.id));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="font-semibold">{emp.fullName}</span>
                        <span className="text-[10px] text-text-secondary">({emp.email})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

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
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
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
              <div>
                <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Assigned Managers:</span>
                </h4>
                <div className="space-y-1.5 p-2.5 bg-blue-50/50 rounded-xl border border-blue-200/60 max-h-36 overflow-y-auto">
                  {managers.map((m) => {
                    const isChecked = selectedManagerIds.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer p-1 hover:bg-white rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedManagerIds((prev) => [...prev, m.id]);
                            } else {
                              setSelectedManagerIds((prev) => prev.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="font-semibold text-gray-800">{m.fullName}</span>
                        <span className="text-[10px] text-gray-500">({m.teamTag || 'Management'})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Assigned Employees:</span>
                </h4>
                <div className="space-y-1.5 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60 max-h-36 overflow-y-auto">
                  {employees.map((emp) => {
                    const isChecked = selectedEmployeeIds.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer p-1 hover:bg-white rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeeIds((prev) => [...prev, emp.id]);
                            } else {
                              setSelectedEmployeeIds((prev) => prev.filter((id) => id !== emp.id));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="font-semibold text-gray-800">{emp.fullName}</span>
                        <span className="text-[10px] text-gray-500">({emp.teamTag || 'Frontend'})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
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
