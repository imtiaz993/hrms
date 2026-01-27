"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseUser";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Edit, Trash2, Plus } from "lucide-react";

interface Holiday {
  id: string;
  name: string;
  date: string;
  is_recurring: boolean;
}

const Holidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    holiday: Holiday | null;
  }>({ open: false, holiday: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    holidayId: string | null;
  }>({ open: false, holidayId: null });

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [recurring, setRecurring] = useState(false);

  const fetchHolidays = async () => {
    const { data, error } = await supabase
      .from("holidays")
      .select("*")
      .order("date", { ascending: true });

    if (!error && data) setHolidays(data);
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const filteredHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return holidays.filter((h) => {
      const hDate = new Date(h.date);

      const matchesSearch = h.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "recurring" && h.is_recurring) ||
        (typeFilter === "one-time" && !h.is_recurring);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "upcoming" && hDate >= today) ||
        (statusFilter === "past" && hDate < today);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [holidays, searchQuery, typeFilter, statusFilter]);

  const handleCreate = async () => {
    const { data, error } = await supabase
      .from("holidays")
      .insert({ name, date, is_recurring: recurring })
      .select()
      .single();

    if (!error && data) {
      setHolidays((p) => [...p, data]);
      setCreateDialog(false);
      setName("");
      setDate("");
      setRecurring(false);
    }
  };
  const handleEdit = async () => {
    if (!editDialog.holiday) return;

    const { error } = await supabase
      .from("holidays")
      .update({ name, date, is_recurring: recurring })
      .eq("id", editDialog.holiday.id);

    if (!error) {
      setHolidays((p) =>
        p.map((h) =>
          h.id === editDialog.holiday?.id
            ? { ...h, name, date, is_recurring: recurring }
            : h,
        ),
      );
      setEditDialog({ open: false, holiday: null });
    }
  };

  const handleDelete = async () => {
    await supabase.from("holidays").delete().eq("id", deleteDialog.holidayId);

    setHolidays((p) => p.filter((h) => h.id !== deleteDialog.holidayId));
    setDeleteDialog({ open: false, holidayId: null });
  };

  return (
    <>
      <Card className="mb-6">
        <CardContent className="py-4 grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search holiday..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border px-3"
          >
            <option value="all">All Types</option>
            <option value="recurring">Recurring</option>
            <option value="one-time">One-time</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border px-3"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </CardContent>
      </Card>
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Holiday</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredHolidays.map((h) => {
              const d = new Date(h.date);
              return (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{d.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {h.is_recurring ? "Recurring" : "One-time"}
                  </TableCell>
                  <TableCell>{d.getFullYear()}</TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setCreateDialog(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Add
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setEditDialog({ open: true, holiday: h });
                            setName(h.name);
                            setDate(h.date);
                            setRecurring(h.is_recurring);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          destructive
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              holidayId: h.id,
                            })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-full w-full p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Add Holiday
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Fill in the details to create a new holiday.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Input
              placeholder="Holiday Name"
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            <Input
              type="date"
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Recurring yearly
            </label>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={() => setDeleteDialog({ open: false, holidayId: null })}
      >
        <DialogContent className="sm:max-w-ful w-full p-6 rounded-2xl shadow-lg">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Delete Holiday?
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete this holiday? This action cannot
              be undone.
            </p>
          </DialogHeader>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, holidayId: null })}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="px-4 py-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialog.open}
        onOpenChange={(open) =>
          setEditDialog({ open, holiday: open ? editDialog.holiday : null })
        }
      >
        <DialogContent className="sm:max-w-full w-full p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Edit Holiday
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Update the details of your holiday.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Input
              placeholder="Holiday Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Recurring yearly
            </label>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, holiday: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Holidays;
