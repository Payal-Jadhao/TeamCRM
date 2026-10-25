import React, { useState, useEffect } from 'react';
import { apiHandoffApi, taskApi, userApi, projectApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ApiDoc, Task, User, Project, ApiDocStatus } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageLoader, ButtonSpinner } from '../components/ui/LoadingSpinner';
import { MultiSelectUserDropdown } from '../components/ui/MultiSelectUserDropdown';
import {
  Code2,
  FileCode,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Send,
  Layers,
  Search,
  Users,
  X,
  MessageSquare,
  Shield,
  UserCheck,
  Edit3,
  Globe,
  FolderGit2
} from 'lucide-react';

export const ApiHandoffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [apiDocs, setApiDocs] = useState<ApiDoc[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Change Modal
  const [selectedDoc, setSelectedDoc] = useState<ApiDoc | null>(null);
  const [newStatus, setNewStatus] = useState('READY_FOR_INTEGRATION');
  const [statusNotes, setStatusNotes] = useState('');

  // Create API Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('POST');
  const [endpoint, setEndpoint] = useState('/api/v1/');
  const [createScope, setCreateScope] = useState<'INDEPENDENT' | 'PROJECT'>('INDEPENDENT');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [taskId, setTaskId] = useState('');
  const [environment, setEnvironment] = useState<'DEV' | 'STAGING' | 'PROD'>('DEV');
  const [requestBody, setRequestBody] = useState('{\n  \n}');
  const [responseBody, setResponseBody] = useState('{\n  \n}');
  const [authReq, setAuthReq] = useState('Bearer JWT');
  const [changeNotes, setChangeNotes] = useState('');
  const [taggedUserIds, setTaggedUserIds] = useState<number[]>([]);

  // Edit API Modal State
  const [editingDoc, setEditingDoc] = useState<ApiDoc | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHttpMethod, setEditHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('POST');
  const [editEndpoint, setEditEndpoint] = useState('/api/v1/');
  const [editScope, setEditScope] = useState<'INDEPENDENT' | 'PROJECT'>('INDEPENDENT');
  const [editProjectId, setEditProjectId] = useState<string>('');
  const [editTaskId, setEditTaskId] = useState<string>('');
  const [editEnvironment, setEditEnvironment] = useState<'DEV' | 'STAGING' | 'PROD'>('DEV');
  const [editAuthReq, setEditAuthReq] = useState('Bearer JWT');
  const [editStatus, setEditStatus] = useState<ApiDocStatus>('READY_FOR_INTEGRATION');
  const [editRequestBody, setEditRequestBody] = useState('{\n  \n}');
  const [editResponseBody, setEditResponseBody] = useState('{\n  \n}');
  const [editChangeNotes, setEditChangeNotes] = useState('');
  const [editTaggedUserIds, setEditTaggedUserIds] = useState<number[]>([]);

  // Discussion state per doc
  const [activeDiscussionDocId, setActiveDiscussionDocId] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState<{ [docId: number]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [docId: number]: boolean }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, t, u, p] = await Promise.all([
        apiHandoffApi.getAll(),
        taskApi.getTasks(),
        userApi.getUsers(),
        projectApi.getProjects(),
      ]);
      setApiDocs(docs);
      setTasks(t);
      setUsers(u);
      setProjects(p);
    } catch (e) {
      console.error('Error loading API handoff data:', e);
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setTitle('');
    setHttpMethod('POST');
    setEndpoint('/api/v1/');
    setCreateScope('INDEPENDENT');
    setSelectedProjectId('');
    setTaskId('');
    setEnvironment('DEV');
    setRequestBody('{\n  \n}');
    setResponseBody('{\n  \n}');
    setAuthReq('Bearer JWT');
    setChangeNotes('');
    setTaggedUserIds([]);
  };

  const handleCreateApiDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        title,
        httpMethod,
        endpoint,
        projectId: createScope === 'PROJECT' && selectedProjectId ? Number(selectedProjectId) : undefined,
        taskId: taskId ? Number(taskId) : undefined,
        requestBodyJson: requestBody,
        responseBodyJson: responseBody,
        authRequired: authReq,
        environment,
        changeNotes,
        status: 'READY_FOR_INTEGRATION',
        taggedUserIds,
        createdById: currentUser?.id,
        createdByName: currentUser?.fullName,
      };

      const created = await apiHandoffApi.createApiDoc(payload);
      setApiDocs((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || e.message || 'Failed to create API doc');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (doc: ApiDoc) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditHttpMethod(doc.httpMethod);
    setEditEndpoint(doc.endpoint);
    const hasProjectOrTask = Boolean(doc.projectId || doc.taskId);
    setEditScope(hasProjectOrTask ? 'PROJECT' : 'INDEPENDENT');
    setEditProjectId(doc.projectId ? String(doc.projectId) : '');
    setEditTaskId(doc.taskId ? String(doc.taskId) : '');
    setEditEnvironment(doc.environment || 'DEV');
    setEditAuthReq(doc.authRequired || 'Bearer JWT');
    setEditStatus(doc.status);
    setEditRequestBody(doc.requestBodyJson || '{\n  \n}');
    setEditResponseBody(doc.responseBodyJson || '{\n  \n}');
    setEditChangeNotes(doc.changeNotes || '');
    setEditTaggedUserIds(doc.taggedUserIds || []);
  };

  const handleUpdateApiDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: editTitle,
        httpMethod: editHttpMethod,
        endpoint: editEndpoint,
        projectId: editScope === 'PROJECT' && editProjectId ? Number(editProjectId) : undefined,
        taskId: editTaskId ? Number(editTaskId) : undefined,
        requestBodyJson: editRequestBody,
        responseBodyJson: editResponseBody,
        authRequired: editAuthReq,
        environment: editEnvironment,
        status: editStatus,
        changeNotes: editChangeNotes,
        taggedUserIds: editTaggedUserIds,
      };

      const updated = await apiHandoffApi.updateApiDoc(editingDoc.id, payload);
      setApiDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setEditingDoc(null);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || e.message || 'Failed to update API specification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setIsSubmitting(true);
    try {
      const updated = await apiHandoffApi.updateStatus(selectedDoc.id, newStatus, statusNotes);
      setApiDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setSelectedDoc(null);
      setStatusNotes('');
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || e.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (docId: number) => {
    const text = (commentInput[docId] || '').trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [docId]: true }));
    try {
      const authorName = currentUser?.fullName || 'Team Member';
      const authorRole = currentUser?.roleName || 'ROLE_EMPLOYEE';
      const newComment = await apiHandoffApi.addComment(docId, text, authorName, authorRole);

      setApiDocs((prev) =>
        prev.map((d) => {
          if (d.id === docId) {
            const existingComments = d.comments || [];
            return {
              ...d,
              comments: [...existingComments, newComment],
            };
          }
          return d;
        })
      );
      setCommentInput((prev) => ({ ...prev, [docId]: '' }));
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      alert('Failed to post discussion comment.');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-emerald-100 text-emerald-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-100 text-amber-800';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isAdmin = currentUser?.roleName === 'ROLE_ADMIN';

  // Permission check: Admin can edit ALL; Manager & Employee can only edit their OWN published API specification
  const canEditDoc = (doc: ApiDoc) => {
    if (isAdmin) return true;
    const userId = currentUser?.id;
    return (
      (doc.createdById && doc.createdById === userId) ||
      (doc.createdByName && doc.createdByName === currentUser?.fullName)
    );
  };

  // Visibility Check:
  // Independent API Handoffs are visible to ALL.
  // Project-specific APIs are visible to assigned project members, author, and tagged members.
  const visibleDocs = apiDocs.filter((doc) => {
    if (isAdmin) return true;

    const isIndependent = !doc.projectId && !doc.taskId;
    if (isIndependent) return true;

    const userId = currentUser?.id;
    const isAuthor =
      (doc.createdById && doc.createdById === userId) ||
      (doc.createdByName && doc.createdByName === currentUser?.fullName);
    if (isAuthor) return true;

    // Tagged check
    const taggedIds = doc.taggedUserIds || [];
    const taggedEmails = (doc.taggedUserEmails || []).map((e: string) => e?.toLowerCase());
    if (
      (userId && taggedIds.includes(userId)) ||
      (currentUser?.email && taggedEmails.includes(currentUser.email.toLowerCase()))
    ) {
      return true;
    }

    // Project membership check
    const projId =
      doc.projectId || (doc.taskId ? tasks.find((t) => t.id === doc.taskId)?.projectId : undefined);
    if (projId) {
      const proj = projects.find((p) => p.id === projId);
      if (proj) {
        if (proj.ownerId === userId) return true;
        if (proj.managerIds && proj.managerIds.includes(userId!)) return true;
        if (proj.employeeIds && proj.employeeIds.includes(userId!)) return true;
      }
    }

    // Task assignee check
    if (doc.taskId) {
      const t = tasks.find((tsk) => tsk.id === doc.taskId);
      if (t && t.assigneeId === userId) return true;
    }

    return false;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Backend to Frontend API Handoff</h1>
            <span className="text-[10px] uppercase font-bold bg-purple-100 text-primary px-2 py-0.5 rounded-full">
              Contract First
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Independent APIs are available across all teams. Project-specific APIs are scoped to assigned project members.
          </p>
        </div>

        <button
          onClick={() => {
            resetCreateForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Publish API Spec
        </button>
      </div>

      {/* Access Control Notice */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <span>
            {isAdmin
              ? 'Administrator Access: You can view, publish, and edit all API specifications and participate in all discussion threads.'
              : 'Role-Based Access: Independent APIs are visible to everyone. Project-specific APIs are visible to assigned project members. You can edit your own published API specifications.'}
          </span>
        </div>
        <span className="font-semibold text-primary">
          {visibleDocs.length} spec{visibleDocs.length === 1 ? '' : 's'} visible
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <PageLoader message="Loading API contracts, projects, and discussions..." />
      ) : (
        <>
          {/* Empty State */}
          {visibleDocs.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-border-custom text-center shadow-xs">
              <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-text-primary">No API Specifications Found</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                No published API specifications match your project assignments. Click "Publish API Spec" to create one.
              </p>
            </div>
          )}

          {/* API Contracts List */}
          <div className="space-y-4">
            {visibleDocs.map((doc) => {
              const docComments = doc.comments || [];
              const isDiscussionOpen = activeDiscussionDocId === doc.id;
              const taggedNames = doc.taggedUserNames || [];
              const canEdit = canEditDoc(doc);

              return (
                <div
                  key={doc.id}
                  className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs space-y-4 hover:shadow-soft transition-all"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-custom">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold ${getMethodBadgeClass(
                          doc.httpMethod
                        )}`}
                      >
                        {doc.httpMethod}
                      </span>
                      <span className="font-mono text-sm font-bold text-text-primary">{doc.endpoint}</span>
                      <span className="text-xs text-text-secondary">({doc.title})</span>

                      {/* Scope Badge */}
                      {doc.projectName ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <FolderGit2 className="w-3 h-3 text-emerald-600" />
                          {doc.projectName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                          <Globe className="w-3 h-3 text-blue-600" />
                          Independent (Global)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={doc.status} />

                      {canEdit && (
                        <button
                          onClick={() => handleOpenEditModal(doc)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          title={isAdmin ? 'Admin can edit all specs' : 'Edit your own published specification'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Spec
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setNewStatus(doc.status);
                        }}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-primary font-bold text-xs rounded-lg border border-purple-200 transition-colors cursor-pointer"
                      >
                        Status
                      </button>
                    </div>
                  </div>

                  {/* Tagged Employees Row */}
                  {taggedNames.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-2.5 bg-gray-50/80 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>Tagged Members:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {taggedNames.map((name: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-primary border border-purple-200"
                          >
                            <UserCheck className="w-3 h-3" />
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                    {doc.taskCode && (
                      <div>
                        Linked Task: <span className="font-bold text-primary">{doc.taskCode}</span>
                      </div>
                    )}
                    <div>
                      Version: <span className="font-mono font-semibold">{doc.version || 'v1.0.0'}</span>
                    </div>
                    <div>
                      Env: <span className="font-semibold text-text-primary">{doc.environment || 'DEV'}</span>
                    </div>
                    <div>
                      Auth: <span className="font-semibold">{doc.authRequired || 'None'}</span>
                    </div>
                    <div>
                      Author: <span className="font-semibold">{doc.createdByName || 'Backend Team'}</span>
                    </div>
                  </div>

                  {/* JSON Request and Response Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-bold text-text-secondary uppercase mb-1">
                        Sample Request Body (JSON)
                      </div>
                      <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-48">
                        {doc.requestBodyJson || '// No request body'}
                      </pre>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-text-secondary uppercase mb-1">
                        Sample Response Body (JSON)
                      </div>
                      <pre className="p-3 bg-gray-900 text-blue-300 font-mono text-xs rounded-xl overflow-x-auto max-h-48">
                        {doc.responseBodyJson || '// No response body'}
                      </pre>
                    </div>
                  </div>

                  {doc.changeNotes && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <span className="font-bold">Integration Notes:</span> {doc.changeNotes}
                    </div>
                  )}

                  {/* Discussion & Comments Toggle Bar */}
                  <div className="pt-2 border-t border-border-custom flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveDiscussionDocId(isDiscussionOpen ? null : doc.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Discussion & Queries ({docComments.length})</span>
                      <span className="text-[10px] text-text-secondary">
                        {isDiscussionOpen ? '▲ Hide' : '▼ Show & Discuss'}
                      </span>
                    </button>
                    <span className="text-[11px] text-text-secondary">
                      Dynamic discussion saved in backend database
                    </span>
                  </div>

                  {/* Collapsible Discussion Section */}
                  {isDiscussionOpen && (
                    <div className="space-y-3 pt-2 bg-purple-50/50 p-4 rounded-xl border border-purple-100 animate-in fade-in duration-150">
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        API Specification Discussion & Queries Thread
                      </h4>

                      {docComments.length === 0 ? (
                        <p className="text-xs text-text-secondary italic">
                          No queries or discussions posted yet. Ask a question or leave integration feedback below.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {docComments.map((c) => (
                            <div key={c.id} className="p-2.5 bg-white border border-border-custom rounded-lg shadow-2xs">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-text-primary">{c.authorName}</span>
                                  {c.authorRole && (
                                    <span className="text-[9px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                                      {c.authorRole.replace('ROLE_', '')}
                                    </span>
                                  )}
                                </div>
                                <span className="text-text-secondary font-mono text-[10px]">
                                  {c.createdAt
                                    ? new Date(c.createdAt).toLocaleString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'Just now'}
                                </span>
                              </div>
                              <p className="text-xs text-text-primary whitespace-pre-wrap">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input Box */}
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={commentInput[doc.id] || ''}
                          onChange={(e) => setCommentInput((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(doc.id);
                            }
                          }}
                          placeholder="Type a query, question, or schema feedback..."
                          className="flex-1 px-3 py-2 bg-white rounded-lg border border-border-custom text-xs outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          disabled={submittingComment[doc.id] || !commentInput[doc.id]?.trim()}
                          onClick={() => handleAddComment(doc.id)}
                          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {submittingComment[doc.id] ? 'Posting...' : 'Post Query'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* STATUS CHANGE MODAL */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Update Status: ${selectedDoc.endpoint}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Integration Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="READY_FOR_INTEGRATION">READY_FOR_INTEGRATION</option>
                <option value="INTEGRATING">INTEGRATING</option>
                <option value="INTEGRATED">INTEGRATED</option>
                <option value="CHANGE_REQUESTED">CHANGE_REQUESTED</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Notes / Reason for Status Change</label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="e.g. Auth header verified, integrated in sprint-2."
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? <ButtonSpinner text="Updating..." /> : 'Save Status'}
            </button>
          </form>
        </Modal>
      )}

      {/* CREATE API SPEC MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publish API Specification"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateApiDoc} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">API Name / Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Start Task Timer Session"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">HTTP Method</label>
              <select
                value={httpMethod}
                onChange={(e) => setHttpMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-semibold"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block font-semibold mb-1">Endpoint Path *</label>
              <input
                type="text"
                required
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/v1/tasks/{id}/time/start"
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono"
              />
            </div>
          </div>

          {/* Scope Selector: Independent vs Project-Specific */}
          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
            <label className="block font-semibold text-text-primary">API Specification Scope</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="createScope"
                  value="INDEPENDENT"
                  checked={createScope === 'INDEPENDENT'}
                  onChange={() => {
                    setCreateScope('INDEPENDENT');
                    setSelectedProjectId('');
                    setTaskId('');
                  }}
                  className="text-primary focus:ring-0 cursor-pointer"
                />
                <span>Independent (Visible to All)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="createScope"
                  value="PROJECT"
                  checked={createScope === 'PROJECT'}
                  onChange={() => setCreateScope('PROJECT')}
                  className="text-primary focus:ring-0 cursor-pointer"
                />
                <span>Project-Specific (Visible to Project Members)</span>
              </label>
            </div>

            {createScope === 'PROJECT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold mb-1">Assign to Project *</label>
                  <select
                    required={createScope === 'PROJECT'}
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setTaskId('');
                    }}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-border-custom outline-none"
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.keyCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Optional: Linked Task</label>
                  <select
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-border-custom outline-none"
                  >
                    <option value="">None</option>
                    {tasks
                      .filter((t) => !selectedProjectId || t.projectId === Number(selectedProjectId))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.taskCode}: {t.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                <option value="DEV">DEV</option>
                <option value="STAGING">STAGING</option>
                <option value="PROD">PROD</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Authorization</label>
              <input
                type="text"
                value={authReq}
                onChange={(e) => setAuthReq(e.target.value)}
                placeholder="e.g. Bearer JWT"
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          {/* Multi-Select User Tagging */}
          <MultiSelectUserDropdown
            label="Tag Team Members"
            sublabel="(Managers & Employees)"
            placeholder="Select members to notify and tag in this API spec..."
            users={users}
            selectedIds={taggedUserIds}
            onChange={setTaggedUserIds}
            accentColor="purple"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Sample Request Body (JSON)</label>
              <textarea
                rows={5}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Sample Response Body (JSON)</label>
              <textarea
                rows={5}
                value={responseBody}
                onChange={(e) => setResponseBody(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Integration Notes</label>
            <textarea
              rows={2}
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="Authentication details, special headers, edge cases..."
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? <ButtonSpinner text="Publishing Specification..." /> : 'Publish API Specification'}
          </button>
        </form>
      </Modal>

      {/* EDIT API SPEC MODAL */}
      {editingDoc && (
        <Modal
          isOpen={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          title={`Edit API Specification: ${editingDoc.endpoint}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleUpdateApiDoc} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">API Name / Title *</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">HTTP Method</label>
                <select
                  value={editHttpMethod}
                  onChange={(e) => setEditHttpMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-semibold"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-semibold mb-1">Endpoint Path *</label>
                <input
                  type="text"
                  required
                  value={editEndpoint}
                  onChange={(e) => setEditEndpoint(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono"
                />
              </div>
            </div>

            {/* Scope Selector: Independent vs Project-Specific */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
              <label className="block font-semibold text-text-primary">API Specification Scope</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="editScope"
                    value="INDEPENDENT"
                    checked={editScope === 'INDEPENDENT'}
                    onChange={() => {
                      setEditScope('INDEPENDENT');
                      setEditProjectId('');
                      setEditTaskId('');
                    }}
                    className="text-primary focus:ring-0 cursor-pointer"
                  />
                  <span>Independent (Visible to All)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="editScope"
                    value="PROJECT"
                    checked={editScope === 'PROJECT'}
                    onChange={() => setEditScope('PROJECT')}
                    className="text-primary focus:ring-0 cursor-pointer"
                  />
                  <span>Project-Specific (Visible to Project Members)</span>
                </label>
              </div>

              {editScope === 'PROJECT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold mb-1">Assign to Project *</label>
                    <select
                      required={editScope === 'PROJECT'}
                      value={editProjectId}
                      onChange={(e) => {
                        setEditProjectId(e.target.value);
                        setEditTaskId('');
                      }}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-border-custom outline-none"
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.keyCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Optional: Linked Task</label>
                    <select
                      value={editTaskId}
                      onChange={(e) => setEditTaskId(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-border-custom outline-none"
                    >
                      <option value="">None</option>
                      {tasks
                        .filter((t) => !editProjectId || t.projectId === Number(editProjectId))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.taskCode}: {t.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Environment</label>
                <select
                  value={editEnvironment}
                  onChange={(e) => setEditEnvironment(e.target.value as any)}
                  className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
                >
                  <option value="DEV">DEV</option>
                  <option value="STAGING">STAGING</option>
                  <option value="PROD">PROD</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-semibold"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY_FOR_INTEGRATION">READY_FOR_INTEGRATION</option>
                  <option value="INTEGRATING">INTEGRATING</option>
                  <option value="INTEGRATED">INTEGRATED</option>
                  <option value="CHANGE_REQUESTED">CHANGE_REQUESTED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Authorization</label>
                <input
                  type="text"
                  value={editAuthReq}
                  onChange={(e) => setEditAuthReq(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
                />
              </div>
            </div>

            {/* Multi-Select User Tagging */}
            <MultiSelectUserDropdown
              label="Tag Team Members"
              sublabel="(Managers & Employees)"
              placeholder="Select members to notify and tag in this API spec..."
              users={users}
              selectedIds={editTaggedUserIds}
              onChange={setEditTaggedUserIds}
              accentColor="purple"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Sample Request Body (JSON)</label>
                <textarea
                  rows={5}
                  value={editRequestBody}
                  onChange={(e) => setEditRequestBody(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Sample Response Body (JSON)</label>
                <textarea
                  rows={5}
                  value={editResponseBody}
                  onChange={(e) => setEditResponseBody(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Integration Notes</label>
              <textarea
                rows={2}
                value={editChangeNotes}
                onChange={(e) => setEditChangeNotes(e.target.value)}
                placeholder="Authentication details, special headers, edge cases..."
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? <ButtonSpinner text="Updating Specification..." /> : 'Update API Specification'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
