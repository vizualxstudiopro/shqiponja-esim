const statusStyles: Record<string, string> = {
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  unpaid: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  received: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  awaiting_esim: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  provisioning_failed: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  refunded: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style}`}>
      {status}
    </span>
  );
}
