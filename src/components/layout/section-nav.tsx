"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SectionNavItem = {
  href: string;
  label: string;
  description?: string;
};

type SectionNavProps = {
  title: string;
  items: SectionNavItem[];
};

export function SectionNav({ title, items }: SectionNavProps) {
  const pathname = usePathname();

  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="px-3 pb-3 text-xs uppercase tracking-[0.25em] text-[#FF6B00]">
        {title}
      </p>

      <nav className="space-y-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-2xl px-3 py-3 transition",
                isActive
                  ? "bg-[#FF6B00] text-black"
                  : "bg-white/0 text-white hover:bg-white/10",
              )}
            >
              <p className="text-sm font-medium">{item.label}</p>
              {item.description ? (
                <p
                  className={cn(
                    "mt-1 text-xs",
                    isActive ? "text-black/75" : "text-white/55",
                  )}
                >
                  {item.description}
                </p>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}