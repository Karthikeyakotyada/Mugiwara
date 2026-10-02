import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FolderKanban,
  FilePlus2,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  ChevronRight,
  Sparkles,
  CloudUpload,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export default function StudentProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/projects');
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const pendingSupervisor = projects.filter(p => p.status === 'SUPERVISOR_REVIEW');
  const pendingCoordinator = projects.filter(p => p.status === 'COORDINATOR_REVIEW');
  const approvedLocked = projects.filter(p => ['APPROVED', 'LOCKED'].includes(p.status));
  const rejected = projects.filter(p => p.status.includes('REJECTED'));

  const filteredProjects = projects.filter(p => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return ['SUPERVISOR_REVIEW', 'COORDINATOR_REVIEW'].includes(p.status);
    if (statusFilter === 'APPROVED') return ['APPROVED', 'LOCKED'].includes(p.status);
    if (statusFilter === 'REJECTED') return p.status.includes('REJECTED');
    return true;
  });

  const getWorkflowStep = (status) => {
    if (status === 'SUPERVISOR_REVIEW') return 1;
    if (status === 'COORDINATOR_REVIEW') return 2;
    if (status === 'APPROVED' || status === 'LOCKED') return 3;
    return 0; // Rejected or draft
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#241B20]">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2c0c1b] via-[#48182F] to-[#5f2b48] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90 border border-white/20">
              Department of {user?.department || 'ECE'}
            </span>
            <span className="text-white/60 text-xs font-mono">Reg: {user?.registerNumber || 'Student'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Academic Project Submissions
          </h1>
          <p className="text-xs text-[#D4CBC4] mt-1 font-medium max-w-xl">
            Track multi-tier evaluation progress, supervisor reviews, and automated Cloudinary repository archiving.
          </p>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-[#EEE9E6] text-[#48182F] font-extrabold text-xs rounded-2xl shadow-lg hover:shadow-xl transition-all border border-[#D4CBC4] self-start sm:self-auto transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <FilePlus2 className="w-4 h-4 text-[#48182F]" />
          <span>New Project Submission</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D8CFD2] shadow-card">
          <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Total Projects</p>
          <p className="text-2xl font-black text-[#241B20] mt-1">{projects.length}</p>
          <div className="mt-2 text-[10px] text-[#756A70] flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#48182F]" />
            <span>Academic record</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D8CFD2] shadow-card">
          <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">In Review</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingSupervisor.length + pendingCoordinator.length}</p>
          <div className="mt-2 text-[10px] text-amber-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending Evaluation</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D8CFD2] shadow-card">
          <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Approved & Synced</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{approvedLocked.length}</p>
          <div className="mt-2 text-[10px] text-emerald-700 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Repository Locked</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D8CFD2] shadow-card">
          <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Needs Revision</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{rejected.length}</p>
          <div className="mt-2 text-[10px] text-rose-700 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Action Required</span>
          </div>
        </div>
      </div>

      {/* Projects List Container */}
      <div className="bg-white rounded-3xl border border-[#D8CFD2] shadow-card p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8CFD2] pb-4">
          <div>
            <h2 className="text-xs font-bold text-[#241B20] uppercase tracking-wider">
              My Academic Submissions & Repository Records
            </h2>
            <p className="text-[11px] text-[#756A70] mt-0.5">Showing {filteredProjects.length} of {projects.length} submissions</p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: 'In Review' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Needs Revision' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-[#48182F] text-white shadow-xs'
                    : 'bg-[#FAF8F7] text-[#756A70] hover:bg-[#EEE9E6] hover:text-[#241B20] border border-[#D8CFD2]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#756A70]">Loading your project submissions...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#756A70] space-y-3 bg-[#FAF8F7] rounded-2xl border border-[#D8CFD2]">
            <FolderKanban className="w-10 h-10 text-[#48182F]/40 mx-auto" />
            <p className="font-bold text-[#241B20]">No project submissions found under this filter.</p>
            <p className="text-[11px] text-[#756A70] max-w-sm mx-auto">
              Start your institutional academic submission by uploading required reports, presentation slides, and verified source code.
            </p>
            <button
              onClick={() => navigate('/projects/new')}
              className="mt-2 px-5 py-2.5 bg-[#48182F] hover:bg-[#391124] text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm"
            >
              Start New Submission
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredProjects.map((proj) => {
              const step = getWorkflowStep(proj.status);
              return (
                <div
                  key={proj._id}
                  className="p-5 rounded-2xl border border-[#D8CFD2] bg-[#FAF8F7] hover:bg-white hover:border-[#48182F]/40 card-hover-effect flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#48182F] text-white font-mono text-[11px] font-bold rounded-lg border border-white/20 shadow-xs">
                          {proj.projectId}
                        </span>
                        <span className="text-[11px] font-semibold text-[#756A70]">
                          v{proj.currentVersion} • {proj.academicYear} ({proj.semester})
                        </span>
                        {proj.locked && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-600" /> Cloudinary Locked
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-800 font-semibold text-[10px] rounded-lg border border-sky-200">
                          {proj.department}
                        </span>
                      </div>

                      <h3 className="font-bold text-[#241B20] text-sm sm:text-base leading-snug">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-[#756A70] line-clamp-2 leading-relaxed">
                        {proj.abstract}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#756A70] pt-1">
                        <span>Supervisor: <strong className="text-[#241B20]">{proj.supervisorId?.name || 'Assigned Guide'}</strong></span>
                        <span>Coordinator: <strong className="text-[#241B20]">{proj.coordinatorId?.name || 'Department Coordinator'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap ${
                        proj.status === 'LOCKED' || proj.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : proj.status.includes('REJECTED')
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : proj.status === 'DRAFT'
                          ? 'bg-[#EEE9E6] text-[#241B20] border-[#D8CFD2]'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {proj.status.replace(/_/g, ' ')}
                      </span>

                      <Link
                        to={`/projects/${proj._id}`}
                        className="px-3.5 py-2 bg-white hover:bg-[#48182F] hover:text-white border border-[#D8CFD2] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 text-[#241B20] group shadow-2xs hover:shadow-sm"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#756A70] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </div>
                  </div>

                  {/* Visual Progress Track */}
                  <div className="pt-3 border-t border-[#D8CFD2]/60 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 ${
                      step >= 1 ? 'bg-amber-50/70 border-amber-200 text-amber-900 font-bold' : 'bg-white border-[#D8CFD2] text-[#756A70]'
                    }`}>
                      <span className="uppercase tracking-wider">1. Supervisor</span>
                      <span className="text-[9px] font-normal">{step > 1 ? 'Approved' : step === 1 ? 'In Review' : 'Pending'}</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 ${
                      step >= 2 ? 'bg-amber-50/70 border-amber-200 text-amber-900 font-bold' : 'bg-white border-[#D8CFD2] text-[#756A70]'
                    }`}>
                      <span className="uppercase tracking-wider">2. Coordinator</span>
                      <span className="text-[9px] font-normal">{step > 2 ? 'Approved' : step === 2 ? 'In Review' : 'Pending'}</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 ${
                      step === 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-white border-[#D8CFD2] text-[#756A70]'
                    }`}>
                      <span className="uppercase tracking-wider">3. Cloudinary Locked</span>
                      <span className="text-[9px] font-normal">{step === 3 ? 'Synchronized' : 'Pending'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


