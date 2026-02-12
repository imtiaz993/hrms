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
import { Search, MoreVertical, Edit, Trash2, Plus, Clock, Eye } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Announcements {
  id: string;
  title: string;
  description: string;
  created_at: Date;
}

const AnnouceMent = () => {
  const { addToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcements[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    annoucementId: string | null;
  }>({ open: false, annoucementId: null });

  const [viewAnnouncement, setViewAnnouncement] =
    useState<Announcements | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [recurring, setRecurring] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    setIsLoading(false);

    if (!error && data) setAnnouncements(data);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [announcements, searchQuery]);

 const handleCreate = async () => {
  try {
    // 1️ Insert announcement in DB
    const { data, error } = await supabase
      .from("announcements")
      .insert({ title, description })
      .select()
      .single();

    if (error || !data) throw error || new Error("Failed to create announcement");

 
    setAnnouncements((prev) => [data, ...prev]);
    setCreateDialog(false);
    setTitle("");
    setDescription("");

    // 3️ Fetch all employees (or users) to notify
    const { data: employees, error: empError } = await supabase
      .from("employees") 
       .select("id")
      .eq("is_admin", false);

    if (empError || !employees) throw empError || new Error("Failed to fetch employees");

    // 4️ Send notification to each employee
    for (const emp of employees) {
      await fetch("/api/admin/send-notification-admin/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: emp.id,    
          title: `New Announcement: ${title}`,
          body: description,
        }),
      });
    }

    addToast({
      title: "Success",
      description: "Announcement created and notifications sent!",
      variant: "success",
    });
  } catch (err) {
    console.error("Announcement creation error:", err);
    addToast({
      title: "Error",
      description: "Failed to create announcement or send notifications",
      variant: "destructive",
    });
  }
};


  const handleDelete = async () => {
    await supabase
      .from("announcements")
      .delete()
      .eq("id", deleteDialog.annoucementId);

    setAnnouncements((p) =>
      p.filter((h) => h.id !== deleteDialog.annoucementId),
    );
    setDeleteDialog({ open: false, annoucementId: null });
  };

  return (
    <>
      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">
            Manage company-wide announcements and updates.
          </p>
        </div>

        <Button
          onClick={() => setCreateDialog(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Annoucement
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Card className="flex-1 ">
          <CardContent className="py-4 grid md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search Annoucement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No Appoinrment found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAnnouncements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>

                  <TableCell className="text-gray-600 max-w-xl">
                    <p className="truncate">{a.description}</p>
                  </TableCell>

                  <TableCell>
                    {new Date(a.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setViewAnnouncement(a)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          destructive
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              annoucementId: a.id,
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-full w-full p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Add Announcement
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Create a new announcement for employees.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Input
              placeholder="Announcement Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />

            <textarea
              placeholder="Announcement Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[120px] truncate rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={() =>
          setDeleteDialog({ open: false, annoucementId: null })
        }
      >
        <DialogContent className="sm:max-w-ful w-full p-6 rounded-2xl shadow-lg">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Delete Annoucement?
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete this Annoucement? This action
              cannot be undone.
            </p>
          </DialogHeader>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, annoucementId: null })
              }
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

      {/* View full announcement dialog */}
      <Dialog
        open={!!viewAnnouncement}
        onOpenChange={() => setViewAnnouncement(null)}
      >
        <DialogContent className="sm:max-w-lg w-full p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {viewAnnouncement?.title || "Announcement"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {viewAnnouncement?.created_at &&
                new Date(viewAnnouncement.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-72 overflow-y-auto rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">
            {viewAnnouncement?.description || "No description provided."}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setViewAnnouncement(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnnouceMent;
