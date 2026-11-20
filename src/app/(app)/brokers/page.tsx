import type { Metadata } from "next";
import { Suspense } from "react";
import { BrokersView } from "@/components/brokers/brokers-view";
import { PageSkeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Brokers" };

export default function BrokersPage() {
  // BrokersView reads ?property= to preselect a property, so it renders inside Suspense.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BrokersView />
    </Suspense>
  );
}
