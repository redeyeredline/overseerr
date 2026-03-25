import Ellipsis from '@app/assets/ellipsis.svg';
import CachedImage from '@app/components/Common/CachedImage';
import ImageFader from '@app/components/Common/ImageFader';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import TitleCard from '@app/components/TitleCard';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import useSettings from '@app/hooks/useSettings';
import { MediaStatus } from '@server/constants/media';
import type { PersonCombinedCreditsResponse } from '@server/interfaces/api/personInterfaces';
import type { PersonDetails as PersonDetailsType } from '@server/models/Person';
import { BarsArrowDownIcon } from '@heroicons/react/24/solid';
import { groupBy } from 'lodash';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import TruncateMarkup from 'react-truncate-markup';
import useSWR from 'swr';

const messages = defineMessages({
  birthdate: 'Born {birthdate}',
  lifespan: '{birthdate} – {deathdate}',
  alsoknownas: 'Also Known As: {names}',
  appearsin: 'Appearances',
  crewmember: 'Crew',
  ascharacter: 'as {character}',
  sortByVoteCount: 'Vote Count',
  sortByRating: 'Rating',
  sortByReleaseDate: 'Release Date',
  sortByTitle: 'Title',
});

const PersonDetails = () => {
  const intl = useIntl();
  const router = useRouter();
  const settings = useSettings();
  const { data, error } = useSWR<PersonDetailsType>(
    `/api/v1/person/${router.query.personId}`
  );
  const [showBio, setShowBio] = useState(false);
  const [castSortBy, setCastSortBy] = useState<'voteCount' | 'rating' | 'releaseDate' | 'title'>('voteCount');
  const [crewSortBy, setCrewSortBy] = useState<'voteCount' | 'rating' | 'releaseDate' | 'title'>('voteCount');

  const { data: combinedCredits, error: errorCombinedCredits } =
    useSWR<PersonCombinedCreditsResponse>(
      `/api/v1/person/${router.query.personId}/combined_credits`
    );

  const sortedCast = useMemo(() => {
    const grouped = groupBy(combinedCredits?.cast ?? [], 'id');

    let reduced = Object.values(grouped).map((objs) => ({
      ...objs[0],
      character: objs.map((pos) => pos.character).join(', '),
    }));

    // Filter out items that are in the library if hideAvailable is enabled
    if (settings.currentSettings.hideAvailable) {
      reduced = reduced.filter(
        (item) =>
          (item.mediaType === 'movie' || item.mediaType === 'tv') &&
          item.mediaInfo?.status !== MediaStatus.AVAILABLE &&
          item.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
      );
    }

    return reduced.sort((a, b) => {
      switch (castSortBy) {
        case 'voteCount':
          const aVotes = a.voteCount ?? 0;
          const bVotes = b.voteCount ?? 0;
          return bVotes - aVotes;
        case 'rating':
          const aRating = a.voteAverage ?? 0;
          const bRating = b.voteAverage ?? 0;
          return bRating - aRating;
        case 'releaseDate':
          const aDate = a.mediaType === 'movie' ? a.releaseDate : a.firstAirDate;
          const bDate = b.mediaType === 'movie' ? b.releaseDate : b.firstAirDate;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        case 'title':
          const aTitle = (a.mediaType === 'movie' ? a.title : a.name) ?? '';
          const bTitle = (b.mediaType === 'movie' ? b.title : b.name) ?? '';
          return aTitle.localeCompare(bTitle);
        default:
          return 0;
      }
    });
  }, [combinedCredits, settings.currentSettings.hideAvailable, castSortBy]);

  const sortedCrew = useMemo(() => {
    const grouped = groupBy(combinedCredits?.crew ?? [], 'id');

    let reduced = Object.values(grouped).map((objs) => ({
      ...objs[0],
      job: objs.map((pos) => pos.job).join(', '),
    }));

    // Filter out items that are in the library if hideAvailable is enabled
    if (settings.currentSettings.hideAvailable) {
      reduced = reduced.filter(
        (item) =>
          (item.mediaType === 'movie' || item.mediaType === 'tv') &&
          item.mediaInfo?.status !== MediaStatus.AVAILABLE &&
          item.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
      );
    }

    return reduced.sort((a, b) => {
      switch (crewSortBy) {
        case 'voteCount':
          const aVotes = a.voteCount ?? 0;
          const bVotes = b.voteCount ?? 0;
          return bVotes - aVotes;
        case 'rating':
          const aRating = a.voteAverage ?? 0;
          const bRating = b.voteAverage ?? 0;
          return bRating - aRating;
        case 'releaseDate':
          const aDate = a.mediaType === 'movie' ? a.releaseDate : a.firstAirDate;
          const bDate = b.mediaType === 'movie' ? b.releaseDate : b.firstAirDate;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        case 'title':
          const aTitle = (a.mediaType === 'movie' ? a.title : a.name) ?? '';
          const bTitle = (b.mediaType === 'movie' ? b.title : b.name) ?? '';
          return aTitle.localeCompare(bTitle);
        default:
          return 0;
      }
    });
  }, [combinedCredits, settings.currentSettings.hideAvailable, crewSortBy]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  const personAttributes: string[] = [];

  if (data.birthday) {
    if (data.deathday) {
      personAttributes.push(
        intl.formatMessage(messages.lifespan, {
          birthdate: intl.formatDate(data.birthday, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
          }),
          deathdate: intl.formatDate(data.deathday, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
          }),
        })
      );
    } else {
      personAttributes.push(
        intl.formatMessage(messages.birthdate, {
          birthdate: intl.formatDate(data.birthday, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
          }),
        })
      );
    }
  }

  if (data.placeOfBirth) {
    personAttributes.push(data.placeOfBirth);
  }

  const isLoading = !combinedCredits && !errorCombinedCredits;

  const cast = (sortedCast ?? []).length > 0 && (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.appearsin)}</span>
        </div>
        <div className="ml-auto flex items-center">
          <span className="mr-2 inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 text-sm">
            <BarsArrowDownIcon className="h-5 w-5" />
          </span>
          <select
            className="rounded-r-only text-sm"
            value={castSortBy}
            onChange={(e) => setCastSortBy(e.target.value as typeof castSortBy)}
          >
            <option value="voteCount">{intl.formatMessage(messages.sortByVoteCount)}</option>
            <option value="rating">{intl.formatMessage(messages.sortByRating)}</option>
            <option value="releaseDate">{intl.formatMessage(messages.sortByReleaseDate)}</option>
            <option value="title">{intl.formatMessage(messages.sortByTitle)}</option>
          </select>
        </div>
      </div>
      <ul className="cards-vertical">
        {sortedCast?.map((media, index) => {
          return (
            <li key={`list-cast-item-${media.id}-${index}`}>
              <TitleCard
                id={media.id}
                title={media.mediaType === 'movie' ? media.title : media.name}
                userScore={media.voteAverage}
                year={
                  media.mediaType === 'movie'
                    ? media.releaseDate
                    : media.firstAirDate
                }
                image={media.posterPath}
                summary={media.overview}
                mediaType={media.mediaType as 'movie' | 'tv'}
                status={media.mediaInfo?.status}
                canExpand
              />
              {media.character && (
                <div className="mt-2 w-full truncate text-center text-xs text-gray-300">
                  {intl.formatMessage(messages.ascharacter, {
                    character: media.character,
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  const crew = (sortedCrew ?? []).length > 0 && (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.crewmember)}</span>
        </div>
        <div className="ml-auto flex items-center">
          <span className="mr-2 inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 text-sm">
            <BarsArrowDownIcon className="h-5 w-5" />
          </span>
          <select
            className="rounded-r-only text-sm"
            value={crewSortBy}
            onChange={(e) => setCrewSortBy(e.target.value as typeof crewSortBy)}
          >
            <option value="voteCount">{intl.formatMessage(messages.sortByVoteCount)}</option>
            <option value="rating">{intl.formatMessage(messages.sortByRating)}</option>
            <option value="releaseDate">{intl.formatMessage(messages.sortByReleaseDate)}</option>
            <option value="title">{intl.formatMessage(messages.sortByTitle)}</option>
          </select>
        </div>
      </div>
      <ul className="cards-vertical">
        {sortedCrew?.map((media, index) => {
          return (
            <li key={`list-crew-item-${media.id}-${index}`}>
              <TitleCard
                id={media.id}
                title={media.mediaType === 'movie' ? media.title : media.name}
                userScore={media.voteAverage}
                year={
                  media.mediaType === 'movie'
                    ? media.releaseDate
                    : media.firstAirDate
                }
                image={media.posterPath}
                summary={media.overview}
                mediaType={media.mediaType as 'movie' | 'tv'}
                status={media.mediaInfo?.status}
                canExpand
              />
              {media.job && (
                <div className="mt-2 w-full truncate text-center text-xs text-gray-300">
                  {media.job}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <>
      <PageTitle title={data.name} />
      {(sortedCrew || sortedCast) && (
        <div className="absolute top-0 left-0 right-0 z-0 h-96">
          <ImageFader
            isDarker
            backgroundImages={[...(sortedCast ?? []), ...(sortedCrew ?? [])]
              .filter((media) => media.backdropPath)
              .map(
                (media) =>
                  `https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${media.backdropPath}`
              )
              .slice(0, 6)}
          />
        </div>
      )}
      <div
        className={`relative z-10 mt-4 mb-8 flex flex-col items-center lg:flex-row ${
          data.biography ? 'lg:items-start' : ''
        }`}
      >
        {data.profilePath && (
          <div className="relative mb-6 mr-0 h-36 w-36 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-gray-700 lg:mb-0 lg:mr-6 lg:h-44 lg:w-44">
            <CachedImage
              src={`https://image.tmdb.org/t/p/w600_and_h900_bestv2${data.profilePath}`}
              alt=""
              layout="fill"
              objectFit="cover"
            />
          </div>
        )}
        <div className="text-center text-gray-300 lg:text-left">
          <h1 className="text-3xl text-white lg:text-4xl">{data.name}</h1>
          <div className="mt-1 mb-2 space-y-1 text-xs text-white sm:text-sm lg:text-base">
            <div>{personAttributes.join(' | ')}</div>
            {(data.alsoKnownAs ?? []).length > 0 && (
              <div>
                {intl.formatMessage(messages.alsoknownas, {
                  names: (data.alsoKnownAs ?? []).reduce((prev, curr) =>
                    intl.formatMessage(globalMessages.delimitedlist, {
                      a: prev,
                      b: curr,
                    })
                  ),
                })}
              </div>
            )}
          </div>
          {data.biography && (
            <div className="relative text-left">
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
              <div
                className="group outline-none ring-0"
                onClick={() => setShowBio((show) => !show)}
                role="button"
                tabIndex={-1}
              >
                <TruncateMarkup
                  lines={showBio ? 200 : 6}
                  ellipsis={
                    <Ellipsis className="relative -top-0.5 ml-2 inline-block opacity-70 transition duration-300 group-hover:opacity-100" />
                  }
                >
                  <p className="pt-2 text-sm lg:text-base">{data.biography}</p>
                </TruncateMarkup>
              </div>
            </div>
          )}
        </div>
      </div>
      {data.knownForDepartment === 'Acting' ? [cast, crew] : [crew, cast]}
      {isLoading && <LoadingSpinner />}
    </>
  );
};

export default PersonDetails;
