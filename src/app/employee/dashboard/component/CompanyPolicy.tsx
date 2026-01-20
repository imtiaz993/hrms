"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseUser";
import { FileText, AlertCircle } from "lucide-react";

type CompanyPolicyRow = {
  id: string;
  title: string | null;
  summary: string | null;
  doc_url: string | null;
  doc_name: string | null;
};

const CompanyPolicy = ({ cardBase }: any) => {
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<CompanyPolicyRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("company_policy")
      .select("id,title,summary,doc_url,doc_name")
      .limit(1)
      .maybeSingle();

    if (error) {
      setError(error.message || "Failed to load policy");
      setPolicy(null);
    } else {
      setPolicy((data as any) ?? null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  return (
    <Card className={`${cardBase} h-auto`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Company Policy
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-full bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : !policy ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No company policy has been published yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {policy.title || "Company Policy"}
                </p>
                {policy.summary ? (
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {policy.summary}
                  </p>
                ) : null}
              </div>
            </div>

            {policy.doc_url ? (
              <a
                href={policy.doc_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {policy.doc_name || "View Policy Document"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-600">
                  Open
                </span>
              </a>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                No document attached.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyPolicy;
