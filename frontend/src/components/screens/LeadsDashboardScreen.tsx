import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';

interface LeadsDashboardScreenProps {
  setActivePage?: (page: any) => void;
}

export const LeadsDashboardScreen: React.FC<LeadsDashboardScreenProps> = ({ setActivePage }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notesText, setNotesText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
        if (selectedLead?.id === leadId) setSelectedLead(data.lead);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText })
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? data.lead : l));
        setSelectedLead(data.lead);
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error updating notes:', err);
    } finally {
      setUpdating(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchStatus = statusFilter === 'all' || lead.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q ||
      lead.firstName.toLowerCase().includes(q) ||
      lead.lastName.toLowerCase().includes(q) ||
      lead.mobile.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.currentRole.toLowerCase().includes(q) ||
      lead.industry.toLowerCase().includes(q) ||
      lead.planInterest.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Date (IST)', 'First Name', 'Last Name', 'Mobile', 'Email', 'Current Role', 'Experience', 'Industry', 'Plan Interest', 'Requirement', 'Status', 'WhatsApp Notified', 'Notes'];
    const rows = filteredLeads.map(l => {
      const notesFormatted = Array.isArray(l.notes) 
        ? l.notes.map(n => n.text).join('; ') 
        : typeof l.notes === 'string' 
        ? l.notes 
        : '';
      return [
        l.id,
        l.timestampIST || l.createdAt,
        `"${l.firstName}"`,
        `"${l.lastName}"`,
        `"${l.mobile}"`,
        `"${l.email}"`,
        `"${l.currentRole}"`,
        `"${l.experience}"`,
        `"${l.industry}"`,
        `"${l.planInterest || ''}"`,
        `"${(l.requirement || '').replace(/"/g, '""')}"`,
        l.status,
        l.whatsAppNotified ? 'Yes' : 'No',
        `"${notesFormatted.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CareerBuddies_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        
        {/* Universal Navigation Controls */}
        {setActivePage && (
          <PageNavigationControls
            onBackToHome={() => {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => {
              setActivePage('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNext={() => {
              setActivePage('counselling');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            backLabel="Admin Settings"
            nextLabel="Counselling Form"
            currentStepLabel="Lead Management Desk"
          />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e0e8ff] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-bold">
                Team Operations
              </span>
              <span className="text-xs text-[#006e29] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#79fd8d] animate-pulse" />
                Live WhatsApp Sync (+91 8890790077 / +91 9310288270)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#061b3b]">
              CareerBuddies Lead Management Desk
            </h1>
            <p className="text-xs text-[#434652] mt-0.5">
              Real-time inbound inquiries, counselling requests, and corporate mentorship leads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="p-2.5 rounded-xl border border-[#e0e8ff] hover:bg-[#f1f3ff] text-[#002869] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh leads"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 bg-[#006e29] hover:bg-[#00531d] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#e0e8ff] shadow-xs">
            <span className="text-xs font-semibold text-[#747783]">Total Inquiries</span>
            <div className="text-2xl font-bold text-[#061b3b] mt-1">{leads.length}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#e0e8ff] shadow-xs">
            <span className="text-xs font-semibold text-[#002869]">New / Uncontacted</span>
            <div className="text-2xl font-bold text-[#002869] mt-1">
              {leads.filter(l => l.status === 'new').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#e0e8ff] shadow-xs">
            <span className="text-xs font-semibold text-amber-600">In Progress / Scheduled</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {leads.filter(l => l.status === 'contacted' || l.status === 'scheduled').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#e0e8ff] shadow-xs">
            <span className="text-xs font-semibold text-[#006e29]">Enrolled / Converted</span>
            <div className="text-2xl font-bold text-[#006e29] mt-1">
              {leads.filter(l => l.status === 'converted').length}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#e0e8ff] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#747783] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, company, role..."
              className="w-full pl-10 pr-4 py-2 bg-[#f9f9ff] border border-[#e0e8ff] rounded-lg text-xs text-[#061b3b] focus:outline-none focus:border-[#002869]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#747783]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#f9f9ff] border border-[#e0e8ff] rounded-lg px-3 py-2 text-xs text-[#061b3b] focus:outline-none focus:border-[#002869]"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Converted">Converted</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl border border-[#e0e8ff] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f3ff] text-[#002869] font-bold border-b border-[#e0e8ff]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Role & Exp</th>
                  <th className="py-3 px-4">Plan / Goal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Captured (IST)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#747783]">
                      No leads match your filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => {
                    const whatsappDirectUrl = `https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.firstName}, this is CareerBuddies counselling team regarding your inquiry on ${lead.planInterest}.`)}`;

                    return (
                      <tr key={lead.id} className="hover:bg-[#f9f9ff] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#747783]">
                          {index + 1}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-[#061b3b]">
                            {lead.firstName} {lead.lastName}
                          </div>
                          <span className="text-[11px] text-[#747783]">
                            {lead.source}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-[#061b3b]">
                            <Phone className="w-3 h-3 text-[#747783]" />
                            <span>{lead.mobile}</span>
                            <a
                              href={whatsappDirectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#006e29] hover:underline ml-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 inline" />
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#434652] mt-0.5">
                            <Mail className="w-3 h-3 text-[#747783]" />
                            <a href={`mailto:${lead.email}`} className="hover:underline">
                              {lead.email}
                            </a>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-[#061b3b]">{lead.currentRole}</div>
                          <div className="text-[11px] text-[#747783]">{lead.experience} • {lead.industry}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-[#dae2ff] text-[#001947] text-[11px] font-bold">
                            {lead.planInterest}
                          </span>
                          {lead.requirement && (
                            <p className="text-[11px] text-[#434652] mt-1 line-clamp-1 max-w-[200px]" title={lead.requirement}>
                              {lead.requirement}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border capitalize ${
                              lead.status === 'new'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : lead.status === 'contacted'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : lead.status === 'scheduled'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="converted">Converted</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-[#747783] text-[11px]">
                          {lead.timestampIST || lead.createdAt}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              const existingNotes = Array.isArray(lead.notes)
                                ? lead.notes.map(n => n.text).join('\n')
                                : typeof lead.notes === 'string'
                                ? lead.notes
                                : '';
                              setNotesText(existingNotes);
                            }}
                            className="px-3 py-1 bg-[#f1f3ff] hover:bg-[#e0e8ff] text-[#002869] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Details & Notes
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Detail & Notes Modal */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e0e8ff] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-[#061b3b]">
                  Lead Details: {selectedLead.firstName} {selectedLead.lastName}
                </h3>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-[#747783] hover:text-[#061b3b] font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#747783] block">Phone:</span>
                  <span className="font-bold text-[#061b3b]">{selectedLead.mobile}</span>
                </div>
                <div>
                  <span className="text-[#747783] block">Email:</span>
                  <span className="font-bold text-[#061b3b]">{selectedLead.email}</span>
                </div>
                <div>
                  <span className="text-[#747783] block">Role / Exp:</span>
                  <span className="font-bold text-[#061b3b]">{selectedLead.currentRole} ({selectedLead.experience})</span>
                </div>
                <div>
                  <span className="text-[#747783] block">Plan / Service:</span>
                  <span className="font-bold text-[#002869]">{selectedLead.planInterest}</span>
                </div>
              </div>

              {selectedLead.requirement && (
                <div className="bg-[#f9f9ff] p-3 rounded-xl border border-[#e0e8ff]">
                  <span className="text-[11px] font-bold text-[#002869] block mb-1">Requirement / Goal:</span>
                  <p className="text-xs text-[#434652]">{selectedLead.requirement}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">
                  Team Internal Notes
                </label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Record call updates, scheduled mentor, pricing discussed..."
                  className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#e0e8ff] rounded-xl text-xs text-[#061b3b] focus:outline-none focus:border-[#002869]"
                />
              </div>

              {notesSaved && (
                <div className="p-2.5 bg-[#e8f5e9] border border-[#a5d6a7] text-[#1b5e20] text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Notes updated and saved successfully!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#434652] hover:text-[#061b3b]"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={updating}
                  className="px-4 py-2 bg-[#002869] text-white font-bold text-xs rounded-lg hover:bg-[#0b3d91]"
                >
                  {updating ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
