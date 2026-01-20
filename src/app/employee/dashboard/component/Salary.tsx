import { SalaryViewPopup } from "@/components/employee/salary-view-popup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";

const Salary = ({ cardBase, currentUser }: any) => {
  const [showSalaryView, setShowSalaryView] = useState(false);
  return (
    <>
      {showSalaryView && (
        <SalaryViewPopup
          employeeId={currentUser.id}
          onClose={() => setShowSalaryView(false)}
        />
      )}
      <Card className={`${cardBase} h-auto`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Salary Section
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Button
            onClick={() => setShowSalaryView(true)}
            className="w-full rounded-full text-sm font-medium"
            variant="outline"
          >
            Salary summary
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default Salary;
