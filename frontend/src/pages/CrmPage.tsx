import React, { useState, useEffect } from 'react';
import { crmApi, userApi, masterApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lead, Customer, Deal, User, MasterItem } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { MultiSelectUserDropdown } from '../components/ui/MultiSelectUserDropdown';
import {
  Briefcase,
  Users,
  DollarSign,
  Plus,
  Mail,
  Phone,
  Building,
  ArrowRight,
  TrendingUp,
  Edit3,
  Trash2,
  Lock,
} from 'lucide-react';
import { PageLoader, ButtonSpinner, TableLoader } from '../components/ui/LoadingSpinner';

interface CrmPageProps {
  searchTerm?: string;
}

export const CrmPage: React.FC<CrmPageProps> = ({ searchTerm }) => {
  const { user } = useAuth();
  const isAdmin = user?.roleName === 'ROLE_ADMIN';

  const [activeTab, setActiveTab] = useState<'leads' | 'deals' | 'customers'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [dealAssigneeIds, setDealAssigneeIds] = useState<number[]>([]);

  // Customer Form (Create & Edit)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerCompanyName, setCustomerCompanyName] = useState('');
  const [customerIndustry, setCustomerIndustry] = useState('');
  const [customerWebsite, setCustomerWebsite] = useState('');
  const [customerContactName, setCustomerContactName] = useState('');
  const [customerContactEmail, setCustomerContactEmail] = useState('');
  const [customerContactPhone, setCustomerContactPhone] = useState('');
  const [customerManagerIds, setCustomerManagerIds] = useState<number[]>([]);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustomerCompanyName, setEditCustomerCompanyName] = useState('');
  const [editCustomerIndustry, setEditCustomerIndustry] = useState('');
  const [editCustomerWebsite, setEditCustomerWebsite] = useState('');
  const [editCustomerContactName, setEditCustomerContactName] = useState('');
  const [editCustomerContactEmail, setEditCustomerContactEmail] = useState('');
  const [editCustomerContactPhone, setEditCustomerContactPhone] = useState('');
  const [editCustomerManagerIds, setEditCustomerManagerIds] = useState<number[]>([]);

  // Edit Lead Modal State
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editLeadFirstName, setEditLeadFirstName] = useState('');
  const [editLeadLastName, setEditLeadLastName] = useState('');
  const [editLeadCompany, setEditLeadCompany] = useState('');
  const [editLeadEmail, setEditLeadEmail] = useState('');
  const [editLeadPhone, setEditLeadPhone] = useState('');
  const [editLeadStatus, setEditLeadStatus] = useState('NEW');
  const [editLeadNotes, setEditLeadNotes] = useState('');
  const [editLeadAssignee, setEditLeadAssignee] = useState('');

  // Edit Deal Modal State
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editDealTitle, setEditDealTitle] = useState('');
  const [editDealValue, setEditDealValue] = useState('15000');
  const [editDealStage, setEditDealStage] = useState('PROSPECT');
  const [editDealCloseDate, setEditDealCloseDate] = useState('');
  const [editDealNotes, setEditDealNotes] = useState('');
  const [editDealAssigneeIds, setEditDealAssigneeIds] = useState<number[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [leadStatusMasters, setLeadStatusMasters] = useState<MasterItem[]>([]);
  const [dealStageMasters, setDealStageMasters] = useState<MasterItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [l, d, c, u, leadStatuses, dealStagesData] = await Promise.all([
        crmApi.getLeads(),
        crmApi.getDeals(),
        crmApi.getCustomers(),
        userApi.getUsers(),
        masterApi.getMasters('LEAD_STATUS').catch(() => []),
        masterApi.getMasters('DEAL_STAGE').catch(() => []),
      ]);
      setLeads(l);
      setDeals(d);
      setCustomers(c);
      setUsers(u);
      if (leadStatuses && leadStatuses.length > 0) {
        setLeadStatusMasters(leadStatuses.filter((m) => m.isActive !== false));
      }
      if (dealStagesData && dealStagesData.length > 0) {
        setDealStageMasters(dealStagesData.filter((m) => m.isActive !== false));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const availableLeadStatuses = leadStatusMasters.length > 0
    ? leadStatusMasters.map((m) => ({ code: m.keyCode || m.name.toUpperCase(), name: m.name }))
    : [
        { code: 'NEW', name: 'New Lead' },
        { code: 'CONTACTED', name: 'Contacted' },
        { code: 'QUALIFIED', name: 'Qualified' },
        { code: 'PROPOSAL', name: 'Proposal Sent' },
        { code: 'WON', name: 'Closed Won' },
        { code: 'LOST', name: 'Lost' },
      ];

  const availableDealStages = dealStageMasters.length > 0
    ? dealStageMasters.map((m) => ({ code: m.keyCode || m.name.toUpperCase(), name: m.name }))
    : [
        { code: 'PROSPECT', name: 'Prospect' },
        { code: 'PROPOSAL', name: 'Proposal' },
        { code: 'NEGOTIATION', name: 'Negotiation' },
        { code: 'WON', name: 'Closed Won' },
        { code: 'LOST', name: 'Closed Lost' },
      ];


  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
      alert('Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setEditLeadFirstName(lead.firstName);
    setEditLeadLastName(lead.lastName || '');
    setEditLeadCompany(lead.company || '');
    setEditLeadEmail(lead.email || '');
    setEditLeadPhone(lead.phone || '');
    setEditLeadStatus(lead.status);
    setEditLeadNotes(lead.notes || '');
    setEditLeadAssignee(lead.assignedToId ? String(lead.assignedToId) : '');
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setIsSubmitting(true);
    try {
      const updated = await crmApi.updateLead(editingLead.id, {
        firstName: editLeadFirstName,
        lastName: editLeadLastName,
        company: editLeadCompany,
        email: editLeadEmail,
        phone: editLeadPhone,
        status: editLeadStatus,
        notes: editLeadNotes,
        assignedToId: editLeadAssignee ? Number(editLeadAssignee) : undefined,
      });
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setEditingLead(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await crmApi.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete lead');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await crmApi.createCustomer({
        companyName: customerCompanyName,
        industry: customerIndustry,
        website: customerWebsite,
        primaryContactName: customerContactName,
        primaryContactEmail: customerContactEmail,
        primaryContactPhone: customerContactPhone,
        assignedUserIds: customerManagerIds,
        accountManagerId: customerManagerIds.length > 0 ? customerManagerIds[0] : undefined,
      });
      setCustomers((prev) => [created, ...prev]);
      setIsCustomerModalOpen(false);
      setCustomerCompanyName('');
      setCustomerIndustry('');
      setCustomerWebsite('');
      setCustomerContactName('');
      setCustomerContactEmail('');
      setCustomerContactPhone('');
      setCustomerManagerIds([]);
    } catch (e) {
      console.error(e);
      alert('Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setEditCustomerCompanyName(c.companyName);
    setEditCustomerIndustry(c.industry || '');
    setEditCustomerWebsite(c.website || '');
    setEditCustomerContactName(c.primaryContactName || '');
    setEditCustomerContactEmail(c.primaryContactEmail || '');
    setEditCustomerContactPhone(c.primaryContactPhone || '');
    const ids = c.assignedUserIds && c.assignedUserIds.length > 0
      ? c.assignedUserIds
      : c.accountManagerId ? [c.accountManagerId] : [];
    setEditCustomerManagerIds(ids);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSubmitting(true);
    try {
      const updated = await crmApi.updateCustomer(editingCustomer.id, {
        companyName: editCustomerCompanyName,
        industry: editCustomerIndustry,
        website: editCustomerWebsite,
        primaryContactName: editCustomerContactName,
        primaryContactEmail: editCustomerContactEmail,
        primaryContactPhone: editCustomerContactPhone,
        assignedUserIds: editCustomerManagerIds,
        accountManagerId: editCustomerManagerIds.length > 0 ? editCustomerManagerIds[0] : undefined,
      });
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCustomer(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await crmApi.createDeal({
        title: dealTitle,
        dealValue: Number(dealValue),
        stage: dealStage,
        expectedCloseDate: dealCloseDate || undefined,
        notes: dealNotes,
        assignedUserIds: dealAssigneeIds,
        assignedToId: dealAssigneeIds.length > 0 ? dealAssigneeIds[0] : undefined,
      });
      setDeals((prev) => [created, ...prev]);
      setIsDealModalOpen(false);
      setDealTitle('');
      setDealAssigneeIds([]);
    } catch (e) {
      console.error(e);
      alert('Failed to create deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditDealTitle(deal.title);
    setEditDealValue(String(deal.dealValue));
    setEditDealStage(deal.stage);
    setEditDealCloseDate(deal.expectedCloseDate ? deal.expectedCloseDate.substring(0, 10) : '');
    setEditDealNotes(deal.notes || '');
    const ids = deal.assignedUserIds && deal.assignedUserIds.length > 0
      ? deal.assignedUserIds
      : deal.assignedToId ? [deal.assignedToId] : [];
    setEditDealAssigneeIds(ids);
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    setIsSubmitting(true);
    try {
      const updated = await crmApi.updateDeal(editingDeal.id, {
        title: editDealTitle,
        dealValue: Number(editDealValue),
        stage: editDealStage,
        expectedCloseDate: editDealCloseDate || undefined,
        notes: editDealNotes,
        assignedUserIds: editDealAssigneeIds,
        assignedToId: editDealAssigneeIds.length > 0 ? editDealAssigneeIds[0] : undefined,
      });
      setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setEditingDeal(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeal = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    try {
      await crmApi.deleteDeal(id);
      setDeals((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete deal');
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer account?')) return;
    try {
      await crmApi.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete customer');
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

  const dealStages = availableDealStages.map((s) => s.code);

  const query = searchTerm?.trim().toLowerCase() || '';

  const filteredLeads = query
    ? leads.filter(
        (l) =>
          l.firstName?.toLowerCase().includes(query) ||
          (l.lastName || '')?.toLowerCase().includes(query) ||
          (l.company || '')?.toLowerCase().includes(query) ||
          (l.email || '')?.toLowerCase().includes(query) ||
          (l.status || '')?.toLowerCase().includes(query)
      )
    : leads;

  const filteredDeals = query
    ? deals.filter(
        (d) =>
          d.title?.toLowerCase().includes(query) ||
          (d.customerName || '')?.toLowerCase().includes(query) ||
          (d.leadName || '')?.toLowerCase().includes(query) ||
          (d.stage || '')?.toLowerCase().includes(query)
      )
    : deals;

  const filteredCustomers = query
    ? customers.filter(
        (c) =>
          c.companyName?.toLowerCase().includes(query) ||
          (c.primaryContactName || '')?.toLowerCase().includes(query) ||
          (c.primaryContactEmail || '')?.toLowerCase().includes(query) ||
          (c.industry || '')?.toLowerCase().includes(query)
      )
    : customers;

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-white p-12 rounded-2xl border border-border-custom text-center shadow-xs">
          <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-text-primary">Admin Access Required</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
            Client accounts and financial deals are restricted to Administrator accounts.
          </p>
        </div>
      </div>
    );
  }

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
            Leads Pipeline ({filteredLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'deals'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-purple-50 text-text-secondary hover:text-text-primary'
            }`}
          >
            Deals Pipeline ({filteredDeals.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'customers'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-purple-50 text-text-secondary hover:text-text-primary'
            }`}
          >
            Accounts ({filteredCustomers.length})
          </button>
        </div>

        <div>
          {activeTab === 'leads' && (
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          )}
          {activeTab === 'deals' && (
            <button
              onClick={() => setIsDealModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Deal
            </button>
          )}
          {activeTab === 'customers' && (
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Client
            </button>
          )}
        </div>
      </div>

      {/* Loading State or Tab Content */}
      {loading ? (
        <PageLoader message="Loading CRM pipelines, leads and accounts..." />
      ) : activeTab === 'leads' ? (
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
                {filteredLeads.map((lead) => (
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
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditLead(lead)}
                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-primary rounded-lg text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
                        title="Edit Lead"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'deals' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {dealStages.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage);
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
                      <div className="flex items-center justify-between text-[11px] text-text-secondary gap-2">
                        <span className="truncate">{deal.customerName || deal.leadName}</span>
                        {deal.assignedUserNames && deal.assignedUserNames.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {deal.assignedUserNames.map((name, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 shrink-0"
                              >
                                👤 {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                            {deal.assignedToName ? `👤 ${deal.assignedToName}` : 'Unassigned'}
                          </span>
                        )}
                      </div>

                      {/* Move Stage Actions */}
                      <div className="pt-2 border-t border-border-custom flex gap-1 justify-between items-center text-[10px]">
                        <div className="flex gap-1">
                          {stage !== 'PROPOSAL' && (
                            <button
                              onClick={() => handleUpdateDealStage(deal.id, 'PROPOSAL')}
                              className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold cursor-pointer"
                            >
                              Proposal
                            </button>
                          )}
                          {stage !== 'WON' && (
                            <button
                              onClick={() => handleUpdateDealStage(deal.id, 'WON')}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold cursor-pointer"
                            >
                              Won
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditDeal(deal)}
                            className="p-1 text-text-secondary hover:text-primary rounded cursor-pointer"
                            title="Edit Deal"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="p-1 text-text-secondary hover:text-rose-600 rounded cursor-pointer"
                            title="Delete Deal"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-primary">{c.companyName}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold bg-purple-100 text-primary px-2 py-0.5 rounded-full">
                    {c.industry || 'Account'}
                  </span>
                  <button
                    onClick={() => handleOpenEditCustomer(c)}
                    className="p-1 text-text-secondary hover:text-primary rounded transition-colors cursor-pointer"
                    title="Edit Client / Assign Manager"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(c.id)}
                    className="p-1 text-text-secondary hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-text-secondary space-y-1">
                <div>Primary Contact: <span className="font-semibold text-text-primary">{c.primaryContactName}</span></div>
                <div>Email: <span className="text-primary">{c.primaryContactEmail}</span></div>
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  <span className="text-text-secondary font-medium">Assigned Team:</span>
                  {c.assignedUserNames && c.assignedUserNames.length > 0 ? (
                    c.assignedUserNames.map((name, i) => (
                      <span
                        key={i}
                        className="font-bold text-primary bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200"
                      >
                        👤 {name}
                      </span>
                    ))
                  ) : (
                    <span className="font-bold text-primary bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200">
                      {c.accountManagerName ? `👤 ${c.accountManagerName}` : 'Unassigned'}
                    </span>
                  )}
                </div>
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
            <label className="block font-semibold mb-1">Assign Lead To (Manager / Employee)</label>
            <select
              value={leadAssignee}
              onChange={(e) => setLeadAssignee(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            >
              <option value="">-- Select Assignee --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.roleName ? u.roleName.replace('ROLE_', '') : 'Member'})
                </option>
              ))}
            </select>
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
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <ButtonSpinner text="Creating Lead..." /> : 'Create Lead'}
          </button>
        </form>
      </Modal>

      {/* EDIT LEAD MODAL */}
      <Modal
        isOpen={!!editingLead}
        onClose={() => setEditingLead(null)}
        title="Edit Lead Information"
      >
        <form onSubmit={handleUpdateLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">First Name</label>
              <input
                type="text"
                required
                value={editLeadFirstName}
                onChange={(e) => setEditLeadFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Last Name</label>
              <input
                type="text"
                value={editLeadLastName}
                onChange={(e) => setEditLeadLastName(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Company / Organization</label>
            <input
              type="text"
              value={editLeadCompany}
              onChange={(e) => setEditLeadCompany(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="email"
                value={editLeadEmail}
                onChange={(e) => setEditLeadEmail(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone</label>
              <input
                type="text"
                value={editLeadPhone}
                onChange={(e) => setEditLeadPhone(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Status</label>
              <select
                value={editLeadStatus}
                onChange={(e) => setEditLeadStatus(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                {availableLeadStatuses.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Assign Lead To</label>
              <select
                value={editLeadAssignee}
                onChange={(e) => setEditLeadAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.roleName ? u.roleName.replace('ROLE_', '') : 'Member'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Notes</label>
            <textarea
              rows={3}
              value={editLeadNotes}
              onChange={(e) => setEditLeadNotes(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <ButtonSpinner text="Updating Lead..." /> : 'Update Lead'}
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
                {availableDealStages.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
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

          <MultiSelectUserDropdown
            label="Assign Deal Members"
            sublabel="(Managers & Employees)"
            placeholder="Select managers and employees..."
            users={users}
            selectedIds={dealAssigneeIds}
            onChange={setDealAssigneeIds}
            accentColor="purple"
          />

          <div>
            <label className="block font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={dealNotes}
              onChange={(e) => setDealNotes(e.target.value)}
              placeholder="Deal details, terms, special requests..."
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <ButtonSpinner text="Creating Deal..." /> : 'Create Deal'}
          </button>
        </form>
      </Modal>

      {/* EDIT DEAL MODAL */}
      <Modal
        isOpen={!!editingDeal}
        onClose={() => setEditingDeal(null)}
        title="Edit Revenue Deal"
      >
        <form onSubmit={handleUpdateDeal} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Deal Title</label>
            <input
              type="text"
              required
              value={editDealTitle}
              onChange={(e) => setEditDealTitle(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Value (USD)</label>
              <input
                type="number"
                required
                value={editDealValue}
                onChange={(e) => setEditDealValue(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Stage</label>
              <select
                value={editDealStage}
                onChange={(e) => setEditDealStage(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              >
                {dealStages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Target Close Date</label>
            <input
              type="date"
              value={editDealCloseDate}
              onChange={(e) => setEditDealCloseDate(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <MultiSelectUserDropdown
            label="Assign Deal Members"
            sublabel="(Managers & Employees)"
            placeholder="Select managers and employees..."
            users={users}
            selectedIds={editDealAssigneeIds}
            onChange={setEditDealAssigneeIds}
            accentColor="purple"
          />

          <div>
            <label className="block font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={editDealNotes}
              onChange={(e) => setEditDealNotes(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <ButtonSpinner text="Updating Deal..." /> : 'Update Deal'}
          </button>
        </form>
      </Modal>

      {/* CREATE CUSTOMER / CLIENT MODAL */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Client Account"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Company / Client Name *</label>
            <input
              type="text"
              required
              value={customerCompanyName}
              onChange={(e) => setCustomerCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Industry</label>
              <input
                type="text"
                value={customerIndustry}
                onChange={(e) => setCustomerIndustry(e.target.value)}
                placeholder="e.g. Fintech, Healthcare"
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Website</label>
              <input
                type="text"
                value={customerWebsite}
                onChange={(e) => setCustomerWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Primary Contact Name</label>
            <input
              type="text"
              value={customerContactName}
              onChange={(e) => setCustomerContactName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Contact Email</label>
              <input
                type="email"
                value={customerContactEmail}
                onChange={(e) => setCustomerContactEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={customerContactPhone}
                onChange={(e) => setCustomerContactPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          <MultiSelectUserDropdown
            label="Assign Account Team"
            sublabel="(Managers & Employees)"
            placeholder="Select managers and employees for this client..."
            users={users}
            selectedIds={customerManagerIds}
            onChange={setCustomerManagerIds}
            accentColor="purple"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <ButtonSpinner text="Creating Account..." /> : 'Create Account'}
          </button>
        </form>
      </Modal>

      {/* EDIT CUSTOMER / CLIENT MODAL */}
      <Modal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        title="Edit Client & Assign Manager"
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Company / Client Name *</label>
            <input
              type="text"
              required
              value={editCustomerCompanyName}
              onChange={(e) => setEditCustomerCompanyName(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Industry</label>
              <input
                type="text"
                value={editCustomerIndustry}
                onChange={(e) => setEditCustomerIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Website</label>
              <input
                type="text"
                value={editCustomerWebsite}
                onChange={(e) => setEditCustomerWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Primary Contact Name</label>
            <input
              type="text"
              value={editCustomerContactName}
              onChange={(e) => setEditCustomerContactName(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Contact Email</label>
              <input
                type="email"
                value={editCustomerContactEmail}
                onChange={(e) => setEditCustomerContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={editCustomerContactPhone}
                onChange={(e) => setEditCustomerContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
              />
            </div>
          </div>

          <MultiSelectUserDropdown
            label="Assign Account Team"
            sublabel="(Managers & Employees)"
            placeholder="Select managers and employees for this client..."
            users={users}
            selectedIds={editCustomerManagerIds}
            onChange={setEditCustomerManagerIds}
            accentColor="purple"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <ButtonSpinner text="Updating Account..." /> : 'Update Account & Manager'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
