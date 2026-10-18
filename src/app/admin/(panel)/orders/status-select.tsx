"use client";

const statuses = ["pending", "paid", "shipped", "cancelled"];

export function StatusSelect({ value }: { value: string }) {
  return (
    <select
      name="status"
      defaultValue={value}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="input w-auto cursor-pointer rounded-full py-1.5 capitalize"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
