import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FolderKanban,
  FileSpreadsheet,
  BarChart3,
  Award,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoordinatorProjects();
  }, []);

  const fetchCoordinatorProjects = async () => {
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

  const pendingEvaluations = projects.filter(p => p.status === 'COORDINATOR_REVIEW');
  const approvedProjects = projects.filter(p => ['APPROVED', 'LOCKED'].includes(p.status));
  const rejectedProjects = projects.filter(p => p.status.includes('REJECTED'));

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#241B20] animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#48182F] via-[#391124] to-[#200814] text-white p-6 rounded-2xl shadow-card border border-[#391124] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#391124] text-[#D4CBC4] rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#D4CBC4]/20">
              Department Coordination
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#FAF8F7]">Coordinator Evaluation & Management</h1>
          <p className="text-xs text-[#D4CBC4] mt-1 font-medium">
            Welcome, {user?.name} • Department Coordinator ({user?.department || 'ECE'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/reports"
            className="px-4 py-2 bg-[#391124] hover:bg-[#2c0c1b] text-[#FAF8F7] rounded-xl text-xs font-bold border border-[#D4CBC4]/30 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#D4CBC4]" />
            <span>Generate Reports</span>
          </Link>
          <Link
            to="/analytics"
            className="px-4 py-2 bg-[#391124] hover:bg-[#2c0c1b] text-[#FAF8F7] rounded-xl text-xs font-bold border border-[#D4CBC4]/30 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span>Analytics</span>
          </Link>
        </div>
      </div>

      {/* Coordinator KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Awaiting Evaluation</p>
            <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{pendingEvaluations.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Approved & Synced</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{approvedProjects.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Returned For Revision</p>
            <p className="text-2xl font-extrabold text-rose-700 mt-0.5">{rejectedProjects.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Total In Department</p>
            <p className="text-2xl font-extrabold text-[#48182F] mt-0.5">{projects.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EEE9E6] flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-[#48182F]" />
          </div>
        </div>
      </div>

      {/* Pending Evaluations List */}
      <div className="bg-white rounded-2xl border border-[#D8CFD2] shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
          <h2 className="text-xs font-bold text-[#241B20] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#48182F]" />
            <span>Pending Projects Awaiting Coordinator Evaluation ({pendingEvaluations.length})</span>
          </h2>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Supervisor Approved
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#756A70] font-semibold">Loading evaluation queue...</div>
        ) : pendingEvaluations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#756A70] bg-[#FAF8F7] rounded-xl border border-[#D8CFD2]">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-[#241B20]">Evaluation Queue Clean!</p>
            <p className="mt-0.5">No projects are awaiting coordinator approval at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingEvaluations.map(proj => (
              <div
                key={proj._id}
                className="p-5 bg-[#FAF8F7] border border-[#D8CFD2] hover:border-[#48182F]/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-subtle hover:shadow-card"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-[#48182F] text-white rounded-lg text-xs font-mono font-bold shadow-xs">
                      {proj.projectId}
                    </span>
                    <span className="px-2 py-0.5 bg-[#EEE9E6] text-[#48182F] rounded-md text-[11px] font-bold">
                      v{proj.currentVersion}
                    </span>
                    <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Supervisor: {proj.supervisorId?.name || 'Verified'}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#241B20] text-sm hover:text-[#48182F] transition-colors">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-[#756A70]">
                    Student: <strong className="text-[#241B20]">{proj.studentName}</strong> ({proj.registerNumber}) • {proj.email}
                  </p>
                </div>

                <Link
                  to={`/projects/${proj._id}`}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#48182F] to-[#391124] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-card flex items-center justify-center gap-1.5 self-start md:self-center transition-all border border-[#D4CBC4]/30"
                >
                  <span>Evaluate Project</span>
                  <ChevronRight className="w-4 h-4 text-[#D4CBC4]" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Assigned Projects */}
      <div className="bg-white rounded-2xl border border-[#D8CFD2] shadow-card p-6 space-y-4">
        <h2 className="text-xs font-bold text-[#241B20] uppercase tracking-wider border-b border-[#D8CFD2] pb-3">
          All Department Projects ({projects.length})
        </h2>
        
        {projects.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#756A70] bg-[#FAF8F7] rounded-xl border border-[#D8CFD2]">
            No projects registered in this department yet.
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(proj => (
              <div
                key={proj._id}
                className="p-3.5 bg-[#FAF8F7] border border-[#D8CFD2] hover:bg-white rounded-xl flex items-center justify-between text-xs transition-all hover:border-[#48182F]/30"
              >
                <div>
                  <span className="font-mono font-bold text-[#48182F] mr-2">{proj.projectId}</span>
                  <span className="font-semibold text-[#241B20]">{proj.title}</span>
                  <p className="text-[#756A70] text-[11px] mt-0.5">
                    Student: {proj.studentName} ({proj.registerNumber}) | Guide: {proj.supervisorId?.name || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    proj.status === 'LOCKED' || proj.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : proj.status.includes('REJECTED')
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {proj.status.replace(/_/g, ' ')}
                  </span>
                  <Link
                    to={`/projects/${proj._id}`}
                    className="p-1.5 hover:bg-[#EEE9E6] rounded-lg text-[#756A70] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#48182F]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
