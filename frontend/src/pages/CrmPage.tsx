import React, { useState, useEffect } from 'react';
import { crmApi, aiApi, userApi } from '../services/api';
import { Lead, Customer, Deal, User } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Briefcase,
  Users,
  DollarSign,
  Plus,
  Sparkles,
  Mail,
  Phone,
  Building,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const CrmPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'deals' | 'customers'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Summary Modal
  const [aiSummaryModal, setAiSummaryModal] = useState<{ isOpen: boolean; title: string; content: string; bullets: string[] }>({
    isOpen: false,
    title: '',
    content: '',
    bullets: [],
  });
  const [aiLoading, setAiLoading] = useState(false);

  // Create Modals
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);

  // New Lead Form
  const [leadFirstName, setLeadFirstName] = useState('');
  const [leadLastName, setLeadLastName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSource, setLeadSource] = useState('WEBSITE');
  const [leadNotes, setLeadNotes] = useState('');
  const [leadAssignee, setLeadAssignee] = useState('');

  // New Deal Form
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('15000');
  const [dealStage, setDealStage] = useState('PROSPECT');
  const [dealCloseDate, setDealCloseDate] = useState('');
  const [dealNotes, setDealNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [l, d, c, u] = await Promise.all([
        crmApi.getLeads(),
        crmApi.getDeals(),
        crmApi.getCustomers(),
        userApi.getUsers(),
      ]);
      setLeads(l);
      setDeals(d);
      setCustomers(c);
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAiSummarizeLead = async (lead: Lead) => {
    setAiLoading(true);
    setAiSummaryModal({
      isOpen: true,
      title: `Gemini AI Insights: ${lead.firstName} ${lead.lastName || ''} (${lead.company || 'Lead'})`,
      content: 'Synthesizing meeting notes and qualification intent...',
      bullets: [],
    });
    try {
      const res = await aiApi.generate('LEAD_SUMMARY', `${lead.firstName} ${lead.company}: ${lead.notes || ''}`);
      setAiSummaryModal({
        isOpen: true,
        title: `Gemini AI Insights: ${lead.firstName} ${lead.lastName || ''}`,
        content: res.result,
        bullets: res.items || [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await crmApi.createLead({
        firstName: leadFirstName,
        lastName: leadLastName,
        company: leadCompany,
        email: leadEmail,
        phone: leadPhone,
        source: leadSource,
        notes: leadNotes,
        assignedToId: leadAssignee ? Number(leadAssignee) : undefined,
      });
      setLeads((prev) => [created, ...prev]);
      setIsLeadModalOpen(false);
      setLeadFirstName('');
      setLeadLastName('');
      setLeadCompany('');
      setLeadEmail('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await crmApi.createDeal({
        title: dealTitle,
        dealValue: Number(dealValue),
        stage: dealStage,
        expectedCloseDate: dealCloseDate || undefined,
        notes: dealNotes,
      });
      setDeals((prev) => [created, ...prev]);
      setIsDealModalOpen(false);
      setDealTitle('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDealStage = async (dealId: number, newStage: string) => {
    try {
      const updated = await crmApi.updateDealStage(dealId, newStage);
      setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
    } catch (e) {
      console.error(e);
    }
  };

  const dealStages = ['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border-custom shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'leads'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-purple-50 text-text-secondary hover:text-text-primary'
            }`}
          >
            Leads Pipeline ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'deals'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-purple-50 text-text-secondary hover:text-text-primary'
            }`}
          >
            Deals Pipeline ({deals.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'customers'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-purple-50 text-text-secondary hover:text-text-primary'
            }`}
          >
            Accounts ({customers.length})
          </button>
        </div>

        <div>
          {activeTab === 'leads' && (
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          )}
          {activeTab === 'deals' && (
            <button
              onClick={() => setIsDealModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Deal
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: LEADS LIST */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-2xl border border-border-custom shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50 text-text-secondary font-bold uppercase tracking-wider border-b border-border-custom">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Company</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Assigned To</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-primary" />
                        <span>{lead.company || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      <div>{lead.email}</div>
                      <div className="text-[11px] text-gray-400">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-medium">
                      {lead.assignedToName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleAiSummarizeLead(lead)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-primary rounded-lg text-xs font-bold border border-purple-200 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
                        <span>AI Insights</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEALS PIPELINE KANBAN */}
      {activeTab === 'deals' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {dealStages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.dealValue || 0), 0);
            return (
              <div
                key={stage}
                className="bg-purple-50/40 rounded-2xl border border-border-custom p-3 flex flex-col min-h-[450px]"
              >
                <div className="pb-3 border-b border-border-custom mb-3 px-1">
                  <div className="font-bold text-xs text-text-primary uppercase tracking-wider">
                    {stage}
                  </div>
                  <div className="text-xs font-mono font-bold text-primary mt-1">
                    ${stageTotal.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white p-3.5 rounded-xl border border-border-custom shadow-xs hover:shadow-soft transition-all space-y-2"
                    >
                      <h5 className="font-bold text-xs text-text-primary">{deal.title}</h5>
                      <div className="text-xs font-mono font-black text-emerald-600">
                        ${Number(deal.dealValue).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {deal.customerName || deal.leadName}
                      </div>

                      {/* Move Stage Actions */}
                      <div className="pt-2 border-t border-border-custom flex gap-1 justify-between text-[10px]">
                        {stage !== 'PROPOSAL' && (
                          <button
                            onClick={() => handleUpdateDealStage(deal.id, 'PROPOSAL')}
                            className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold"
                          >
                            Proposal
                          </button>
                        )}
                        {stage !== 'WON' && (
                          <button
                            onClick={() => handleUpdateDealStage(deal.id, 'WON')}
                            className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold"
                          >
                            Won
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: CUSTOMERS DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-primary">{c.companyName}</span>
                <span className="text-[10px] uppercase font-bold bg-purple-100 text-primary px-2 py-0.5 rounded-full">
                  {c.industry || 'Account'}
                </span>
              </div>
              <div className="text-xs text-text-secondary space-y-1">
                <div>Primary Contact: <span className="font-semibold text-text-primary">{c.primaryContactName}</span></div>
                <div>Email: <span className="text-primary">{c.primaryContactEmail}</span></div>
                <div>Manager: {c.accountManagerName || 'Shared'}</div>
              </div>
              {c.website && (
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary font-semibold hover:underline block pt-1"
                >
                  Visit Website &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Summary Modal */}
      <Modal
        isOpen={aiSummaryModal.isOpen}
        onClose={() => setAiSummaryModal((prev) => ({ ...prev, isOpen: false }))}
        title={aiSummaryModal.title}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-text-primary leading-relaxed">
            {aiSummaryModal.content}
          </div>

          {aiSummaryModal.bullets.length > 0 && (
            <div>
              <div className="font-bold text-text-primary uppercase mb-2">Key Takeaways:</div>
              <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                {aiSummaryModal.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {/* CREATE LEAD MODAL */}
      <Modal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        title="Add New Sales Lead"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">First Name</label>
              <input
                type="text"
                required
                value={leadFirstName}
                onChange={(e) => setLeadFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Last Name</label>
              <input
                type="text"
                value={leadLastName}
                onChange={(e) => setLeadLastName(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Company</label>
            <input
              type="text"
              required
              value={leadCompany}
              onChange={(e) => setLeadCompany(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="email"
                required
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone</label>
              <input
                type="text"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Notes & Requirements</label>
            <textarea
              rows={3}
              value={leadNotes}
              onChange={(e) => setLeadNotes(e.target.value)}
              placeholder="Budget, seat requirements, tech stack..."
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs"
          >
            Create Lead
          </button>
        </form>
      </Modal>

      {/* CREATE DEAL MODAL */}
      <Modal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        title="Create Revenue Deal"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Deal Title</label>
            <input
              type="text"
              required
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              placeholder="e.g. 50-Seat Annual Contract"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Value (USD)</label>
              <input
                type="number"
                required
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Initial Stage</label>
              <select
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                <option value="PROSPECT">Prospect</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Target Close Date</label>
            <input
              type="date"
              value={dealCloseDate}
              onChange={(e) => setDealCloseDate(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs"
          >
            Create Deal
          </button>
        </form>
      </Modal>
    </div>
  );
};
