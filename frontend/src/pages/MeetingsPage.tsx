import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { meetingApi, userApi, taskApi, aiApi } from '../services/api';
import type { Meeting, User, Task } from '../types';
import { Modal } from '../components/ui/Modal';
import {
  Calendar as CalendarIcon,
  Plus,
  Video,
  Clock,
  MapPin,
  Users,
  CheckSquare,
  FileText,
  ExternalLink,
  Edit3,
  Trash2,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { PageLoader, ButtonSpinner } from '../components/ui/LoadingSpinner';

interface MeetingsPageProps {
  initialTaskForMeeting?: Task | null;
  onClearInitialTask?: () => void;
}

export const MeetingsPage: React.FC<MeetingsPageProps> = ({
  initialTaskForMeeting,
  onClearInitialTask,
}) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Schedule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/crm-sync');
  const [location, setLocation] = useState('Online / Google Meet');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);

  // Edit / Reschedule Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMeetingId, setEditMeetingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAgenda, setEditAgenda] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editDuration, setEditDuration] = useState('30');
  const [editMeetingLink, setEditMeetingLink] = useState('');
  const [editLocation, setEditLocation] = useState('Online / Google Meet');

  // Delete Confirmation Modal
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);

  // Role Permissions: Admin, Manager or users with MEETING_SCHEDULE permission
  const canManageMeetings =
    user?.roleName === 'ROLE_ADMIN' ||
    user?.roleName === 'ROLE_MANAGER' ||
    user?.permissions?.includes('MEETING_SCHEDULE');

  // Selected Meeting Details & AI
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [aiActionItems, setAiActionItems] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialTaskForMeeting) {
      setTitle(`Resolve Blockers on ${initialTaskForMeeting.taskCode}`);
      setAgenda(initialTaskForMeeting.description || 'Discuss open blockers and integration points.');
      setSelectedTaskId(String(initialTaskForMeeting.id));
      setIsModalOpen(true);
      if (onClearInitialTask) onClearInitialTask();
    }
  }, [initialTaskForMeeting]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, u, t] = await Promise.all([
        meetingApi.getAll(),
        userApi.getUsers(),
        taskApi.getTasks(),
      ]);
      setMeetings(m);
      setUsers(u);
      setTasks(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startIso = startTime ? new Date(startTime).toISOString() : new Date(Date.now() + 3600000).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + Number(duration) * 60000).toISOString();

      const created = await meetingApi.scheduleMeeting({
        title,
        agenda,
        startTime: startIso,
        endTime: endIso,
        durationMinutes: Number(duration),
        meetingLink,
        location,
        linkedTaskId: selectedTaskId ? Number(selectedTaskId) : undefined,
        attendeeIds: selectedAttendees,
      });

      setMeetings((prev) => [...prev, created]);
      setIsModalOpen(false);
      setTitle('');
      setAgenda('');
      showToast('Meeting scheduled successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (m: Meeting) => {
    setEditMeetingId(m.id);
    setEditTitle(m.title);
    setEditAgenda(m.agenda || '');
    try {
      const d = new Date(m.startTime);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setEditStartTime(d.toISOString().slice(0, 16));
    } catch {
      setEditStartTime('');
    }
    setEditDuration(String(m.durationMinutes || 30));
    setEditMeetingLink(m.meetingLink || 'https://meet.google.com/crm-sync');
    setEditLocation(m.location || 'Online / Google Meet');
    setIsEditModalOpen(true);
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeetingId) return;
    try {
      const startIso = editStartTime ? new Date(editStartTime).toISOString() : new Date().toISOString();
      const endIso = new Date(new Date(startIso).getTime() + Number(editDuration) * 60000).toISOString();
      const updated = await meetingApi.updateMeeting(editMeetingId, {
        title: editTitle,
        agenda: editAgenda,
        startTime: startIso,
        endTime: endIso,
        durationMinutes: Number(editDuration),
        meetingLink: editMeetingLink,
        location: editLocation,
      });
      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      if (activeMeeting?.id === updated.id) {
        setActiveMeeting(updated);
      }
      setIsEditModalOpen(false);
      showToast('Meeting updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update meeting');
    }
  };

  const handleDeleteMeeting = async (id: number) => {
    try {
      await meetingApi.deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      if (activeMeeting?.id === id) {
        setActiveMeeting(null);
      }
      setMeetingToDelete(null);
      showToast('Meeting deleted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete meeting');
    }
  };

  const handleGenerateAiNotes = async (meeting: Meeting) => {
    setIsGeneratingAi(true);
    try {
      const res = await aiApi.generate('ACTION_ITEMS', (meeting.agenda || '') + ' ' + (meetingNotes || ''));
      if (res.items && res.items.length > 0) {
        setAiActionItems((prev) => Array.from(new Set([...prev, ...res.items])));
      }
      if (res.result) {
        setMeetingNotes((prev) => (prev ? prev + '\n\n' + res.result : res.result));
      }
      showToast('AI Action items & summary extracted!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeMeeting) return;
    try {
      const updated = await meetingApi.updateNotes(activeMeeting.id, meetingNotes);
      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setActiveMeeting(updated);
      showToast('Meeting notes saved successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvertActionItemToTask = async (itemText: string) => {
    try {
      const created = await taskApi.createTask({
        title: itemText,
        description: `Generated from Action Items in meeting "${activeMeeting?.title}".`,
        type: 'FEATURE',
        priority: 'HIGH',
      });
      showToast(`Created task ${created.taskCode} from action item!`);
    } catch (e) {
      console.error(e);
    }
  };

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
          <h1 className="text-xl font-bold text-text-primary">Team Meetings & Action Items</h1>
          <p className="text-xs text-text-secondary mt-1">
            Schedule meetings, resolve blockers, edit schedules, and auto-generate tasks with Gemini AI.
          </p>
        </div>

        {canManageMeetings && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        )}
      </div>

      {/* Grid: Meetings List & Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meetings List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <PageLoader message="Loading calendar meetings & sync sessions..." />
          ) : meetings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-border-custom text-text-secondary text-xs">
              No meetings scheduled yet. Click "Schedule Meeting" to get started.
            </div>
          ) : (
            meetings.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setActiveMeeting(m);
                  setMeetingNotes(m.notes || '');
                }}
                className={`p-5 bg-white rounded-2xl border border-border-custom shadow-xs hover:shadow-soft transition-all cursor-pointer ${activeMeeting?.id === m.id ? 'ring-2 ring-primary/40' : ''
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-text-primary">{m.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold bg-purple-100 text-primary px-2.5 py-0.5 rounded-full">
                      {m.status}
                    </span>
                    {canManageMeetings && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(m);
                          }}
                          className="p-1 text-text-secondary hover:text-primary hover:bg-purple-50 rounded cursor-pointer transition-colors"
                          title="Edit / Reschedule Meeting"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMeetingToDelete(m);
                          }}
                          className="p-1 text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                          title="Delete Meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 mb-3">{m.agenda}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary pt-3 border-t border-border-custom">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {new Date(m.startTime).toLocaleDateString()} at{' '}
                      {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      ({m.durationMinutes}m)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-accent-pink" />
                    <span>{m.attendeeNames.length} Attendees</span>
                  </div>

                  {m.meetingLink && (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 font-bold text-primary hover:underline ml-auto"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Call
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Meeting Minutes & Action Items */}
        <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-custom">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-text-primary">Meeting Notes</h3>
            </div>
            {activeMeeting && (
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={() => handleGenerateAiNotes(activeMeeting)}
                className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-primary hover:text-primary-hover font-bold text-[11px] rounded-lg transition-all cursor-pointer disabled:opacity-50"
                title="Extract Action Items with Gemini AI"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                )}
                <span>AI Assist</span>
              </button>
            )}
          </div>

          {activeMeeting ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-text-secondary font-semibold">Organizer:</span>{' '}
                  <span className="text-text-primary font-bold">{activeMeeting.organizerName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(activeMeeting)}
                    className="p-1 hover:bg-purple-50 text-text-secondary hover:text-primary rounded cursor-pointer"
                    title="Reschedule / Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMeetingToDelete(activeMeeting)}
                    className="p-1 hover:bg-rose-50 text-text-secondary hover:text-rose-600 rounded cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-semibold mb-1">
                  Meeting Minutes / Notes
                </label>
                <textarea
                  rows={5}
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Record key takeaways, decisions and discussion highlights..."
                  className="w-full p-2.5 bg-purple-50 text-text-primary rounded-xl border border-border-custom outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveNotes}
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save Notes
              </button>

              {/* <div className="pt-3 border-t border-border-custom">
                <span className="font-bold text-text-secondary uppercase block mb-2">
                  Action Items (Convert to Task)
                </span>
                <div className="space-y-2">
                  {aiActionItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-purple-50/80 rounded-xl flex items-center justify-between gap-2 border border-purple-100">
                      <span className="text-[11px] leading-snug">{item}</span>
                      <button
                        onClick={() => handleConvertActionItemToTask(item)}
                        className="px-2 py-1 bg-white hover:bg-purple-100 text-primary font-bold rounded-md shadow-2xs shrink-0 cursor-pointer text-[10px]"
                      >
                        + Task
                      </button>
                    </div>
                  ))}
                  <div className="p-2.5 bg-purple-50 rounded-xl flex items-center justify-between">
                    <span>Draft WebSocket reconnection handler</span>
                    <button
                      onClick={() => handleConvertActionItemToTask('Draft WebSocket reconnection handler')}
                      className="px-2 py-1 bg-white hover:bg-purple-100 text-primary font-bold rounded-md shadow-2xs cursor-pointer text-[10px]"
                    >
                      + Task
                    </button>
                  </div>
                  <div className="p-2.5 bg-purple-50 rounded-xl flex items-center justify-between">
                    <span>Finalize PostgreSQL enum migrations</span>
                    <button
                      onClick={() => handleConvertActionItemToTask('Finalize PostgreSQL enum migrations')}
                      className="px-2 py-1 bg-white hover:bg-purple-100 text-primary font-bold rounded-md shadow-2xs cursor-pointer text-[10px]"
                    >
                      + Task
                    </button>
                  </div>
                </div>
              </div> */}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-text-secondary">
              Select a meeting from the list to view or edit notes and action items.
            </div>
          )}
        </div>
      </div>

      {/* SCHEDULE MEETING MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Team Meeting"
      >
        <form onSubmit={handleSchedule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Meeting Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint 42 API Alignment"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Agenda / Discussion Goals</label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Key questions to answer..."
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Duration (Mins)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                <option value="15">15 mins</option>
                <option value="30">30 mins</option>
                <option value="45">45 mins</option>
                <option value="60">60 mins</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Meeting Link (Meet/Zoom)</label>
            <input
              type="text"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Invite Team Members</label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-purple-50 p-2 rounded-xl border border-border-custom">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedAttendees.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAttendees((prev) => [...prev, u.id]);
                      } else {
                        setSelectedAttendees((prev) => prev.filter((id) => id !== u.id));
                      }
                    }}
                    className="accent-primary"
                  />
                  <span>
                    {u.fullName} ({u.teamTag || u.roleName.replace('ROLE_', '')})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Confirm & Send Invites
          </button>
        </form>
      </Modal>

      {/* EDIT / RESCHEDULE MEETING MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit / Reschedule Meeting"
      >
        <form onSubmit={handleUpdateMeeting} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Meeting Title</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Agenda / Discussion Goals</label>
            <textarea
              rows={3}
              value={editAgenda}
              onChange={(e) => setEditAgenda(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Date & Time (Reschedule)</label>
              <input
                type="datetime-local"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Duration (Mins)</label>
              <select
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                <option value="15">15 mins</option>
                <option value="30">30 mins</option>
                <option value="45">45 mins</option>
                <option value="60">60 mins</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Meeting Link (Meet/Zoom)</label>
            <input
              type="text"
              value={editMeetingLink}
              onChange={(e) => setEditMeetingLink(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Location</label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Save Meeting Changes
          </button>
        </form>
      </Modal>

      {/* CONFIRM DELETE MEETING MODAL */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-custom space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-text-primary">Delete Meeting?</h3>
              <p className="text-xs text-text-secondary">
                Are you sure you want to cancel and delete <span className="font-bold text-text-primary">"{meetingToDelete.title}"</span>? All meeting notes will be removed.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-text-secondary font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Keep Meeting
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMeeting(meetingToDelete.id)}
                className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Delete Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
