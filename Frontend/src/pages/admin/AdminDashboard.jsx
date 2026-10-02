import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Users,
  FolderKanban,
  FileSpreadsheet,
  BarChart3,
  Settings,
  FolderGit2,
  ChevronRight,
  AlertCircle,
  CloudLightning
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/analytics');
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#241B20] animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#48182F] via-[#391124] to-[#200814] text-white p-6 rounded-2xl shadow-card border border-[#391124] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#391124] text-[#D4CBC4] rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#D4CBC4]/20">
              System Control
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#FAF8F7]">System Administration Dashboard</h1>
          <p className="text-xs text-[#D4CBC4] mt-1 font-medium">
            Welcome, {user?.name} • System Administrator (KLEF / KLU Repository)
          </p>
        </div>
        <ShieldCheck className="w-9 h-9 text-[#D4CBC4] hidden sm:block opacity-90" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card text-center hover:border-[#48182F]/40 transition-all">
          <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Total System Projects</p>
          <p className="text-2xl font-extrabold text-[#241B20] mt-1">{summary?.totalProjects || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card text-center hover:border-emerald-300 transition-all">
          <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Approved & Locked</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{summary?.approvedProjects || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card text-center hover:border-[#48182F]/40 transition-all">
          <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Supervisors</p>
          <p className="text-2xl font-extrabold text-[#48182F] mt-1">{summary?.supervisorCount || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card text-center hover:border-[#87756B]/40 transition-all">
          <p className="text-[10px] font-bold text-[#756A70] uppercase tracking-wider">Coordinators</p>
          <p className="text-2xl font-extrabold text-[#87756B] mt-1">{summary?.coordinatorCount || 0}</p>
        </div>
      </div>

      {/* Admin Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="p-5 bg-white border border-[#D8CFD2] rounded-2xl hover:border-[#48182F] hover:shadow-card transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#EEE9E6] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#48182F]" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#756A70] group-hover:text-[#48182F] transition-colors" />
          </div>
          <h3 className="font-bold text-[#241B20] text-sm group-hover:text-[#48182F] transition-colors">Users & Role Management</h3>
          <p className="text-xs text-[#756A70]">Provision user accounts, assign roles, toggle active status, and manage permissions.</p>
        </Link>

        <Link
          to="/admin/assignments"
          className="p-5 bg-white border border-[#D8CFD2] rounded-2xl hover:border-[#48182F] hover:shadow-card transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#EEE9E6] flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-[#48182F]" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#756A70] group-hover:text-[#48182F] transition-colors" />
          </div>
          <h3 className="font-bold text-[#241B20] text-sm group-hover:text-[#48182F] transition-colors">Project Guide Assignments</h3>
          <p className="text-xs text-[#756A70]">Assign or reassign Supervisors and Department Coordinators to student projects.</p>
        </Link>

        <Link
          to="/admin/repository"
          className="p-5 bg-white border border-[#D8CFD2] rounded-2xl hover:border-[#48182F] hover:shadow-card transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <CloudLightning className="w-5 h-5 text-amber-700" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#756A70] group-hover:text-[#48182F] transition-colors" />
          </div>
          <h3 className="font-bold text-[#241B20] text-sm group-hover:text-[#48182F] transition-colors">Cloudinary Repository Controls</h3>
          <p className="text-xs text-[#756A70]">Inspect automated cloud uploads, sync logs, and trigger retries for failed automation states.</p>
        </Link>

        <Link
          to="/reports"
          className="p-5 bg-white border border-[#D8CFD2] rounded-2xl hover:border-[#48182F] hover:shadow-card transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#756A70] group-hover:text-[#48182F] transition-colors" />
          </div>
          <h3 className="font-bold text-[#241B20] text-sm group-hover:text-[#48182F] transition-colors">Institutional Reports Suite</h3>
          <p className="text-xs text-[#756A70]">Generate customizable downloadable project reports in PDF, Excel, and CSV formats.</p>
        </Link>

        <Link
          to="/analytics"
          className="p-5 bg-white border border-[#D8CFD2] rounded-2xl hover:border-[#48182F] hover:shadow-card transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F7] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-700" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#756A70] group-hover:text-[#48182F] transition-colors" />
          </div>
          <h3 className="font-bold text-[#241B20] text-sm group-hover:text-[#48182F] transition-colors">System Analytics & Google Charts</h3>
          <p className="text-xs text-[#756A70]">Interactive distribution charts for tech stacks, domains, years, and project outcomes.</p>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 bg-white border border-[#D8CFD2] rounded-2xl hover:border-[#48182F] hover:shadow-card transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#EEE9E6] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#48182F]" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#756A70] group-hover:text-[#48182F] transition-colors" />
          </div>
          <h3 className="font-bold text-[#241B20] text-sm group-hover:text-[#48182F] transition-colors">System Audit Stream</h3>
          <p className="text-xs text-[#756A70]">Inspect complete immutable system audit logs and workflow security event history.</p>
        </Link>
      </div>
    </div>
  );
}
