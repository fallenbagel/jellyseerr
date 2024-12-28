import type { DVRTestResponse } from '@app/components/Settings/SettingsServices';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import type { TmdbGenre } from '@server/api/themoviedb/interfaces';
import type OverrideRule from '@server/entity/OverrideRule';
import type { User } from '@server/entity/User';
import type {
  Language,
  RadarrSettings,
  SonarrSettings,
} from '@server/lib/settings';
import type { Keyword } from '@server/models/common';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.Settings.OverrideRuleTile', {
  qualityprofile: 'Quality Profile',
  rootfolder: 'Root Folder',
  tags: 'Tags',
  users: 'Users',
  genre: 'Genre',
  language: 'Language',
  keywords: 'Keywords',
  conditions: 'Conditions',
  settings: 'Settings',
});

interface OverrideRuleTileProps {
  rules: OverrideRule[];
  setOverrideRuleModal: ({
    open,
    rule,
    testResponse,
  }: {
    open: boolean;
    rule: OverrideRule | null;
    testResponse: DVRTestResponse;
  }) => void;
  testResponse: DVRTestResponse;
  radarr?: RadarrSettings | null;
  sonarr?: SonarrSettings | null;
  revalidate: () => void;
}

const OverrideRuleTile = ({
  rules,
  setOverrideRuleModal,
  testResponse,
  radarr,
  sonarr,
  revalidate,
}: OverrideRuleTileProps) => {
  const intl = useIntl();
  const [users, setUsers] = useState<User[] | null>(null);
  const [keywords, setKeywords] = useState<Keyword[] | null>(null);
  const { data: languages } = useSWR<Language[]>('/api/v1/languages');
  const { data: genres } = useSWR<TmdbGenre[]>('/api/v1/genres/movie');

  useEffect(() => {
    (async () => {
      const keywords = await Promise.all(
        rules
          .map((rule) => rule.keywords?.split(','))
          .flat()
          .filter((keywordId) => keywordId)
          .map(async (keywordId) => {
            const res = await fetch(`/api/v1/keyword/${keywordId}`);
            if (!res.ok) throw new Error();
            const keyword: Keyword = await res.json();
            return keyword;
          })
      );
      setKeywords(keywords);
      const users = await Promise.all(
        rules
          .map((rule) => rule.users?.split(','))
          .flat()
          .filter((userId) => userId)
          .map(async (userId) => {
            const res = await fetch(`/api/v1/user/${userId}`);
            if (!res.ok) throw new Error();
            const user: User = await res.json();
            return user;
          })
      );
      setUsers(users);
    })();
  }, [rules]);

  return (
    <>
      {rules
        .filter(
          (rule) =>
            (rule.radarrServiceId !== null &&
              rule.radarrServiceId === radarr?.id) ||
            (rule.sonarrServiceId !== null &&
              rule.sonarrServiceId === sonarr?.id)
        )
        .map((rule) => (
          <li className="flex h-full flex-col rounded-lg bg-gray-800 text-left shadow ring-1 ring-gray-500">
            <div className="flex w-full flex-1 items-center justify-between space-x-6 p-6">
              <div className="flex-1 truncate">
                <span className="text-lg">
                  {intl.formatMessage(messages.conditions)}
                </span>
                {rule.users && (
                  <p className="truncate text-sm leading-5 text-gray-300">
                    <span className="mr-2 font-bold">
                      {intl.formatMessage(messages.users)}
                    </span>
                    <div className="inline-flex gap-2">
                      {rule.users.split(',').map((userId) => {
                        return (
                          <span>
                            {
                              users?.find((user) => user.id === Number(userId))
                                ?.displayName
                            }
                          </span>
                        );
                      })}
                    </div>
                  </p>
                )}
                {rule.genre && (
                  <p className="truncate text-sm leading-5 text-gray-300">
                    <span className="mr-2 font-bold">
                      {intl.formatMessage(messages.genre)}
                    </span>
                    <div className="inline-flex gap-2">
                      {rule.genre.split(',').map((genreId) => (
                        <span>
                          {genres?.find((g) => g.id === Number(genreId))?.name}
                        </span>
                      ))}
                    </div>
                  </p>
                )}
                {rule.language && (
                  <p className="truncate text-sm leading-5 text-gray-300">
                    <span className="mr-2 font-bold">
                      {intl.formatMessage(messages.language)}
                    </span>
                    <div className="inline-flex gap-2">
                      {rule.language
                        .split('|')
                        .filter((languageId) => languageId !== 'server')
                        .map((languageId) => {
                          const language = languages?.find(
                            (language) => language.iso_639_1 === languageId
                          );
                          if (!language) return null;
                          const languageName =
                            intl.formatDisplayName(language.iso_639_1, {
                              type: 'language',
                              fallback: 'none',
                            }) ?? language.english_name;
                          return <span>{languageName}</span>;
                        })}
                    </div>
                  </p>
                )}
                {rule.keywords && (
                  <p className="truncate text-sm leading-5 text-gray-300">
                    <span className="mr-2 font-bold">
                      {intl.formatMessage(messages.keywords)}
                    </span>
                    <div className="inline-flex gap-2">
                      {rule.keywords.split(',').map((keywordId) => {
                        return (
                          <span>
                            {
                              keywords?.find(
                                (keyword) => keyword.id === Number(keywordId)
                              )?.name
                            }
                          </span>
                        );
                      })}
                    </div>
                  </p>
                )}
                <span className="text-lg">
                  {intl.formatMessage(messages.settings)}
                </span>
                {rule.profileId && (
                  <p className="runcate text-sm leading-5 text-gray-300">
                    <span className="mr-2 font-bold">
                      {intl.formatMessage(messages.qualityprofile)}
                    </span>
                    {
                      testResponse.profiles.find(
                        (profile) => rule.profileId === profile.id
                      )?.name
                    }
                  </p>
                )}
                {rule.rootFolder && (
                  <p className="truncate text-sm leading-5 text-gray-300">
                    <span className="mr-2 font-bold">
                      {intl.formatMessage(messages.rootfolder)}
                    </span>
                    {rule.rootFolder}
                  </p>
                )}
                {rule.tags && rule.tags.length > 0 && (
                  <p className="truncate text-sm leading-5 text-gray-300">
                    <span className="mr-2 font-bold">
                      {intl.formatMessage(messages.tags)}
                    </span>
                    <div className="inline-flex gap-2">
                      {rule.tags.split(',').map((tag) => (
                        <span>
                          {
                            testResponse.tags?.find((t) => t.id === Number(tag))
                              ?.label
                          }
                        </span>
                      ))}
                    </div>
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-gray-500">
              <div className="-mt-px flex">
                <div className="flex w-0 flex-1 border-r border-gray-500">
                  <button
                    onClick={() =>
                      setOverrideRuleModal({ open: true, rule, testResponse })
                    }
                    className="focus:ring-blue relative -mr-px inline-flex w-0 flex-1 items-center justify-center rounded-bl-lg border border-transparent py-4 text-sm font-medium leading-5 text-gray-200 transition duration-150 ease-in-out hover:text-white focus:z-10 focus:border-gray-500 focus:outline-none"
                  >
                    <PencilIcon className="mr-2 h-5 w-5" />
                    <span>{intl.formatMessage(globalMessages.edit)}</span>
                  </button>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <button
                    onClick={async () => {
                      const res = await fetch(
                        `/api/v1/overrideRule/${rule.id}`,
                        {
                          method: 'DELETE',
                        }
                      );
                      if (!res.ok) throw new Error();
                      revalidate();
                    }}
                    className="focus:ring-blue relative inline-flex w-0 flex-1 items-center justify-center rounded-br-lg border border-transparent py-4 text-sm font-medium leading-5 text-gray-200 transition duration-150 ease-in-out hover:text-white focus:z-10 focus:border-gray-500 focus:outline-none"
                  >
                    <TrashIcon className="mr-2 h-5 w-5" />
                    <span>{intl.formatMessage(globalMessages.delete)}</span>
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
    </>
  );
};

export default OverrideRuleTile;
