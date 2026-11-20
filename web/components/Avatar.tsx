const COLORS = ["bg-sun", "bg-chili", "bg-mint", "bg-sky-300", "bg-orange-300"];

function colorFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

export default function Avatar({ id, name }: { id: string; name: string }) {
  return (
    <span
      aria-hidden
      className={`grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink text-lg font-extrabold ${colorFor(id)}`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
