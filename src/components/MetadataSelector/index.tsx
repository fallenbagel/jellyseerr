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
  value: IndexerType;
  onChange: (value: IndexerType) => void;
  isDisabled?: boolean;
}

const MetadataSelector = ({
  value,
  onChange,
  isDisabled = false,
}: MetadataSelectorProps) => {
  const intl = useIntl();

  const indexerOptions: IndexerOptionType[] = [
    {
      value: IndexerType.TMDB,
      label: intl.formatMessage(messages.tmdbLabel),
      icon: <TmdbLogo />,
    },
    {
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
      <span>{option.label}</span>
    </div>
  );

  return (
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
  );
};

export { IndexerType };
export default MetadataSelector;
