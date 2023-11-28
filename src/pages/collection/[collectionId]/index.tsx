import CollectionDetails from '@app/components/CollectionDetails';
import { getRequestHeaders } from '@app/utils/localRequestHelper';
import type { Collection } from '@server/models/Collection';
import type { GetServerSideProps, NextPage } from 'next';

interface CollectionPageProps {
  collection?: Collection;
}

const CollectionPage: NextPage<CollectionPageProps> = ({ collection }) => {
  return <CollectionDetails collection={collection} />;
};

export const getServerSideProps: GetServerSideProps<
  CollectionPageProps
> = async (ctx) => {
  const res = await fetch(
    `http://localhost:${process.env.PORT || 5055}/api/v1/collection/${
      ctx.query.collectionId
    }`,
    {
      headers: getRequestHeaders(ctx),
    }
  );
  if (!res.ok) throw new Error();
  const collection: Collection = await res.json();

  return {
    props: {
      collection,
    },
  };
};

export default CollectionPage;
