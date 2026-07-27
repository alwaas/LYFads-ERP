import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";

import { getEmployee } from "../../services/employee.service";
import type { Employee } from "../../types/employee";

import EmployeeProfileCard from "../../components/employee-profile/EmployeeProfileCard";
import EmployeePersonalInfo from "../../components/employee-profile/EmployeePersonalInfo";
import EmployeeEmploymentInfo from "../../components/employee-profile/EmployeeEmploymentInfo";
import EmployeeActions from "../../components/employee-profile/EmployeeActions";

function ViewEmployeePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    try {
      if (!id) return;

      const data = await getEmployee(id);
      setEmployee(data);
    } catch (error) {
      console.error(error);
      navigate("/employees");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          Loading Employee...
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          Employee not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <EmployeeProfileCard
          employee={employee}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <EmployeePersonalInfo
            employee={employee}
          />

          <EmployeeEmploymentInfo
            employee={employee}
          />

        </div>

        <EmployeeActions
          employeeId={employee.id}
        />

      </div>
    </DashboardLayout>
  );
}

export default ViewEmployeePage;