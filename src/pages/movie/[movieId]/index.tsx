import MovieDetails from '@app/components/MovieDetails';
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
      headers: ctx.req?.headers?.cookie
        ? { cookie: ctx.req.headers.cookie }
        : undefined,
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
