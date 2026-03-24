import { AppShell } from '@/components/layout/app-shell';
import { HelpFab } from '@/components/shared/help-fab';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
      <HelpFab />
    </AppShell>
  );
}
