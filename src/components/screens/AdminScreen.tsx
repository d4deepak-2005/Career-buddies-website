import React, { useState, useEffect } from 'react';
import { Lead, WebinarItem, WebinarRegistration, SiteConfig } from '../../types';
import { DEFAULT_SITE_CONFIG, INITIAL_WEBINARS } from '../../config/siteConfig';
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  FileText, 
  Settings, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  Search, 
  ArrowRight,
  MessageSquare,
  Sparkles,
  Save
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';

interface AdminScreenProps {
  onOpenLeadDetail?: (lead: Lead) => void;
  setActivePage?: (page: any) => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ setActivePage }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'webinars' | 'settings'>('overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [webinars, setWebinars] = useState<WebinarItem[]>(INITIAL_WEBINARS);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLead, setSearchLead] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New webinar form modal state
  const [isAddingWebinar, setIsAddingWebinar] = useState(false);
  const [newWebinarTitle, setNewWebinarTitle] = useState('');
  const [newWebinarSpeaker, setNewWebinarSpeaker] = useState('');
  const [newWebinarRole, setNewWebinarRole] = useState('');
  const [newWebinarDate, setNewWebinarDate] = useState('');
  const [newWebinarTime, setNewWebinarTime] = useState('');
  const [newWebinarPrice, setNewWebinarPrice] = useState(siteConfig.webinarDefaultPriceINR);

  // Fetch leads on mount
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        if (data.leads) setLeads(data.leads);
      }
    } catch (err) {
      console.warn('Could not fetch from server, using existing state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: 'new' | 'contacted' | 'scheduled' | 'converted') => {
    try {
      await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateWebinar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebinarTitle || !newWebinarSpeaker) return;

    const newW: WebinarItem = {
      id: `web-${Date.now()}`,
      title: newWebinarTitle,
      tagline: `Interactive masterclass led by ${newWebinarSpeaker}`,
      category: 'Engineering & Architecture',
      speaker: {
        name: newWebinarSpeaker,
        role: newWebinarRole || 'Industry Leader',
        company: 'CareerBuddies Masterclass',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: 'Senior practitioner with deep industry experience.'
      },
      date: newWebinarDate || 'Saturday, Upcoming',
      time: newWebinarTime || '06:00 PM IST',
      duration: '90 Mins',
      description: 'Comprehensive masterclass covering real-world architecture and industry insights.',
      whatYouWillLearn: [
        'Core architectural patterns and trade-offs',
        'Staff-level problem solving methodology',
        'Live Q&A with speaker'
      ],
      targetAudience: ['Engineers and aspiring leaders'],
      priceINR: Number(newWebinarPrice) || siteConfig.webinarDefaultPriceINR,
      originalPriceINR: 999,
      capacity: 100,
      registeredCount: 0,
      status: 'upcoming',
      recordingIncluded: true,
      certificateProvided: true,
      badge: 'New'
    };

    setWebinars([newW, ...webinars]);
    setIsAddingWebinar(false);
    setNewWebinarTitle('');
    setNewWebinarSpeaker('');
    setNewWebinarRole('');
  };

  const exportLeadsCSV = () => {
    if (leads.length === 0) return;
    const headers = ['S.No', 'Date (IST)', 'Name', 'Mobile', 'Email', 'Role', 'Experience', 'Requirement', 'Status', 'Source'];
    const rows = leads.map(l => [
      l.serialNumber,
      `"${l.timestampIST || ''}"`,
      `"${l.fullName}"`,
      `"${l.mobile}"`,
      `"${l.email}"`,
      `"${l.currentRole || ''}"`,
      `"${l.experience || ''}"`,
      `"${(l.requirement || '').replace(/"/g, '""')}"`,
      l.status,
      l.source
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `careerbuddies-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    const matchStatus = leadStatusFilter === 'all' || l.status === leadStatusFilter;
    const q = searchLead.toLowerCase();
    const matchQ = !q ||
      l.fullName.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.mobile.includes(q) ||
      (l.requirement && l.requirement.toLowerCase().includes(q));
    return matchStatus && matchQ;
  });

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1360px] mx-auto flex flex-col gap-8">
        
        {/* Universal Navigation Controls */}
        {setActivePage && (
          <PageNavigationControls
            onBackToHome={() => {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => {
              setActivePage('leads-dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNext={() => {
              setActivePage('webinars');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            backLabel="Leads CRM"
            nextLabel="Webinars"
            currentStepLabel="Admin Control Workspace"
          />
        )}

        {/* Top Admin Header */}
        <div className="bg-[#002869] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#79fd8d] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                  CareerBuddies Admin Workspace
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#79fd8d]/20 text-[#79fd8d] text-[10px] font-bold">
                  Live Management
                </span>
              </div>
              <p className="text-xs text-[#dae2ff]">
                Central control for leads, webinars, pricing models, content, and notification dispatches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportLeadsCSV}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#002869] text-white'
                : 'bg-white text-[#434652] hover:bg-[#e0e8ff] border border-[#e0e8ff]'
            }`}
          >
            Dashboard Overview
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leads'
                ? 'bg-[#002869] text-white'
                : 'bg-white text-[#434652] hover:bg-[#e0e8ff] border border-[#e0e8ff]'
            }`}
          >
            <span>Leads & Inquiries</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#79fd8d]/30 text-[#001947] text-[10px]">
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('webinars')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'webinars'
                ? 'bg-[#002869] text-white'
                : 'bg-white text-[#434652] hover:bg-[#e0e8ff] border border-[#e0e8ff]'
            }`}
          >
            <span>Manage Webinars</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#dae2ff] text-[#001947] text-[10px]">
              {webinars.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-[#002869] text-white'
                : 'bg-white text-[#434652] hover:bg-[#e0e8ff] border border-[#e0e8ff]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Site Settings & Pricing</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-[#e0e8ff] shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-[#747783]">Total Inquiries & Leads</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-[#002869]">{leads.length}</span>
                  <span className="text-xs text-[#006e29] font-bold">Live Stream</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e0e8ff] shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-[#747783]">Scheduled Consultations</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-[#006e29]">
                    {leads.filter(l => l.status === 'scheduled').length}
                  </span>
                  <span className="text-xs text-[#747783]">In Calendar</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e0e8ff] shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-[#747783]">Active Webinars</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-[#002869]">{webinars.length}</span>
                  <span className="text-xs text-[#006e29] font-bold">Standard ₹{siteConfig.webinarDefaultPriceINR}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e0e8ff] shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-[#747783]">WhatsApp Alert Pipeline</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg font-bold text-[#006e29]">Active (2 Admins)</span>
                  <span className="text-[10px] text-[#747783]">Instant IST</span>
                </div>
              </div>
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 rounded-2xl border border-[#e0e8ff] shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#061b3b]">Recent Inquiries</h3>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className="text-xs font-bold text-[#002869] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="flex flex-col divide-y divide-gray-100">
                  {leads.slice(0, 4).map(l => (
                    <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[#061b3b] block">{l.fullName}</strong>
                        <span className="text-[11px] text-[#747783]">{l.email} • {l.mobile}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === 'scheduled' ? 'bg-[#79fd8d]/30 text-[#00531d]' : 'bg-[#dae2ff] text-[#001947]'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e0e8ff] shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#061b3b]">Webinar Management</h3>
                  <button
                    onClick={() => setActiveTab('webinars')}
                    className="text-xs font-bold text-[#002869] hover:underline"
                  >
                    Manage
                  </button>
                </div>

                <div className="flex flex-col divide-y divide-gray-100">
                  {webinars.map(w => (
                    <div key={w.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="max-w-[70%]">
                        <strong className="text-[#061b3b] block truncate">{w.title}</strong>
                        <span className="text-[11px] text-[#747783]">{w.speaker.name} • {w.date}</span>
                      </div>
                      <span className="font-extrabold text-[#006e29]">
                        ₹{w.priceINR}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: LEADS DESK */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#747783] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchLead}
                  onChange={(e) => setSearchLead(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={leadStatusFilter}
                  onChange={(e) => setLeadStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs font-semibold text-[#061b3b]"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="converted">Converted</option>
                </select>

                <button
                  onClick={fetchLeads}
                  className="px-3.5 py-2 bg-[#002869] text-white rounded-xl text-xs font-bold hover:bg-[#0b3d91] cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#f9f9ff] text-[#747783] font-bold">
                    <th className="p-3">S.No</th>
                    <th className="p-3">Lead Name & Contact</th>
                    <th className="p-3">Role & Experience</th>
                    <th className="p-3">Requirement</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Time (IST)</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#f9f9ff] transition-colors">
                      <td className="p-3 font-bold text-[#002869]">#{lead.serialNumber}</td>
                      <td className="p-3">
                        <strong className="text-[#061b3b] block">{lead.fullName}</strong>
                        <span className="text-[#747783] text-[11px] block">{lead.email}</span>
                        <span className="text-[#006e29] text-[11px] font-mono">{lead.mobile}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-[#061b3b] block">{lead.currentRole || 'N/A'}</span>
                        <span className="text-[#747783] text-[11px]">{lead.experience || 'N/A'}</span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="text-[#434652] line-clamp-2">{lead.requirement || 'Free Consultation'}</p>
                        <span className="text-[10px] text-[#747783]">Source: {lead.source}</span>
                      </td>
                      <td className="p-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-[#061b3b]"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="converted">Converted</option>
                        </select>
                      </td>
                      <td className="p-3 text-[11px] text-[#747783] whitespace-nowrap">
                        {lead.timestampIST || new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <a
                          href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(lead.firstName)}%2C%20this%20is%20CareerBuddies%20team%20following%20up%20on%20your%20career%20guidance%20request.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-[#006e29]/15 text-[#006e29] hover:bg-[#006e29] hover:text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: WEBINARS MANAGEMENT */}
        {activeTab === 'webinars' && (
          <div className="flex flex-col gap-6">
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#061b3b]">Masterclasses & Webinar Schedule</h3>
              <button
                onClick={() => setIsAddingWebinar(true)}
                className="px-4 py-2 bg-[#002869] text-white text-xs font-bold rounded-xl hover:bg-[#0b3d91] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Webinar</span>
              </button>
            </div>

            {/* Add Webinar Form Modal */}
            {isAddingWebinar && (
              <form onSubmit={handleCreateWebinar} className="p-6 rounded-2xl bg-white border border-[#cbdaff] shadow-sm flex flex-col gap-4">
                <h4 className="font-bold text-sm text-[#061b3b]">Create New Masterclass</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#061b3b] mb-1">Webinar Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Consensus in Cloud Native"
                      value={newWebinarTitle}
                      onChange={(e) => setNewWebinarTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#061b3b] mb-1">Speaker Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Elena Rostova"
                      value={newWebinarSpeaker}
                      onChange={(e) => setNewWebinarSpeaker(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#061b3b] mb-1">Speaker Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Staff Engineer @ Google"
                      value={newWebinarRole}
                      onChange={(e) => setNewWebinarRole(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#061b3b] mb-1">Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Saturday, Sep 19, 2026"
                      value={newWebinarDate}
                      onChange={(e) => setNewWebinarDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#061b3b] mb-1">Price (INR)</label>
                    <input
                      type="number"
                      value={newWebinarPrice}
                      onChange={(e) => setNewWebinarPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs font-bold text-[#006e29]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#006e29] text-white text-xs font-bold rounded-xl hover:bg-[#00531d] cursor-pointer"
                  >
                    Save & Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingWebinar(false)}
                    className="px-4 py-2 bg-gray-200 text-[#434652] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of Webinars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {webinars.map(w => (
                <div key={w.id} className="p-5 rounded-2xl bg-white border border-[#cbdaff] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#dae2ff] text-[#001947]">
                        {w.category}
                      </span>
                      <span className="text-base font-extrabold text-[#006e29]">
                        ₹{w.priceINR}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#061b3b] mb-1">{w.title}</h4>
                    <p className="text-xs text-[#747783] mb-3">Speaker: {w.speaker.name} • {w.date}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#434652]">
                    <span>Registered: {w.registeredCount}/{w.capacity}</span>
                    <span className="font-bold text-[#002869]">Live Status: Active</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 4: SETTINGS & PRICING */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#061b3b]">Central System Configuration</h3>
                <p className="text-xs text-[#747783]">
                  Changes made here update the single source of truth for pricing, addresses, and contacts across all pages.
                </p>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#79fd8d]/30 text-[#00531d] text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings Saved Successfully!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">Company Name</label>
                <input
                  type="text"
                  value={siteConfig.companyName}
                  onChange={(e) => setSiteConfig({ ...siteConfig, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs text-[#061b3b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={siteConfig.brandTagline}
                  onChange={(e) => setSiteConfig({ ...siteConfig, brandTagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs font-bold text-[#002869]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">
                  Default Webinar Fee (INR) - Central Price
                </label>
                <input
                  type="number"
                  value={siteConfig.webinarDefaultPriceINR}
                  onChange={(e) => setSiteConfig({ ...siteConfig, webinarDefaultPriceINR: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs font-extrabold text-[#006e29]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">Primary Support Email</label>
                <input
                  type="email"
                  value={siteConfig.supportEmail}
                  onChange={(e) => setSiteConfig({ ...siteConfig, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">WhatsApp Admin Mobile 1</label>
                <input
                  type="text"
                  value={siteConfig.primaryWhatsApp}
                  onChange={(e) => setSiteConfig({ ...siteConfig, primaryWhatsApp: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">WhatsApp Admin Mobile 2</label>
                <input
                  type="text"
                  value={siteConfig.secondaryWhatsApp}
                  onChange={(e) => setSiteConfig({ ...siteConfig, secondaryWhatsApp: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#061b3b] mb-1">Registered Office Address</label>
              <textarea
                rows={2}
                value={siteConfig.officeAddress}
                onChange={(e) => setSiteConfig({ ...siteConfig, officeAddress: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs text-[#061b3b]"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Site Settings</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
