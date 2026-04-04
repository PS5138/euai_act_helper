import { Suspense } from "react";
import WizardShell from "@/components/wizard/WizardShell";

export default function AssessPage() {
  return (
    <Suspense>
      <WizardShell />
    </Suspense>
  );
}
