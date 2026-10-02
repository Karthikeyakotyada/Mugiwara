import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import RejectionModal from '../../components/common/RejectionModal';
import {
  FolderKanban,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  FileText,
  History,
  Download,
  AlertCircle,
  UserCheck,
  Building2,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal & File Viewer State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState(null); // 'SUPERVISOR' or 'COORDINATOR'
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/projects/${id}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!data?.project) return;
    setActionLoading(true);
    setError(null);

    const isSup = user?.role === 'SUPERVISOR' || (user?.role === 'ADMIN' && project?.status === 'SUPERVISOR_REVIEW');
    const endpoint = isSup
      ? `/api/v1/projects/${id}/supervisor-review`
      : `/api/v1/projects/${id}/coordinator-review`;

    try {
      const res = await axios.post(endpoint, { action: 'APPROVE' });
      if (res.data.success) {
        fetchProject();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Approval action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (reason) => {
    if (!data?.project) return;
    setActionLoading(true);
    setError(null);

    const isSup = rejectType === 'SUPERVISOR';
    const endpoint = isSup
      ? `/api/v1/projects/${id}/supervisor-review`
      : `/api/v1/projects/${id}/coordinator-review`;

    try {
      const res = await axios.post(endpoint, {
        action: 'REJECT',
        rejectionReason: reason
      });
      if (res.data.success) {
        setShowRejectModal(false);
        fetchProject();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Rejection action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminRetryCloudinary = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/v1/admin/projects/${id}/retry-cloudinary`);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Cloudinary retry failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-semibold text-slate-500">Loading project details...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error || 'Project not found.'}</span>
      </div>
    );
  }

  const { project, versions, files, reviews, history, researchInfo } = data;

  const currentUserId = (user?.id || user?._id)?.toString();
  const supervisorIdStr = (project.supervisorId?._id || project.supervisorId)?.toString();
  const coSupervisorIdStr = (project.coSupervisorId?._id || project.coSupervisorId)?.toString();
  const coordinatorIdStr = (project.coordinatorId?._id || project.coordinatorId)?.toString();

  const isSupervisorForProject = (user?.role === 'SUPERVISOR' || user?.role === 'ADMIN') && (
    supervisorIdStr === currentUserId || coSupervisorIdStr === currentUserId || user?.role === 'ADMIN'
  );
  const isCoordinatorForProject = (user?.role === 'COORDINATOR' || user?.role === 'ADMIN') && (
    coordinatorIdStr === currentUserId || user?.role === 'ADMIN'
  );

  const canSupervisorReview = (isSupervisorForProject || user?.role === 'ADMIN') && project.status === 'SUPERVISOR_REVIEW';
  const canCoordinatorReview = (isCoordinatorForProject || user?.role === 'ADMIN') && project.status === 'COORDINATOR_REVIEW';
  const canStudentResubmit = (user?.role === 'STUDENT' || user?.role === 'ADMIN') && ['REJECTED_BY_SUPERVISOR', 'REJECTED_BY_COORDINATOR'].includes(project.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-[#241B20] animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-[#D8CFD2] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-[#48182F] to-[#391124] text-white rounded-xl text-xs font-mono font-bold shadow-xs">
              {project.projectId}
            </span>
            <span className="px-2.5 py-1 bg-[#EEE9E6] text-[#48182F] rounded-lg text-xs font-bold border border-[#D4CBC4]">
              Version v{project.currentVersion}
            </span>
            <span className="px-2.5 py-1 bg-[#FAF8F7] text-[#756A70] rounded-lg text-xs font-semibold border border-[#D8CFD2]">
              Dept: {project.department}
            </span>
            {project.locked && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> REPOSITORY LOCKED
              </span>
            )}
          </div>

          <h1 className="text-xl font-extrabold text-[#241B20] tracking-tight">{project.title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#756A70]">
            <span>Student: <strong className="text-[#241B20]">{project.studentName}</strong> ({project.registerNumber})</span>
            <span>•</span>
            <span className="font-mono">{project.email}</span>
            <span>•</span>
            <span>Term: <strong className="text-[#241B20]">{project.academicYear}</strong> ({project.yearOfStudy})</span>
          </div>
        </div>

        {/* Action Controls for Reviewers & Admin */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {canSupervisorReview && (
            <>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-card flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Project</span>
              </button>
              <button
                disabled={actionLoading}
                onClick={() => { setRejectType('SUPERVISOR'); setShowRejectModal(true); }}
                className="px-4 py-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-bold shadow-card flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject...</span>
              </button>
            </>
          )}

          {canCoordinatorReview && (
            <>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-card flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Grant Coordinator Approval</span>
              </button>
              <button
                disabled={actionLoading}
                onClick={() => { setRejectType('COORDINATOR'); setShowRejectModal(true); }}
                className="px-4 py-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-bold shadow-card flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Submission...</span>
              </button>
            </>
          )}

          {canStudentResubmit && (
            <button
              onClick={() => navigate(`/projects/${project._id}/resubmit`)}
              className="px-5 py-2.5 bg-gradient-to-r from-[#48182F] to-[#391124] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-card transition-all border border-[#D4CBC4]/30"
            >
              Resubmit Revised Project (v{project.currentVersion + 1})
            </button>
          )}

          {user?.role === 'ADMIN' && project.status === 'AUTOMATION_FAILED' && (
            <button
              disabled={actionLoading}
              onClick={handleAdminRetryCloudinary}
              className="px-4 py-2.5 bg-[#48182F] hover:bg-[#391124] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-card border border-[#D4CBC4]/30"
            >
              <RefreshCw className={`w-4 h-4 text-[#D4CBC4] ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Retry Cloudinary Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Workflow Progress Timeline */}
      <div className="bg-white rounded-2xl p-5 shadow-card border border-[#D8CFD2]">
        <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3 mb-4">
          <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#48182F]" />
            <span>Project Lifecycle & Repository State</span>
          </h3>
          <span className="text-[11px] font-bold text-[#756A70]">
            Current Status: <strong className="text-[#48182F] font-mono">{project.status.replace(/_/g, ' ')}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 shadow-xs">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="font-bold">1. Submitted</p>
            <p className="text-[10px] text-emerald-700">v{project.currentVersion}</p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${
            project.status === 'SUPERVISOR_REVIEW'
              ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse shadow-xs'
              : project.status === 'REJECTED_BY_SUPERVISOR'
              ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 shadow-xs'
          }`}>
            {project.status === 'REJECTED_BY_SUPERVISOR' ? (
              <XCircle className="w-5 h-5 mx-auto mb-1 text-rose-600" />
            ) : project.status === 'SUPERVISOR_REVIEW' ? (
              <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            )}
            <p className="font-bold">2. Supervisor</p>
            <p className="text-[10px] font-semibold">{project.status === 'REJECTED_BY_SUPERVISOR' ? 'Rejected' : project.status === 'SUPERVISOR_REVIEW' ? 'In Review' : 'Verified'}</p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${
            project.status === 'COORDINATOR_REVIEW'
              ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse shadow-xs'
              : project.status === 'REJECTED_BY_COORDINATOR'
              ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
              : ['APPROVED', 'AUTOMATION_FAILED', 'LOCKED'].includes(project.status)
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 shadow-xs'
              : 'bg-[#FAF8F7] border-[#D8CFD2] text-[#756A70]'
          }`}>
            {project.status === 'REJECTED_BY_COORDINATOR' ? (
              <XCircle className="w-5 h-5 mx-auto mb-1 text-rose-600" />
            ) : project.status === 'COORDINATOR_REVIEW' ? (
              <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            ) : ['APPROVED', 'AUTOMATION_FAILED', 'LOCKED'].includes(project.status) ? (
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            ) : (
              <Clock className="w-5 h-5 mx-auto mb-1 text-[#756A70]" />
            )}
            <p className="font-bold">3. Coordinator</p>
            <p className="text-[10px] font-semibold">{project.status === 'REJECTED_BY_COORDINATOR' ? 'Rejected' : project.status === 'COORDINATOR_REVIEW' ? 'In Review' : ['APPROVED', 'AUTOMATION_FAILED', 'LOCKED'].includes(project.status) ? 'Approved' : 'Awaiting'}</p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${
            project.status === 'APPROVED'
              ? 'bg-[#EEE9E6] border-[#D4CBC4] text-[#48182F] animate-pulse shadow-xs'
              : project.status === 'AUTOMATION_FAILED'
              ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
              : project.status === 'LOCKED'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 shadow-xs'
              : 'bg-[#FAF8F7] border-[#D8CFD2] text-[#756A70]'
          }`}>
            {project.status === 'AUTOMATION_FAILED' ? (
              <XCircle className="w-5 h-5 mx-auto mb-1 text-rose-600" />
            ) : project.status === 'APPROVED' ? (
              <Clock className="w-5 h-5 mx-auto mb-1 text-[#48182F]" />
            ) : project.status === 'LOCKED' ? (
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            ) : (
              <Clock className="w-5 h-5 mx-auto mb-1 text-[#756A70]" />
            )}
            <p className="font-bold">4. Cloudinary Sync</p>
            <p className="text-[10px] font-semibold">{project.status === 'AUTOMATION_FAILED' ? 'Sync Failed' : project.status === 'APPROVED' ? 'Processing' : project.status === 'LOCKED' ? 'Synced' : 'Awaiting'}</p>
          </div>

          <div className={`p-3 rounded-xl border transition-all ${
            project.locked
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold shadow-xs'
              : 'bg-[#FAF8F7] border-[#D8CFD2] text-[#756A70]'
          }`}>
            <Lock className={`w-5 h-5 mx-auto mb-1 ${project.locked ? 'text-emerald-700' : 'text-[#756A70]'}`} />
            <p className="font-bold">5. Locked</p>
            <p className="text-[10px] font-semibold">{project.locked ? 'Read-Only' : 'Open'}</p>
          </div>
        </div>
      </div>

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Abstract & Meta */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#D8CFD2] space-y-4">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider border-b border-[#D8CFD2] pb-2">
              Project Abstract & Scope
            </h3>
            <p className="text-xs text-[#241B20] leading-relaxed whitespace-pre-line bg-[#FAF8F7] p-4 rounded-xl border border-[#D8CFD2]/60">
              {project.abstract}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs border-t border-[#D8CFD2]">
              <div>
                <span className="text-[#756A70] font-bold uppercase tracking-wider text-[10px] block mb-1">Keywords & Topics</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.keywords?.length > 0 ? (
                    project.keywords.map((k, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 bg-[#FAF8F7] text-[#241B20] border border-[#D8CFD2] rounded-lg text-[11px] font-semibold">
                        {k}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#756A70] italic">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[#756A70] font-bold uppercase tracking-wider text-[10px] block mb-1">Technologies Used</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.technology?.length > 0 ? (
                    project.technology.map((t, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 bg-[#EEE9E6] text-[#48182F] border border-[#D4CBC4] rounded-lg text-[11px] font-bold">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#756A70] italic">None specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Research Info if applicable */}
            {(researchInfo?.hasPatent || researchInfo?.hasPublication) && (
              <div className="pt-3 border-t border-[#D8CFD2] space-y-2">
                <span className="text-[#756A70] font-bold uppercase tracking-wider text-[10px] block">Research & Innovation Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {researchInfo.hasPatent && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs">
                      <p className="font-bold text-amber-900">Patent Applied / Published</p>
                      <p className="text-[#241B20] font-mono text-[11px] mt-0.5">{researchInfo.patentTitle || 'N/A'}</p>
                    </div>
                  )}
                  {researchInfo.hasPublication && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
                      <p className="font-bold text-blue-900">Research Paper Published</p>
                      <p className="text-[#241B20] font-mono text-[11px] mt-0.5">{researchInfo.paperTitle || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Project Documents List & Storage Info */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-[#D8CFD2] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CFD2] pb-3">
              <div>
                <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider">
                  Repository Documents ({files.length})
                </h3>
                <p className="text-[11px] text-[#756A70]">Encrypted and served via Cloudinary signed secure URLs</p>
              </div>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Cloudinary Repository Active</span>
              </span>
            </div>

            <div className="space-y-3">
              {files.map(file => (
                <div key={file._id} className="p-4 bg-[#FAF8F7] border border-[#D8CFD2] hover:border-[#48182F]/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-subtle">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EEE9E6] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#48182F]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#241B20]">{file.documentType.replace(/_/g, ' ')}</p>
                        {(file.isUploadedToCloudinary || file.isUploadedToDrive) && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md">
                            Cloudinary
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#756A70] mt-0.5">
                        {file.originalName} • {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-[10px] font-mono text-[#756A70]">
                        {file.cloudinaryPublicId ? (
                          <>Cloud ID: <span className="text-[#48182F] font-semibold">{file.cloudinaryPublicId}</span></>
                        ) : (
                          <>Path: <span className="text-[#48182F]">{file.filePath}</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className="px-3.5 py-1.5 bg-[#48182F] hover:bg-[#391124] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-[#D4CBC4]/30 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#D4CBC4]" />
                      <span>View PDF</span>
                    </button>

                    <a
                      href={`/api/v1/projects/files/${file._id}/download`}
                      download
                      className="px-3.5 py-1.5 bg-white border border-[#D8CFD2] hover:bg-[#EEE9E6] rounded-xl text-xs font-bold text-[#241B20] flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-[#48182F]" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Assignments & History */}
        <div className="space-y-6">
          {/* Assigned Guides Card */}
          <div className="bg-white rounded-2xl p-5 shadow-card border border-[#D8CFD2] space-y-4">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider border-b border-[#D8CFD2] pb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#48182F]" />
              <span>Assigned Personnel</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#FAF8F7] rounded-xl border border-[#D8CFD2]">
                <span className="text-[#756A70] font-bold block text-[10px] uppercase tracking-wider">PRIMARY SUPERVISOR</span>
                <p className="font-bold text-[#241B20] mt-0.5 text-sm">{project.supervisorId?.name}</p>
                <p className="text-[#756A70] text-[11px] font-mono mt-0.5">{project.supervisorId?.email}</p>
              </div>

              {project.coSupervisorId && (
                <div className="p-3 bg-[#FAF8F7] rounded-xl border border-[#D8CFD2]">
                  <span className="text-[#756A70] font-bold block text-[10px] uppercase tracking-wider">CO-SUPERVISOR</span>
                  <p className="font-bold text-[#241B20] mt-0.5 text-sm">{project.coSupervisorId?.name}</p>
                </div>
              )}

              <div className="p-3 bg-[#FAF8F7] rounded-xl border border-[#D8CFD2]">
                <span className="text-[#756A70] font-bold block text-[10px] uppercase tracking-wider">ASSIGNED COORDINATOR</span>
                <p className="font-bold text-[#241B20] mt-0.5 text-sm">{project.coordinatorId?.name}</p>
                <p className="text-[#756A70] text-[11px] font-mono mt-0.5">{project.coordinatorId?.email}</p>
              </div>
            </div>
          </div>

          {/* Rejection Reasons Log if any */}
          {reviews.filter(r => r.decision === 'REJECTED').length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Rejection History & Feedback</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                {reviews.filter(r => r.decision === 'REJECTED').map(rev => (
                  <div key={rev._id} className="p-3.5 bg-white border border-rose-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-rose-900 text-xs">
                      <span>{rev.reviewerName} ({rev.reviewerRole})</span>
                      <span className="font-mono">v{rev.versionNumber}</span>
                    </div>
                    <p className="text-[#241B20] italic bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                      "{rev.rejectionReason}"
                    </p>
                    <p className="text-[10px] text-[#756A70]">{new Date(rev.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit & Version Log */}
          <div className="bg-white rounded-2xl p-5 shadow-card border border-[#D8CFD2] space-y-3">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider border-b border-[#D8CFD2] pb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#48182F]" />
              <span>Approval Audit Stream</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {history.map(item => (
                <div key={item._id} className="p-2.5 bg-[#FAF8F7] rounded-xl text-xs space-y-0.5 border border-[#D8CFD2]">
                  <div className="flex justify-between font-semibold text-[#241B20] text-[11px]">
                    <span className="font-bold text-[#48182F]">{item.action.replace('_', ' ')}</span>
                    <span className="text-[10px] text-[#756A70]">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-[#756A70]">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-[#1b0610]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-modal border border-[#D8CFD2] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[#48182F] to-[#2c0c1b] text-white px-6 py-4 flex items-center justify-between border-b border-[#391124]">
              <div>
                <h3 className="text-sm font-bold text-[#FAF8F7]">{previewFile.documentType.replace(/_/g, ' ')}</h3>
                <p className="text-[11px] text-[#D4CBC4] font-mono mt-0.5">{previewFile.originalName}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/v1/projects/files/${previewFile._id}/download`}
                  download
                  className="px-3.5 py-1.5 bg-[#391124] hover:bg-[#200814] text-white rounded-xl text-xs font-bold border border-[#D4CBC4]/30 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4CBC4]" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 bg-[#391124] hover:bg-[#200814] text-white rounded-xl text-xs font-bold border border-[#D4CBC4]/30 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-[#D4CBC4]" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-[#FAF8F7] p-2 sm:p-3">
              <iframe
                src={`/api/v1/projects/files/${previewFile._id}/view`}
                title="Document Preview"
                className="w-full h-full rounded-xl border border-[#D8CFD2] bg-white shadow-inner-soft"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      {showRejectModal && (
        <RejectionModal
          projectCode={project.projectId}
          studentName={project.studentName}
          onConfirm={handleConfirmReject}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </div>
  );
}

