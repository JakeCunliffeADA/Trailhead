import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getKitList, getKitListItems, getActiveGearForPicker } from "@/server/kit-lists";
import { KitListDetail } from "@/components/kit-lists/kit-list-detail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Kit list" };
  const list = await getKitList(session.user.id, id);
  return { title: list?.name ?? "Kit list" };
}

export default async function KitListPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [list, items, gearOptions] = await Promise.all([
    getKitList(session.user.id, id),
    getKitListItems(session.user.id, id),
    getActiveGearForPicker(session.user.id),
  ]);

  if (!list) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <KitListDetail list={list} items={items} gearOptions={gearOptions} />
    </main>
  );
}
