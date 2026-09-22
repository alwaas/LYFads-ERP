import api from "./api";

export interface SalaryStructure {
  id: string;
  employeeId: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  bonus: number;
  incentives: number;
  deductions: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
}

export const getSalaryStructureByEmployee = async (employeeId: string): Promise<SalaryStructure | null> => {
  const response = await api.get(`/salary-structures/employee/${employeeId}`);
  return response.data.data || null;
};
