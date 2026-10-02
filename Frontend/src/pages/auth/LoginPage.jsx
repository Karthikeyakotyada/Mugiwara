import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, AlertCircle, ArrowRight, UserCheck, GraduationCap, Sparkles, Lock } from 'lucide-react';

export default function LoginPage() {
  const { devLoginSwitch, loginWithGoogleToken, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleDevSwitch = async (role, email) => {
    setLoading(true);
    setError(null);
    const res = await devLoginSwitch(role, email);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError(null);
    const res = await loginWithGoogleToken(credentialResponse.credential);
    setLoading(false);
    if (res?.success) {
      navigate('/dashboard');
    } else {
      setError(res?.message || 'Google Login failed.');
    }
  };

  const devAccounts = [
    {
      role: 'STUDENT',
      name: 'Karthikeya Kotyada',
      email: '9924008032@klu.ac.in',
      tag: 'Student (Primary)',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      role: 'STUDENT',
      name: 'Rajesh Kumar',
      email: 'student1@klu.ac.in',
      tag: 'Student (2000030056)',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      role: 'SUPERVISOR',
      name: 'Dr. E. V. Krishna',
      email: 'supervisor1@klu.ac.in',
      tag: 'Supervisor (ECE)',
      badgeColor: 'bg-violet-50 text-violet-800 border-violet-200'
    },
    {
      role: 'COORDINATOR',
      name: 'Dr. K. Raghava Rao',
      email: 'coordinator1@klu.ac.in',
      tag: 'Coordinator (ECE)',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      role: 'ADMIN',
      name: 'System Administrator',
      email: 'admin@klu.ac.in',
      tag: 'System Admin',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b0610] via-[#240816] to-[#0d0208] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden text-[#241B20]">
      {/* Ambient Lighting Glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#5f2b48]/30 rounded-full blur-3xl pointer-events-none animate-subtle-pulse"></div>
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#48182F]/40 rounded-full blur-3xl pointer-events-none animate-subtle-pulse"></div>

      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-modal border border-white/20 p-6 sm:p-8 z-10 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#48182F] to-[#7e4768] text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl mx-auto shadow-xl mb-4 border border-white/20 transform hover:scale-105 transition-transform">
            KLU
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#241B20] tracking-tight">
            KLEF / KLU Academic Repository
          </h1>
          <p className="text-xs text-[#756A70] mt-1 font-medium">
            Project Management, Evaluation & Institutional Repository
          </p>
        </div>

        {/* Institutional Access Badge */}
        <div className="mb-6 bg-[#FAF8F7] border border-[#D8CFD2] rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#48182F] flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-[#48182F]">Institutional Google Access</p>
            <p className="mt-0.5 text-[#756A70] leading-relaxed">
              Google Workspace authentication is enabled with automated role mapping and Cloudinary digital repository archiving.
            </p>
          </div>
        </div>

        {(error || authError) && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error || authError}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="mb-6 flex justify-center">
          <div className="p-1 rounded-full hover:shadow-md transition-shadow">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In was cancelled or failed.')}
              theme="outline"
              size="large"
              shape="pill"
              text="signin_with"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D8CFD2]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-[#756A70] bg-white px-3">
            Institutional Dev Fast-Switch
          </div>
        </div>

        {/* 1-Click Institutional Dev Switcher */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {devAccounts.map((acc) => (
            <button
              key={acc.email}
              disabled={loading}
              onClick={() => handleDevSwitch(acc.role, acc.email)}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#D8CFD2] bg-[#FAF8F7] hover:bg-white hover:border-[#48182F]/40 hover:shadow-sm text-xs font-semibold text-[#241B20] transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#D8CFD2] flex items-center justify-center text-[11px] font-bold text-[#48182F] shadow-2xs group-hover:bg-[#48182F] group-hover:text-white transition-colors">
                  {acc.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#241B20] text-xs">{acc.name}</p>
                  <p className="text-[10px] text-[#756A70] font-mono">{acc.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border ${acc.badgeColor}`}>
                  {acc.tag}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#756A70] group-hover:text-[#48182F] group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center text-[10px] text-[#756A70] flex items-center justify-center gap-1.5 font-medium">
          <Lock className="w-3 h-3 text-[#48182F]" />
          <span>Secured via Institutional JWT Cookie Session & Cloudinary Storage</span>
        </div>
      </div>
    </div>
  );
}


