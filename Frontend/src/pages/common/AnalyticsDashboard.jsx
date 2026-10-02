import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart } from 'react-google-charts';
import {
  BarChart3,
  FolderKanban,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  BookOpen,
  Users,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/analytics');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#48182F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#756A70]">Loading real-time institutional analytics & charts...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  const techItems = charts.technology || [];
  const techChartData = [
    ['Technology', 'Projects Count'],
    ...techItems
  ];

  const domainItems = charts.domain || [];
  const domainChartData = [
    ['Domain', 'Projects'],
    ...domainItems
  ];

  const yearItems = charts.year || [];
  const yearChartData = [
    ['Academic Year', 'Total Projects'],
    ...yearItems
  ];

  const semItems = charts.semester || [];
  const semChartData = [
    ['Semester', 'Submissions'],
    ...semItems
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#241B20] animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#48182F] via-[#391124] to-[#200814] text-white p-6 rounded-2xl shadow-card border border-[#391124] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#391124] text-[#D4CBC4] rounded-md text-[10px] font-bold uppercase tracking-wider border border-[#D4CBC4]/20">
              Executive Analytics
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#FAF8F7]">KLU Academic Analytics & Insights</h1>
          <p className="text-xs text-[#D4CBC4] mt-1 font-medium">
            Real-time MongoDB Atlas statistics & Google Charts visual analytics
          </p>
        </div>
        <BarChart3 className="w-9 h-9 text-[#D4CBC4] hidden sm:block opacity-90" />
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#D8CFD2] shadow-card text-center hover:border-[#48182F]/40 transition-all">
          <FolderKanban className="w-5 h-5 mx-auto text-[#48182F] mb-1" />
          <p className="text-[10px] text-[#756A70] font-bold uppercase tracking-wider">Total</p>
          <p className="text-lg font-extrabold text-[#241B20]">{summary.totalProjects || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8CFD2] shadow-card text-center hover:border-emerald-300 transition-all">
          <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
          <p className="text-[10px] text-[#756A70] font-bold uppercase tracking-wider">Approved</p>
          <p className="text-lg font-extrabold text-emerald-700">{summary.approvedProjects || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8CFD2] shadow-card text-center hover:border-amber-300 transition-all">
          <Clock className="w-5 h-5 mx-auto text-amber-600 mb-1" />
          <p className="text-[10px] text-[#756A70] font-bold uppercase tracking-wider">Pending</p>
          <p className="text-lg font-extrabold text-amber-700">{summary.pendingProjects || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8CFD2] shadow-card text-center hover:border-rose-300 transition-all">
          <XCircle className="w-5 h-5 mx-auto text-rose-600 mb-1" />
          <p className="text-[10px] text-[#756A70] font-bold uppercase tracking-wider">Rejected</p>
          <p className="text-lg font-extrabold text-rose-700">{summary.rejectedProjects || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8CFD2] shadow-card text-center hover:border-[#48182F]/40 transition-all">
          <Award className="w-5 h-5 mx-auto text-[#48182F] mb-1" />
          <p className="text-[10px] text-[#756A70] font-bold uppercase tracking-wider">Patents</p>
          <p className="text-lg font-extrabold text-[#48182F]">{summary.patentCount || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8CFD2] shadow-card text-center hover:border-[#56483F]/40 transition-all">
          <BookOpen className="w-5 h-5 mx-auto text-[#56483F] mb-1" />
          <p className="text-[10px] text-[#756A70] font-bold uppercase tracking-wider">Papers</p>
          <p className="text-lg font-extrabold text-[#56483F]">{summary.publicationCount || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8CFD2] shadow-card text-center hover:border-[#756A70]/40 transition-all">
          <Users className="w-5 h-5 mx-auto text-[#756A70] mb-1" />
          <p className="text-[10px] text-[#756A70] font-bold uppercase tracking-wider">Supervisors</p>
          <p className="text-lg font-extrabold text-[#241B20]">{summary.supervisorCount || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D8CFD2] shadow-card text-center hover:border-[#48182F]/40 transition-all">
          <Users className="w-5 h-5 mx-auto text-[#48182F] mb-1" />
          <p className="text-[10px] text-[#756A70] font-bold uppercase tracking-wider">Coordinators</p>
          <p className="text-lg font-extrabold text-[#48182F]">{summary.coordinatorCount || 0}</p>
        </div>
      </div>

      {/* Google Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technology Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#48182F]" />
              <span>Technology Stack Distribution</span>
            </h3>
            <span className="text-[10px] font-bold text-[#756A70]">Donut Visualization</span>
          </div>

          <div className="h-72 flex items-center justify-center">
            {techItems.length === 0 ? (
              <p className="text-xs text-[#756A70] font-medium">No technology stack recorded yet.</p>
            ) : (
              <Chart
                chartType="PieChart"
                data={techChartData}
                options={{
                  pieHole: 0.45,
                  is3D: false,
                  legend: { position: 'right', textStyle: { color: '#241B20', fontSize: 11, fontName: 'Outfit' } },
                  colors: ['#48182F', '#7E4768', '#8C7C71', '#56483F', '#A3718D', '#2C0C1B', '#391124'],
                  chartArea: { width: '90%', height: '80%' }
                }}
                width="100%"
                height="100%"
              />
            )}
          </div>
        </div>

        {/* Domain Distribution Column Chart */}
        <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#48182F]" />
              <span>Project Domains Breakdown</span>
            </h3>
            <span className="text-[10px] font-bold text-[#756A70]">Column Distribution</span>
          </div>

          <div className="h-72 flex items-center justify-center">
            {domainItems.length === 0 ? (
              <p className="text-xs text-[#756A70] font-medium">No domain data recorded yet.</p>
            ) : (
              <Chart
                chartType="ColumnChart"
                data={domainChartData}
                options={{
                  legend: { position: 'none' },
                  colors: ['#48182F'],
                  vAxis: { minValue: 0 },
                  chartArea: { width: '85%', height: '75%' }
                }}
                width="100%"
                height="100%"
              />
            )}
          </div>
        </div>

        {/* Year-wise Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#7E4768]" />
              <span>Academic Cohort Statistics</span>
            </h3>
            <span className="text-[10px] font-bold text-[#756A70]">Year-on-Year Submissions</span>
          </div>

          <div className="h-72 flex items-center justify-center">
            {yearItems.length === 0 ? (
              <p className="text-xs text-[#756A70] font-medium">No academic year records recorded yet.</p>
            ) : (
              <Chart
                chartType="BarChart"
                data={yearChartData}
                options={{
                  legend: { position: 'none' },
                  colors: ['#7E4768'],
                  chartArea: { width: '85%', height: '75%' }
                }}
                width="100%"
                height="100%"
              />
            )}
          </div>
        </div>

        {/* Semester-wise Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-[#D8CFD2] shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-[#D8CFD2] pb-3">
            <h3 className="text-xs font-bold text-[#241B20] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#48182F]" />
              <span>Semester-wise Submissions</span>
            </h3>
            <span className="text-[10px] font-bold text-[#756A70]">Even vs Odd Terms</span>
          </div>

          <div className="h-72 flex items-center justify-center">
            {semItems.length === 0 ? (
              <p className="text-xs text-[#756A70] font-medium">No semester submission records recorded yet.</p>
            ) : (
              <Chart
                chartType="PieChart"
                data={semChartData}
                options={{
                  pieHole: 0.5,
                  colors: ['#48182F', '#8C7C71', '#56483F', '#D4CBC4'],
                  chartArea: { width: '90%', height: '80%' }
                }}
                width="100%"
                height="100%"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
