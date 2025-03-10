import {Location} from 'history';
import identity from 'lodash/identity';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import pickBy from 'lodash/pickBy';

import {DATE_TIME_KEYS, LOCAL_STORAGE_KEY, URL_PARAM} from 'sentry/constants/pageFilters';
import {GlobalSelection} from 'sentry/types';
import {defined} from 'sentry/utils';
import {getUtcToLocalDateObject} from 'sentry/utils/dates';
import localStorage from 'sentry/utils/localStorage';

import {getParams} from './getParams';

const DEFAULT_PARAMS = getParams({});

// Parses URL query parameters for values relevant to global selection header
type GetStateFromQueryOptions = {
  allowEmptyPeriod?: boolean;
  allowAbsoluteDatetime?: boolean;
};

export function getStateFromQuery(
  query: Location['query'],
  {allowEmptyPeriod = false, allowAbsoluteDatetime = true}: GetStateFromQueryOptions = {}
) {
  const parsedParams = getParams(query, {allowEmptyPeriod, allowAbsoluteDatetime});

  const projectFromQuery = query[URL_PARAM.PROJECT];
  const environmentFromQuery = query[URL_PARAM.ENVIRONMENT];
  const period = parsedParams.statsPeriod;
  const utc = parsedParams.utc;

  const hasAbsolute = allowAbsoluteDatetime && !!parsedParams.start && !!parsedParams.end;

  let project: number[] | null | undefined;
  if (defined(projectFromQuery) && Array.isArray(projectFromQuery)) {
    project = projectFromQuery.map(p => parseInt(p, 10));
  } else if (defined(projectFromQuery)) {
    const projectFromQueryIdInt = parseInt(projectFromQuery, 10);
    project = isNaN(projectFromQueryIdInt) ? [] : [projectFromQueryIdInt];
  } else {
    project = projectFromQuery;
  }

  const environment =
    defined(environmentFromQuery) && !Array.isArray(environmentFromQuery)
      ? [environmentFromQuery]
      : environmentFromQuery;

  const start = hasAbsolute ? getUtcToLocalDateObject(parsedParams.start) : null;
  const end = hasAbsolute ? getUtcToLocalDateObject(parsedParams.end) : null;

  return {
    project,
    environment,
    period: period || null,
    start: start || null,
    end: end || null,
    // params from URL will be a string
    utc: typeof utc !== 'undefined' ? utc === 'true' : null,
  };
}

/**
 * Extract the global selection parameters from an object
 * Useful for extracting global selection properties from the current URL
 * when building another URL.
 */
export function extractSelectionParameters(query) {
  return pickBy(pick(query, Object.values(URL_PARAM)), identity);
}

/**
 * Extract the global selection datetime parameters from an object.
 */
export function extractDatetimeSelectionParameters(query) {
  return pickBy(pick(query, Object.values(DATE_TIME_KEYS)), identity);
}

export function getDefaultSelection(): GlobalSelection {
  const utc = DEFAULT_PARAMS.utc;
  return {
    projects: [],
    environments: [],
    datetime: {
      start: DEFAULT_PARAMS.start || null,
      end: DEFAULT_PARAMS.end || null,
      period: DEFAULT_PARAMS.statsPeriod || '',
      utc: typeof utc !== 'undefined' ? utc === 'true' : null,
    },
  };
}

/**
 * Compare the non-utc values of two selections.
 * Useful when re-fetching data based on globalselection changing.
 *
 * utc is not compared as there is a problem somewhere in the selection
 * data flow that results in it being undefined | null | boolean instead of null | boolean.
 * The additional undefined state makes this function just as unreliable as isEqual(selection, other)
 */
export function isSelectionEqual(
  selection: GlobalSelection,
  other: GlobalSelection
): boolean {
  if (
    !isEqual(selection.projects, other.projects) ||
    !isEqual(selection.environments, other.environments)
  ) {
    return false;
  }

  // Use string comparison as we aren't interested in the identity of the datetimes.
  if (
    selection.datetime.period !== other.datetime.period ||
    selection.datetime.start?.toString() !== other.datetime.start?.toString() ||
    selection.datetime.end?.toString() !== other.datetime.end?.toString()
  ) {
    return false;
  }

  return true;
}

/**
 * Removes globalselection from localstorage
 */
export function removeGlobalSelectionStorage(orgId: string) {
  const localStorageKey = `${LOCAL_STORAGE_KEY}:${orgId}`;
  localStorage.removeItem(localStorageKey);
}
