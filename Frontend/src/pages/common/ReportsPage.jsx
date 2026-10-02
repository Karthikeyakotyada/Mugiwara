import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FileType
} from 'lucide-react';

export default function ReportsPage() {
  const [format, setFormat] = useState('pdf');
  const [type, setType] = useState('summary');
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [status, setStatus] = useState('');

  const handleDownload = () => {
    const params = new URLSearchParams({
      format,
      type,
      academicYear,
      semester,
      status
    });

    // Direct browser download URL
    window.open(`/api/v1/reports/download?${params.toString()}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[#241B20] animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#48182F] via-[#391124] to-[#200814] text-white p-6 rounded-2xl shadow-card border border-[#391124] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#391124] text-[#D4CBC4] rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#D4CBC4]/20">
              Institutional Reporting
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#FAF8F7]">KLU Institutional Reports Generator</h1>
          <p className="text-xs text-[#D4CBC4] mt-1 font-medium">
            Export customizable project audit and performance reports in PDF, Excel (XLSX), and CSV formats
          </p>
        </div>
        <FileSpreadsheet className="w-9 h-9 text-[#D4CBC4] hidden sm:block opacity-90" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-6">
        <div className="border-b border-[#D8CFD2] pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#241B20]">Configure Report Dataset & Export Options</h2>
          <span className="text-[11px] text-[#756A70]">Standard Institutional Format</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Format Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-[#241B20] mb-2">Export File Format *</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'pdf', label: 'PDF Document', icon: FileText, desc: 'Printable' },
                { id: 'excel', label: 'Excel (XLSX)', icon: FileSpreadsheet, desc: 'Data Tables' },
                { id: 'csv', label: 'CSV Spreadsheet', icon: Download, desc: 'Raw Data' }
              ].map(f => {
                const Icon = f.icon;
                const isSelected = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all text-center ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#48182F] to-[#391124] border-[#48182F] text-white shadow-card ring-2 ring-[#48182F]/20'
                        : 'bg-[#FAF8F7] border-[#D8CFD2] text-[#756A70] hover:bg-[#EEE9E6] hover:text-[#241B20]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#FAF8F7]' : 'text-[#48182F]'}`} />
                    <span className="text-[11px] block">{f.label}</span>
                    <span className={`text-[9px] font-normal ${isSelected ? 'text-[#D4CBC4]' : 'text-[#756A70]'}`}>{f.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-xs font-bold text-[#241B20] mb-2">Report Dataset Category *</label>
            <div className="space-y-2">
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full text-xs p-3.5 bg-white border border-[#D8CFD2] rounded-xl font-bold text-[#241B20] focus:ring-2 focus:ring-[#48182F] shadow-xs"
              >
                <option value="summary">All Projects Summary List (Comprehensive)</option>
                <option value="patent">Patent Applied Projects Report</option>
                <option value="publication">Research Paper Published Projects Report</option>
                <option value="approved">Approved & Cloudinary Synced Projects</option>
                <option value="pending">Pending Evaluation Submissions</option>
              </select>

              <div className="p-3 bg-[#FAF8F7] rounded-xl border border-[#D8CFD2] text-[11px] text-[#756A70]">
                {type === 'summary' && 'Generates complete project cohort summaries including guides, domains, and current versions.'}
                {type === 'patent' && 'Filters projects that have Indian or international patent registrations recorded.'}
                {type === 'publication' && 'Filters projects with indexed publications (Scopus, IEEE, Springer) and DOI numbers.'}
                {type === 'approved' && 'Only extracts projects that have cleared dual approval and are locked in Cloudinary.'}
                {type === 'pending' && 'Lists projects currently in Supervisor Review or Coordinator Evaluation.'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Parameters */}
        <div className="p-5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-2">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#48182F]" />
              <span>Dataset Scope Filters</span>
            </h3>
            <span className="text-[10px] text-[#756A70]">Optional Narrowing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#756A70] uppercase tracking-wider mb-1">Academic Year</label>
              <select
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
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
                onChange={e => setSemester(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
              >
                <option value="">All Semesters</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 7">Semester 7</option>
                <option value="Semester 8">Semester 8</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#756A70] uppercase tracking-wider mb-1">Workflow Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
              >
                <option value="">All Workflow Statuses</option>
                <option value="SUPERVISOR_REVIEW">Pending Supervisor Review</option>
                <option value="COORDINATOR_REVIEW">Pending Coordinator Evaluation</option>
                <option value="APPROVED">Approved</option>
                <option value="LOCKED">Repository Locked</option>
                <option value="REJECTED_BY_SUPERVISOR">Rejected (Supervisor)</option>
                <option value="REJECTED_BY_COORDINATOR">Rejected (Coordinator)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generate Action */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-[#48182F] to-[#391124] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-card transition-all border border-[#D4CBC4]/30"
          >
            <Download className="w-4 h-4 text-[#D4CBC4]" />
            <span>Generate & Download {format.toUpperCase()} Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
