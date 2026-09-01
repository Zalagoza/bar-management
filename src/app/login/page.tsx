import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { inputClass, SubmitButton } from "@/components/ui";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/");

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      const { redirect } = await import("next/navigation");
      redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw err;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">Bar Manager</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to continue.</p>

        {params.error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid email or password.
          </div>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl || "/"} />
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Email</label>
            <input type="email" name="email" required className={inputClass} placeholder="you@bar.local" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Password</label>
            <input type="password" name="password" required className={inputClass} />
          </div>
          <SubmitButton>Sign in</SubmitButton>
        </form>
      </div>
    </div>
  );
}
