import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Filter,
  X,
  FolderKanban,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

export default function SearchFilterPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters State
  const [q, setQ] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [domain, setDomain] = useState('');
  const [hasPatent, setHasPatent] = useState(false);
  const [hasPublication, setHasPublication] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [page, academicYear, semester, department, status, domain, hasPatent, hasPublication]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        q,
        academicYear,
        semester,
        department,
        status,
        domain,
        hasPatent: hasPatent ? 'true' : '',
        hasPublication: hasPublication ? 'true' : '',
        page,
        limit: 10
      };

      const res = await axios.get('/api/v1/search', { params });
      if (res.data.success) {
        setProjects(res.data.projects);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (e) {
      console.warn('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const clearAllFilters = () => {
    setQ('');
    setAcademicYear('');
    setSemester('');
    setDepartment('');
    setStatus('');
    setDomain('');
    setHasPatent(false);
    setHasPublication(false);
    setPage(1);
  };

  const hasActiveFilters = q || academicYear || semester || department || status || domain || hasPatent || hasPublication;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#241B20] animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#48182F] via-[#391124] to-[#200814] text-white p-6 rounded-2xl shadow-card border border-[#391124] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#391124] text-[#D4CBC4] rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#D4CBC4]/20">
              Institutional Archive
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#FAF8F7]">Global Project Repository & Discovery</h1>
          <p className="text-xs text-[#D4CBC4] mt-1 font-medium">
            Search projects across Student, Register No, Guide, Project ID, Domain, Tech, and Patent status
          </p>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#D4CBC4] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Title, ID (e.g. ECE2026-001), Student, Tech..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#391124]/90 text-white placeholder-[#D4CBC4]/60 border border-[#D4CBC4]/30 rounded-xl text-xs focus:ring-2 focus:ring-[#D4CBC4] focus:outline-none transition-all shadow-inner-soft"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-[#FAF8F7] to-[#EEE9E6] hover:bg-white text-[#48182F] text-xs font-bold rounded-xl shadow-card border border-[#D4CBC4] transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Combinable Filters Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#D8CFD2] shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#48182F]" />
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider">Combinable Multi-Facet Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-800 hover:text-rose-950 flex items-center gap-1 font-semibold transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#756A70] uppercase tracking-wider mb-1">Academic Year</label>
            <select
              value={academicYear}
              onChange={e => { setAcademicYear(e.target.value); setPage(1); }}
              className="w-full text-xs p-2.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
            >
              <option value="">All Academic Years</option>
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
              <option value="2027-28">2027-28</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#756A70] uppercase tracking-wider mb-1">Semester</label>
            <select
              value={semester}
              onChange={e => { setSemester(e.target.value); setPage(1); }}
              className="w-full text-xs p-2.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
            >
              <option value="">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
              <option value="Semester 7">Semester 7</option>
              <option value="Semester 8">Semester 8</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#756A70] uppercase tracking-wider mb-1">Department</label>
            <select
              value={department}
              onChange={e => { setDepartment(e.target.value); setPage(1); }}
              className="w-full text-xs p-2.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
            >
              <option value="">All Departments</option>
              <option value="ECE">ECE</option>
              <option value="CSE">CSE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="AI&DS">AI&DS</option>
              <option value="AIML">AIML</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#756A70] uppercase tracking-wider mb-1">Status</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="w-full text-xs p-2.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
            >
              <option value="">All Statuses</option>
              <option value="SUPERVISOR_REVIEW">Supervisor Review</option>
              <option value="COORDINATOR_REVIEW">Coordinator Review</option>
              <option value="APPROVED">Approved</option>
              <option value="LOCKED">Repository Locked</option>
              <option value="REJECTED_BY_SUPERVISOR">Rejected (Supervisor)</option>
              <option value="REJECTED_BY_COORDINATOR">Rejected (Coordinator)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#756A70] uppercase tracking-wider mb-1">Domain</label>
            <select
              value={domain}
              onChange={e => { setDomain(e.target.value); setPage(1); }}
              className="w-full text-xs p-2.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
            >
              <option value="">All Domains</option>
              <option value="Artificial Intelligence">AI & Machine Learning</option>
              <option value="Internet of Things (IoT)">IoT</option>
              <option value="Embedded Systems">Embedded Systems</option>
              <option value="Cloud Computing">Cloud Computing</option>
              <option value="Cybersecurity">Cybersecurity</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-1.5 p-1 bg-[#FAF8F7] rounded-xl border border-[#D8CFD2]">
            <label className="flex items-center gap-1.5 text-xs text-[#241B20] font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={hasPatent}
                onChange={e => { setHasPatent(e.target.checked); setPage(1); }}
                className="w-3.5 h-3.5 text-[#48182F] accent-[#48182F] rounded"
              />
              <span className="text-[11px]">Has Patent</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[#241B20] font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={hasPublication}
                onChange={e => { setHasPublication(e.target.checked); setPage(1); }}
                className="w-3.5 h-3.5 text-[#48182F] accent-[#48182F] rounded"
              />
              <span className="text-[11px]">Has Paper</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Header & Counter */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#756A70] px-1">
        <span>Found <strong className="text-[#241B20] font-bold">{total}</strong> projects matching active criteria</span>
        <span>Page {page} of {pages || 1}</span>
      </div>

      {/* Projects Results Table */}
      <div className="bg-white rounded-2xl border border-[#D8CFD2] shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#756A70] font-semibold">Searching project archive...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#756A70] bg-[#FAF8F7]">
            <FolderKanban className="w-8 h-8 text-[#756A70] mx-auto mb-2 opacity-60" />
            <p className="font-bold text-[#241B20]">No Projects Found</p>
            <p className="mt-0.5">No repository submissions match the active search or filter combinations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEE9E6] border-b border-[#D8CFD2] text-[#241B20] font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Project ID</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Supervisor</th>
                  <th className="p-3.5">Coordinator</th>
                  <th className="p-3.5">Domain</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CFD2]">
                {projects.map((proj) => (
                  <tr key={proj._id} className="hover:bg-[#FAF8F7] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#48182F]">
                      <span className="px-2 py-0.5 bg-[#48182F]/10 rounded border border-[#48182F]/20">
                        {proj.projectId}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-[#241B20] max-w-xs truncate">
                      {proj.title}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-[#241B20]">{proj.studentName}</p>
                      <p className="text-[10px] text-[#756A70] font-mono">{proj.registerNumber}</p>
                    </td>
                    <td className="p-3.5 text-[#241B20] font-medium">
                      {proj.supervisorId?.name || 'N/A'}
                    </td>
                    <td className="p-3.5 text-[#241B20] font-medium">
                      {proj.coordinatorId?.name || 'N/A'}
                    </td>
                    <td className="p-3.5 text-[#756A70]">
                      <span className="px-2 py-0.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded text-[11px]">
                        {proj.domain}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        proj.status === 'LOCKED' || proj.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : proj.status.includes('REJECTED')
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {proj.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/projects/${proj._id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#FAF8F7] hover:bg-[#48182F] hover:text-white border border-[#D8CFD2] text-[#241B20] rounded-xl font-bold text-[11px] transition-all group shadow-xs"
                      >
                        <span>View Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#756A70] group-hover:text-white transition-colors" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-xl border border-[#D8CFD2] bg-white text-xs font-bold disabled:opacity-40 hover:bg-[#FAF8F7] shadow-xs transition-all"
          >
            Previous
          </button>
          <span className="text-xs text-[#756A70] font-semibold px-3">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-xl border border-[#D8CFD2] bg-white text-xs font-bold disabled:opacity-40 hover:bg-[#FAF8F7] shadow-xs transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
