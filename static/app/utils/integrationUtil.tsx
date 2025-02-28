import capitalize from 'lodash/capitalize';
import * as qs from 'query-string';

import {
  IconBitbucket,
  IconGeneric,
  IconGithub,
  IconGitlab,
  IconJira,
  IconVsts,
} from 'sentry/icons';
import {t} from 'sentry/locale';
import HookStore from 'sentry/stores/hookStore';
import {
  AppOrProviderOrPlugin,
  DocumentIntegration,
  Integration,
  IntegrationFeature,
  IntegrationInstallationStatus,
  IntegrationType,
  Organization,
  PluginWithProjectList,
  SentryApp,
  SentryAppInstallation,
} from 'sentry/types';
import {Hooks} from 'sentry/types/hooks';
import {
  integrationEventMap,
  IntegrationEventParameters,
} from 'sentry/utils/analytics/integrationAnalyticsEvents';
import makeAnalyticsFunction from 'sentry/utils/analytics/makeAnalyticsFunction';

const mapIntegrationParams = analyticsParams => {
  // Reload expects integration_status even though it's not relevant for non-sentry apps
  // Passing in a dummy value of published in those cases
  const fullParams = {...analyticsParams};
  if (analyticsParams.integration && analyticsParams.integration_type !== 'sentry_app') {
    fullParams.integration_status = 'published';
  }
  return fullParams;
};

export const trackIntegrationAnalytics = makeAnalyticsFunction<
  IntegrationEventParameters,
  {organization: Organization} // org is required
>(integrationEventMap, {
  mapValuesFn: mapIntegrationParams,
});

/**
 * In sentry.io the features list supports rendering plan details. If the hook
 * is not registered for rendering the features list like this simply show the
 * features as a normal list.
 */
const generateFeaturesList = p => (
  <ul>
    {p.features.map((f, i) => (
      <li key={i}>{f.description}</li>
    ))}
  </ul>
);

const generateIntegrationFeatures = p =>
  p.children({
    disabled: false,
    disabledReason: null,
    ungatedFeatures: p.features,
    gatedFeatureGroups: [],
  });

const defaultFeatureGateComponents = {
  IntegrationFeatures: generateIntegrationFeatures,
  IntegrationDirectoryFeatures: generateIntegrationFeatures,
  FeatureList: generateFeaturesList,
  IntegrationDirectoryFeatureList: generateFeaturesList,
} as ReturnType<Hooks['integrations:feature-gates']>;

export const getIntegrationFeatureGate = () => {
  const defaultHook = () => defaultFeatureGateComponents;
  const featureHook = HookStore.get('integrations:feature-gates')[0] || defaultHook;
  return featureHook();
};

export const getSentryAppInstallStatus = (install: SentryAppInstallation | undefined) => {
  if (install) {
    return capitalize(install.status) as IntegrationInstallationStatus;
  }
  return 'Not Installed';
};

export const getCategories = (features: IntegrationFeature[]): string[] => {
  const transform = features.map(({featureGate}) => {
    const feature = featureGate
      .replace(/integrations/g, '')
      .replace(/-/g, ' ')
      .trim();
    switch (feature) {
      case 'actionable notification':
        return 'notification action';
      case 'issue basic':
      case 'issue link':
      case 'issue sync':
        return 'project management';
      case 'commits':
        return 'source code management';
      case 'chat unfurl':
        return 'chat';
      default:
        return feature;
    }
  });

  return [...new Set(transform)];
};

export const getCategoriesForIntegration = (
  integration: AppOrProviderOrPlugin
): string[] => {
  if (isSentryApp(integration)) {
    return ['internal', 'unpublished'].includes(integration.status)
      ? [integration.status]
      : getCategories(integration.featureData);
  }
  if (isPlugin(integration)) {
    return getCategories(integration.featureDescriptions);
  }
  if (isDocumentIntegration(integration)) {
    return getCategories(integration.features);
  }
  return getCategories(integration.metadata.features);
};

export function isSentryApp(
  integration: AppOrProviderOrPlugin
): integration is SentryApp {
  return !!(integration as SentryApp).uuid;
}

export function isPlugin(
  integration: AppOrProviderOrPlugin
): integration is PluginWithProjectList {
  return integration.hasOwnProperty('shortName');
}

export function isDocumentIntegration(
  integration: AppOrProviderOrPlugin
): integration is DocumentIntegration {
  return integration.hasOwnProperty('docUrl');
}

export const getIntegrationType = (
  integration: AppOrProviderOrPlugin
): IntegrationType => {
  if (isSentryApp(integration)) {
    return 'sentry_app';
  }
  if (isPlugin(integration)) {
    return 'plugin';
  }
  if (isDocumentIntegration(integration)) {
    return 'document';
  }
  return 'first_party';
};

export const convertIntegrationTypeToSnakeCase = (
  type: 'plugin' | 'firstParty' | 'sentryApp' | 'documentIntegration'
) => {
  switch (type) {
    case 'firstParty':
      return 'first_party';
    case 'sentryApp':
      return 'sentry_app';
    case 'documentIntegration':
      return 'document';
    default:
      return type;
  }
};

export const safeGetQsParam = (param: string) => {
  try {
    const query = qs.parse(window.location.search) || {};
    return query[param];
  } catch {
    return undefined;
  }
};

export const getIntegrationIcon = (integrationType?: string, size?: string) => {
  const iconSize = size || 'md';
  switch (integrationType) {
    case 'bitbucket':
      return <IconBitbucket size={iconSize} />;
    case 'gitlab':
      return <IconGitlab size={iconSize} />;
    case 'github':
    case 'github_enterprise':
      return <IconGithub size={iconSize} />;
    case 'jira':
    case 'jira_server':
      return <IconJira size={iconSize} />;
    case 'vsts':
      return <IconVsts size={iconSize} />;
    default:
      return <IconGeneric size={iconSize} />;
  }
};

// used for project creation and onboarding
// determines what integration maps to what project platform
export const platformToIntegrationMap = {
  'node-awslambda': 'aws_lambda',
  'python-awslambda': 'aws_lambda',
};

export const isSlackIntegrationUpToDate = (integrations: Integration[]): boolean => {
  return integrations.every(
    integration =>
      integration.provider.key !== 'slack' || integration.scopes?.includes('commands')
  );
};

export const getAlertText = (integrations?: Integration[]): string | undefined => {
  return isSlackIntegrationUpToDate(integrations || [])
    ? undefined
    : t(
        'Update to the latest version of our Slack app to get access to personal and team notifications.'
      );
};
