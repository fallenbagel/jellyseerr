import Button from '@app/components/Common/Button';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import useSettings from '@app/hooks/useSettings';
import defineMessages from '@app/utils/defineMessages';
import {
  ArrowLeftOnRectangleIcon,
  LifebuoyIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

const messages = defineMessages('components.Login', {
  username: 'Username',
  email: 'Email Address',
  password: 'Password',
  validationemailrequired: 'You must provide a valid email address',
  validationpasswordrequired: 'You must provide a password',
  loginerror: 'Something went wrong while trying to sign in.',
  signingin: 'Signing In…',
  signin: 'Sign In',
  forgotpassword: 'Forgot Password?',
});

interface LocalLoginProps {
  revalidate: () => void;
}

const LocalLogin = ({ revalidate }: LocalLoginProps) => {
  const intl = useIntl();
  const settings = useSettings();
  const [loginError, setLoginError] = useState<string | null>(null);

  const LoginSchema = Yup.object().shape({
    email: Yup.string().required(
      intl.formatMessage(messages.validationemailrequired)
    ),
    password: Yup.string().required(
      intl.formatMessage(messages.validationpasswordrequired)
    ),
  });

  const passwordResetEnabled =
    settings.currentSettings.applicationUrl &&
    settings.currentSettings.emailEnabled;

  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
      }}
      validationSchema={LoginSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/auth/local', {
            email: values.email,
            password: values.password,
          });
        } catch (e) {
          setLoginError(intl.formatMessage(messages.loginerror));
        } finally {
          revalidate();
        }
      }}
    >
      {({ errors, touched, isSubmitting, isValid }) => {
        return (
          <>
            <Form>
              <div>
                <label htmlFor="email" className="text-label">
                  {intl.formatMessage(messages.email) +
                    ' / ' +
                    intl.formatMessage(messages.username)}
                </label>
                <div className="mt-1 mb-2 sm:col-span-2 sm:mt-0">
                  <div className="form-input-field">
                    <Field
                      id="email"
                      name="email"
                      type="text"
                      inputMode="email"
                      data-testid="email"
                    />
                  </div>
                  {errors.email &&
                    touched.email &&
                    typeof errors.email === 'string' && (
                      <div className="error">{errors.email}</div>
                    )}
                </div>
                <label htmlFor="password" className="text-label">
                  {intl.formatMessage(messages.password)}
                </label>
                <div className="mt-1 mb-2 sm:col-span-2 sm:mt-0">
                  <div className="form-input-field">
                    <SensitiveInput
                      as="field"
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      data-testid="password"
                    />
                  </div>
                  {errors.password &&
                    touched.password &&
                    typeof errors.password === 'string' && (
                      <div className="error">{errors.password}</div>
                    )}
                </div>
                {loginError && (
                  <div className="mt-1 mb-2 sm:col-span-2 sm:mt-0">
                    <div className="error">{loginError}</div>
                  </div>
                )}
              </div>
              <div className="mt-8 border-t border-gray-700 pt-5">
                <div className="flex flex-row-reverse justify-between">
                  <span className="inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSubmitting || !isValid}
                      data-testid="local-signin-button"
                    >
                      <ArrowLeftOnRectangleIcon />
                      <span>
                        {isSubmitting
                          ? intl.formatMessage(messages.signingin)
                          : intl.formatMessage(messages.signin)}
                      </span>
                    </Button>
                  </span>
                  {passwordResetEnabled && (
                    <span className="inline-flex rounded-md shadow-sm">
                      <Link href="/resetpassword" passHref legacyBehavior>
                        <Button as="a" buttonType="ghost">
                          <LifebuoyIcon />
                          <span>
                            {intl.formatMessage(messages.forgotpassword)}
                          </span>
                        </Button>
                      </Link>
                    </span>
                  )}
                </div>
              </div>
            </Form>
          </>
        );
      }}
    </Formik>
  );
};

export default LocalLogin;
