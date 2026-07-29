import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const generatePrescriptionPDF = async (prescriptionData) => {
  const {
    prescriptionId, doctorName, specialization, clinicName, sealName,
    patientName, medicines = [], notes, issuedAt, signature, seal
  } = prescriptionData;

  const uploadsDir = path.join(__dirname, '../../uploads/prescriptions');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, `${prescriptionId}.pdf`);

  const medicinesRows = medicines.map((m, i) => `
    <tr style="background: ${i % 2 === 0 ? '#f8fafc' : '#fff'}">
      <td style="padding:10px 14px; border:1px solid #e2e8f0;">${m.name}</td>
      <td style="padding:10px 14px; border:1px solid #e2e8f0;">${m.dosage}</td>
      <td style="padding:10px 14px; border:1px solid #e2e8f0;">${m.duration}</td>
      <td style="padding:10px 14px; border:1px solid #e2e8f0;">${m.instructions}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; }
  .page { padding: 40px 50px; max-width: 794px; margin: 0 auto; }
  .header { border-bottom: 3px solid #2563A8; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
  .clinic-info h1 { margin: 0; color: #2563A8; font-size: 22px; }
  .clinic-info p { margin: 3px 0; color: #475569; font-size: 13px; }
  .rx-symbol { font-size: 60px; color: #2563A8; font-weight: 900; line-height: 1; }
  .patient-section { background: #f0f7ff; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
  .patient-section h3 { margin: 0 0 8px; color: #2563A8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
  .patient-section p { margin: 4px 0; font-size: 14px; }
  .section-title { font-size: 15px; font-weight: 700; color: #2563A8; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  table thead { background: #2563A8; color: white; }
  table thead th { padding: 10px 14px; text-align: left; font-weight: 600; }
  .notes-box { background: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 14px 18px; margin: 20px 0; font-size: 14px; }
  .footer { border-top: 2px solid #e2e8f0; margin-top: 40px; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .seal { text-align: center; display: flex; flex-direction: column; align-items: center; }
  .seal-box { border: 2px solid #2563A8; border-radius: 8px; padding: 12px 24px; display: inline-block; text-align: center; }
  .seal-box p { margin: 2px 0; font-size: 12px; color: #2563A8; font-weight: 600; }
  .stamp { color: #16a34a; font-weight: 700; font-size: 13px; border: 2px solid #16a34a; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-top: 8px; }
  .issued { font-size: 12px; color: #64748b; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="clinic-info">
      <h1>🏥 ${clinicName}</h1>
      <p><strong>Dr. ${doctorName}</strong></p>
      <p>${specialization}</p>
      <p>Seal: ${sealName}</p>
    </div>
    <div class="rx-symbol">℞</div>
  </div>
  
  <div class="patient-section">
    <h3>Patient Information</h3>
    <p><strong>Name:</strong> ${patientName}</p>
    <p><strong>Date Issued:</strong> ${new Date(issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
 
  <div class="section-title">Prescribed Medicines</div>
  <table>
    <thead>
      <tr>
        <th>Medicine</th><th>Dosage</th><th>Duration</th><th>Instructions</th>
      </tr>
    </thead>
    <tbody>${medicinesRows}</tbody>
  </table>

  ${notes ? `<div class="notes-box"><strong>Notes:</strong> ${notes}</div>` : ''}

  <div class="footer">
    <div class="issued">
      <p>Issued on: ${new Date(issuedAt).toLocaleDateString()}</p>
      <p>SmartDoctor Platform</p>
    </div>
    <div class="seal">
      ${signature ? `<img src="${signature}" style="max-height: 50px; max-width: 150px; object-fit: contain; margin-bottom: 6px; display: block;" />` : ''}
      <div class="seal-box">
        <p>Dr. ${doctorName}</p>
        <p>${sealName}</p>
        <p>${specialization}</p>
        ${seal ? `<img src="${seal}" style="max-height: 60px; max-width: 120px; object-fit: contain; display: block; margin: 8px auto 0;" />` : ''}
      </div>
      <br>
      <span class="stamp">✓ Digitally Sealed — Verified</span>
    </div>
  </div>
</div>
</body>
</html>`;

  try {
    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;
    
    const launchOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    };

    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\afham', 'AppData\\Local');
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

    const chromePaths = [
      path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(localAppData, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(programFilesX86, 'Microsoft\\Edge\\Application\\msedge.exe'),
      path.join(programFiles, 'Microsoft\\Edge\\Application\\msedge.exe'),
      path.join(localAppData, 'Microsoft\\Edge\\Application\\msedge.exe')
    ];

    for (const p of chromePaths) {
      if (fs.existsSync(p)) {
        launchOptions.executablePath = p;
        break;
      }
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: filePath, format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
    await browser.close();
    return filePath;
  } catch (err) {
    console.warn('[PDF Service] Puppeteer not available, returning HTML fallback path:', err.message);
    const htmlPath = filePath.replace('.pdf', '.html');
    fs.writeFileSync(htmlPath, html, 'utf8');
    return htmlPath;
  }
};
