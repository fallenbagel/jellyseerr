import TmdbLogo from '@app/assets/services/tmdb.svg';
import TvdbLogo from '@app/assets/services/tvdb.svg';
import defineMessages from '@app/utils/defineMessages';
import React from 'react';
import { useIntl } from 'react-intl';
import Select, { type StylesConfig } from 'react-select';

enum IndexerType {
  TMDB = 'tmdb',
  TVDB = 'tvdb',
}

type IndexerOptionType = {
  testId?: string;
  value: IndexerType;
  label: string;
  icon: React.ReactNode;
};

const messages = defineMessages('components.MetadataSelector', {
  tmdbLabel: 'TheMovieDB',
  tvdbLabel: 'TheTVDB',
  selectIndexer: 'Select an indexer',
});

interface MetadataSelectorProps {
  testId: string;
  value: IndexerType;
  onChange: (value: IndexerType) => void;
  isDisabled?: boolean;
}

const MetadataSelector = ({
  testId = 'indexer-selector',
  value,
  onChange,
  isDisabled = false,
}: MetadataSelectorProps) => {
  const intl = useIntl();

  const indexerOptions: IndexerOptionType[] = [
    {
      testId: 'tmdb-option',
      value: IndexerType.TMDB,
      label: intl.formatMessage(messages.tmdbLabel),
      icon: <TmdbLogo />,
    },
    {
      testId: 'tvdb-option',
      value: IndexerType.TVDB,
      label: intl.formatMessage(messages.tvdbLabel),
      icon: <TvdbLogo />,
    },
  ];

  const customStyles: StylesConfig<IndexerOptionType, false> = {
    option: (base) => ({
      ...base,
      display: 'flex',
      alignItems: 'center',
    }),
    singleValue: (base) => ({
      ...base,
      display: 'flex',
      alignItems: 'center',
    }),
  };

  const formatOptionLabel = (option: IndexerOptionType) => (
    <div className="flex items-center">
      {option.icon}
      <span data-testid={option.testId}>{option.label}</span>
    </div>
  );

  return (
    <div data-testid={testId}>
      <Select
        options={indexerOptions}
        isDisabled={isDisabled}
        className="react-select-container"
        classNamePrefix="react-select"
        value={indexerOptions.find((option) => option.value === value)}
        onChange={(selectedOption) => {
          if (selectedOption) {
            onChange(selectedOption.value);
          }
        }}
        placeholder={intl.formatMessage(messages.selectIndexer)}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
      />
    </div>
  );
};

export { IndexerType };
export default MetadataSelector;
