import TvDetails from '@app/components/TvDetails';
import { getAuthHeaders } from '@app/utils/localRequestHelper';
import type { TvDetails as TvDetailsType } from '@server/models/Tv';
import type { GetServerSideProps, NextPage } from 'next';

interface TvPageProps {
  tv?: TvDetailsType;
}

const TvPage: NextPage<TvPageProps> = ({ tv }) => {
  return <TvDetails tv={tv} />;
};

export const getServerSideProps: GetServerSideProps<TvPageProps> = async (
  ctx
) => {
  const res = await fetch(
    `http://localhost:${process.env.PORT || 5055}/api/v1/tv/${ctx.query.tvId}`,
    {
      headers: getAuthHeaders(ctx),
    }
  );
  if (!res.ok) throw new Error();
  const tv: TvDetailsType = await res.json();

  return {
    props: {
      tv,
    },
  };
};

export default TvPage;
