import React, { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';

export default function RejectionModal({ projectCode, studentName, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  const isReasonValid = reason.trim().length >= 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReasonValid) {
      onConfirm(reason.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1b0610]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-modal border border-[#D8CFD2] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#48182F] to-[#2c0c1b] text-white p-5 flex items-center justify-between border-b border-[#391124]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-400/30">
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FAF8F7]">Return Project For Revision</h3>
              <p className="text-[10px] text-[#D4CBC4]">Provides actionable feedback for candidate</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-[#D4CBC4] hover:bg-[#391124] rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[#FAF8F7] border border-[#D8CFD2] p-4 rounded-xl text-xs space-y-1">
            <p className="font-semibold text-[#241B20]">
              Project: <span className="font-mono text-[#48182F] font-bold">{projectCode}</span>
            </p>
            <p className="text-[#756A70]">Candidate: <strong className="text-[#241B20]">{studentName}</strong></p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#241B20]">
                Reason for Return / Revision <span className="text-rose-600">*</span>
              </label>
              <span className={`text-[10px] font-mono font-bold ${reason.trim().length >= 10 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {reason.trim().length}/10 min chars
              </span>
            </div>
            <textarea
              rows={4}
              required
              placeholder="Explain clearly what corrections, abstract modifications, or document replacements the candidate must make before resubmitting..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full text-xs p-3.5 border border-[#D8CFD2] rounded-xl focus:ring-2 focus:ring-[#48182F] focus:border-[#48182F] bg-white text-[#241B20] leading-relaxed transition-all shadow-xs"
            />
            <p className="text-[11px] text-[#756A70] mt-1.5">
              This notice will be recorded in the audit trail and sent directly to the student.
            </p>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#D8CFD2]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-[#EEE9E6] hover:bg-[#D4CBC4] text-[#241B20] rounded-xl text-xs font-semibold transition-colors border border-[#D8CFD2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isReasonValid}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-card transition-all flex items-center gap-1.5 ${
                isReasonValid
                  ? 'bg-rose-800 hover:bg-rose-900 text-white'
                  : 'bg-[#EEE9E6] text-[#756A70] cursor-not-allowed border border-[#D8CFD2]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm & Return Submission</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
