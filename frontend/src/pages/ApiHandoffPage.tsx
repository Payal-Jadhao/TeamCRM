import React, { useState, useEffect } from 'react';
import { apiHandoffApi, taskApi } from '../services/api';
import type { ApiDoc, Task } from '../types';
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
} from 'lucide-react';

export const ApiHandoffPage: React.FC = () => {
  const [apiDocs, setApiDocs] = useState<ApiDoc[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, t] = await Promise.all([
        apiHandoffApi.getAll(),
        taskApi.getTasks(),
      ]);
      setApiDocs(docs);
      setTasks(t);
    } catch (e) {
      console.error(e);
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

  const handleCreateApiDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiHandoffApi.createApiDoc({
        title,
        httpMethod,
        endpoint,
        taskId: taskId ? Number(taskId) : undefined,
        requestBodyJson: requestBody,
        responseBodyJson: responseBody,
        authRequired: authReq,
        status: 'READY_FOR_INTEGRATION', // tags frontend devs immediately
      });
      setApiDocs((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setTitle('');
      setEndpoint('/api/v1/');
    } catch (e) {
      console.error(e);
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
            Eliminate Slack/WhatsApp handoff gaps. Publish payloads, auto-alert frontend engineers, and track integration state.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start"
        >
          <Plus className="w-4 h-4" /> Publish API Spec
        </button>
      </div>

      {/* API Contracts List */}
      <div className="space-y-4">
        {apiDocs.map((doc) => (
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
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-primary font-bold text-xs rounded-lg border border-purple-200 transition-colors"
                >
                  Change Status
                </button>
              </div>
            </div>

            {/* Metadata Chips */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
              {doc.taskCode && (
                <div>Linked Task: <span className="font-bold text-primary">{doc.taskCode}</span></div>
              )}
              <div>Version: <span className="font-mono font-semibold">{doc.version}</span></div>
              <div>Env: <span className="font-semibold text-text-primary">{doc.environment}</span></div>
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
          </div>
        ))}
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
              className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs"
            >
              Update Contract Status
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
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs"
          >
            Publish & Notify Frontend Team
          </button>
        </form>
      </Modal>
    </div>
  );
};
