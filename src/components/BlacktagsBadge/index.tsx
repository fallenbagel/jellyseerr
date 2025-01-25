import Badge from '@app/components/Common/Badge';
import Tooltip from '@app/components/Common/Tooltip';
import { TagIcon } from '@heroicons/react/20/solid';
import type { BlacklistItem } from '@server/interfaces/api/blacklistInterfaces';
import type { Keyword } from '@server/models/common';
import { useEffect, useState } from 'react';

interface BlacktagsBadgeProps {
  data: BlacklistItem;
}

const BlacktagsBadge = ({ data }: BlacktagsBadgeProps) => {
  const [tagNamesBlacklistedFor, setTagNamesBlacklistedFor] =
    useState<string>('Loading...');

  useEffect(() => {
    if (data.blacktags == null) {
      return;
    }

    const keywordIds = data.blacktags.slice(1, -1).split(',');
    Promise.all(
      keywordIds.map(async (keywordId) => {
        const res = await fetch(`/api/v1/keyword/${keywordId}`);
        if (!res.ok) {
          return '';
        }
        const keyword: Keyword = await res.json();

        return keyword.name;
      })
    ).then((keywords) => {
      setTagNamesBlacklistedFor(keywords.join(', '));
    });
  }, [data.blacktags]);

  return (
    <Tooltip
      content={tagNamesBlacklistedFor}
      tooltipConfig={{ followCursor: false }}
    >
      <Badge
        badgeType="dark"
        className="items-center border border-red-500 !text-red-400"
      >
        <TagIcon className="mr-1 h-4" />
        Blacktags
      </Badge>
    </Tooltip>
  );
};

export default BlacktagsBadge;
