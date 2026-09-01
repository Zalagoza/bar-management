import Link from "next/link";
import { signOut, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/bills", label: "Bills" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/operating-costs", label: "Operating Costs" },
  { href: "/admin/salaries", label: "Salaries/Wages" },
  { href: "/admin/assets", label: "Assets" },
  { href: "/admin/loans", label: "Loans" },
  { href: "/admin/capital", label: "Capital" },
  { href: "/admin/journal", label: "Journal (Book of Records)" },
  { href: "/admin/reports/pnl", label: "Profit & Loss" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-zinc-200 bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="px-4 py-4">
          <p className="font-bold text-zinc-900">Bar Manager</p>
          <p className="text-xs text-zinc-500">Admin — {session.user.name}</p>
        </div>
        <nav className="flex flex-wrap gap-1 px-2 pb-4 text-sm font-medium lg:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
          <form action={signOutAction}>
            <button className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50">Sign out</button>
          </form>
        </nav>
      </aside>
      <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
