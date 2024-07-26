import SettingsLayout from '@app/components/Settings/SettingsLayout';
import SettingsTvdb from '@app/components/Settings/SettingsTvdb';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const TvdbSettingsPage: NextPage = () => {
  useRouteGuard(Permission.ADMIN);
  return (
    <SettingsLayout>
      <SettingsTvdb />
    </SettingsLayout>
  );
};

export default TvdbSettingsPage;
