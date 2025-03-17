import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { Field } from 'formik';
import { useState } from 'react';

interface CustomInputProps extends React.ComponentProps<'input'> {
  as?: 'input';
  'data-bwignore'?: boolean | string;  // Add data-bwignore to the props type
}

interface CustomFieldProps extends React.ComponentProps<typeof Field> {
  as?: 'field';
}

type SensitiveInputProps = CustomInputProps | CustomFieldProps;

const SensitiveInput = ({ as = 'input', ...props }: SensitiveInputProps) => {
  const [isHidden, setHidden] = useState(true);
  const Component = as === 'input' ? 'input' : Field;

  // Deconstruct to filter
  const { "data-bwignore": bwignore, ...filteredProps } = props;

  const componentProps =
    as === 'input'
      ? filteredProps
      : {
          ...filteredProps,
          as: props.type === 'textarea' && !isHidden ? 'textarea' : undefined,
        };

  return (
    <>
      <Component
        autoComplete="off"
        data-form-type="other"
        data-1pignore="true"
        data-lpignore="true"
        // Only include data-bwignore if it's not "false" always with the value "true"
        {...(bwignore !== "false" ? { "data-bwignore": "true" } : {})}
        {...componentProps}
        className={`rounded-l-only ${componentProps.className ?? ''}`}
        type={
          isHidden
            ? 'password'
            : props.type !== 'password'
            ? props.type ?? 'text'
            : 'text'
        }
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          setHidden(!isHidden);
        }}
        type="button"
        className="input-action"
      >
        {isHidden ? <EyeSlashIcon /> : <EyeIcon />}
      </button>
    </>
  );
};

export default SensitiveInput;
