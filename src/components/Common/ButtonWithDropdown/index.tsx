import useClickOutside from '@app/hooks/useClickOutside';
import { withProperties } from '@app/utils/typeHelpers';
import { Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  RefObject,
} from 'react';
import { Fragment, useRef, useState } from 'react';

interface DropdownItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  buttonType?: 'primary' | 'ghost';
}

const DropdownItem = ({
  children,
  buttonType = 'primary',
  ...props
}: DropdownItemProps) => {
  let styleClass = 'button-md text-white';

  switch (buttonType) {
    case 'ghost':
      styleClass +=
        ' bg-transparent rounded hover:bg-gradient-to-br from-indigo-600 to-purple-600 text-white focus:border-gray-500 focus:text-white';
      break;
    default:
      styleClass +=
        ' bg-indigo-600 rounded hover:bg-indigo-500 focus:border-indigo-700 focus:text-white';
  }
  return (
    <a
      className={`flex cursor-pointer items-center px-4 py-2 text-sm leading-5 focus:outline-none ${styleClass}`}
      {...props}
    >
      {children}
    </a>
  );
};

interface ButtonWithDropdownProps {
  text: React.ReactNode;
  dropdownIcon?: React.ReactNode;
  buttonType?: 'primary' | 'ghost';
}
interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonWithDropdownProps {
  as?: 'button';
}
interface AnchorProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    ButtonWithDropdownProps {
  as: 'a';
}

const ButtonWithDropdown = ({
  as,
  text,
  children,
  dropdownIcon,
  className,
  buttonType = 'primary',
  ...props
}: ButtonProps | AnchorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  useClickOutside(buttonRef, () => setIsOpen(false));

  const styleClasses = {
    mainButtonClasses: 'button-md text-white border',
    dropdownSideButtonClasses: 'button-md border',
    dropdownClasses: 'button-md',
  };

  switch (buttonType) {
    case 'ghost':
      styleClasses.mainButtonClasses +=
        ' bg-transparent border-gray-600 hover:border-gray-200 focus:border-gray-100 active:border-gray-100';
      styleClasses.dropdownSideButtonClasses = styleClasses.mainButtonClasses;
      styleClasses.dropdownClasses +=
        ' bg-gray-800 border border-gray-700 bg-opacity-80 p-1 backdrop-blur';
      break;
    default:
      styleClasses.mainButtonClasses +=
        ' bg-indigo-600 border-indigo-500 bg-opacity-80 hover:bg-opacity-100 hover:border-indigo-500 active:bg-indigo-700 active:border-indigo-700 focus:ring-blue';
      styleClasses.dropdownSideButtonClasses +=
        ' bg-indigo-600 bg-opacity-80 border-indigo-500 hover:bg-opacity-100 active:bg-opacity-100 focus:ring-blue';
      styleClasses.dropdownClasses += ' bg-indigo-600 p-1';
  }

  return (
    <span className="relative inline-flex h-full rounded-md shadow-sm">
      {as === 'a' ? (
        <a
          className={`relative z-10 inline-flex h-full items-center px-4 py-2 text-sm font-medium leading-5 transition duration-150 ease-in-out hover:z-20 focus:z-20 focus:outline-none ${
            styleClasses.mainButtonClasses
          } ${children ? 'rounded-l-md' : 'rounded-md'} ${className}`}
          ref={buttonRef as RefObject<HTMLAnchorElement>}
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {text}
        </a>
      ) : (
        <button
          type="button"
          className={`relative z-10 inline-flex h-full items-center px-4 py-2 text-sm font-medium leading-5 transition duration-150 ease-in-out hover:z-20 focus:z-20 focus:outline-none ${
            styleClasses.mainButtonClasses
          } ${children ? 'rounded-l-md' : 'rounded-md'} ${className}`}
          ref={buttonRef as RefObject<HTMLButtonElement>}
          {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {text}
        </button>
      )}
      {children && (
        <span className="relative -ml-px block">
          <button
            type="button"
            className={`relative z-10 inline-flex h-full items-center rounded-r-md px-2 py-2 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out hover:z-20 focus:z-20 ${styleClasses.dropdownSideButtonClasses}`}
            aria-label="Expand"
            onClick={() => setIsOpen((state) => !state)}
          >
            {dropdownIcon ? dropdownIcon : <ChevronDownIcon />}
          </button>
          <Transition
            as={Fragment}
            show={isOpen}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="absolute right-0 z-40 mt-2 -mr-1 w-56 origin-top-right rounded-md shadow-lg">
              <div
                className={`rounded-md ring-1 ring-black ring-opacity-5 ${styleClasses.dropdownClasses}`}
              >
                <div className="py-1">{children}</div>
              </div>
            </div>
          </Transition>
        </span>
      )}
    </span>
  );
};
export default withProperties(ButtonWithDropdown, { Item: DropdownItem });
