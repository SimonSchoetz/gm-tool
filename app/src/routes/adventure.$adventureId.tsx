import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Routes } from './index';

export const Route = createFileRoute(`/${Routes.ADVENTURE}/$adventureId`)({
  component: () => <Outlet />,
});
