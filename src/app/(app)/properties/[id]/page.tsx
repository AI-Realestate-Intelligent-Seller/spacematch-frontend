import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertyDetail } from "@/components/properties/property-detail";
import { PageSkeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Property" };

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropertyDetail key={id} id={id} />;
}

export default function PropertyPage({ params }: PageProps<"/properties/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <Detail params={params} />
    </Suspense>
  );
}
