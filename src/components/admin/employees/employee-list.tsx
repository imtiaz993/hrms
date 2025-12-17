"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUpdateEmployeeStatus } from "@/hooks/admin/useEmployees";
import { Edit, Power, UserCircle, Mail, Briefcase } from "lucide-react";

interface EmployeeListProps {
  employees: Employee[];
}

export function EmployeeList({ employees }: EmployeeListProps) {
  const router = useRouter();
  const updateStatus = useUpdateEmployeeStatus();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [optimisticEmployees, setOptimisticEmployees] =
    useState<Employee[]>(employees);

  useEffect(() => {
    setOptimisticEmployees(employees);
  }, [employees]);

  const handleToggleStatus = async (employee: Employee) => {
    const nextActive = !employee.is_active;

    if (
      window.confirm(
        `Are you sure you want to ${
          employee.is_active ? "deactivate" : "activate"
        } ${employee.first_name} ${employee.last_name}?`
      )
    ) {
      setTogglingId(employee.id);

      // ✅ optimistic update (button flips instantly)
      setOptimisticEmployees((prev) =>
        prev.map((e) =>
          e.id === employee.id ? { ...e, is_active: nextActive } : e
        )
      );

      try {
        await updateStatus.mutateAsync({
          employeeId: employee.id,
          isActive: nextActive,
        });
      } catch (error) {
        // ✅ rollback if API fails
        setOptimisticEmployees((prev) =>
          prev.map((e) =>
            e.id === employee.id ? { ...e, is_active: !nextActive } : e
          )
        );

        console.error("Error updating status:", error);
        alert("Failed to update employee status");
      } finally {
        setTogglingId(null);
      }
    }
  };

  if (optimisticEmployees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              No employees found matching your criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {optimisticEmployees.map((employee) => (
        <Card
          key={employee.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center space-x-4 flex-1"
                onClick={() =>
                  router.push(`/admin/dashboard/employees/${employee.id}`)
                }
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-8 w-8 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <Badge
                      variant={employee.is_active ? "success" : "destructive"}
                    >
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {employee.employee_id && (
                      <Badge variant="secondary">
                        ID: {employee.employee_id}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Briefcase className="h-3 w-3" />
                      <span>{employee.department}</span>
                    </div>
                    <span>•</span>
                    <span>{employee.designation}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/admin/dashboard/employees/${employee.id}/edit`
                    );
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={employee.is_active ? "destructive" : "default"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(employee);
                  }}
                  disabled={togglingId === employee.id}
                >
                  <Power className="h-4 w-4 mr-1" />
                  {togglingId === employee.id
                    ? "Loading..."
                    : employee.is_active
                    ? "Deactivate"
                    : "Activate"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
