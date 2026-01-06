"use client";

import { useState } from "react";
import { Employee } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreVertical, Eye, Power, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ProfilePopup } from "@/components/employee/profile-popup";
import { useUpdateEmployeeStatus, useDeleteEmployee } from "@/hooks/admin/useEmployees";
import { useToast } from "@/components/ui/toast";

interface EmployeeTableProps {
  employees: Employee[];
  onEmployeeUpdate: () => void;
}

export function EmployeeTable({ employees, onEmployeeUpdate }: EmployeeTableProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "activate" | "deactivate" | "delete";
    employee: Employee | null;
  }>({ open: false, type: "activate", employee: null });

  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateEmployeeStatus();
  const { mutateAsync: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();
  const { addToast } = useToast();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowProfilePopup(true);
  };

  const handleToggleStatus = (employee: Employee) => {
    setConfirmDialog({
      open: true,
      type: employee.is_active ? "deactivate" : "activate",
      employee,
    });
  };

  const handleDelete = (employee: Employee) => {
    setConfirmDialog({
      open: true,
      type: "delete",
      employee,
    });
  };

  const confirmAction = async () => {
    if (!confirmDialog.employee) return;

    try {
      if (confirmDialog.type === "delete") {
        await deleteEmployee(confirmDialog.employee.id);
        addToast({
          title: "Success",
          description: "Employee deleted successfully",
          variant: "success",
        });
      } else {
        const newStatus = confirmDialog.type === "activate";
        await updateStatus({
          employeeId: confirmDialog.employee.id,
          isActive: newStatus,
        });
        addToast({
          title: "Success",
          description: `Employee ${confirmDialog.type}d successfully`,
          variant: "success",
        });
      }
      onEmployeeUpdate();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive",
      });
    } finally {
      setConfirmDialog({ open: false, type: "activate", employee: null });
    }
  };

  const getConfirmDialogContent = () => {
    if (!confirmDialog.employee) return { title: "", description: "" };

    const employeeName = `${confirmDialog.employee.first_name} ${confirmDialog.employee.last_name}`;

    switch (confirmDialog.type) {
      case "activate":
        return {
          title: "Activate employee?",
          description: `Are you sure you want to activate ${employeeName}? They will regain access to the system.`,
        };
      case "deactivate":
        return {
          title: "Deactivate employee?",
          description: `Are you sure you want to deactivate ${employeeName}? They will lose access to the system.`,
        };
      case "delete":
        return {
          title: "Delete employee?",
          description: `Are you sure you want to delete ${employeeName}? This action cannot be undone and will permanently remove all their data.`,
        };
    }
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-gray-500">No employees found</p>
      </div>
    );
  }

  const dialogContent = getConfirmDialogContent();

  return (
    <>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                      {getInitials(employee.first_name, employee.last_name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </div>
                      {employee.employee_id && (
                        <div className="text-xs text-gray-500">
                          ID: {employee.employee_id}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">{employee.email}</TableCell>
                <TableCell className="text-gray-700">{employee.department}</TableCell>
                <TableCell className="text-gray-700">{employee.designation}</TableCell>
                <TableCell>
                  <Badge variant={employee.is_active ? "success" : "destructive"}>
                    {employee.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-700">
                  {employee.join_date
                    ? format(new Date(employee.join_date), "MMM dd, yyyy")
                    : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewEmployee(employee)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(employee)}>
                        <Power className="mr-2 h-4 w-4" />
                        {employee.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        destructive
                        onClick={() => handleDelete(employee)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showProfilePopup && selectedEmployee && (
        <ProfilePopup
          employee={selectedEmployee}
          onClose={() => {
            setShowProfilePopup(false);
            setSelectedEmployee(null);
          }}
          onChangePassword={() => {}}
        />
      )}

      <Dialog open={confirmDialog.open} onOpenChange={(open) => {
        if (!open) {
          setConfirmDialog({ open: false, type: "activate", employee: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, type: "activate", employee: null })
              }
              disabled={isUpdating || isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === "delete" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={isUpdating || isDeleting}
            >
              {isUpdating || isDeleting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
