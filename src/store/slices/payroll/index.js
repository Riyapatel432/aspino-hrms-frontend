import salaryStructureReducer from "./salaryStructureSlice";
import hraTaxReducer from "./hraTaxSlice";
import loanReducer from "./loanSlice";
import payrollRunReducer from "./payrollRunSlice";

export * from "./salaryStructureSlice";
export * from "./hraTaxSlice";
export * from "./loanSlice";
export * from "./payrollRunSlice";

export function payrollReducer(state = {}, action) {
  const salaryStructureState = salaryStructureReducer(
    state ? {
      employees: state.employees,
      salaryStructures: state.salaryStructures,
      activeFinancialYear: state.activeFinancialYear,
      loading: state._salaryStructureLoading,
      error: state.error,
    } : undefined,
    action
  );

  const hraTaxState = hraTaxReducer(
    state ? {
      rentReceipts: state.rentReceipts,
      taxDeclarations: state.taxDeclarations,
      loading: state._hraTaxLoading,
      error: state.error,
    } : undefined,
    action
  );

  const loanState = loanReducer(
    state ? {
      loans: state.loans,
      loading: state._loanLoading,
      error: state.error,
    } : undefined,
    action
  );

  const payrollRunState = payrollRunReducer(
    state ? {
      currentRun: state.currentRun,
      payslips: state.payslips,
      loading: state._payrollRunLoading,
      error: state.error,
    } : undefined,
    action
  );

  return {
    employees: salaryStructureState.employees,
    salaryStructures: salaryStructureState.salaryStructures,
    activeFinancialYear: salaryStructureState.activeFinancialYear,
    rentReceipts: hraTaxState.rentReceipts,
    taxDeclarations: hraTaxState.taxDeclarations,
    loans: loanState.loans,
    currentRun: payrollRunState.currentRun,
    payslips: payrollRunState.payslips,
    _salaryStructureLoading: salaryStructureState.loading,
    _hraTaxLoading: hraTaxState.loading,
    _loanLoading: loanState.loading,
    _payrollRunLoading: payrollRunState.loading,
    loading: salaryStructureState.loading || hraTaxState.loading || loanState.loading || payrollRunState.loading,
    error: action.type === 'payroll/clearPayrollError' ? null : (salaryStructureState.error || hraTaxState.error || loanState.error || payrollRunState.error),
  };
}

export function clearPayrollError() {
  return { type: 'payroll/clearPayrollError' };
}

export default payrollReducer;
