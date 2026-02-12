"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseUser";
import { useToast } from "@/components/ui/toast";
const Page = () => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    summary?: string;
  }>({});

  const [editpolicy, setEditpolicy] = useState<{
    open: boolean;
    policy: any | null;
  }>({ open: false, policy: null });

  const fetchPolicies = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("company_policy")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setPolicies(data || []);
    else console.error(error);

    setLoading(false);
  };

  const validatePolicy = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "Policy title is required";
    }

    if (!summary.trim()) {
      newErrors.summary = "Policy summary is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetchPolicies();
  }, []);
  
  const { addToast } = useToast();
 const handleSavePolicy = async () => {
 
  if (!validatePolicy()) return;

  try {
    let fileUrl = editpolicy.policy?.doc_url || null;

    // Remove old file if new uploaded
    if (document && editpolicy.policy?.doc_url) {
      const oldFilePath = editpolicy.policy.doc_url.split("/docs/")[1];
      await supabase.storage.from("docs").remove([oldFilePath]);
    }

    // Upload new file
    if (document) {
      const fileName = `${Date.now()}-${document.name}`;

      const { error: uploadError } = await supabase.storage
        .from("docs")
        .upload(fileName, document);

      if (uploadError) throw uploadError;

      fileUrl =
        supabase.storage.from("docs").getPublicUrl(fileName).data.publicUrl;
    }

    const { error } = await supabase
      .from("company_policy")
      .update({
        title: title.trim(),
        summary: summary.trim(),
        doc_url: fileUrl,
      })
      .eq("id", editpolicy.policy.id);

    if (error) throw error;

    // ✅ Success Toast
    addToast({
      title: "Policy Updated",
      description: "Company policy updated successfully.",
      variant: "success",
    });

    setEditpolicy({ open: false, policy: null });
    setDocument(null);
    setErrors({});
    fetchPolicies();
  } catch (err) {
    console.error(err);

    addToast({
      title: "Update Failed",
      description: "Failed to update policy. Please try again.",
      variant: "destructive",
    });
  }
};


  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Company Policy</h1>
        <p className="text-gray-600 mt-1">
          Official company rules and guidelines.
        </p>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-sm text-gray-500">Loading...</p>}

        {!loading && policies.length === 0 && (
          <p className="text-sm text-gray-500">No policies found.</p>
        )}

        {policies.map((policy) => (
          <div
            key={policy.id}
            className="flex  items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-gray-50">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {policy.title}
                </h3>
                <p className="text-xs text-gray-500">{policy.summary}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {policy.doc_url && (
                <a
                  href={policy.doc_url}
                  target="_blank"
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Open
                </a>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTitle(policy.title);
                  setSummary(policy.summary);
                  setEditpolicy({ open: true, policy });
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={editpolicy.open}
        onOpenChange={(open) =>
          setEditpolicy({ open, policy: open ? editpolicy.policy : null })
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Company Policy</DialogTitle>
            <DialogDescription className="mb-3 pb-3">
              Update policy details or replace document.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((p) => ({ ...p, title: undefined }));
                }}
                placeholder="Policy title"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setErrors((p) => ({ ...p, summary: undefined }));
                }}
                rows={3}
                className="w-full rounded-md border p-2 text-sm"
                placeholder="Policy summary"
              />
              {errors.summary && (
                <p className="text-sm text-red-500 mt-1">{errors.summary}</p>
              )}
            </div>

            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setDocument(e.target.files?.[0] || null)}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setEditpolicy({ open: false, policy: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePolicy}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Page;
