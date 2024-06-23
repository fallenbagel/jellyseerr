import CompanyCard from '@app/components/CompanyCard';
import Slider from '@app/components/Slider';
import defineMessages from '@app/utils/defineMessages';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Discover.NetworkSlider', {
  networks: 'Networks',
});

interface Network {
  name: string;
  image: string;
  url: string;
}

const networks: Network[] = [
  {
    name: 'Netflix',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/wwemzKWzjKYJFfCeiB57q3r4Bcm.png',
    url: '/discover/tv/network/213',
  },
  {
    name: 'Disney+',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/gJ8VX6JSu3ciXHuC2dDGAo2lvwM.png',
    url: '/discover/tv/network/2739',
  },
  {
    name: 'Prime Video',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.png',
    url: '/discover/tv/network/1024',
  },
  {
    name: 'Apple TV+',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/4KAy34EHvRM25Ih8wb82AuGU7zJ.png',
    url: '/discover/tv/network/2552',
  },
  {
    name: 'Hulu',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/pqUTCleNUiTLAVlelGxUgWn1ELh.png',
    url: '/discover/tv/network/453',
  },
  {
    name: 'HBO',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/tuomPhY2UtuPTqqFnKMVHvSb724.png',
    url: '/discover/tv/network/49',
  },
  {
    name: 'Discovery+',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/1D1bS3Dyw4ScYnFWTlBOvJXC3nb.png',
    url: '/discover/tv/network/4353',
  },
  {
    name: 'ABC',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ndAvF4JLsliGreX87jAc9GdjmJY.png',
    url: '/discover/tv/network/2',
  },
  {
    name: 'FOX',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/1DSpHrWyOORkL9N2QHX7Adt31mQ.png',
    url: '/discover/tv/network/19',
  },
  {
    name: 'Cinemax',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/6mSHSquNpfLgDdv6VnOOvC5Uz2h.png',
    url: '/discover/tv/network/359',
  },
  {
    name: 'AMC',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/pmvRmATOCaDykE6JrVoeYxlFHw3.png',
    url: '/discover/tv/network/174',
  },
  {
    name: 'Showtime',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/Allse9kbjiP6ExaQrnSpIhkurEi.png',
    url: '/discover/tv/network/67',
  },
  {
    name: 'Starz',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/8GJjw3HHsAJYwIWKIPBPfqMxlEa.png',
    url: '/discover/tv/network/318',
  },
  {
    name: 'The CW',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ge9hzeaU7nMtQ4PjkFlc68dGAJ9.png',
    url: '/discover/tv/network/71',
  },
  {
    name: 'NBC',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/o3OedEP0f9mfZr33jz2BfXOUK5.png',
    url: '/discover/tv/network/6',
  },
  {
    name: 'CBS',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/nm8d7P7MJNiBLdgIzUK0gkuEA4r.png',
    url: '/discover/tv/network/16',
  },
  {
    name: 'Paramount+',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/fi83B1oztoS47xxcemFdPMhIzK.png',
    url: '/discover/tv/network/4330',
  },
  {
    name: 'BBC One',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/mVn7xESaTNmjBUyUtGNvDQd3CT1.png',
    url: '/discover/tv/network/4',
  },
  {
    name: 'Cartoon Network',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/c5OC6oVCg6QP4eqzW6XIq17CQjI.png',
    url: '/discover/tv/network/56',
  },
  {
    name: 'Adult Swim',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/9AKyspxVzywuaMuZ1Bvilu8sXly.png',
    url: '/discover/tv/network/80',
  },
  {
    name: 'Nickelodeon',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ikZXxg6GnwpzqiZbRPhJGaZapqB.png',
    url: '/discover/tv/network/13',
  },
  {
    name: 'Peacock',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/gIAcGTjKKr0KOHL5s4O36roJ8p7.png',
    url: '/discover/tv/network/3353',
  },
];

const NetworkSlider = () => {
  const intl = useIntl();

  return (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.networks)}</span>
        </div>
      </div>
      <Slider
        sliderKey="networks"
        isLoading={false}
        isEmpty={false}
        items={networks.map((network, index) => (
          <CompanyCard
            key={`network-${index}`}
            name={network.name}
            image={network.image}
            url={network.url}
          />
        ))}
        emptyMessage=""
      />
    </>
  );
};

export default NetworkSlider;
