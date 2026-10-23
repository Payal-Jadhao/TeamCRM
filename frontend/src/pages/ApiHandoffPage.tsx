import React, { useState, useEffect } from 'react';
import { apiHandoffApi, taskApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ApiDoc, Task, User } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
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
  UserCheck
} from 'lucide-react';

export const ApiHandoffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [apiDocs, setApiDocs] = useState<ApiDoc[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Change Modal
  const [selectedDoc, setSelectedDoc] = useState<ApiDoc | null>(null);
  const [newStatus, setNewStatus] = useState('READY_FOR_INTEGRATION');
  const [statusNotes, setStatusNotes] = useState('');

  // Create API Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('POST');
  const [endpoint, setEndpoint] = useState('/api/v1/');
  const [taskId, setTaskId] = useState('');
  const [requestBody, setRequestBody] = useState('{\n  \n}');
  const [responseBody, setResponseBody] = useState('{\n  \n}');
  const [authReq, setAuthReq] = useState('Bearer JWT');

  // Searchable multi-select employee tagging state
  const [selectedEmployees, setSelectedEmployees] = useState<User[]>([]);
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      const [docs, t, u] = await Promise.all([
        apiHandoffApi.getAll(),
        taskApi.getTasks(),
        userApi.getUsers(),
      ]);
      setApiDocs(docs);
      setTasks(t);
      setUsers(u);
    } catch (e) {
      console.error('Error loading API handoff data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    try {
      const updated = await apiHandoffApi.updateStatus(selectedDoc.id, newStatus, statusNotes);
      setApiDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setSelectedDoc(null);
      setStatusNotes('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleEmployeeTag = (user: User) => {
    if (selectedEmployees.some((u) => u.id === user.id)) {
      setSelectedEmployees((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setSelectedEmployees((prev) => [...prev, user]);
    }
  };

  const handleCreateApiDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title,
        httpMethod,
        endpoint,
        taskId: taskId ? Number(taskId) : undefined,
        requestBodyJson: requestBody,
        responseBodyJson: responseBody,
        authRequired: authReq,
        status: 'READY_FOR_INTEGRATION',
        taggedUserIds: selectedEmployees.map((u) => u.id),
        taggedUserNames: selectedEmployees.map((u) => u.fullName),
        taggedUserEmails: selectedEmployees.map((u) => u.email),
        createdById: currentUser?.id,
        createdByName: currentUser?.fullName,
        comments: [],
      };

      const created = await apiHandoffApi.createApiDoc(payload);
      setApiDocs((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setTitle('');
      setEndpoint('/api/v1/');
      setSelectedEmployees([]);
      setSearchEmployeeQuery('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (docId: number) => {
    const text = (commentInput[docId] || '').trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [docId]: true }));
    try {
      const authorName = currentUser?.fullName || 'Team Member';
      const authorRole = currentUser?.roleName || 'ROLE_EMPLOYEE';
      const newComment = await (apiHandoffApi as any).addComment(docId, text, authorName, authorRole);

      setApiDocs((prev) =>
        prev.map((d) => {
          if (d.id === docId) {
            const existingComments = (d as any).comments || [];
            return {
              ...d,
              comments: [...existingComments, newComment || { id: Date.now(), authorName, text, createdAt: new Date().toISOString() }],
            };
          }
          return d;
        })
      );
      setCommentInput((prev) => ({ ...prev, [docId]: '' }));
    } catch (err) {
      console.error('Failed to post comment:', err);
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

  // Higher Order Visibility Check:
  // Admin and Manager can see ALL API handoff specs and discussions.
  // Employees only see specs where they are tagged, or that they authored.
  const isHigherOrder = currentUser?.roleName === 'ROLE_ADMIN' || currentUser?.roleName === 'ROLE_MANAGER';

  const visibleDocs = apiDocs.filter((doc: any) => {
    if (isHigherOrder) return true;

    const userEmail = currentUser?.email?.toLowerCase();
    const userId = currentUser?.id;
    const isAuthor = doc.createdById === userId || doc.createdByName === currentUser?.fullName;

    const taggedIds = doc.taggedUserIds || [];
    const taggedEmails = (doc.taggedUserEmails || []).map((e: string) => e?.toLowerCase());
    const taggedNames = doc.taggedUserNames || [];

    const isTagged =
      (userId && taggedIds.includes(userId)) ||
      (userEmail && taggedEmails.includes(userEmail)) ||
      (currentUser?.fullName && taggedNames.includes(currentUser.fullName));

    // If no tags were assigned yet (legacy specs), allow employees to view them as well
    if (taggedIds.length === 0 && taggedEmails.length === 0) {
      return true;
    }

    return isAuthor || isTagged;
  });

  const filteredEmployeesForDropdown = users.filter((u) => {
    const q = searchEmployeeQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.teamTag && u.teamTag.toLowerCase().includes(q))
    );
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
            Eliminate Slack/WhatsApp handoff gaps. Publish payloads, tag specific employees, and discuss integration details securely.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedEmployees([]);
            setSearchEmployeeQuery('');
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
            {isHigherOrder
              ? `You are logged in as ${currentUser?.roleName?.replace('ROLE_', '')} (Higher Order). You have full visibility into all published API specifications and employee discussions.`
              : `You are logged in as an Employee. You only see API specifications and discussions where you have been explicitly tagged.`}
          </span>
        </div>
        <span className="font-semibold text-primary">{visibleDocs.length} spec{visibleDocs.length === 1 ? '' : 's'} visible</span>
      </div>

      {/* Empty State */}
      {visibleDocs.length === 0 && !loading && (
        <div className="bg-white p-12 rounded-2xl border border-border-custom text-center shadow-xs">
          <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-text-primary">No API Specifications Found</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
            {isHigherOrder
              ? 'No API specifications published yet. Click "Publish API Spec" to create one and tag team members.'
              : 'You have not been tagged in any active API specifications yet. When your administrator or manager tags you, they will appear here.'}
          </p>
        </div>
      )}

      {/* API Contracts List */}
      <div className="space-y-4">
        {visibleDocs.map((doc: any) => {
          const docComments = doc.comments || [];
          const isDiscussionOpen = activeDiscussionDocId === doc.id;
          const taggedNames = doc.taggedUserNames || [];

          return (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs space-y-4 hover:shadow-soft transition-all"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-custom">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold ${getMethodBadgeClass(doc.httpMethod)}`}>
                    {doc.httpMethod}
                  </span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {doc.endpoint}
                  </span>
                  <span className="text-xs text-text-secondary">({doc.title})</span>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => {
                      setSelectedDoc(doc);
                      setNewStatus(doc.status);
                    }}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-primary font-bold text-xs rounded-lg border border-purple-200 transition-colors cursor-pointer"
                  >
                    Change Status
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
                  <div>Linked Task: <span className="font-bold text-primary">{doc.taskCode}</span></div>
                )}
                <div>Version: <span className="font-mono font-semibold">{doc.version || 'v1.0.0'}</span></div>
                <div>Env: <span className="font-semibold text-text-primary">{doc.environment || 'DEV'}</span></div>
                <div>Auth: <span className="font-semibold">{doc.authRequired || 'None'}</span></div>
                <div>Author: <span className="font-semibold">{doc.createdByName || 'Backend Team'}</span></div>
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
                  Visible to tagged members & higher orders
                </span>
              </div>

              {/* Collapsible Discussion Section */}
              {isDiscussionOpen && (
                <div className="space-y-3 pt-2 bg-purple-50/50 p-4 rounded-xl border border-purple-100 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    API Specification Discussion Thread
                  </h4>

                  {docComments.length === 0 ? (
                    <p className="text-xs text-text-secondary italic">
                      No queries or discussions posted yet. Ask a question below to notify tagged team members.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {docComments.map((c: any) => (
                        <div key={c.id} className="p-2.5 bg-white border border-border-custom rounded-lg shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-text-primary">{c.authorName}</span>
                            <span className="text-text-secondary font-mono">
                              {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </div>
                          <p className="text-xs text-text-primary">{c.text}</p>
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
                      placeholder="Type a question, schema feedback, or integration update..."
                      className="flex-1 px-3 py-2 bg-white rounded-lg border border-border-custom text-xs outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      disabled={submittingComment[doc.id] || !commentInput[doc.id]?.trim()}
                      onClick={() => handleAddComment(doc.id)}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingComment[doc.id] ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* UPDATE STATUS MODAL */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Update Status: ${selectedDoc.httpMethod} ${selectedDoc.endpoint}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Integration Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-semibold text-primary"
              >
                <option value="DRAFT">Draft</option>
                <option value="READY_FOR_INTEGRATION">Ready for Integration (Alert Frontend)</option>
                <option value="INTEGRATING">Integrating (In Progress)</option>
                <option value="INTEGRATED">Integrated (Done)</option>
                <option value="CHANGE_REQUESTED">Change Requested</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Feedback / Change Notes</label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Mention any schema mismatches, error codes, or changes required..."
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Update Contract Status
            </button>
          </form>
        </Modal>
      )}

      {/* CREATE API SPEC MODAL WITH SEARCHABLE MULTI-SELECT EMPLOYEE TAGGING */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publish API Specification"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateApiDoc} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">API Name / Title</label>
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
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block font-semibold mb-1">Endpoint Path</label>
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

          <div>
            <label className="block font-semibold mb-1">Linked Task</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            >
              <option value="">None (Independent API)</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.taskCode}: {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* SEARCHABLE MULTI-SELECT DROPDOWN FOR EMPLOYEES */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-text-primary">
                Tag Team Members (Multi-Select)
              </label>
              <span className="text-[11px] text-text-secondary">
                {selectedEmployees.length} member{selectedEmployees.length === 1 ? '' : 's'} tagged
              </span>
            </div>

            {/* Selected Chips */}
            {selectedEmployees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-purple-50/60 rounded-xl border border-purple-200 mb-2">
                {selectedEmployees.map((emp) => (
                  <span
                    key={emp.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-primary border border-purple-200 shadow-2xs"
                  >
                    <span>{emp.fullName}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleEmployeeTag(emp)}
                      className="p-0.5 hover:bg-rose-100 hover:text-rose-600 rounded-full cursor-pointer transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchEmployeeQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchEmployeeQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Search employees by name, email, or team to tag..."
                className="w-full pl-9 pr-8 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none focus:border-primary text-xs"
              />
              {searchEmployeeQuery && (
                <button
                  type="button"
                  onClick={() => setSearchEmployeeQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Options List */}
            {isDropdownOpen && (
              <div className="mt-1.5 max-h-48 overflow-y-auto bg-white border border-border-custom rounded-xl shadow-lg p-1 space-y-1 divide-y divide-gray-50">
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] text-text-secondary font-semibold bg-gray-50/80 rounded-lg">
                  <span>Select employees to tag in this API spec</span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                {filteredEmployeesForDropdown.length === 0 ? (
                  <div className="p-3 text-center text-xs text-text-secondary">
                    No team members found matching "{searchEmployeeQuery}"
                  </div>
                ) : (
                  filteredEmployeesForDropdown.map((u) => {
                    const isSelected = selectedEmployees.some((sel) => sel.id === u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleEmployeeTag(u)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-100/60 font-semibold' : 'hover:bg-purple-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="accent-primary cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-xs text-text-primary">{u.fullName}</div>
                            <div className="text-[10px] text-text-secondary font-mono">{u.email}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-primary border border-purple-200">
                          {u.teamTag || u.roleName.replace('ROLE_', '')}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            <p className="text-[11px] text-text-secondary mt-1">
              Only tagged employees (and higher order managers/admins) will have access to view this API spec and discussion thread.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Request Payload (JSON)</label>
              <textarea
                rows={4}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full p-2.5 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Response Payload (JSON)</label>
              <textarea
                rows={4}
                value={responseBody}
                onChange={(e) => setResponseBody(e.target.value)}
                className="w-full p-2.5 bg-gray-900 text-blue-300 font-mono text-[11px] rounded-lg outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Publish & Notify Tagged Team
          </button>
        </form>
      </Modal>
    </div>
  );
};
