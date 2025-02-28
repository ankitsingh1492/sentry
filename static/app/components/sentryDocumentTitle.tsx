import * as React from 'react';
import DocumentTitle from 'react-document-title';

type Props = {
  /**
   * This string will be shown at the very front of the title
   */
  title?: string;
  /**
   * The organization slug to show in the title
   */
  orgSlug?: string;
  /**
   * The project slug to show in the title.
   */
  projectSlug?: string;
  /**
   * Should the ` - Sentry` suffix be excluded?
   */
  noSuffix?: boolean;

  children?: React.ReactChild;
};

/**
 * Assigns the document title. The deepest nested version of this title will be
 * the one which is assigned.
 */
function SentryDocumentTitle({
  title = '',
  orgSlug,
  projectSlug,
  noSuffix,
  children,
}: Props) {
  function getPageTitle() {
    if (orgSlug && projectSlug) {
      return `${title} - ${orgSlug} - ${projectSlug}`;
    }

    if (orgSlug) {
      return `${title} - ${orgSlug}`;
    }

    if (projectSlug) {
      return `${title} - ${projectSlug}`;
    }

    return title;
  }

  const pageTitle = getPageTitle();

  const documentTitle = noSuffix
    ? pageTitle
    : pageTitle !== ''
    ? `${pageTitle} - Sentry`
    : 'Sentry';

  return <DocumentTitle title={documentTitle}>{children}</DocumentTitle>;
}

export default SentryDocumentTitle;
