import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Lock,
  Sparkles,
  Trash2,
  RotateCcw
} from 'lucide-react';

const REQUIRED_DOCS = [
  { type: 'FINAL_REPORT', label: 'Final Project Report', ext: '.pdf' },
  { type: 'PRESENTATION', label: 'Presentation (PPTX/PPT)', ext: '.pptx, .ppt' },
  { type: 'APPROVAL_CERTIFICATE', label: 'Signed Approval Certificate', ext: '.pdf' },
  { type: 'PLAGIARISM_REPORT', label: 'Plagiarism / Similarity Report', ext: '.pdf' },
  { type: 'POSTER', label: 'Project Poster', ext: '.pdf' },
  { type: 'SOURCE_CODE', label: 'Complete Source Code Archive', ext: '.zip, .tar, .7z' }
];

const YEAR_SEMESTER_MAP = {
  '1st Year': ['Semester 1', 'Semester 2'],
  '2nd Year': ['Semester 3', 'Semester 4'],
  '3rd Year': ['Semester 5', 'Semester 6'],
  '4th Year': ['Semester 7', 'Semester 8']
};

export default function NewProjectPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const DRAFT_KEY = user?.id ? `klu_new_project_draft_${user.id}` : 'klu_new_project_draft_guest';

  // Helper to read persisted draft from localStorage
  const getInitialDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const initialDraft = getInitialDraft();

  const [step, setStep] = useState(initialDraft?.step || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [academicYear, setAcademicYear] = useState(initialDraft?.academicYear || '2026-27');
  const [yearOfStudy, setYearOfStudy] = useState(initialDraft?.yearOfStudy || '4th Year');
  const [semester, setSemester] = useState(initialDraft?.semester || 'Semester 8');
  const [department, setDepartment] = useState(initialDraft?.department || user?.department || 'CSE');
  const [registerNumber, setRegisterNumber] = useState(initialDraft?.registerNumber || user?.registerNumber || '');
  const [title, setTitle] = useState(initialDraft?.title || '');
  const [abstract, setAbstract] = useState(initialDraft?.abstract || '');
  const [keywordsInput, setKeywordsInput] = useState(initialDraft?.keywordsInput || '');
  const [technologyInput, setTechnologyInput] = useState(initialDraft?.technologyInput || '');
  const [domain, setDomain] = useState(initialDraft?.domain || 'Artificial Intelligence');
  const [supervisorId, setSupervisorId] = useState(initialDraft?.supervisorId || '');
  const [coSupervisorId, setCoSupervisorId] = useState(initialDraft?.coSupervisorId || '');
  const [coordinatorId, setCoordinatorId] = useState(initialDraft?.coordinatorId || '');

  // Dropdown lists fetched from API
  const [supervisors, setSupervisors] = useState([]);
  const [coordinators, setCoordinators] = useState([]);

  // File Upload State: Map of docType => fileObject
  const [uploadedFiles, setUploadedFiles] = useState(initialDraft?.uploadedFiles || {});
  const [uploadingDoc, setUploadingDoc] = useState(null);

  // Patent / Publication
  const [hasPatent, setHasPatent] = useState(initialDraft?.hasPatent || false);
  const [patentTitle, setPatentTitle] = useState(initialDraft?.patentTitle || '');
  const [hasPublication, setHasPublication] = useState(initialDraft?.hasPublication || false);
  const [paperTitle, setPaperTitle] = useState(initialDraft?.paperTitle || '');

  useEffect(() => {
    fetchFacultyOptions();
  }, []);

  const fetchFacultyOptions = async () => {
    try {
      const res = await axios.get('/api/v1/projects/options/faculty');
      if (res.data.success) {
        setSupervisors(res.data.supervisors || []);
        setCoordinators(res.data.coordinators || []);
        if (!supervisorId && res.data.supervisors?.length > 0) {
          setSupervisorId(res.data.supervisors[0]._id);
        }
        if (!coordinatorId && res.data.coordinators?.length > 0) {
          setCoordinatorId(res.data.coordinators[0]._id);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch faculty options:', e);
    }
  };

  // Auto-persist draft to localStorage on state changes
  useEffect(() => {
    const draftData = {
      step,
      academicYear,
      yearOfStudy,
      semester,
      department,
      registerNumber,
      title,
      abstract,
      keywordsInput,
      technologyInput,
      domain,
      supervisorId,
      coSupervisorId,
      coordinatorId,
      uploadedFiles,
      hasPatent,
      patentTitle,
      hasPublication,
      paperTitle
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    } catch (e) {
      console.warn('Failed to save draft to localStorage:', e);
    }
  }, [
    step,
    academicYear,
    yearOfStudy,
    semester,
    department,
    registerNumber,
    title,
    abstract,
    keywordsInput,
    technologyInput,
    domain,
    supervisorId,
    coSupervisorId,
    coordinatorId,
    uploadedFiles,
    hasPatent,
    patentTitle,
    hasPublication,
    paperTitle,
    DRAFT_KEY
  ]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
    setStep(1);
    setTitle('');
    setAbstract('');
    setKeywordsInput('');
    setTechnologyInput('');
    setUploadedFiles({});
    setHasPatent(false);
    setPatentTitle('');
    setHasPublication(false);
    setPaperTitle('');
  };

  const handleDepartmentSelect = (newDept) => {
    setDepartment(newDept);
    if (updateProfile) updateProfile({ department: newDept });
  };

  const handleYearOfStudyChange = (selectedYear) => {
    setYearOfStudy(selectedYear);
    const availableSems = YEAR_SEMESTER_MAP[selectedYear] || [];
    if (availableSems.length > 0 && !availableSems.includes(semester)) {
      setSemester(availableSems[0]);
    }
  };



  const handleFileUpload = async (docType, file) => {
    if (!file) return;

    setUploadingDoc(docType);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);

    try {
      const res = await axios.post('/api/v1/projects/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setUploadedFiles(prev => ({
          ...prev,
          [docType]: res.data.file
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'File upload failed.';
      setError(msg);
    } finally {
      setUploadingDoc(null);
    }
  };

  const removeFile = (docType) => {
    setUploadedFiles(prev => {
      const next = { ...prev };
      delete next[docType];
      return next;
    });
  };

  const requiredUploadedCount = REQUIRED_DOCS.filter(d => uploadedFiles[d.type]).length;
  const isAllMandatoryUploaded = requiredUploadedCount === REQUIRED_DOCS.length;

  const handleSubmit = async () => {
    if (!isAllMandatoryUploaded) {
      setError(`Cannot submit. All 6 mandatory documents must be uploaded. Currently uploaded: ${requiredUploadedCount}/6.`);
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      registerNumber,
      academicYear,
      yearOfStudy,
      semester,
      department,
      title,
      abstract,
      keywords: keywordsInput.split(',').map(k => k.trim()).filter(Boolean),
      technology: technologyInput.split(',').map(t => t.trim()).filter(Boolean),
      domain,
      supervisorId,
      coSupervisorId: coSupervisorId || null,
      coordinatorId,
      files: Object.values(uploadedFiles),
      researchInfo: {
        hasPatent,
        patentTitle: hasPatent ? patentTitle : null,
        hasPublication,
        paperTitle: hasPublication ? paperTitle : null
      }
    };

    try {
      const res = await axios.post('/api/v1/projects/submit', payload);
      if (res.data.success) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (e) {}
        navigate(`/projects/${res.data.project._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[#241B20]">
      {/* Header Banner */}
      <div className="bg-[#48182F] text-white rounded-2xl p-6 shadow-card border border-[#391124] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FAF8F7]">New Academic Project Submission</h1>
          <p className="text-xs text-[#D4CBC4] mt-1 font-medium">
            Institutional Multi-Step Submission Wizard • KLEF / KLU
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearDraft}
            className="px-3 py-1.5 bg-[#391124] hover:bg-[#2c0c1b] text-[#D4CBC4] rounded-xl text-xs font-semibold border border-[#D4CBC4]/30 flex items-center gap-1.5 transition-all"
            title="Reset draft and clear filled form data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Draft</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-[#391124] px-3.5 py-1.5 rounded-xl border border-[#D4CBC4]/30 text-xs font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-[#D4CBC4]" />
            <span>Step {step} of 5</span>
          </div>
        </div>
      </div>

      {/* Progress Steps Bar - Responsive Stepper */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-[#D8CFD2]">
        <div className="flex items-center justify-between sm:hidden mb-3">
          <span className="text-xs font-bold text-[#48182F] uppercase tracking-wider">
            Step {step} of 5: {['Identity', 'Details & Guide', 'Documents', 'Research Info', 'Final Review'][step - 1]}
          </span>
          <span className="text-xs font-mono font-bold text-[#756A70]">
            {Math.round((step / 5) * 100)}%
          </span>
        </div>
        <div className="w-full bg-[#EEE9E6] h-1.5 rounded-full overflow-hidden sm:hidden mb-1">
          <div
            className="h-full bg-gradient-to-r from-[#48182F] to-[#756A70] transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <div className="hidden sm:grid grid-cols-5 gap-2 text-center text-xs font-bold">
          {[
            { num: 1, label: '1. Identity', desc: 'Student Profile' },
            { num: 2, label: '2. Details', desc: 'Title & Faculty' },
            { num: 3, label: `3. Documents (${requiredUploadedCount}/6)`, desc: 'Mandatory Files' },
            { num: 4, label: '4. Research', desc: 'Patent & Paper' },
            { num: 5, label: '5. Review', desc: 'Confirm & Lock' }
          ].map((s) => {
            const isActive = step === s.num;
            const isPassed = step > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (isPassed || (s.num <= 3 && step >= 2)) setStep(s.num);
                }}
                className={`p-3 rounded-xl transition-all text-left flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-br from-[#48182F] to-[#391124] text-white shadow-card ring-2 ring-[#48182F]/20'
                    : isPassed
                    ? 'bg-emerald-50/70 text-emerald-900 border border-emerald-200 hover:bg-emerald-100/60 cursor-pointer'
                    : 'bg-[#FAF8F7] text-[#756A70] border border-[#D8CFD2]/60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[11px] font-bold ${isActive ? 'text-[#FAF8F7]' : isPassed ? 'text-emerald-800' : 'text-[#756A70]'}`}>
                    {s.label}
                  </span>
                  {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                </div>
                <span className={`text-[10px] truncate ${isActive ? 'text-[#D4CBC4]' : isPassed ? 'text-emerald-700 font-medium' : 'text-[#756A70]/70'}`}>
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 shadow-xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* STEP 1: Student Information */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#D8CFD2] space-y-5 animate-fadeIn">
          <div className="border-b border-[#D8CFD2] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#241B20]">Section 1: Academic & Student Information</h2>
              <p className="text-xs text-[#756A70] mt-0.5">Verify your institutional registration details and cohort terms.</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#EEE9E6] text-[#48182F] font-bold px-2.5 py-1 rounded-lg border border-[#D4CBC4]">
              KLU Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#756A70] mb-1.5">Student Name</label>
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full text-xs p-3 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl text-[#756A70] font-semibold cursor-not-allowed shadow-inner-soft"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#756A70] mb-1.5">Institutional Email</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full text-xs p-3 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl text-[#756A70] font-mono cursor-not-allowed shadow-inner-soft"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                Register Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 2000030056"
                value={registerNumber}
                onChange={e => setRegisterNumber(e.target.value)}
                onBlur={() => { if (registerNumber && updateProfile) updateProfile({ registerNumber }); }}
                className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl font-mono font-bold text-[#241B20] focus:ring-2 focus:ring-[#48182F] focus:border-[#48182F] transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                Department <span className="text-rose-600">*</span>
              </label>
              <select
                value={department}
                onChange={e => handleDepartmentSelect(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F] transition-all shadow-xs"
              >
                <option value="ECE">Electronics & Communication Engineering (ECE)</option>
                <option value="CSE">Computer Science & Engineering (CSE)</option>
                <option value="BME">Biomedical Engineering</option>
                <option value="IT">Information Technology</option>
                <option value="AE">Aeronautical Engineering</option>
                <option value="AIML">Artificial Intelligence and Machine Learning</option>
                <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
                <option value="MECH">Mechanical Engineering (MECH)</option>
                <option value="CIVIL">Civil Engineering (CIVIL)</option>
                <option value="AI&DS">Artificial Intelligence & Data Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                Year of Study <span className="text-rose-600">*</span>
              </label>
              <select
                value={yearOfStudy}
                onChange={e => handleYearOfStudyChange(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F] transition-all shadow-xs"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                Semester <span className="text-rose-600">*</span>
              </label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F] transition-all shadow-xs"
              >
                {(YEAR_SEMESTER_MAP[yearOfStudy] || ['Semester 7', 'Semester 8']).map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#D8CFD2]">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#48182F] to-[#391124] text-white text-xs font-bold rounded-xl hover:opacity-95 transition-all border border-[#D4CBC4]/30 shadow-card"
            >
              <span>Next: Project Details</span>
              <ArrowRight className="w-4 h-4 text-[#D4CBC4]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Project Information */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#D8CFD2] space-y-5 animate-fadeIn">
          <div className="border-b border-[#D8CFD2] pb-3">
            <h2 className="text-sm font-bold text-[#241B20]">Section 2: Project Information & Guide Selection</h2>
            <p className="text-xs text-[#756A70] mt-0.5">Provide detailed project metadata, technical domain, and designated faculty supervisors.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                Project Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. AI-Based Smart Irrigation and Soil Health Monitoring System"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl focus:ring-2 focus:ring-[#48182F] text-[#241B20] font-semibold transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                Abstract & Objectives <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Detailed project summary, problem statement, methodology, system architecture, and outcomes..."
                value={abstract}
                onChange={e => setAbstract(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl focus:ring-2 focus:ring-[#48182F] text-[#241B20] transition-all shadow-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                  Technologies Used (Comma Separated) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Python, TensorFlow, React, Node.js, Cloudinary"
                  value={technologyInput}
                  onChange={e => setTechnologyInput(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl text-[#241B20] font-semibold focus:ring-2 focus:ring-[#48182F] transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                  Project Domain <span className="text-rose-600">*</span>
                </label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl font-semibold text-[#241B20] focus:ring-2 focus:ring-[#48182F] transition-all shadow-xs"
                >
                  <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                  <option value="Internet of Things (IoT)">Internet of Things (IoT)</option>
                  <option value="Embedded Systems">Embedded Systems & VLSI</option>
                  <option value="Cloud Computing">Cloud Computing & DevOps</option>
                  <option value="Cybersecurity">Cybersecurity & Cryptography</option>
                  <option value="Robotics & Automation">Robotics & Automation</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                  Keywords / Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. IoT Sensors, Deep Learning, Edge Computing, Sustainability"
                  value={keywordsInput}
                  onChange={e => setKeywordsInput(e.target.value)}
                  className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl text-[#241B20] font-semibold focus:ring-2 focus:ring-[#48182F] transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Guide & Coordinator Selection */}
            <div className="pt-4 border-t border-[#D8CFD2] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#48182F] uppercase tracking-wider">
                  Assigned Faculty Supervisor & Coordinator
                </h3>
                <span className="text-[10px] text-[#756A70]">Required for dual approval workflow</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-[#241B20]">
                    Primary Supervisor (Faculty) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={supervisorId}
                    onChange={e => setSupervisorId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#D8CFD2] rounded-xl font-bold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
                  >
                    <option value="">-- Select Faculty Supervisor --</option>
                    {supervisors.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.department} • {s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-[#241B20]">
                    Department Coordinator <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={coordinatorId}
                    onChange={e => setCoordinatorId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#D8CFD2] rounded-xl font-bold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
                  >
                    <option value="">-- Select Department Coordinator --</option>
                    {coordinators.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.department} • {c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 p-3 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl">
                  <label className="block text-xs font-semibold text-[#756A70] mb-1.5">
                    Co-Supervisor (Optional)
                  </label>
                  <select
                    value={coSupervisorId}
                    onChange={e => setCoSupervisorId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#D8CFD2] rounded-xl text-[#241B20]"
                  >
                    <option value="">None (Optional Secondary Faculty)</option>
                    {supervisors.filter(s => s._id !== supervisorId).map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.department} • {s.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#D8CFD2]">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#EEE9E6] text-[#241B20] text-xs font-semibold rounded-xl hover:bg-[#D4CBC4] transition-colors border border-[#D8CFD2]"
            >
              <ArrowLeft className="w-4 h-4 text-[#756A70]" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#48182F] to-[#391124] text-white text-xs font-bold rounded-xl hover:opacity-95 transition-all border border-[#D4CBC4]/30 shadow-card"
            >
              <span>Next: Document Uploads</span>
              <ArrowRight className="w-4 h-4 text-[#D4CBC4]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Mandatory Document Upload Manager */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#D8CFD2] space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8CFD2] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#241B20]">Section 3: Mandatory Document Uploads (6/6 Required)</h2>
              <p className="text-xs text-[#756A70] mt-0.5">
                All 6 files are validated and synced to the secure Cloudinary cloud repository upon selection.
              </p>
            </div>
            <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold self-start sm:self-auto flex items-center gap-1.5 ${
              isAllMandatoryUploaded
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isAllMandatoryUploaded ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Upload className="w-4 h-4 text-amber-600" />}
              <span>{requiredUploadedCount} / 6 Uploaded</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REQUIRED_DOCS.map((doc) => {
              const uploaded = uploadedFiles[doc.type];
              const isUploading = uploadingDoc === doc.type;

              return (
                <div
                  key={doc.type}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    uploaded
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                      : 'bg-[#FAF8F7] border-[#D8CFD2] hover:border-[#48182F]/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {uploaded ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-[#EEE9E6] flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-[#48182F]" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-[#241B20]">
                            {doc.label} <span className="text-rose-600">*</span>
                          </p>
                          <span className="text-[10px] font-mono bg-[#EEE9E6] text-[#48182F] px-1.5 py-0.5 rounded border border-[#D4CBC4]">
                            {doc.ext}
                          </span>
                        </div>
                      </div>

                      {uploaded && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md flex-shrink-0">
                          Cloudinary Synced
                        </span>
                      )}
                    </div>

                    {uploaded ? (
                      <div className="p-2.5 bg-white/80 rounded-lg border border-emerald-200/80 text-[11px] text-emerald-900 font-medium">
                        <p className="truncate font-semibold">{uploaded.originalName}</p>
                        <p className="text-[10px] text-emerald-700 mt-0.5">
                          {(uploaded.fileSize / (1024 * 1024)).toFixed(2)} MB • Cloud ID: <span className="font-mono">{uploaded.cloudinaryPublicId || 'Pending'}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#756A70]">
                        Click below to select and upload document. Must not exceed 25MB.
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#D8CFD2]/50 flex items-center justify-between">
                    {uploaded ? (
                      <button
                        onClick={() => removeFile(doc.type)}
                        className="text-rose-700 hover:text-rose-900 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove & Replace</span>
                      </button>
                    ) : (
                      <label className={`cursor-pointer w-full text-center py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                        isUploading
                          ? 'bg-[#EEE9E6] text-[#756A70] cursor-wait'
                          : 'bg-[#48182F] hover:bg-[#391124] text-white border border-[#D4CBC4]/30'
                      }`}>
                        <Upload className="w-3.5 h-3.5 text-[#D4CBC4]" />
                        <span>{isUploading ? 'Validating & Uploading...' : 'Choose File to Upload'}</span>
                        <input
                          type="file"
                          accept={doc.ext}
                          disabled={isUploading}
                          onChange={e => handleFileUpload(doc.type, e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-[#D8CFD2]">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#EEE9E6] text-[#241B20] text-xs font-semibold rounded-xl hover:bg-[#D4CBC4] transition-colors border border-[#D8CFD2]"
            >
              <ArrowLeft className="w-4 h-4 text-[#756A70]" />
              <span>Back</span>
            </button>
            <button
              disabled={!isAllMandatoryUploaded}
              onClick={() => setStep(4)}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-card ${
                isAllMandatoryUploaded
                  ? 'bg-gradient-to-r from-[#48182F] to-[#391124] text-white hover:opacity-95 border border-[#D4CBC4]/30'
                  : 'bg-[#EEE9E6] text-[#756A70] cursor-not-allowed border border-[#D8CFD2]'
              }`}
            >
              <span>Next: Research Info</span>
              <ArrowRight className="w-4 h-4 text-[#D4CBC4]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Research Information (Patent & Publication) */}
      {step === 4 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#D8CFD2] space-y-5 animate-fadeIn">
          <div className="border-b border-[#D8CFD2] pb-3">
            <h2 className="text-sm font-bold text-[#241B20]">Section 4: Research & Innovation Information</h2>
            <p className="text-xs text-[#756A70] mt-0.5">Specify if your academic project resulted in any patents or peer-reviewed scientific publications.</p>
          </div>

          <div className="space-y-4">
            {/* Patent Option Card */}
            <div className={`p-4 rounded-xl border transition-all ${hasPatent ? 'bg-[#48182F]/5 border-[#48182F]/30' : 'bg-[#FAF8F7] border-[#D8CFD2]'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPatent}
                  onChange={e => setHasPatent(e.target.checked)}
                  className="w-4 h-4 text-[#48182F] accent-[#48182F] rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#241B20] block">Has Patent Applied / Published for this project?</span>
                  <span className="text-[11px] text-[#756A70]">Check if an Indian or international patent application has been registered.</span>
                </div>
              </label>

              {hasPatent && (
                <div className="mt-3 pt-3 border-t border-[#D8CFD2]/60 animate-fadeIn">
                  <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                    Patent Application Title / Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Patent Ref: 202641098231 - AI Agriculture Irrigation"
                    value={patentTitle}
                    onChange={e => setPatentTitle(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl text-[#241B20] font-semibold focus:ring-2 focus:ring-[#48182F]"
                  />
                </div>
              )}
            </div>

            {/* Publication Option Card */}
            <div className={`p-4 rounded-xl border transition-all ${hasPublication ? 'bg-[#48182F]/5 border-[#48182F]/30' : 'bg-[#FAF8F7] border-[#D8CFD2]'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPublication}
                  onChange={e => setHasPublication(e.target.checked)}
                  className="w-4 h-4 text-[#48182F] accent-[#48182F] rounded"
                />
                <div>
                  <span className="text-xs font-bold text-[#241B20] block">Has Paper Published / Accepted in Scopus/IEEE/Springer?</span>
                  <span className="text-[11px] text-[#756A70]">Check if a research paper has been accepted or published in indexed journals or conferences.</span>
                </div>
              </label>

              {hasPublication && (
                <div className="mt-3 pt-3 border-t border-[#D8CFD2]/60 animate-fadeIn">
                  <label className="block text-xs font-semibold text-[#241B20] mb-1.5">
                    Publication Paper Title & Journal / Conference / DOI
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IEEE Access / DOI: 10.1109/ACCESS.2026.019283"
                    value={paperTitle}
                    onChange={e => setPaperTitle(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-[#D8CFD2] rounded-xl text-[#241B20] font-semibold focus:ring-2 focus:ring-[#48182F]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#D8CFD2]">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#EEE9E6] text-[#241B20] text-xs font-semibold rounded-xl hover:bg-[#D4CBC4] transition-colors border border-[#D8CFD2]"
            >
              <ArrowLeft className="w-4 h-4 text-[#756A70]" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#48182F] to-[#391124] text-white text-xs font-bold rounded-xl hover:opacity-95 transition-all border border-[#D4CBC4]/30 shadow-card"
            >
              <span>Next: Final Review</span>
              <ArrowRight className="w-4 h-4 text-[#D4CBC4]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Final Review & Submit */}
      {step === 5 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#D8CFD2] space-y-6 animate-fadeIn">
          <div className="border-b border-[#D8CFD2] pb-3">
            <h2 className="text-sm font-bold text-[#241B20]">Section 5: Final Review & Submission Dossier</h2>
            <p className="text-xs text-[#756A70] mt-0.5">Please review your submission details. Upon confirmation, a unique project ID will be generated.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF8F7] p-5 rounded-2xl border border-[#D8CFD2]">
              <div>
                <span className="text-[#756A70] font-semibold text-[11px] block">CANDIDATE:</span>
                <p className="font-bold text-[#241B20] text-sm mt-0.5">{user?.name}</p>
                <p className="font-mono text-[#756A70] text-[11px]">{registerNumber || user?.registerNumber || 'N/A'}</p>
              </div>

              <div>
                <span className="text-[#756A70] font-semibold text-[11px] block">ACADEMIC COHORT:</span>
                <p className="font-bold text-[#241B20] mt-0.5">{department} • {academicYear}</p>
                <p className="text-[#756A70] text-[11px]">{yearOfStudy} ({semester})</p>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-[#D8CFD2]">
                <span className="text-[#756A70] font-semibold text-[11px] block">PROJECT TITLE:</span>
                <p className="font-bold text-[#241B20] text-sm mt-0.5">{title || 'Untitled Project'}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-[#756A70] font-semibold text-[11px] block">ABSTRACT:</span>
                <p className="text-[#241B20] mt-1 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-[#D8CFD2]">
                  {abstract || 'No abstract provided.'}
                </p>
              </div>

              <div>
                <span className="text-[#756A70] font-semibold text-[11px] block">PRIMARY SUPERVISOR:</span>
                <p className="font-bold text-[#48182F] mt-0.5">
                  {supervisors.find(s => s._id === supervisorId)?.name || 'Not Selected'}
                </p>
              </div>

              <div>
                <span className="text-[#756A70] font-semibold text-[11px] block">DEPARTMENT COORDINATOR:</span>
                <p className="font-bold text-[#48182F] mt-0.5">
                  {coordinators.find(c => c._id === coordinatorId)?.name || 'Not Selected'}
                </p>
              </div>
            </div>

            {/* Verified Documents Checklist */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Cloudinary Synced Documents (6/6 Mandatory):</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Ready for Submission
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-emerald-800">
                {REQUIRED_DOCS.map(d => (
                  <div key={d.type} className="p-2 bg-white/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                    <span className="truncate">{d.label}</span>
                    <span className="text-[10px] font-mono text-emerald-700 flex-shrink-0">
                      {(uploadedFiles[d.type]?.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#D8CFD2]">
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#EEE9E6] text-[#241B20] text-xs font-semibold rounded-xl hover:bg-[#D4CBC4] transition-colors border border-[#D8CFD2]"
            >
              <ArrowLeft className="w-4 h-4 text-[#756A70]" />
              <span>Back</span>
            </button>

            <button
              disabled={loading || !isAllMandatoryUploaded}
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-bold transition-all shadow-card ${
                loading || !isAllMandatoryUploaded
                  ? 'bg-[#EEE9E6] text-[#756A70] cursor-not-allowed border border-[#D8CFD2]'
                  : 'bg-gradient-to-r from-[#48182F] to-[#2c0c1b] hover:from-[#391124] hover:to-[#1b0610] text-white border border-[#D4CBC4]/40 scale-[1.01]'
              }`}
            >
              <FileCheck2 className="w-5 h-5 text-[#D4CBC4]" />
              <span>{loading ? 'Submitting & Generating Project ID...' : 'Confirm & Submit to Supervisor'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

