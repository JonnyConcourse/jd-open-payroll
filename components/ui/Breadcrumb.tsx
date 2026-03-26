import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-300">›</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-gray-800 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
