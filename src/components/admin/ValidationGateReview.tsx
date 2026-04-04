import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ValidationRequest {
  id: string;
  userId: string;
  userEmail: string;
  gateId: string;
  reasoning: string;
  userData: any;
  status: 'pending_review' | 'approved' | 'denied';
  createdAt: string;
  reviewedAt?: any;
  reviewedBy?: string;
  adminNotes?: string;
}

export const ValidationGateReview: React.FC<{ onNotify: (msg: string, type: string) => void }> = ({
  onNotify,
}) => {
  const [requests, setRequests] = useState<ValidationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'denied'>(
    'pending_review'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ValidationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'validationRequests'), orderBy('createdAt', 'desc'));

    if (filter !== 'all') {
      q = query(
        collection(db, 'validationRequests'),
        where('status', '==', filter),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ValidationRequest[];
        setRequests(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching validation requests:', error);
        onNotify('Failed to load validation requests', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filter]);

  const handleReview = async (status: 'approved' | 'denied') => {
    if (!selectedRequest) return;

    try {
      const docRef = doc(db, 'validationRequests', selectedRequest.id);
      await updateDoc(docRef, {
        status,
        adminNotes,
        reviewedAt: serverTimestamp(),
        reviewedBy: 'admin', // In real app, get from auth
      });

      // Also update the user's wavvault status if approved
      if (status === 'approved') {
        const wavvaultRef = doc(db, 'wavvault', selectedRequest.userId);
        await updateDoc(wavvaultRef, {
          [`validationGates.${selectedRequest.gateId}.status`]: 'passed',
          [`validationGates.${selectedRequest.gateId}.passedAt`]: serverTimestamp(),
        });
      }

      onNotify(`Request ${status} successfully`, 'success');
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating validation request:', error);
      onNotify('Failed to update request', 'error');
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gateId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-neon-cyan" />
            Validation Gate Review
          </h2>
          <p className="text-white/40 text-sm">Human-in-the-Loop (HITL) Lifecycle Gatekeeping</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Search by email or gate..."
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neon-cyan/50 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neon-cyan/50"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Requests</option>
            <option value="pending_review">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="glass-panel p-12 text-center border-white/5 bg-white/[0.02] rounded-3xl">
              <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-4" />
              <p className="text-white/40">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="glass-panel p-12 text-center border-white/5 bg-white/[0.02] rounded-3xl">
              <CheckCircle2 className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No validation requests found.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                layoutId={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`glass-panel p-6 rounded-3xl border transition-all cursor-pointer group ${
                  selectedRequest?.id === request.id
                    ? 'border-neon-cyan bg-neon-cyan/5'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        request.status === 'pending_review'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : request.status === 'approved'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {request.status === 'pending_review' ? (
                        <Clock className="w-5 h-5" />
                      ) : request.status === 'approved' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white group-hover:text-neon-cyan transition-colors">
                        {request.gateId}
                      </h4>
                      <p className="text-xs text-white/40">{request.userEmail}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-white/20">
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-white/60 line-clamp-2 mb-4 italic">
                  "{request.reasoning}"
                </p>

                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {request.userId.substring(0, 8)}...
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {Object.keys(request.userData || {}).length} Data Points
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedRequest ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-panel p-8 rounded-3xl border border-neon-cyan/30 bg-neon-cyan/5 sticky top-24"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-bold">Request Details</h3>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <XCircle className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                      User Reasoning
                    </label>
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 text-sm text-white/80 italic">
                      {selectedRequest.reasoning}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                      User Context Data
                    </label>
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 font-mono text-[10px] text-neon-cyan/80 max-h-48 overflow-y-auto">
                      <pre>{JSON.stringify(selectedRequest.userData, null, 2)}</pre>
                    </div>
                  </div>

                  {selectedRequest.status === 'pending_review' ? (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                          Admin Notes
                        </label>
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-neon-cyan/50 h-24 resize-none"
                          placeholder="Add internal notes or feedback for the user..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleReview('denied')}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          Deny
                        </button>
                        <button
                          onClick={() => handleReview('approved')}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neon-cyan text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-white/10">
                      <div
                        className={`flex items-center gap-2 mb-4 ${
                          selectedRequest.status === 'approved' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {selectedRequest.status === 'approved' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        <span className="font-bold uppercase tracking-widest text-xs">
                          Request {selectedRequest.status}
                        </span>
                      </div>
                      {selectedRequest.adminNotes && (
                        <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                            Admin Notes
                          </label>
                          <p className="text-sm text-white/60">{selectedRequest.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] text-center"
              >
                <AlertTriangle className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold mb-2">No Request Selected</h3>
                <p className="text-sm text-white/40">
                  Select a validation request from the list to review details and take action.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
