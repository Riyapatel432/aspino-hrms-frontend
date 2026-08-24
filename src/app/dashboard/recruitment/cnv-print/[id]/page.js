"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function CnvPrintPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [reqData, setReqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!id) return;
    async function fetchReq() {
      try {
        setLoading(true);
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${id}/cnv`);
        if (!res.ok) {
          const resFallback = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${id}`);
          if (!resFallback.ok) throw new Error("Failed to load requisition details");
          const fallbackData = await resFallback.json();
          setReqData(fallbackData);
          return;
        }
        const data = await res.json();
        setReqData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReq();
  }, [id, backendUrl]);

  const handleBack = () => {
    try {
      if (typeof window !== "undefined" && window.opener) {
        window.close();
      } else {
        router.push("/dashboard/recruitment");
      }
    } catch {
      router.push("/dashboard/recruitment");
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("cnv-print-sheet");
    if (!printContent) {
      window.print();
      return;
    }

    let iframe = document.getElementById("print-iframe");
    if (iframe) {
      iframe.remove();
    }
    iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <title>CNV Notification - ${reqData.title || "Document"}</title>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    }
    .print-sheet {
      width: 100%;
      min-height: 98vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      box-sizing: border-box;
      border: 1.5px solid #0f3d70;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background: #0f3d70 !important;
      color: #ffffff !important;
      padding: 24px 36px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 4px solid #f59e0b;
    }
    .header-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #ffffff;
    }
    .header-sub {
      font-size: 10.5px;
      color: #cbd5e1;
      margin-top: 4px;
    }
    .header-right {
      font-size: 10.5px;
      text-align: right;
      line-height: 1.5;
      color: #e2e8f0;
    }
    .dept-badge {
      font-weight: 800;
      color: #f59e0b;
      letter-spacing: 0.5px;
      font-size: 11px;
    }
    .body {
      padding: 24px 36px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .ref-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      border-bottom: 1.5px dashed #cbd5e1;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .to-block {
      font-size: 13px;
      color: #1e293b;
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .subject {
      font-size: 14.5px;
      font-weight: 900;
      text-align: center;
      margin: 10px 0 12px;
      color: #0f3d70;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 8px 14px;
      background: #eff6ff;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }
    .legal-clause {
      font-size: 11.5px;
      line-height: 1.6;
      background: #f8fafc;
      border-left: 4px solid #0f3d70;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 14px;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin: 8px 0 14px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      background: #0f3d70 !important;
      color: #ffffff !important;
      padding: 9px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 11.5px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    td {
      padding: 8px 14px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .td-label {
      font-weight: 700;
      color: #475569;
      width: 38%;
      background: #f1f5f9;
      border-right: 1px solid #e2e8f0;
    }
    .closing-text {
      font-size: 11.5px;
      line-height: 1.6;
      color: #334155;
      margin: 10px 0 14px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .seal-row {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 10px 0 4px;
    }
    .seal-block {
      text-align: center;
    }
    .seal-line {
      border-top: 1.5px solid #64748b;
      width: 180px;
      margin: 0 auto 6px;
    }
    .signatory-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f3d70;
    }
    .signatory-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .seal-circle {
      height: 75px;
      width: 110px;
      border: 1.5px dashed #94a3b8;
      border-radius: 50%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      background: #0f3d70 !important;
      color: #ffffff !important;
      padding: 12px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      letter-spacing: 0.3px;
      border-top: 2.5px solid #f59e0b;
    }
  </style>
</head>
<body>
  <div class="print-sheet">
    <div class="header">
      <div>
        <div class="header-title">ASPINO SPECIALTY CHEMICALS PVT. LTD.</div>
        <div class="header-sub">CIN: U20297GJ2024PTC150782 &nbsp;|&nbsp; SRN-271, BLK-314, Nakoda Road, Ta-Mangrol, Surat - 394125</div>
      </div>
      <div class="header-right">
        <div class="dept-badge">HUMAN RESOURCES DEPARTMENT</div>
        <div>info@aspinochemicals.com</div>
        <div>+91 98259 57173</div>
      </div>
    </div>

    <div class="body">
      <div>
        <div class="ref-row">
          <div><strong>Ref. No.:</strong> ${refNo}</div>
          <div><strong>Date:</strong> ${dateFormatted}</div>
        </div>
        <div class="to-block">
          <strong>To,</strong><br/>
          The Employment Officer / Competent Authority,<br/>
          <strong style="color:#0f3d70; font-size:14px;">${exchangeOffice}</strong>
        </div>
        <div class="subject">Statutory Notification of Vacancy (CNV Act, 1959)</div>
        <div class="legal-clause">
          This official notification is submitted in strict compliance with Section 4 of the <strong>Employment Exchanges (Compulsory Notification of Vacancies) Act, 1959</strong> and relevant statutory rules for registration and referral of eligible candidates.
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 38%;">Compliance Field</th>
              <th>Particulars / Specifications</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="td-label">Name of Employer / Organization</td><td><strong>Aspino Specialty Chemicals Pvt. Ltd.</strong></td></tr>
            <tr><td class="td-label">Vacancy / Job Title</td><td><strong style="color: #0f3d70; font-size: 13px;">${req.title || "—"}</strong></td></tr>
            <tr><td class="td-label">Department / Unit</td><td>${req.department?.name || "General"}</td></tr>
            <tr><td class="td-label">Number of Vacancies (Headcount)</td><td><strong>${req.headcount || 1} Position(s)</strong></td></tr>
            <tr><td class="td-label">Minimum Experience Required</td><td>${req.experienceRequired ? `${req.experienceRequired} Year(s)` : "Freshers / Entry Level eligible"}</td></tr>
            <tr><td class="td-label">Nature of Employment</td><td>Full-Time / Regular & Permanent</td></tr>
            <tr><td class="td-label">Type of Vacancy</td><td>${req.requisitionType === "REPLACEMENT" ? "Replacement Requirement" : "New Requirement / Expansion"}</td></tr>
            <tr><td class="td-label">Job Specification / Requirements</td><td>${req.jobSpecification || "As per company standard specification"}</td></tr>
            <tr><td class="td-label">Statutory Reference Number</td><td><span style="font-family: monospace; font-weight: 700;">${refNo}</span></td></tr>
            <tr><td class="td-label">Official Notification Date</td><td>${dateFormatted}</td></tr>
          </tbody>
        </table>
        <div class="closing-text">
          We request your office to kindly register this notification on record and sponsor / refer eligible candidates conforming to the above specifications. Aspino Specialty Chemicals Pvt. Ltd. practices equal employment opportunity across all categories including persons with benchmark disabilities.
        </div>
      </div>

      <div class="seal-row">
        <div class="seal-block" style="text-align: left;">
          <div style="height: 45px;"></div>
          <div class="seal-line" style="margin-left: 0;"></div>
          <div class="signatory-title">Authorized Signatory</div>
          <div class="signatory-sub">Aspino Specialty Chemicals Pvt. Ltd.</div>
        </div>
        <div class="seal-block">
          <div class="seal-circle">Official<br/>Company Seal</div>
        </div>
        <div class="seal-block" style="text-align: right;">
          <div style="height: 45px;"></div>
          <div class="seal-line" style="margin-right: 0;"></div>
          <div class="signatory-title">Employment Exchange Receipt</div>
          <div class="signatory-sub">Receiving Officer Signature & Seal</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>Ref: ${refNo} &nbsp;|&nbsp; Generated on ${dateFormatted}</div>
      <div>Official Statutory Form (Act, 1959) &nbsp;|&nbsp; Aspino HRMS Portal</div>
    </div>
  </div>
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        <p className="text-sm font-semibold text-slate-600">Generating Official CNV Document...</p>
      </div>
    );
  }

  if (error || !reqData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <p className="text-base font-bold text-rose-600">{error || "Requisition not found"}</p>
        <button
          onClick={handleBack}
          className="px-5 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold shadow hover:bg-slate-900 transition"
        >
          ← Return to Recruitment
        </button>
      </div>
    );
  }

  const req = reqData;
  const cnv = reqData.cnvRecord || {};
  const now = new Date();
  const refNo = cnv.referenceNumber || req.cnvRefNumber || `REF/CNV/${now.getFullYear()}/${String(req.id || "1").slice(-4).padStart(4, "0")}`;
  const exchangeOffice = cnv.employmentExchangeOffice || req.cnvExchangeOffice || "District Employment Exchange Office, Surat";
  const dateFormatted = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;

  return (
    <div className="w-full min-h-screen py-4 px-2 flex flex-col items-center print:p-0 print:m-0 print:bg-white">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-4xl mb-3 flex items-center justify-between bg-white dark:bg-slate-900 px-5 py-3 rounded-xl shadow border border-slate-200 dark:border-slate-800 print:hidden">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Requisitions
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            Single-Page Official A4 Letterhead
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#0f3d70] hover:bg-[#164a85] text-white text-xs font-extrabold rounded-lg shadow-md transition"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Full-Page A4 Sheet */}
      <div
        id="cnv-print-sheet"
        className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl flex flex-col justify-between box-border border-2 border-[#0f3d70] rounded-lg overflow-hidden print:border print:border-[#0f3d70] print:rounded-none print:shadow-none print:max-w-none print:w-full print:h-full print:m-0 print:p-0"
        style={{ minHeight: "95vh" }}
      >
        {/* Top Header Banner */}
        <div className="bg-[#0f3d70] text-white px-8 py-6 flex items-center justify-between border-b-4 border-amber-500">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white">
              ASPINO SPECIALTY CHEMICALS PVT. LTD.
            </h1>
            <p className="text-xs text-slate-200 mt-1 leading-normal font-medium">
              CIN: U20297GJ2024PTC150782 &nbsp;|&nbsp; SRN-271, BLK-314, Nakoda Road, Ta-Mangrol, Surat - 394125
            </p>
          </div>
          <div className="text-right text-xs leading-relaxed text-slate-200 hidden sm:block print:block">
            <div className="font-extrabold text-amber-400 text-xs uppercase tracking-wider mb-1">
              HUMAN RESOURCES DEPARTMENT
            </div>
            <div>info@aspinochemicals.com</div>
            <div>+91 98259 57173</div>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between space-y-5 print:p-6 print:space-y-3">
          <div>
            {/* Reference & Date */}
            <div className="flex justify-between items-center text-sm font-bold text-slate-700 border-b-2 border-dashed border-slate-300 pb-2 mb-4">
              <div>Ref. No.: <span className="font-mono text-[#0f3d70]">{refNo}</span></div>
              <div>Date: <span>{dateFormatted}</span></div>
            </div>

            {/* To Authority */}
            <div className="text-sm text-slate-800 leading-normal mb-4">
              <span className="font-bold">To,</span>
              <div className="text-slate-600">The Employment Officer / Competent Authority,</div>
              <div className="font-bold text-[#0f3d70] text-base">{exchangeOffice}</div>
            </div>

            {/* Subject Title */}
            <div className="bg-blue-50 border border-blue-200 text-[#0f3d70] font-black text-center py-2.5 px-4 rounded-lg text-sm sm:text-base uppercase tracking-wider mb-4">
              Statutory Notification of Vacancy (CNV Act, 1959)
            </div>

            {/* Legal Notice */}
            <div className="bg-slate-50 border-l-4 border-[#0f3d70] p-3.5 rounded text-xs sm:text-sm leading-relaxed text-slate-700 mb-4">
              This official notification is submitted under Section 4 of the <strong>Employment Exchanges (Compulsory Notification of Vacancies) Act, 1959</strong> for registration and referral of eligible candidates.
            </div>

            {/* Particulars Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-4 shadow-sm">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f3d70] text-white uppercase text-xs font-bold">
                    <th className="py-2.5 px-4 w-[38%] border-r border-blue-900">Compliance Field</th>
                    <th className="py-2.5 px-4">Particulars / Specifications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50">
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Organization Name</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">Aspino Specialty Chemicals Pvt. Ltd.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Vacancy / Job Title</td>
                    <td className="py-2 px-4 font-black text-[#0f3d70]">{req.title || "—"}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Department / Unit</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">{req.department?.name || "General"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Number of Vacancies</td>
                    <td className="py-2 px-4 font-bold text-blue-900">{req.headcount || 1} Position(s)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Experience Required</td>
                    <td className="py-2 px-4 text-slate-800">{req.experienceRequired ? `${req.experienceRequired} Year(s)` : "Freshers / Entry level eligible"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Nature of Employment</td>
                    <td className="py-2 px-4 text-slate-800">Full-Time / Regular & Permanent</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Vacancy Type</td>
                    <td className="py-2 px-4 text-slate-800">{req.requisitionType === "REPLACEMENT" ? "Replacement Requirement" : "New Requirement / Expansion"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Job Specification</td>
                    <td className="py-2 px-4 text-slate-800">{req.jobSpecification || "As per company standard job description"}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Statutory Reference</td>
                    <td className="py-2 px-4 font-mono font-bold text-slate-900">{refNo}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">Date of Notification</td>
                    <td className="py-2 px-4 text-slate-800">{dateFormatted}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Closing Note */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
              We request your office to kindly register this notification and refer suitable candidate profiles. Aspino Specialty Chemicals Pvt. Ltd. practices equal employment opportunity across all categories including persons with benchmark disabilities.
            </p>
          </div>

          {/* Dual Signatures & Seal */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 items-end">
            <div className="text-left">
              <div className="h-12"></div>
              <div className="border-t-2 border-slate-400 w-44 mb-1.5"></div>
              <div className="text-xs sm:text-sm font-bold text-[#0f3d70]">Authorized Signatory</div>
              <div className="text-[10px] sm:text-xs text-slate-500">Aspino Specialty Chemicals Pvt. Ltd.</div>
            </div>

            <div className="text-center">
              <div className="w-28 h-16 border-2 border-dashed border-slate-400 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                Official Seal
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="h-12"></div>
              <div className="border-t-2 border-slate-400 w-48 mb-1.5"></div>
              <div className="text-xs sm:text-sm font-bold text-[#0f3d70]">Employment Exchange Receipt</div>
              <div className="text-[10px] sm:text-xs text-slate-500">Receiving Officer Signature & Seal</div>
            </div>
          </div>
        </div>

        {/* Footer Banner */}
        <div className="bg-[#0f3d70] text-white px-8 py-3 flex justify-between items-center text-xs border-t-2 border-amber-500">
          <div>Ref: {refNo} &nbsp;|&nbsp; Generated on {dateFormatted}</div>
          <div>Official Statutory Form (Act, 1959) &nbsp;|&nbsp; Aspino HRMS</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #cnv-print-sheet {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 98vh !important;
            max-height: 98vh !important;
            border: 1.5px solid #0f3d70 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
