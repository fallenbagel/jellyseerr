import UserSettings from '@app/components/UserProfile/UserSettings';
import UserLinkedAccountsSettings from '@app/components/UserProfile/UserSettings/UserLinkedAccountsSettings';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const UserLinkedAccountsPage: NextPage = () => {
  useRouteGuard(Permission.MANAGE_USERS);
  return (
    <UserSettings>
      <UserLinkedAccountsSettings />
    </UserSettings>
  );
};

export default UserLinkedAccountsPage;
