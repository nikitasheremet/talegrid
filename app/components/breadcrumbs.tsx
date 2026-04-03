import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1;

          return (
            <li
              key={`${item.href}-${item.label}`}
              className="flex items-center gap-1"
            >
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              <Link
                href={item.href}
                aria-current={isCurrentPage ? "page" : undefined}
                className={isCurrentPage ? "font-semibold" : "hover:underline"}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
