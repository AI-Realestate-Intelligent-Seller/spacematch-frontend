"use client";

import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Empty, LoadError, PageHeader, PageSkeleton } from "@/components/ui/misc";
import { errorMessage, usePropertiesQuery } from "@/store/api";
import { useAppSelector } from "@/store/store";
import { AddPropertyModal } from "./add-property-modal";
import { PropertyCard } from "./property-card";

export function PropertiesView() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const { data: properties, isLoading, isError, error, refetch } = usePropertiesQuery();
  const [adding, setAdding] = useState(false);
  const owner = role === "agent";

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <Breadcrumbs items={[{ label: "Properties" }]} />
      <PageHeader
        title={owner ? "Your properties" : "Properties shared with you"}
        description={owner ? "Add a property, then attach its social links (reels)." : "Agents share properties with you by invite."}
        actions={
          owner && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus aria-hidden /> Add property
            </Button>
          )
        }
      />
      <div className="py-6">
        {isError ? (
          <LoadError message={errorMessage(error)} onRetry={refetch} />
        ) : properties?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <Empty icon={<Building2 />}>
            {owner ? (
              <>
                <b className="block text-ink">No properties yet</b>
                Add your first property to start tracking its reels.
              </>
            ) : (
              "No properties have been shared with you yet."
            )}
          </Empty>
        )}
      </div>
      {owner && adding && <AddPropertyModal onClose={() => setAdding(false)} />}
    </>
  );
}
