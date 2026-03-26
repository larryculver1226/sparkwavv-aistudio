import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Settings, 
  LogOut, 
  Search, 
  ChevronRight, 
  Shield, 
  LayoutDashboard, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Save,
  Palette,
  Image as ImageIcon
} from 'lucide-react';

interface Client {
  uid: string;
  displayName: string;
  email: string;
  journeyStage: string;
  updatedAt: string;
  permissions: string[];
}

interface TenantSettings {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
}

export const PartnerDashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clients' | 'settings' | 'admin'>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        // Fetch Partner Info (Role/Tenant)
        const userDoc = await fetch('/api/admin/profile', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        }).then(res => res.json());
        setPartnerInfo(userDoc);

        // Fetch Tenant Branding
        if (userDoc.tenantId) {
          const tenant = await fetch(`/api/tenant/${userDoc.tenantId}`).then(res => res.json());
          setTenantSettings(tenant);
        }

        // Fetch Clients
        const clientsData = await fetch('/api/partner/clients', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        }).then(res => res.json());
        setClients(clientsData);

        // If Super Admin, fetch applications
        if (userDoc.role === 'super_admin' || userDoc.role === 'admin') {
          const apps = await fetch('/api/admin/partner-applications', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          }).then(res => res.json());
          setApplications(apps);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/partner/login');
  };

  const filteredClients = clients.filter(c => 
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSettings) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`/api/tenant/${tenantSettings.id}/settings`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tenantSettings)
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const [showDnaModal, setShowDnaModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [dnaSuggestion, setDnaSuggestion] = useState({ field: 'brandPersona', value: '' });
  const [milestoneSuggestion, setMilestoneSuggestion] = useState({ title: '', description: '' });

  const proposeSuggestion = async (type: 'dna_shift' | 'milestone', content: any) => {
    if (!selectedClient) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/partner/suggestions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedClient.uid,
          type,
          content
        })
      });
      if (res.ok) {
        alert('Suggestion submitted! The user will be notified.');
        setShowDnaModal(false);
        setShowMilestoneModal(false);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-slate-200 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            {tenantSettings?.logoUrl ? (
              <img src={tenantSettings.logoUrl} alt="Logo" className="h-8 w-auto" referrerPolicy="no-referrer" />
            ) : (
              <LayoutDashboard className="w-8 h-8 text-slate-400" />
            )}
            <span className="font-bold text-white tracking-tight">Partner Portal</span>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'clients' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Users className="w-4 h-4" />
              Client Roster
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Settings className="w-4 h-4" />
              Tenant Settings
            </button>
            {(partnerInfo?.role === 'super_admin' || partnerInfo?.role === 'admin') && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <Shield className="w-4 h-4" />
                Admin View
              </button>
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
              {partnerInfo?.displayName?.[0] || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{partnerInfo?.displayName || 'Partner'}</p>
              <p className="text-xs text-slate-500 truncate">{partnerInfo?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-slate-900/50 border-bottom border-slate-800 flex items-center justify-between px-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">
            {activeTab === 'clients' ? 'Client Roster' : activeTab === 'settings' ? 'Tenant Settings' : 'Partner Applications'}
          </h2>
          {activeTab === 'clients' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all"
              />
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'clients' && (
              <motion.div 
                key="clients"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {selectedClient ? (
                  <div className="space-y-6">
                    <button 
                      onClick={() => setSelectedClient(null)}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm mb-4"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Roster
                    </button>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-2xl font-bold text-white">{selectedClient.displayName}</h3>
                          <p className="text-slate-400">{selectedClient.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => navigate(`/dashboard/${selectedClient.uid}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-all"
                          >
                            <ExternalLink className="w-4 h-4" /> View Dashboard
                          </button>
                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-medium text-slate-300">
                              Stage: {selectedClient.journeyStage}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedClient.permissions.includes('propose') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                              {selectedClient.permissions.includes('propose') ? 'Propose Access' : 'Read Only'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* DNA Suggestion */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <h4 className="font-semibold text-white">Propose DNA Shift</h4>
                          </div>
                          <p className="text-sm text-slate-400 mb-6">Suggest a new attribute or persona based on your role-playing sessions.</p>
                          
                          {!selectedClient.permissions.includes('propose') ? (
                            <div className="text-xs text-slate-500 italic bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                              User has not granted "Propose" permissions yet.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <button 
                                onClick={() => setShowDnaModal(true)}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4" /> Suggest Persona Shift
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Milestone Suggestion */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <h4 className="font-semibold text-white">Propose Milestone</h4>
                          </div>
                          <p className="text-sm text-slate-400 mb-6">Add a strategic milestone to the user's journey dashboard.</p>
                          
                          {!selectedClient.permissions.includes('propose') ? (
                            <div className="text-xs text-slate-500 italic bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                              User has not granted "Propose" permissions yet.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <button 
                                onClick={() => setShowMilestoneModal(true)}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4" /> Add Milestone
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800">
                          <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stage</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Permissions</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Sync</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredClients.map((client) => (
                          <tr 
                            key={client.uid} 
                            onClick={() => setSelectedClient(client)}
                            className="hover:bg-slate-800/30 transition-all cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                                  {client.displayName[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{client.displayName}</p>
                                  <p className="text-xs text-slate-500">{client.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-slate-400">{client.journeyStage}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${client.permissions.includes('propose') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                {client.permissions.includes('propose') ? 'PROPOSE' : 'READ'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {new Date(client.updatedAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredClients.length === 0 && (
                      <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500">No clients found matching your search.</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 overflow-hidden">
                        {tenantSettings?.logoUrl ? (
                          <img src={tenantSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Branding Settings</h3>
                        <p className="text-sm text-slate-400">Customize how your brand appears to your clients.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          value={tenantSettings?.name || ''}
                          onChange={(e) => setTenantSettings(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Logo URL
                        </label>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="url"
                            value={tenantSettings?.logoUrl || ''}
                            onChange={(e) => setTenantSettings(prev => prev ? { ...prev, logoUrl: e.target.value } : null)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Primary Brand Color
                        </label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              value={tenantSettings?.primaryColor || ''}
                              onChange={(e) => setTenantSettings(prev => prev ? { ...prev, primaryColor: e.target.value } : null)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all"
                              placeholder="#000000"
                            />
                          </div>
                          <input 
                            type="color" 
                            value={tenantSettings?.primaryColor || '#000000'}
                            onChange={(e) => setTenantSettings(prev => prev ? { ...prev, primaryColor: e.target.value } : null)}
                            className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl p-1 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Description
                        </label>
                        <textarea
                          value={tenantSettings?.description || ''}
                          onChange={(e) => setTenantSettings(prev => prev ? { ...prev, description: e.target.value } : null)}
                          rows={4}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all resize-none"
                          placeholder="Tell your clients about your organization..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-100 hover:bg-white text-slate-950 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Save className="w-4 h-4" /> Save Branding Settings
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Applied On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-800/30 transition-all">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-white">{app.companyName}</p>
                            <p className="text-xs text-slate-500">{app.website}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-300">{app.contactName}</p>
                            <p className="text-xs text-slate-500">{app.contactEmail}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${app.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                              {app.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {applications.length === 0 && (
                    <div className="p-12 text-center">
                      <FileText className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                      <p className="text-slate-500">No applications found.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      {/* DNA Shift Modal */}
      <AnimatePresence>
        {showDnaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Propose DNA Shift</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Attribute Field</label>
                  <select 
                    value={dnaSuggestion.field}
                    onChange={(e) => setDnaSuggestion(prev => ({ ...prev, field: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none"
                  >
                    <option value="brandPersona">Brand Persona</option>
                    <option value="generationalPersona">Generational Persona</option>
                    <option value="careerStageRole">Career Stage Role</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Suggested Value</label>
                  <input 
                    type="text"
                    value={dnaSuggestion.value}
                    onChange={(e) => setDnaSuggestion(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none"
                    placeholder="e.g., Right Brain (Spark/Yang)"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowDnaModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => proposeSuggestion('dna_shift', dnaSuggestion)}
                    disabled={!dnaSuggestion.value}
                    className="flex-1 px-4 py-2 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    Propose
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Milestone Modal */}
      <AnimatePresence>
        {showMilestoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Propose Milestone</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Milestone Title</label>
                  <input 
                    type="text"
                    value={milestoneSuggestion.title}
                    onChange={(e) => setMilestoneSuggestion(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none"
                    placeholder="e.g., Complete Brand Workshop"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea 
                    value={milestoneSuggestion.description}
                    onChange={(e) => setMilestoneSuggestion(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none resize-none"
                    placeholder="What should the user achieve?"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowMilestoneModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => proposeSuggestion('milestone', milestoneSuggestion)}
                    disabled={!milestoneSuggestion.title}
                    className="flex-1 px-4 py-2 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    Propose
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
