import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  UserCheck,
  FolderGit2,
  FolderKanban,
  Settings,
  ShieldCheck,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function AdminConsole() {
  const location = useLocation();
  const navigate = useNavigate();

  // Map route pathname to active tab
  const getTabFromPath = () => {
    if (location.pathname.includes('assignments')) return 'assignments';
    if (location.pathname.includes('repository')) return 'repository';
    if (location.pathname.includes('settings')) return 'settings';
    if (location.pathname.includes('audit-logs')) return 'audit';
    return 'users';
  };

  const [tab, setTab] = useState(getTabFromPath());
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [failedCloudinaryProjects, setFailedCloudinaryProjects] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // New User Form State
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'SUPERVISOR', department: 'ECE' });

  useEffect(() => {
    setTab(getTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'assignments') { fetchUsers(); fetchAllProjects(); }
    if (tab === 'repository') fetchFailedProjects();
    if (tab === 'audit') fetchAuditLogs();
    if (tab === 'settings') fetchConfigs();
  }, [tab]);

  const switchTab = (newTab) => {
    setTab(newTab);
    if (newTab === 'users') navigate('/admin/users');
    else if (newTab === 'assignments') navigate('/admin/assignments');
    else if (newTab === 'repository') navigate('/admin/repository');
    else if (newTab === 'settings') navigate('/admin/settings');
    else if (newTab === 'audit') navigate('/admin/audit-logs');
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/admin/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/search?limit=50');
      if (res.data.success) setProjects(res.data.projects);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFailedProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/search?status=AUTOMATION_FAILED');
      if (res.data.success) setFailedCloudinaryProjects(res.data.projects);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/admin/audit-logs');
      if (res.data.success) setAuditLogs(res.data.logs);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/admin/configs');
      if (res.data.success) setConfigs(res.data.configs);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/v1/admin/users', newUser);
      if (res.data.success) {
        setMessage('User account created/provisioned successfully.');
        setNewUser({ name: '', email: '', role: 'SUPERVISOR', department: 'ECE' });
        fetchUsers();
      }
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      const res = await axios.put(`/api/v1/admin/users/${userId}`, { role });
      if (res.data.success) {
        setMessage(`Role updated to ${role} for ${res.data.user.email}`);
        fetchUsers();
      }
    } catch (err) {
      setMessage('Error updating role: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateUserDept = async (userId, department) => {
    try {
      const res = await axios.put(`/api/v1/admin/users/${userId}`, { department });
      if (res.data.success) {
        setMessage(`Department updated to ${department} for ${res.data.user.email}`);
        fetchUsers();
      }
    } catch (err) {
      setMessage('Error updating department: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const res = await axios.put(`/api/v1/admin/users/${userId}`, { isActive: !currentStatus });
      if (res.data.success) {
        setMessage(`Account status toggled for ${res.data.user.email}`);
        fetchUsers();
      }
    } catch (err) {
      setMessage('Error toggling status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRetryCloudinary = async (projectId) => {
    try {
      await axios.post(`/api/v1/admin/projects/${projectId}/retry-cloudinary`);
      setMessage('Cloudinary automation retry initiated.');
      fetchFailedProjects();
    } catch (err) {
      setMessage('Retry Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const supervisors = users.filter(u => u.role === 'SUPERVISOR');
  const coordinators = users.filter(u => u.role === 'COORDINATOR');

  const handleAssignFaculty = async (projectId, supervisorId, coordinatorId) => {
    try {
      await axios.put(`/api/v1/projects/${projectId}`, { supervisorId, coordinatorId });
      setMessage('Project supervisor/coordinator assignment updated.');
      fetchAllProjects();
    } catch (err) {
      setMessage('Assignment Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#241B20] animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#48182F] via-[#391124] to-[#200814] text-white p-6 rounded-2xl shadow-card border border-[#391124] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#391124] text-[#D4CBC4] rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#D4CBC4]/20">
              Institutional Admin Console
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#FAF8F7]">Administrative Management Console</h1>
          <p className="text-xs text-[#D4CBC4] mt-1 font-medium">
            Manage users, project guide assignments, Cloudinary automation retries, system parameters & audit history
          </p>
        </div>
        <ShieldCheck className="w-8 h-8 text-[#D4CBC4] hidden sm:block opacity-90" />
      </div>

      {/* Admin Tab Header */}
      <div className="bg-white p-2 rounded-2xl border border-[#D8CFD2] shadow-card flex flex-wrap gap-2 text-xs font-bold">
        {[
          { id: 'users', label: 'Users & Roles', icon: Users },
          { id: 'assignments', label: 'Guide Assignments', icon: FolderKanban },
          { id: 'repository', label: 'Cloudinary Automation Retries', icon: FolderGit2 },
          { id: 'settings', label: 'System Configs', icon: Settings },
          { id: 'audit', label: 'Audit Logs', icon: ShieldCheck }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#48182F] to-[#391124] text-white shadow-card border border-[#D4CBC4]/30'
                  : 'text-[#756A70] hover:bg-[#FAF8F7] hover:text-[#241B20]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4CBC4]' : 'text-[#756A70]'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between gap-2 font-medium shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* TAB 1: USERS & ROLES */}
      {tab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* User Creation Form */}
          <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-4">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider border-b border-[#D8CFD2] pb-3">
              Add / Provision User Account
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#241B20] font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Raghava Rao"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl text-[#241B20] font-semibold focus:ring-2 focus:ring-[#48182F]"
                />
              </div>

              <div>
                <label className="block text-[#241B20] font-semibold mb-1">Institutional Email (@klu.ac.in)</label>
                <input
                  type="email"
                  required
                  placeholder="user@klu.ac.in"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl text-[#241B20] font-mono focus:ring-2 focus:ring-[#48182F]"
                />
              </div>

              <div>
                <label className="block text-[#241B20] font-semibold mb-1">Assigned System Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#D8CFD2] rounded-xl font-bold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
                >
                  <option value="STUDENT">Student</option>
                  <option value="SUPERVISOR">Supervisor (Faculty Guide)</option>
                  <option value="COORDINATOR">Department Coordinator</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[#241B20] font-semibold mb-1">Department</label>
                <select
                  value={newUser.department}
                  onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#D8CFD2] rounded-xl font-bold text-[#241B20] focus:ring-2 focus:ring-[#48182F]"
                >
                  <option value="ECE">ECE</option>
                  <option value="CSE">CSE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="AI&DS">AI&DS</option>
                  <option value="AIML">AIML</option>
                  <option value="IT">IT</option>
                  <option value="BME">BME</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#48182F] to-[#391124] hover:opacity-95 text-white rounded-xl font-bold shadow-card transition-all flex items-center justify-center gap-1.5 border border-[#D4CBC4]/30"
              >
                <Plus className="w-4 h-4 text-[#D4CBC4]" />
                <span>Save User Account</span>
              </button>
            </form>
          </div>

          {/* Users Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
              <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider">
                User Registry ({users.length})
              </h3>
              <span className="text-[11px] text-[#756A70]">KLEF Authentication Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EEE9E6] border-b border-[#D8CFD2] text-[#241B20] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Designated Role</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8CFD2]">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-[#FAF8F7] transition-colors">
                      <td className="p-3 font-semibold text-[#241B20]">
                        <div>{u.name}</div>
                        {u.registerNumber && <span className="text-[10px] text-[#756A70] font-mono">{u.registerNumber}</span>}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#756A70]">{u.email}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            u.role === 'ADMIN' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                            u.role === 'COORDINATOR' ? 'bg-[#EEE9E6] text-[#48182F] border-[#D4CBC4]' :
                            u.role === 'SUPERVISOR' ? 'bg-[#48182F]/10 text-[#48182F] border-[#48182F]/30' :
                            'bg-white text-[#241B20] border-[#D8CFD2]'
                          }`}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="SUPERVISOR">Supervisor</option>
                          <option value="COORDINATOR">Coordinator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="p-3 font-semibold text-[#241B20]">
                        <select
                          value={u.department || 'ECE'}
                          onChange={(e) => handleUpdateUserDept(u._id, e.target.value)}
                          className="px-2 py-1 bg-white border border-[#D8CFD2] rounded-lg text-xs font-semibold text-[#241B20] cursor-pointer"
                        >
                          <option value="ECE">ECE</option>
                          <option value="CSE">CSE</option>
                          <option value="EEE">EEE</option>
                          <option value="MECH">MECH</option>
                          <option value="CIVIL">CIVIL</option>
                          <option value="AI&DS">AI&DS</option>
                          <option value="AIML">AIML</option>
                          <option value="IT">IT</option>
                          <option value="BME">BME</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                            u.isActive
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GUIDE ASSIGNMENTS */}
      {tab === 'assignments' && (
        <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
            <div>
              <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider">
                Project Guide & Coordinator Assignments
              </h3>
              <p className="text-xs text-[#756A70] mt-0.5">Assign or reassign Supervisors and Department Coordinators to student projects</p>
            </div>
            <span className="text-[11px] font-bold text-[#48182F] bg-[#EEE9E6] px-2.5 py-1 rounded-lg border border-[#D4CBC4]">
              {projects.length} Projects Listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEE9E6] border-b border-[#D8CFD2] text-[#241B20] font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Project</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Primary Supervisor</th>
                  <th className="p-3">Coordinator</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CFD2]">
                {projects.map(proj => (
                  <tr key={proj._id} className="hover:bg-[#FAF8F7] transition-colors">
                    <td className="p-3 font-semibold text-[#241B20]">
                      <span className="font-mono text-[#48182F] font-bold block">{proj.projectId}</span>
                      <span className="text-[11px] text-[#756A70] truncate block max-w-xs">{proj.title}</span>
                    </td>
                    <td className="p-3 text-[#241B20]">
                      <div className="font-semibold">{proj.studentName}</div>
                      <span className="text-[10px] text-[#756A70] font-mono">{proj.registerNumber}</span>
                    </td>
                    <td className="p-3">
                      <select
                        value={proj.supervisorId?._id || proj.supervisorId || ''}
                        onChange={(e) => handleAssignFaculty(proj._id, e.target.value, proj.coordinatorId?._id || proj.coordinatorId)}
                        className="p-1.5 bg-white border border-[#D8CFD2] rounded-lg text-xs font-semibold text-[#241B20]"
                      >
                        <option value="">-- Assign Supervisor --</option>
                        {supervisors.map(s => (
                          <option key={s._id} value={s._id}>{s.name} ({s.department})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={proj.coordinatorId?._id || proj.coordinatorId || ''}
                        onChange={(e) => handleAssignFaculty(proj._id, proj.supervisorId?._id || proj.supervisorId, e.target.value)}
                        className="p-1.5 bg-white border border-[#D8CFD2] rounded-lg text-xs font-semibold text-[#241B20]"
                      >
                        <option value="">-- Assign Coordinator --</option>
                        {coordinators.map(c => (
                          <option key={c._id} value={c._id}>{c.name} ({c.department})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF8F7] border border-[#D8CFD2] text-[#241B20]">
                        {proj.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CLOUDINARY REPOSITORIES RETRY */}
      {tab === 'repository' && (
        <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
            <div>
              <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider">
                Cloudinary Automation Monitor & Failed Sync Queue
              </h3>
              <p className="text-xs text-[#756A70] mt-0.5">Projects stuck in AUTOMATION_FAILED can be retried idempotently here.</p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
              failedCloudinaryProjects.length === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {failedCloudinaryProjects.length} Pending Retries
            </span>
          </div>

          {failedCloudinaryProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#756A70] bg-[#FAF8F7] rounded-xl border border-[#D8CFD2]">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-[#241B20]">All Cloudinary Assets Healthy!</p>
              <p className="mt-0.5">No projects are currently in AUTOMATION_FAILED state.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedCloudinaryProjects.map(p => (
                <div key={p._id} className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-rose-900">[{p.projectId}] {p.title}</p>
                    <p className="text-[#756A70] mt-0.5">Student: {p.studentName} ({p.registerNumber})</p>
                  </div>
                  <button
                    onClick={() => handleRetryCloudinary(p._id)}
                    className="px-4 py-2 bg-[#48182F] hover:bg-[#391124] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm border border-[#D4CBC4]/30"
                  >
                    <RefreshCw className="w-4 h-4 text-[#D4CBC4]" />
                    <span>Trigger Idempotent Retry</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SYSTEM CONFIGS */}
      {tab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-4 animate-fadeIn">
          <div className="border-b border-[#D8CFD2] pb-3">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider">
              System Parameters & Cloud Configurations
            </h3>
            <p className="text-xs text-[#756A70] mt-0.5">Active repository upload caps, timeout rules, and institution configurations</p>
          </div>

          <div className="space-y-3 text-xs">
            {configs.length === 0 ? (
              <p className="p-6 text-center text-[#756A70] bg-[#FAF8F7] rounded-xl border border-[#D8CFD2]">
                No custom configs registered. Default institutional policies active.
              </p>
            ) : (
              configs.map(cfg => (
                <div key={cfg._id} className="p-4 bg-[#FAF8F7] border border-[#D8CFD2] rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#48182F] font-mono">{cfg.key}</p>
                    <p className="text-[#756A70] text-[11px] mt-0.5">{cfg.description}</p>
                  </div>
                  <div className="bg-white px-3 py-1.5 border border-[#D8CFD2] rounded-lg font-bold text-[#48182F] shadow-xs">
                    {JSON.stringify(cfg.value)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {tab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
            <div>
              <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider">
                System Security & Audit Stream ({auditLogs.length})
              </h3>
              <p className="text-xs text-[#756A70] mt-0.5">Immutable transaction log of user logins, project approvals, and config updates</p>
            </div>
            <span className="text-[10px] font-mono text-[#756A70] bg-[#FAF8F7] px-2.5 py-1 rounded-lg border border-[#D8CFD2]">
              Realtime Atlas Audit Log
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEE9E6] border-b border-[#D8CFD2] text-[#241B20] font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CFD2]">
                {auditLogs.map(log => (
                  <tr key={log._id} className="hover:bg-[#FAF8F7] transition-colors">
                    <td className="p-3 font-mono text-[11px] text-[#756A70]">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-[#241B20]">{log.actorName}</td>
                    <td className="p-3 font-bold text-[#756A70]">{log.actorRole}</td>
                    <td className="p-3 font-mono font-bold text-[#48182F]">{log.action}</td>
                    <td className="p-3 font-mono text-[11px] text-[#756A70]">{log.entityId || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
