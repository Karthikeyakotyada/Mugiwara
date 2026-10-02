const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * Generates PDF report stream
 */
function generatePDFReport(res, title, subtitle, projects) {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, '_')}_report.pdf"`);

  doc.pipe(res);

  // Header
  doc.fontSize(18).fillColor('#003366').text('KLEF / KLU Academic Project Management', { align: 'center' });
  doc.fontSize(14).fillColor('#333333').text(title, { align: 'center' });
  if (subtitle) doc.fontSize(10).fillColor('#666666').text(subtitle, { align: 'center' });
  doc.moveDown();

  // Summary Count
  doc.fontSize(10).fillColor('#000000').text(`Total Records: ${projects.length}`, { underline: true });
  doc.moveDown(0.5);

  // Project List
  projects.forEach((proj, idx) => {
    if (doc.y > 720) doc.addPage();

    doc.fontSize(11).fillColor('#003366').text(`${idx + 1}. [${proj.projectId}] ${proj.title}`);
    doc.fontSize(9).fillColor('#333333').text(`   Student: ${proj.studentName} (${proj.registerNumber}) | Dept: ${proj.department} | Year: ${proj.academicYear} | Sem: ${proj.semester}`);
    doc.fontSize(9).fillColor('#555555').text(`   Supervisor: ${proj.supervisorId ? proj.supervisorId.name : 'N/A'} | Coordinator: ${proj.coordinatorId ? proj.coordinatorId.name : 'N/A'}`);
    doc.fontSize(9).fillColor(proj.status === 'APPROVED' || proj.status === 'LOCKED' ? '#007700' : proj.status.includes('REJECTED') ? '#cc0000' : '#bb7700')
       .text(`   Status: ${proj.status} | Version: v${proj.currentVersion}`);
    doc.moveDown(0.5);
  });

  doc.end();
}

/**
 * Generates Excel report stream
 */
async function generateExcelReport(res, title, projects) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Projects');

  worksheet.columns = [
    { header: 'Project ID', key: 'projectId', width: 15 },
    { header: 'Title', key: 'title', width: 35 },
    { header: 'Student Name', key: 'studentName', width: 20 },
    { header: 'Register No', key: 'registerNumber', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Department', key: 'department', width: 12 },
    { header: 'Academic Year', key: 'academicYear', width: 15 },
    { header: 'Semester', key: 'semester', width: 12 },
    { header: 'Technology', key: 'technology', width: 25 },
    { header: 'Domain', key: 'domain', width: 20 },
    { header: 'Supervisor', key: 'supervisor', width: 20 },
    { header: 'Coordinator', key: 'coordinator', width: 20 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Version', key: 'version', width: 10 }
  ];

  // Formatting header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };

  projects.forEach((proj) => {
    worksheet.addRow({
      projectId: proj.projectId,
      title: proj.title,
      studentName: proj.studentName,
      registerNumber: proj.registerNumber,
      email: proj.email,
      department: proj.department,
      academicYear: proj.academicYear,
      semester: proj.semester,
      technology: Array.isArray(proj.technology) ? proj.technology.join(', ') : proj.technology,
      domain: proj.domain,
      supervisor: proj.supervisorId ? proj.supervisorId.name : 'N/A',
      coordinator: proj.coordinatorId ? proj.coordinatorId.name : 'N/A',
      status: proj.status,
      version: `v${proj.currentVersion}`
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, '_')}_report.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Generates CSV report stream
 */
function generateCSVReport(res, title, projects) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, '_')}_report.csv"`);

  const headers = ['Project ID', 'Title', 'Student Name', 'Register No', 'Email', 'Department', 'Academic Year', 'Semester', 'Technology', 'Domain', 'Supervisor', 'Coordinator', 'Status', 'Version'];
  
  let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';

  projects.forEach((proj) => {
    const row = [
      proj.projectId,
      proj.title.replace(/"/g, '""'),
      proj.studentName,
      proj.registerNumber,
      proj.email,
      proj.department,
      proj.academicYear,
      proj.semester,
      Array.isArray(proj.technology) ? proj.technology.join('; ') : proj.technology,
      proj.domain,
      proj.supervisorId ? proj.supervisorId.name : 'N/A',
      proj.coordinatorId ? proj.coordinatorId.name : 'N/A',
      proj.status,
      `v${proj.currentVersion}`
    ];
    csvContent += row.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',') + '\n';
  });

  res.send(csvContent);
}

module.exports = {
  generatePDFReport,
  generateExcelReport,
  generateCSVReport
};
