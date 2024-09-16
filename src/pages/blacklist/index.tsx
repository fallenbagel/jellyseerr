import Blacklist from '@app/components/Blacklist';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@server/lib/permissions';
import type { NextPage } from 'next';

const BlacklistPage: NextPage = () => {
  useRouteGuard([Permission.MANAGE_BLACKLIST, Permission.VIEW_BLACKLIST], {
    type: 'or',
  });
  return <Blacklist />;
};

export default BlacklistPage;
