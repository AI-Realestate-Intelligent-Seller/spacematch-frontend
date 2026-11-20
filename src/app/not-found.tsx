import { LinkButton } from "@/components/ui/button";
import { Brand } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="grid justify-items-center gap-4 text-center">
        <Brand large />
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
        <LinkButton href="/properties" variant="primary">
          Go to properties
        </LinkButton>
      </div>
    </main>
  );
}
