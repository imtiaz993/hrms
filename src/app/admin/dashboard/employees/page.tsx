"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useGetAllEmployees,
  useGetDepartments,
} from "@/hooks/admin/useEmployees";
import { EmployeeTable } from "@/components/admin/employees/employee-table";
import { AddEmployeeModal } from "@/components/admin/employees/add-employee-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Search,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Employee } from "@/types";

function matchesSearch(e: Employee, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const fullName = `${e.first_name ?? ""} ${e.last_name ?? ""}`.toLowerCase();
  const email = (e.email ?? "").toLowerCase();
  const empId = (e.employee_id ?? "").toLowerCase();
  return fullName.includes(s) || email.includes(s) || empId.includes(s);
}

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const openCreate = () => {
    setModalMode("create");
    setEditingEmployee(null);
    setShowAddModal(true);
  };

  const openEdit = (emp: Employee) => {
    setModalMode("edit");
    setEditingEmployee(emp);
    setShowAddModal(true);
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const {
    data: allEmployees,
    isLoading,
    error,
    refetch,
  } = useGetAllEmployees();
  const { data: departments } = useGetDepartments();

  const filteredEmployees = useMemo(() => {
    return (allEmployees ?? []).filter((e) => {
      const deptOk = department === "all" ? true : e.department === department;

      const statusOk =
        status === "all"
          ? true
          : status === "active"
          ? e.is_active === true
          : e.is_active === false;

      const searchOk = matchesSearch(e, searchQuery);

      return deptOk && statusOk && searchOk;
    });
  }, [allEmployees, searchQuery, department, status]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, department, status, pageSize]);

  const total = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, startIndex, endIndex]);

  const showingFrom = total === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Employee Directory
          </h1>
          <p className="text-gray-600 mt-1">Manage and view all employees</p>
        </div>

        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Departments</option>
                {departments?.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load employee data.
            <Button
              variant="link"
              onClick={refetch}
              className="ml-2 p-0 h-auto"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : total === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No employees found.</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <EmployeeTable
            employees={paginatedEmployees}
            onEmployeeUpdate={refetch}
            onEdit={openEdit}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium text-gray-900">{showingFrom}</span>–
              <span className="font-medium text-gray-900">{showingTo}</span> of{" "}
              <span className="font-medium text-gray-900">{total}</span>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center justify-between gap-2 sm:justify-start">
                <span className="text-sm text-gray-600">Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="flex h-9 w-[96px] rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {[5, 10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Prev</span>
                </Button>

                <div className="text-sm text-gray-700 text-center px-2 whitespace-nowrap">
                  Page <span className="font-medium">{safePage}</span> /{" "}
                  <span className="font-medium">{totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="flex-1 sm:flex-none"
                >
                  <span className="mr-1 hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <AddEmployeeModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) {
            setModalMode("create");
            setEditingEmployee(null);
          }
        }}
        onSuccess={refetch}
        mode={modalMode}
        employee={editingEmployee}
      />
    </div>
  );
}
