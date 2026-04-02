'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Gift, Package, ShoppingBag, Settings, ChevronDown, ChevronRight, Plus, List } from 'lucide-react';

const nav = [
  {
    label: 'Blind Boxes',
    icon: Package,
    children: [
      { label: 'All Boxes', href: '/manage' },
      { label: 'Create New', href: '/manage/create' },
    ],
  },
  {
    label: 'Orders',
    icon: ShoppingBag,
    href: '/manage/orders',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/manage/settings',
  },
];

export default function ManageSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string[]>(['Blind Boxes']); // open by default

  const toggle = (label: string) =>
    setOpen((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);

  const isActive = (href: string) => pathname === href;
  const isParentActive = (children?: { href: string }[]) =>
    children?.some((c) => pathname === c.href) ?? false;

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      {/* App header */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Gift className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Blind Box</p>
          <p className="text-xs text-gray-400 leading-tight">App</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const expanded = open.includes(item.label);
          const parentActive = isParentActive(item.children);

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                    parentActive ? 'text-purple-700' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${parentActive ? 'text-purple-600' : 'text-gray-400'}`} />
                    {item.label}
                  </div>
                  {expanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                </button>
                {expanded && (
                  <div className="pb-1">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center pl-10 pr-4 py-2 text-sm transition-colors rounded-lg mx-2 ${
                          isActive(child.href)
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href!)
                  ? 'text-purple-700 bg-purple-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive(item.href!) ? 'text-purple-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
