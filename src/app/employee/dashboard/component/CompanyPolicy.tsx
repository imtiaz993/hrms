import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

const CompanyPolicy = ({ cardBase }: any) => {
  return (
    <Card className={`${cardBase} h-auto`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Company Policy
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default CompanyPolicy;
