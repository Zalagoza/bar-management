import { prisma } from "@/lib/prisma";
import { createEmployee, paySalary } from "@/lib/actions/salaries";
import { Card, Field, Table, inputClass, SubmitButton, money } from "@/components/ui";

export default async function AdminSalariesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const [employees, payments] = await Promise.all([
    prisma.employee.findMany({ orderBy: { name: "asc" } }),
    prisma.salaryPayment.findMany({ include: { employee: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Salaries & Wages</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved successfully.</div>
      )}

      <Card title="Employees">
        <Table headers={["Name", "Role", "Monthly rate", "Status"]}>
          {employees.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-2">{e.name}</td>
              <td className="px-4 py-2">{e.role}</td>
              <td className="px-4 py-2">{money(Number(e.monthlyRate))}</td>
              <td className="px-4 py-2">{e.active ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Add employee">
          <form action={createEmployee} className="space-y-4">
            <Field label="Name">
              <input type="text" name="name" required className={inputClass} />
            </Field>
            <Field label="Role">
              <input type="text" name="role" required className={inputClass} placeholder="Bartender, Security, Cleaner..." />
            </Field>
            <Field label="Monthly rate">
              <input type="number" name="monthlyRate" step="0.01" min={0} className={inputClass} />
            </Field>
            <SubmitButton>Add Employee</SubmitButton>
          </form>
        </Card>

        <Card title="Pay salary / wages">
          <form action={paySalary} className="space-y-4">
            <Field label="Employee">
              <select name="employeeId" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select employee
                </option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {e.role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount">
              <input type="number" name="amount" step="0.01" min={0.01} required className={inputClass} />
            </Field>
            <Field label="Period">
              <input type="text" name="periodLabel" required className={inputClass} placeholder="e.g. August 2026" />
            </Field>
            <Field label="Paid via">
              <select name="paidVia" className={inputClass} defaultValue="CASH">
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Card</option>
              </select>
            </Field>
            <SubmitButton>Record Payment</SubmitButton>
          </form>
        </Card>
      </div>

      <Card title={`Payment history — total paid ${money(totalPaid)}`}>
        <Table headers={["Date", "Employee", "Period", "Paid via", "Amount"]}>
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-2 whitespace-nowrap">{p.createdAt.toLocaleDateString()}</td>
              <td className="px-4 py-2">{p.employee.name}</td>
              <td className="px-4 py-2">{p.periodLabel}</td>
              <td className="px-4 py-2">{p.paidVia.replace("_", " ")}</td>
              <td className="px-4 py-2 font-medium">{money(Number(p.amount))}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
