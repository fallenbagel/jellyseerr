import MovieDetails from '@app/components/MovieDetails';
import { getRequestHeaders } from '@app/utils/localRequestHelper';
import type { MovieDetails as MovieDetailsType } from '@server/models/Movie';
import type { GetServerSideProps, NextPage } from 'next';

interface MoviePageProps {
  movie?: MovieDetailsType;
}

const MoviePage: NextPage<MoviePageProps> = ({ movie }) => {
  return <MovieDetails movie={movie} />;
};

export const getServerSideProps: GetServerSideProps<MoviePageProps> = async (
  ctx
) => {
  const res = await fetch(
    `http://localhost:${process.env.PORT || 5055}/api/v1/movie/${
      ctx.query.movieId
    }`,
    {
      headers: getRequestHeaders(ctx),
    }
  );
  if (!res.ok) throw new Error();
  const movie: MovieDetailsType = await res.json();

  return {
    props: {
      movie,
    },
  };
};

export default MoviePage;
