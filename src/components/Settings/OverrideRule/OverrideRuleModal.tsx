import Modal from '@app/components/Common/Modal';
import LanguageSelector from '@app/components/LanguageSelector';
import {
  GenreSelector,
  KeywordSelector,
  UserSelector,
} from '@app/components/Selector';
import type { DVRTestResponse } from '@app/components/Settings/SettingsServices';
import useSettings from '@app/hooks/useSettings';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';
import type OverrideRule from '@server/entity/OverrideRule';
import { Field, Formik } from 'formik';
import { useIntl } from 'react-intl';
import Select from 'react-select';
import { useToasts } from 'react-toast-notifications';

const messages = defineMessages('components.Settings.OverrideRuleModal', {
  createrule: 'New Override Rule',
  editrule: 'Edit Override Rule',
  create: 'Create rule',
  conditions: 'Conditions',
  conditionsDescription:
    'Specifies conditions before applying parameter changes. Each field must be validated for the rules to be applied (AND operation). A field is considered verified if any of its properties match (OR operation).',
  settings: 'Settings',
  settingsDescription:
    'Specifies which settings will be changed when the above conditions are met.',
  users: 'Users',
  genres: 'Genres',
  languages: 'Languages',
  keywords: 'Keywords',
  rootfolder: 'Root Folder',
  selectRootFolder: 'Select root folder',
  qualityprofile: 'Quality Profile',
  selectQualityProfile: 'Select quality profile',
  tags: 'Tags',
  notagoptions: 'No tags.',
  selecttags: 'Select tags',
  ruleCreated: 'Override rule created successfully!',
  ruleUpdated: 'Override rule updated successfully!',
});

type OptionType = {
  value: number;
  label: string;
};

interface OverrideRuleModalProps {
  rule: OverrideRule | null;
  onClose: () => void;
  testResponse: DVRTestResponse;
  radarrId?: number;
  sonarrId?: number;
}

const OverrideRuleModal = ({
  onClose,
  rule,
  testResponse,
  radarrId,
  sonarrId,
}: OverrideRuleModalProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { currentSettings } = useSettings();

  return (
    <Transition
      as="div"
      appear
      show
      enter="transition-opacity ease-in-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity ease-in-out duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Formik
        initialValues={{
          users: rule?.users,
          genre: rule?.genre,
          language: rule?.language,
          keywords: rule?.keywords,
          profileId: rule?.profileId,
          rootFolder: rule?.rootFolder,
          tags: rule?.tags,
        }}
        onSubmit={async (values) => {
          try {
            const submission = {
              users: values.users || null,
              genre: values.genre || null,
              language: values.language || null,
              keywords: values.keywords || null,
              profileId: Number(values.profileId) || null,
              rootFolder: values.rootFolder || null,
              tags: values.tags || null,
              radarrServiceId: radarrId,
              sonarrServiceId: sonarrId,
            };
            if (!rule) {
              const res = await fetch('/api/v1/overrideRule', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(submission),
              });
              if (!res.ok) throw new Error();
              addToast(intl.formatMessage(messages.ruleCreated), {
                appearance: 'success',
                autoDismiss: true,
              });
            } else {
              const res = await fetch(`/api/v1/overrideRule/${rule.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(submission),
              });
              if (!res.ok) throw new Error();
              addToast(intl.formatMessage(messages.ruleUpdated), {
                appearance: 'success',
                autoDismiss: true,
              });
            }
            onClose();
          } catch (e) {
            // set error here
          }
        }}
      >
        {({
          errors,
          touched,
          values,
          handleSubmit,
          setFieldValue,
          isSubmitting,
          isValid,
        }) => {
          return (
            <Modal
              onCancel={onClose}
              okButtonType="primary"
              okText={
                isSubmitting
                  ? intl.formatMessage(globalMessages.saving)
                  : rule
                  ? intl.formatMessage(globalMessages.save)
                  : intl.formatMessage(messages.create)
              }
              okDisabled={
                isSubmitting ||
                !isValid ||
                (!values.users &&
                  !values.genre &&
                  !values.language &&
                  !values.keywords) ||
                (!values.rootFolder && !values.profileId && !values.tags)
              }
              onOk={() => handleSubmit()}
              title={
                !rule
                  ? intl.formatMessage(messages.createrule)
                  : intl.formatMessage(messages.editrule)
              }
            >
              <div className="mb-6">
                <h3 className="text-lg font-bold leading-8 text-gray-100">
                  {intl.formatMessage(messages.conditions)}
                </h3>
                <p className="description">
                  {intl.formatMessage(messages.conditionsDescription)}
                </p>
                <div className="form-row">
                  <label htmlFor="users" className="text-label">
                    {intl.formatMessage(messages.users)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <UserSelector
                        defaultValue={values.users}
                        isMulti
                        onChange={(users) => {
                          setFieldValue(
                            'users',
                            users?.map((v) => v.value).join(',')
                          );
                        }}
                      />
                    </div>
                    {errors.users &&
                      touched.users &&
                      typeof errors.users === 'string' && (
                        <div className="error">{errors.users}</div>
                      )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="genre" className="text-label">
                    {intl.formatMessage(messages.genres)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <GenreSelector
                        type={radarrId ? 'movie' : 'tv'}
                        defaultValue={values.genre}
                        isMulti
                        onChange={(genres) => {
                          setFieldValue(
                            'genre',
                            genres?.map((v) => v.value).join(',')
                          );
                        }}
                      />
                    </div>
                    {errors.genre &&
                      touched.genre &&
                      typeof errors.genre === 'string' && (
                        <div className="error">{errors.genre}</div>
                      )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="language" className="text-label">
                    {intl.formatMessage(messages.languages)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <LanguageSelector
                        value={values.language}
                        serverValue={currentSettings.originalLanguage}
                        setFieldValue={(_key, value) => {
                          setFieldValue('language', value);
                        }}
                      />
                    </div>
                    {errors.language &&
                      touched.language &&
                      typeof errors.language === 'string' && (
                        <div className="error">{errors.language}</div>
                      )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="keywords" className="text-label">
                    {intl.formatMessage(messages.keywords)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <KeywordSelector
                        defaultValue={values.keywords}
                        isMulti
                        onChange={(value) => {
                          setFieldValue(
                            'keywords',
                            value?.map((v) => v.value).join(',')
                          );
                        }}
                      />
                    </div>
                    {errors.keywords &&
                      touched.keywords &&
                      typeof errors.keywords === 'string' && (
                        <div className="error">{errors.keywords}</div>
                      )}
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-bold leading-8 text-gray-100">
                  {intl.formatMessage(messages.settings)}
                </h3>
                <p className="description">
                  {intl.formatMessage(messages.settingsDescription)}
                </p>
                <div className="form-row">
                  <label htmlFor="rootFolderRule" className="text-label">
                    {intl.formatMessage(messages.rootfolder)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <Field as="select" id="rootFolderRule" name="rootFolder">
                        <option value="">
                          {intl.formatMessage(messages.selectRootFolder)}
                        </option>
                        {testResponse.rootFolders.length > 0 &&
                          testResponse.rootFolders.map((folder) => (
                            <option
                              key={`loaded-profile-${folder.id}`}
                              value={folder.path}
                            >
                              {folder.path}
                            </option>
                          ))}
                      </Field>
                    </div>
                    {errors.rootFolder &&
                      touched.rootFolder &&
                      typeof errors.rootFolder === 'string' && (
                        <div className="error">{errors.rootFolder}</div>
                      )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="profileIdRule" className="text-label">
                    {intl.formatMessage(messages.qualityprofile)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <Field as="select" id="profileIdRule" name="profileId">
                        <option value="">
                          {intl.formatMessage(messages.selectQualityProfile)}
                        </option>
                        {testResponse.profiles.length > 0 &&
                          testResponse.profiles.map((profile) => (
                            <option
                              key={`loaded-profile-${profile.id}`}
                              value={profile.id}
                            >
                              {profile.name}
                            </option>
                          ))}
                      </Field>
                    </div>
                    {errors.profileId &&
                      touched.profileId &&
                      typeof errors.profileId === 'string' && (
                        <div className="error">{errors.profileId}</div>
                      )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="tags" className="text-label">
                    {intl.formatMessage(messages.tags)}
                  </label>
                  <div className="form-input-area">
                    <Select<OptionType, true>
                      options={testResponse.tags.map((tag) => ({
                        label: tag.label,
                        value: tag.id,
                      }))}
                      isMulti
                      placeholder={intl.formatMessage(messages.selecttags)}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      value={
                        (values?.tags
                          ?.split(',')
                          .map((tagId) => {
                            const foundTag = testResponse.tags.find(
                              (tag) => tag.id === Number(tagId)
                            );

                            if (!foundTag) {
                              return undefined;
                            }

                            return {
                              value: foundTag.id,
                              label: foundTag.label,
                            };
                          })
                          .filter(
                            (option) => option !== undefined
                          ) as OptionType[]) || []
                      }
                      onChange={(value) => {
                        setFieldValue(
                          'tags',
                          value.map((option) => option.value).join(',')
                        );
                      }}
                      noOptionsMessage={() =>
                        intl.formatMessage(messages.notagoptions)
                      }
                    />
                  </div>
                </div>
              </div>
            </Modal>
          );
        }}
      </Formik>
    </Transition>
  );
};

export default OverrideRuleModal;
