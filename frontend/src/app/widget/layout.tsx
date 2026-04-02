import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blind Box Widget',
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
