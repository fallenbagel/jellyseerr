import CompanyCard from '@app/components/CompanyCard';
import Slider from '@app/components/Slider';
import defineMessages from '@app/utils/defineMessages';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Discover.StudioSlider', {
  studios: 'Studios',
});

interface Studio {
  name: string;
  image: string;
  url: string;
}

const studios: Studio[] = [
  {
    name: 'Disney',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/wdrCwmRnLFJhEoH8GSfymY85KHT.png',
    url: '/discover/movies/studio/2',
  },
  {
    name: '20th Century Studios',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/h0rjX5vjW5r8yEnUBStFarjcLT4.png',
    url: '/discover/movies/studio/127928',
  },
  {
    name: 'Sony Pictures',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/GagSvqWlyPdkFHMfQ3pNq6ix9P.png',
    url: '/discover/movies/studio/34',
  },
  {
    name: 'Warner Bros. Pictures',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ky0xOc5OrhzkZ1N6KyUxacfQsCk.png',
    url: '/discover/movies/studio/174',
  },
  {
    name: 'Universal',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/8lvHyhjr8oUKOOy2dKXoALWKdp0.png',
    url: '/discover/movies/studio/33',
  },
  {
    name: 'Paramount',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/fycMZt242LVjagMByZOLUGbCvv3.png',
    url: '/discover/movies/studio/4',
  },
  {
    name: 'Pixar',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png',
    url: '/discover/movies/studio/3',
  },
  {
    name: 'Dreamworks',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/kP7t6RwGz2AvvTkvnI1uteEwHet.png',
    url: '/discover/movies/studio/521',
  },
  {
    name: 'Marvel Studios',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/hUzeosd33nzE5MCNsZxCGEKTXaQ.png',
    url: '/discover/movies/studio/420',
  },
  {
    name: 'DC',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/2Tc1P3Ac8M479naPp1kYT3izLS5.png',
    url: '/discover/movies/studio/9993',
  },
];

const StudioSlider = () => {
  const intl = useIntl();

  return (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.studios)}</span>
        </div>
      </div>
      <Slider
        sliderKey="studios"
        isLoading={false}
        isEmpty={false}
        items={studios.map((studio, index) => (
          <CompanyCard
            key={`studio-${index}`}
            name={studio.name}
            image={studio.image}
            url={studio.url}
          />
        ))}
        emptyMessage=""
      />
    </>
  );
};

export default StudioSlider;
