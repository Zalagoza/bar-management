import Link from "next/link";
import { signOut, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function BartenderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-bold text-zinc-900">Bar Manager</p>
            <p className="text-xs text-zinc-500">Signed in as {session.user.name} (Bartender)</p>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/bartender" className="text-zinc-600 hover:text-zinc-900">
              Dashboard
            </Link>
            <Link href="/bartender/sales/new" className="text-zinc-600 hover:text-zinc-900">
              New Sale
            </Link>
            <Link href="/bartender/stock/new" className="text-zinc-600 hover:text-zinc-900">
              New Stock
            </Link>
            <form action={signOutAction}>
              <button className="text-red-600 hover:text-red-800">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
