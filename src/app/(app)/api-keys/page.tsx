import type { Metadata } from "next";
import { ApiKeysView } from "@/components/api-keys/api-keys-view";

export const metadata: Metadata = { title: "API keys" };

export default function ApiKeysPage() {
  return <ApiKeysView />;
}
