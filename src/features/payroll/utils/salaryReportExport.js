import * as XLSX from "xlsx";

/**
 * Normalizes and combines employee details, salary structure components, and bank details
 * into a structured dataset for reporting, viewing, and exporting.
 */
export function buildSalaryReportData({
  salaryStructures = [],
  employees = [],
  banks = [],
  departments = [],
  selectedMonth = new Date().getMonth() + 1,
  selectedYear = new Date().getFullYear(),
}) {
  const empList = Array.isArray(employees)
    ? employees
    : Array.isArray(employees?.data)
    ? employees.data
    : [];

  const structList = Array.isArray(salaryStructures)
    ? salaryStructures
    : Array.isArray(salaryStructures?.data)
    ? salaryStructures.data
    : [];

  const bankList = Array.isArray(banks)
    ? banks
    : Array.isArray(banks?.data)
    ? banks.data
    : [];

  const deptList = Array.isArray(departments)
    ? departments
    : Array.isArray(departments?.data)
    ? departments.data
    : [];

  // Map of bank id/name
  const bankMap = new Map();
  bankList.forEach((b) => {
    if (b.id) bankMap.set(String(b.id), b.name);
    if (b.bankName) bankMap.set(String(b.id || b.bankName), b.bankName);
  });

  // Map of department id/name
  const deptMap = new Map();
  deptList.forEach((d) => {
    if (d.id) deptMap.set(String(d.id), d.name);
  });

  // Map employees by various identifier keys for robust lookup
  const empMap = new Map();
  empList.forEach((emp) => {
    if (emp.id) empMap.set(String(emp.id), emp);
    if (emp.employeeId) empMap.set(String(emp.employeeId), emp);
  });

  // Map salary structures by employeeId or employee.id
  const structMap = new Map();
  structList.forEach((struct) => {
    const key = struct.employeeId || struct.employee?.id || struct.employee?.employeeId;
    if (key) {
      // If multiple structures exist, prefer the one matching selected month/year, else latest
      const existing = structMap.get(String(key));
      if (!existing) {
        structMap.set(String(key), struct);
      } else if (
        Number(struct.month) === Number(selectedMonth) &&
        Number(struct.year) === Number(selectedYear)
      ) {
        structMap.set(String(key), struct);
      }
    }
  });

  // Build combined roster: Start with all employees, or all structures if employees list is empty
  const combinedEntries = [];
  const processedEmpIds = new Set();

  if (empList.length > 0) {
    empList.forEach((emp) => {
      const empIdStr = String(emp.id);
      const empCodeStr = String(emp.employeeId || "");
      processedEmpIds.add(empIdStr);
      if (empCodeStr) processedEmpIds.add(empCodeStr);

      const struct =
        structMap.get(empIdStr) ||
        structMap.get(empCodeStr) ||
        structList.find(
          (s) =>
            String(s.employeeId) === empIdStr ||
            String(s.employeeId) === empCodeStr ||
            String(s.employee?.id) === empIdStr ||
            String(s.employee?.employeeId) === empCodeStr
        ) ||
        {};

      combinedEntries.push({ emp, struct });
    });
  }

  // Also include any structures whose employee wasn't in empList
  structList.forEach((struct) => {
    const structEmp = struct.employee || {};
    const empId = String(struct.employeeId || structEmp.id || "");
    const empCode = String(structEmp.employeeId || "");

    if (
      (!empId || !processedEmpIds.has(empId)) &&
      (!empCode || !processedEmpIds.has(empCode))
    ) {
      if (empId) processedEmpIds.add(empId);
      if (empCode) processedEmpIds.add(empCode);
      combinedEntries.push({
        emp: structEmp.id ? structEmp : { id: empId, employeeId: empCode || empId },
        struct,
      });
    }
  });

  // If both lists were empty, provide fallback sample row for preview
  if (combinedEntries.length === 0) {
    combinedEntries.push({
      emp: {
        id: "emp-demo-001",
        employeeId: "ASP-2026-001",
        firstName: "Sample",
        lastName: "Employee",
        email: "sample.employee@aspino.com",
        phone: "+91 98765 43210",
        department: { name: "Operations" },
        designation: "Staff Specialist",
        status: "ACTIVE",
        dateOfJoining: "2024-04-01",
        accountNumber: "912345678901",
        ifscCode: "HDFC0001234",
        panNumber: "ABCDE1234F",
      },
      struct: {
        basicSalary: 35000,
        hraAmount: 17500,
        da: 3500,
        conveyance: 2000,
        specialAllowance: 7000,
        statutoryBonus: 2000,
        reimbursements: 1000,
        grossSalary: 68000,
        pfAmount: 1800,
        esiAmount: 0,
        ptAmount: 200,
        netSalary: 66000,
        taxRegime: "NEW",
        cityCategory: "METRO",
      },
    });
  }

  // Map to unified report items
  const items = combinedEntries.map(({ emp, struct }, index) => {
    const firstName = emp.firstName || "";
    const lastName = emp.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || emp.name || `Employee #${index + 1}`;
    const employeeId = emp.employeeId || emp.code || struct.employeeId || emp.id || `EMP-${index + 1}`;

    const departmentName =
      (typeof emp.department === "object" ? emp.department?.name : emp.department) ||
      deptMap.get(String(emp.departmentId)) ||
      "—";

    const designation = emp.designation || emp.jobTitle || "—";
    const email = emp.email || "—";
    const phone = emp.phone || emp.mobile || emp.alternatePhone || "—";
    const dateOfJoining = emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString("en-IN") : "—";
    const status = emp.status || "ACTIVE";

    // Earnings components
    const basicSalary = Number(struct.basicSalary) || 0;
    const hraPercent = Number(struct.hraPercent) || (struct.cityCategory === "METRO" ? 50 : 40);
    const hraAmount =
      Number(struct.hraAmount) ||
      Number(struct.hra) ||
      (basicSalary > 0 ? Math.round((basicSalary * hraPercent) / 100) : 0);
    const da = Number(struct.da) || 0;
    const conveyance = Number(struct.conveyance) || 0;
    const specialAllowance = Number(struct.specialAllowance) || 0;
    const statutoryBonus = Number(struct.statutoryBonus) || 0;
    const reimbursements = Number(struct.reimbursements) || 0;

    const computedGross =
      basicSalary + hraAmount + da + conveyance + specialAllowance + statutoryBonus + reimbursements;
    const grossSalary = Number(struct.grossSalary) || computedGross;
    const annualGross = grossSalary * 12;

    // Deductions & Statutory contributions
    const pfEnabled = struct.pfEnabled !== undefined ? Boolean(struct.pfEnabled) : basicSalary > 0;
    const pfAmount = Number(struct.pfAmount) || (pfEnabled && basicSalary > 0 ? Math.min(1800, Math.round(basicSalary * 0.12)) : 0);

    const esiEnabled = Boolean(struct.esiEnabled);
    const esiAmount = Number(struct.esiAmount) || (esiEnabled && grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0);

    const ptEnabled = struct.ptEnabled !== undefined ? Boolean(struct.ptEnabled) : true;
    const ptAmount = Number(struct.ptAmount) || (ptEnabled && grossSalary > 10000 ? 200 : 0);

    const totalDeductions =
      Number(struct.totalDeductions) || (pfAmount + esiAmount + ptAmount);
    const netSalary = Number(struct.netSalary) || Math.max(0, grossSalary - totalDeductions);
    const annualNet = netSalary * 12;

    // Banking & KYC details
    const bankName =
      struct.bank?.name ||
      struct.bankName ||
      emp.bank?.name ||
      emp.bankName ||
      bankMap.get(String(struct.bankId || emp.bankId)) ||
      (emp.accountNumber || struct.accountNumber ? "Bank Account Configured" : "—");

    const accountNumber = String(struct.accountNumber || emp.accountNumber || emp.bankAccountNumber || "").trim() || "—";
    const ifscCode = String(struct.ifscCode || emp.ifscCode || emp.bankIfsc || "").trim() || "—";
    const bankBranch = String(struct.bankBranch || emp.bankBranch || "").trim() || "—";
    const panNumber = String(struct.panNumber || emp.panNumber || emp.pan || "").trim().toUpperCase() || "—";
    const aadharNumber = String(emp.aadharNumber || struct.aadharNumber || "").trim() || "—";
    const uanNumber = String(struct.uanNumber || emp.uanNumber || "").trim() || "—";
    const pfNumber = String(struct.pfNumber || emp.pfNumber || "").trim() || "—";
    const esiNumber = String(struct.esiNumber || emp.esiNumber || "").trim() || "—";

    const cityCategory = struct.cityCategory || "METRO";
    const taxRegime = struct.taxRegime || "NEW";

    const hasBankDetails = accountNumber !== "—" && ifscCode !== "—";

    return {
      sNo: index + 1,
      id: emp.id || struct.id,
      employeeId,
      fullName,
      firstName,
      lastName,
      email,
      phone,
      department: departmentName,
      designation,
      dateOfJoining,
      status,
      cityCategory,
      taxRegime,
      // Earnings
      basicSalary,
      hraPercent,
      hraAmount,
      da,
      conveyance,
      specialAllowance,
      statutoryBonus,
      reimbursements,
      grossSalary,
      annualGross,
      // Deductions
      pfEnabled,
      pfAmount,
      esiEnabled,
      esiAmount,
      ptEnabled,
      ptAmount,
      totalDeductions,
      // Net
      netSalary,
      annualNet,
      // Bank & KYC
      bankName,
      accountNumber,
      ifscCode,
      bankBranch,
      panNumber,
      aadharNumber,
      uanNumber,
      pfNumber,
      esiNumber,
      hasBankDetails,
    };
  });

  // Calculate summary metrics
  const summary = {
    totalEmployees: items.length,
    totalGrossSalary: items.reduce((sum, item) => sum + item.grossSalary, 0),
    totalNetSalary: items.reduce((sum, item) => sum + item.netSalary, 0),
    totalBasicSalary: items.reduce((sum, item) => sum + item.basicSalary, 0),
    totalHra: items.reduce((sum, item) => sum + item.hraAmount, 0),
    totalDa: items.reduce((sum, item) => sum + item.da, 0),
    totalSpecialAllowance: items.reduce((sum, item) => sum + item.specialAllowance, 0),
    totalPf: items.reduce((sum, item) => sum + item.pfAmount, 0),
    totalEsi: items.reduce((sum, item) => sum + item.esiAmount, 0),
    totalPt: items.reduce((sum, item) => sum + item.ptAmount, 0),
    totalDeductions: items.reduce((sum, item) => sum + item.totalDeductions, 0),
    totalAnnualCtc: items.reduce((sum, item) => sum + item.annualGross, 0),
    bankConfiguredCount: items.filter((item) => item.hasBankDetails).length,
    bankMissingCount: items.filter((item) => !item.hasBankDetails).length,
  };

  return { items, summary };
}

/**
 * Exports employee salary structure and bank details report to a multi-sheet, formatted Excel (.xlsx) file.
 */
export function exportSalaryReportToExcel(reportData, options = {}) {
  const { items = [], summary = {} } = reportData;
  const monthName = options.monthName || "Consolidated";
  const year = options.year || new Date().getFullYear();
  const filename =
    options.filename ||
    `Aspino_Employee_Salary_and_Bank_Report_${year}_${monthName.replace(/\s+/g, "_")}.xlsx`;

  const wb = XLSX.utils.book_new();

  // --------------------------------------------------------------------------
  // SHEET 1: Master Salary & Bank Report (Comprehensive)
  // --------------------------------------------------------------------------
  const masterHeaders = [
    "S.No",
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "Email Address",
    "Mobile Number",
    "Date of Joining",
    "Status",
    "City Category",
    "Tax Regime",
    // Salary Components
    "Basic Salary (INR)",
    "HRA Amount (INR)",
    "Dearness Allowance - DA (INR)",
    "Conveyance Allowance (INR)",
    "Special Allowance (INR)",
    "Statutory Bonus (INR)",
    "Reimbursements (INR)",
    "Gross Monthly Salary (INR)",
    "Annual CTC / Gross (INR)",
    // Deductions
    "PF (Employee Share)",
    "ESI (Employee Share)",
    "Professional Tax - PT",
    "Total Deductions (INR)",
    // Net
    "Net Monthly Salary (INR)",
    "Net Annual Take-Home (INR)",
    // Bank & KYC Details
    "Bank Name",
    "Bank Account Number",
    "IFSC Code",
    "Bank Branch",
    "PAN Number",
    "Aadhaar Number",
    "UAN Number",
    "PF Number",
    "ESI IP Number",
  ];

  const masterRows = items.map((item) => [
    item.sNo,
    item.employeeId,
    item.fullName,
    item.department,
    item.designation,
    item.email,
    item.phone,
    item.dateOfJoining,
    item.status,
    item.cityCategory,
    item.taxRegime,
    item.basicSalary,
    item.hraAmount,
    item.da,
    item.conveyance,
    item.specialAllowance,
    item.statutoryBonus,
    item.reimbursements,
    item.grossSalary,
    item.annualGross,
    item.pfAmount,
    item.esiAmount,
    item.ptAmount,
    item.totalDeductions,
    item.netSalary,
    item.annualNet,
    item.bankName,
    item.accountNumber,
    item.ifscCode,
    item.bankBranch,
    item.panNumber,
    item.aadharNumber,
    item.uanNumber,
    item.pfNumber,
    item.esiNumber,
  ]);

  // Master Total Row
  const masterTotalRow = [
    "",
    "TOTAL",
    `Total Employees: ${items.length}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    summary.totalBasicSalary || 0,
    summary.totalHra || 0,
    summary.totalDa || 0,
    items.reduce((s, i) => s + i.conveyance, 0),
    summary.totalSpecialAllowance || 0,
    items.reduce((s, i) => s + i.statutoryBonus, 0),
    items.reduce((s, i) => s + i.reimbursements, 0),
    summary.totalGrossSalary || 0,
    summary.totalAnnualCtc || 0,
    summary.totalPf || 0,
    summary.totalEsi || 0,
    summary.totalPt || 0,
    summary.totalDeductions || 0,
    summary.totalNetSalary || 0,
    (summary.totalNetSalary || 0) * 12,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const wsMaster = XLSX.utils.aoa_to_sheet([masterHeaders, ...masterRows, masterTotalRow]);

  // Set explicit column widths for readability in Excel
  wsMaster["!cols"] = [
    { wch: 6 },  // S.No
    { wch: 15 }, // Emp ID
    { wch: 22 }, // Name
    { wch: 18 }, // Dept
    { wch: 22 }, // Designation
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 14 }, // DOJ
    { wch: 12 }, // Status
    { wch: 14 }, // City Category
    { wch: 12 }, // Regime
    { wch: 16 }, // Basic
    { wch: 15 }, // HRA
    { wch: 14 }, // DA
    { wch: 15 }, // Conveyance
    { wch: 18 }, // Special
    { wch: 15 }, // Bonus
    { wch: 15 }, // Reimb
    { wch: 20 }, // Gross Monthly
    { wch: 20 }, // Annual Gross
    { wch: 16 }, // PF
    { wch: 16 }, // ESI
    { wch: 16 }, // PT
    { wch: 18 }, // Total Deductions
    { wch: 20 }, // Net Salary
    { wch: 20 }, // Net Annual
    { wch: 20 }, // Bank Name
    { wch: 22 }, // Account Number
    { wch: 15 }, // IFSC
    { wch: 16 }, // Branch
    { wch: 14 }, // PAN
    { wch: 16 }, // Aadhaar
    { wch: 16 }, // UAN
    { wch: 18 }, // PF No
    { wch: 16 }, // ESI No
  ];

  // --------------------------------------------------------------------------
  // SHEET 2: Salary Structure Breakdown (Earnings & Net Pay)
  // --------------------------------------------------------------------------
  const salaryHeaders = [
    "S.No",
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "City Category",
    "Tax Regime",
    "Basic Salary",
    "HRA",
    "Dearness Allowance",
    "Conveyance Allowance",
    "Special Allowance",
    "Statutory Bonus",
    "Reimbursements",
    "Gross Monthly Salary",
    "PF Deduction",
    "ESI Deduction",
    "Professional Tax",
    "Total Deductions",
    "Net Take-Home Pay",
    "Annual CTC",
  ];

  const salaryRows = items.map((item) => [
    item.sNo,
    item.employeeId,
    item.fullName,
    item.department,
    item.designation,
    item.cityCategory,
    item.taxRegime,
    item.basicSalary,
    item.hraAmount,
    item.da,
    item.conveyance,
    item.specialAllowance,
    item.statutoryBonus,
    item.reimbursements,
    item.grossSalary,
    item.pfAmount,
    item.esiAmount,
    item.ptAmount,
    item.totalDeductions,
    item.netSalary,
    item.annualGross,
  ]);

  const salaryTotalRow = [
    "",
    "TOTAL",
    `Total Staff: ${items.length}`,
    "",
    "",
    "",
    "",
    summary.totalBasicSalary || 0,
    summary.totalHra || 0,
    summary.totalDa || 0,
    items.reduce((s, i) => s + i.conveyance, 0),
    summary.totalSpecialAllowance || 0,
    items.reduce((s, i) => s + i.statutoryBonus, 0),
    items.reduce((s, i) => s + i.reimbursements, 0),
    summary.totalGrossSalary || 0,
    summary.totalPf || 0,
    summary.totalEsi || 0,
    summary.totalPt || 0,
    summary.totalDeductions || 0,
    summary.totalNetSalary || 0,
    summary.totalAnnualCtc || 0,
  ];

  const wsSalary = XLSX.utils.aoa_to_sheet([salaryHeaders, ...salaryRows, salaryTotalRow]);
  wsSalary["!cols"] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
  ];

  // --------------------------------------------------------------------------
  // SHEET 3: Bank Details & Disbursement
  // --------------------------------------------------------------------------
  const bankHeaders = [
    "S.No",
    "Employee ID",
    "Beneficiary Name",
    "Department",
    "Bank Name",
    "Account Number",
    "IFSC Code",
    "Branch",
    "Net Monthly Salary (INR)",
    "Payment Remarks",
    "PAN Number",
    "Aadhaar Number",
    "UAN Number",
    "PF Member ID",
  ];

  const bankRows = items.map((item) => [
    item.sNo,
    item.employeeId,
    item.fullName,
    item.department,
    item.bankName,
    item.accountNumber,
    item.ifscCode,
    item.bankBranch,
    item.netSalary,
    `Salary Payout ${monthName} ${year}`,
    item.panNumber,
    item.aadharNumber,
    item.uanNumber,
    item.pfNumber,
  ]);

  const bankTotalRow = [
    "",
    "TOTAL",
    `Count: ${items.length}`,
    "",
    "",
    "",
    "",
    "",
    summary.totalNetSalary || 0,
    `Total Payout: INR ${summary.totalNetSalary?.toLocaleString() || 0}`,
    "",
    "",
    "",
    "",
  ];

  const wsBank = XLSX.utils.aoa_to_sheet([bankHeaders, ...bankRows, bankTotalRow]);
  wsBank["!cols"] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 26 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
  ];

  // Append sheets
  XLSX.utils.book_append_sheet(wb, wsMaster, "Salary & Bank Master");
  XLSX.utils.book_append_sheet(wb, wsSalary, "Salary Structures");
  XLSX.utils.book_append_sheet(wb, wsBank, "Bank Details & Payout");

  // Write and trigger download in browser
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Exports employee salary structure and bank details report to a standard CSV file.
 */
export function exportSalaryReportToCsv(reportData, options = {}) {
  const { items = [], summary = {} } = reportData;
  const monthName = options.monthName || "Consolidated";
  const year = options.year || new Date().getFullYear();
  const filename =
    options.filename ||
    `Aspino_Employee_Salary_and_Bank_Report_${year}_${monthName.replace(/\s+/g, "_")}.csv`;

  const headers = [
    "S.No",
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "Email",
    "Phone",
    "Date of Joining",
    "Status",
    "City Category",
    "Tax Regime",
    "Basic Salary",
    "HRA",
    "DA",
    "Conveyance",
    "Special Allowance",
    "Statutory Bonus",
    "Reimbursements",
    "Gross Monthly Salary",
    "Annual CTC",
    "PF Deduction",
    "ESI Deduction",
    "PT Deduction",
    "Total Deductions",
    "Net Monthly Salary",
    "Bank Name",
    "Account Number",
    "IFSC Code",
    "Branch",
    "PAN Number",
    "Aadhaar Number",
    "UAN Number",
    "PF Number",
    "ESI Number",
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = items.map((item) =>
    [
      item.sNo,
      escapeCsv(item.employeeId),
      escapeCsv(item.fullName),
      escapeCsv(item.department),
      escapeCsv(item.designation),
      escapeCsv(item.email),
      escapeCsv(item.phone),
      escapeCsv(item.dateOfJoining),
      escapeCsv(item.status),
      escapeCsv(item.cityCategory),
      escapeCsv(item.taxRegime),
      item.basicSalary,
      item.hraAmount,
      item.da,
      item.conveyance,
      item.specialAllowance,
      item.statutoryBonus,
      item.reimbursements,
      item.grossSalary,
      item.annualGross,
      item.pfAmount,
      item.esiAmount,
      item.ptAmount,
      item.totalDeductions,
      item.netSalary,
      escapeCsv(item.bankName),
      escapeCsv(item.accountNumber),
      escapeCsv(item.ifscCode),
      escapeCsv(item.bankBranch),
      escapeCsv(item.panNumber),
      escapeCsv(item.aadharNumber),
      escapeCsv(item.uanNumber),
      escapeCsv(item.pfNumber),
      escapeCsv(item.esiNumber),
    ].join(",")
  );

  // Total summary row
  const totalRow = [
    "",
    '"TOTAL"',
    escapeCsv(`Total Staff: ${items.length}`),
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    summary.totalBasicSalary || 0,
    summary.totalHra || 0,
    summary.totalDa || 0,
    items.reduce((s, i) => s + i.conveyance, 0),
    summary.totalSpecialAllowance || 0,
    items.reduce((s, i) => s + i.statutoryBonus, 0),
    items.reduce((s, i) => s + i.reimbursements, 0),
    summary.totalGrossSalary || 0,
    summary.totalAnnualCtc || 0,
    summary.totalPf || 0,
    summary.totalEsi || 0,
    summary.totalPt || 0,
    summary.totalDeductions || 0,
    summary.totalNetSalary || 0,
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
  ].join(",");

  const csvContent = "\uFEFF" + [headers.join(","), ...rows, totalRow].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Exports an annual multi-month Excel workbook where each month is placed on a separate sheet/page.
 */
export function exportMultiMonthSalaryReportToExcel({ monthsData = [], year = new Date().getFullYear(), filename }) {
  const wb = XLSX.utils.book_new();
  const actualFilename = filename || `Aspino_Annual_Monthly_Salary_Report_${year}.xlsx`;

  // 1. Consolidated Annual Summary Sheet
  const annualSummaryHeaders = [
    "S.No",
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "Bank Name",
    "Bank Account Number",
    "IFSC Code",
    "PAN Number",
    "Annual Gross CTC (INR)",
    "Average Monthly Gross",
    "Average Monthly Net Pay",
    "Total Annual Take-Home (INR)",
  ];

  // Aggregate across all months by employee
  const empAnnualMap = new Map();
  monthsData.forEach((m) => {
    (m.items || []).forEach((item) => {
      const key = item.employeeId || item.id;
      if (!empAnnualMap.has(key)) {
        empAnnualMap.set(key, {
          employeeId: item.employeeId,
          fullName: item.fullName,
          department: item.department,
          designation: item.designation,
          bankName: item.bankName,
          accountNumber: item.accountNumber,
          ifscCode: item.ifscCode,
          panNumber: item.panNumber,
          annualGross: item.annualGross || item.grossSalary * 12,
          grossSum: 0,
          netSum: 0,
          count: 0,
        });
      }
      const agg = empAnnualMap.get(key);
      agg.grossSum += item.grossSalary || 0;
      agg.netSum += item.netSalary || 0;
      agg.count += 1;
    });
  });

  const annualRows = Array.from(empAnnualMap.values()).map((agg, idx) => {
    const avgGross = agg.count > 0 ? Math.round(agg.grossSum / agg.count) : 0;
    const avgNet = agg.count > 0 ? Math.round(agg.netSum / agg.count) : 0;
    const annualNet = agg.netSum;
    return [
      idx + 1,
      agg.employeeId,
      agg.fullName,
      agg.department,
      agg.designation,
      agg.bankName,
      agg.accountNumber,
      agg.ifscCode,
      agg.panNumber,
      agg.annualGross,
      avgGross,
      avgNet,
      annualNet,
    ];
  });

  const wsAnnual = XLSX.utils.aoa_to_sheet([annualSummaryHeaders, ...annualRows]);
  wsAnnual["!cols"] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
    { wch: 15 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAnnual, "Annual Overview");

  // 2. Add each month to a different sheet/page in Excel
  monthsData.forEach((m) => {
    const sheetName = (m.monthName || `Month ${m.month}`).slice(0, 31);
    const headers = [
      "S.No",
      "Employee ID",
      "Employee Name",
      "Department",
      "Designation",
      "Basic Salary",
      "HRA",
      "DA",
      "Allowances",
      "Gross Monthly Salary",
      "PF Deduction",
      "ESI Deduction",
      "PT Deduction",
      "Total Deductions",
      "Net Salary (INR)",
      "Bank Name",
      "Account Number",
      "IFSC Code",
      "PAN Number",
    ];

    const rows = (m.items || []).map((item, idx) => {
      const allowances = (item.conveyance || 0) + (item.specialAllowance || 0) + (item.statutoryBonus || 0) + (item.reimbursements || 0);
      return [
        idx + 1,
        item.employeeId,
        item.fullName,
        item.department,
        item.designation,
        item.basicSalary,
        item.hraAmount,
        item.da,
        allowances,
        item.grossSalary,
        item.pfAmount,
        item.esiAmount,
        item.ptAmount,
        item.totalDeductions,
        item.netSalary,
        item.bankName,
        item.accountNumber,
        item.ifscCode,
        item.panNumber,
      ];
    });

    const totalRow = [
      "",
      "TOTAL",
      `Total: ${m.items?.length || 0}`,
      "",
      "",
      m.summary?.totalBasicSalary || 0,
      m.summary?.totalHra || 0,
      m.summary?.totalDa || 0,
      "",
      m.summary?.totalGrossSalary || 0,
      m.summary?.totalPf || 0,
      m.summary?.totalEsi || 0,
      m.summary?.totalPt || 0,
      m.summary?.totalDeductions || 0,
      m.summary?.totalNetSalary || 0,
      "",
      "",
      "",
      "",
    ];

    const wsMonth = XLSX.utils.aoa_to_sheet([headers, ...rows, totalRow]);
    wsMonth["!cols"] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 22 },
      { wch: 15 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMonth, sheetName);
  });

  // Write and trigger download in browser
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = actualFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
