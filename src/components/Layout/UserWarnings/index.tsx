import { useUser } from '@app/hooks/useUser';
import defineMessages from '@app/utils/defineMessages';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Layout.UserWarnings', {
  emailRequired: 'An email address is required.',
  emailInvalid: 'Email address is invalid.',
  passwordRequired: 'A password is required.',
});

interface UserWarningsProps {
  onClick?: () => void;
}

const UserWarnings: React.FC<UserWarningsProps> = ({ onClick }) => {
  const intl = useIntl();
  const { user } = useUser();
  if (!user) {
    return null;
  }

  let res = null;

  //check if a user has warnings
  if (user.warnings.length > 0) {
    user.warnings.forEach((warning) => {
      let link = '';
      let warningText = '';
      let warningTitle = '';
      switch (warning) {
        case 'userEmailRequired':
          link = '/profile/settings/';
          warningTitle = 'Profile is incomplete';
          warningText = intl.formatMessage(messages.emailRequired);
      }

      res = (
        <Link
          href={link}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onClick) {
              onClick();
            }
          }}
          role="button"
          tabIndex={0}
          className="mx-2 mb-2 flex items-center rounded-lg bg-yellow-500 p-2 text-xs text-white ring-1 ring-gray-700 transition duration-300 hover:bg-yellow-400"
        >
          <ExclamationTriangleIcon className="h-6 w-6" />
          <div className="flex min-w-0 flex-1 flex-col truncate px-2 last:pr-0">
            <span className="font-bold">{warningTitle}</span>
            <span className="truncate">{warningText}</span>
          </div>
        </Link>
      );
    });
  }

  return res;
};

export default UserWarnings;
