import Link from "next/link";
import { type KitList } from "@/db/schema";

type Props = { list: KitList };

export function KitListCard({ list }: Props) {
  return (
    <Link
      href={`/kits/${list.id}`}
      className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <h2 className="font-semibold">{list.name}</h2>
      {list.description && (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {list.description}
        </p>
      )}
    </Link>
  );
}
