import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import type { FilterOptions } from '@app/components/Discover/constants';
import { prepareFilterValues } from '@app/components/Discover/constants';
import useDiscover from '@app/hooks/useDiscover';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import { BarsArrowDownIcon } from '@heroicons/react/24/solid';
import type { SortOptions as TMDBSortOptions } from '@server/api/themoviedb';
import type { ProductionCompany } from '@server/models/common';
import type { MovieResult } from '@server/models/Search';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  studioMovies: '{studio} Movies',
  sortPopularityAsc: 'Popularity Ascending',
  sortPopularityDesc: 'Popularity Descending',
  sortReleaseDateAsc: 'Release Date Ascending',
  sortReleaseDateDesc: 'Release Date Descending',
  sortTmdbRatingAsc: 'TMDB Rating Ascending',
  sortTmdbRatingDesc: 'TMDB Rating Descending',
  sortTitleAsc: 'Title (A-Z) Ascending',
  sortTitleDesc: 'Title (Z-A) Descending',
});

const StudioSortOptions: Record<string, TMDBSortOptions> = {
  PopularityAsc: 'popularity.asc',
  PopularityDesc: 'popularity.desc',
  ReleaseDateAsc: 'release_date.asc',
  ReleaseDateDesc: 'release_date.desc',
  TmdbRatingAsc: 'vote_average.asc',
  TmdbRatingDesc: 'vote_average.desc',
  TitleAsc: 'original_title.asc',
  TitleDesc: 'original_title.desc',
};

const DiscoverMovieStudio = () => {
  const router = useRouter();
  const intl = useIntl();
  const updateQueryParams = useUpdateQueryParams({});

  const preparedFilters = prepareFilterValues(router.query);

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
    firstResultData,
  } = useDiscover<MovieResult, { studio: ProductionCompany }, FilterOptions>(
    `/api/v1/discover/movies/studio/${router.query.studioId}`,
    {
      sortBy: preparedFilters.sortBy || StudioSortOptions.PopularityDesc,
    },
    { hideAvailable: true }
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = isLoadingInitialData
    ? intl.formatMessage(globalMessages.loading)
    : intl.formatMessage(messages.studioMovies, {
        studio: firstResultData?.studio.name,
      });

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header>
          {firstResultData?.studio.logoPath ? (
            <div className="mb-6 flex justify-center">
              <img
                src={`//image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)${firstResultData.studio.logoPath}`}
                alt={firstResultData.studio.name}
                className="max-h-24 sm:max-h-32"
              />
            </div>
          ) : (
            title
          )}
        </Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
              <BarsArrowDownIcon className="h-6 w-6" />
            </span>
            <select
              id="sortBy"
              name="sortBy"
              className="rounded-r-only"
              value={preparedFilters.sortBy || StudioSortOptions.PopularityDesc}
              onChange={(e) => updateQueryParams('sortBy', e.target.value)}
            >
              <option value={StudioSortOptions.PopularityDesc}>
                {intl.formatMessage(messages.sortPopularityDesc)}
              </option>
              <option value={StudioSortOptions.PopularityAsc}>
                {intl.formatMessage(messages.sortPopularityAsc)}
              </option>
              <option value={StudioSortOptions.ReleaseDateDesc}>
                {intl.formatMessage(messages.sortReleaseDateDesc)}
              </option>
              <option value={StudioSortOptions.ReleaseDateAsc}>
                {intl.formatMessage(messages.sortReleaseDateAsc)}
              </option>
              <option value={StudioSortOptions.TmdbRatingDesc}>
                {intl.formatMessage(messages.sortTmdbRatingDesc)}
              </option>
              <option value={StudioSortOptions.TmdbRatingAsc}>
                {intl.formatMessage(messages.sortTmdbRatingAsc)}
              </option>
              <option value={StudioSortOptions.TitleAsc}>
                {intl.formatMessage(messages.sortTitleAsc)}
              </option>
              <option value={StudioSortOptions.TitleDesc}>
                {intl.formatMessage(messages.sortTitleDesc)}
              </option>
            </select>
          </div>
        </div>
      </div>
      <ListView
        items={titles}
        isEmpty={isEmpty}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        isReachingEnd={isReachingEnd}
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverMovieStudio;
