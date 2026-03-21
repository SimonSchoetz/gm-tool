import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/adventure/$adventureId')({
  component: () => <Outlet />,
});
