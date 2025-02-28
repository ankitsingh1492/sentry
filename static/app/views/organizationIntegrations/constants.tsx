import {DocumentIntegration} from 'sentry/types';

export const INSTALLED = 'Installed' as const;
export const NOT_INSTALLED = 'Not Installed' as const;
export const PENDING = 'Pending' as const;
export const DISABLED = 'Disabled' as const;
export const LEARN_MORE = 'Learn More' as const;

export const COLORS = {
  [INSTALLED]: 'success',
  [NOT_INSTALLED]: 'gray300',
  [DISABLED]: 'gray300',
  [PENDING]: 'pink300',
  [LEARN_MORE]: 'gray300',
} as const;

/**
 * Integrations in the integration directory should be sorted by their popularity (weight).
 * The weights should reflect the relative popularity of each integration are hardcoded, except for
 * Sentry-apps which read popularity from the db.
 */

export const POPULARITY_WEIGHT: {
  [key: string]: number;
} = {
  // First-party-integrations
  slack: 50,
  github: 20,
  jira: 10,
  bitbucket: 10,
  gitlab: 10,
  pagerduty: 10,
  vsts: 10,
  jira_server: 10,
  bitbucket_server: 10,
  github_enterprise: 10,
  vercel: 10,
  msteams: 10,
  aws_lambda: 10,

  // Plugins
  webhooks: 10,
  asana: 8,
  trello: 8,
  heroku: 8,
  pivotal: 8,
  twilio: 8,
  pushover: 5,
  redmine: 5,
  phabricator: 5,
  opsgenie: 5,
  victorops: 5,
  sessionstack: 5,
  segment: 2,
  'amazon-sqs': 2,
  splunk: 2,

  // doc integrations
  fullstory: 8,
  datadog: 8,
  netlify: 8,
  asayer: 8,
  rocketchat: 8,
  bitbucket_pipelines: 8,
  github_actions: 8,
  grafana: 10,
  insight_finder: 8,
  octohook: 8,
} as const;

export const documentIntegrationList: DocumentIntegration[] = [
  {
    slug: 'fullstory',
    name: 'FullStory',
    author: 'The Sentry Team',
    docUrl: 'https://www.npmjs.com/package/@sentry/fullstory',
    description:
      'The Sentry-FullStory integration seamlessly integrates the Sentry and FullStory platforms. When you look at a browser error in Sentry, you will see a link to the FullStory session replay at that exact moment in time. When you are watching a FullStory replay and your user experiences an error, you will see a link that will take you to that error in Sentry.',
    features: [
      {
        featureGate: 'session-replay',
        description:
          'Links Sentry errors to the FullStory session replay and vice-versa.',
      },
    ],
    resourceLinks: [
      {
        title: 'Documentation',
        url: 'https://www.npmjs.com/package/@sentry/fullstory',
      },
      {title: 'View Source', url: 'https://github.com/getsentry/sentry-fullstory'},
      {
        title: 'Report Issue',
        url: 'https://github.com/getsentry/sentry-fullstory/issues',
      },
    ],
  },
  {
    slug: 'datadog',
    name: 'Datadog',
    author: 'Datadog',
    docUrl: 'https://docs.datadoghq.com/integrations/sentry/',
    description:
      'Quickly discover relationships between production apps and systems performance. See correlations between Sentry events and metrics from infra services like AWS, Elasticsearch, Docker, and Kafka can save time detecting sources of future spikes.',
    features: [
      {
        featureGate: 'incident-management',
        description:
          'Manage incidents and outages by sending Sentry notifications to DataDog.',
      },
      {
        featureGate: 'alert-rule',
        description:
          'Configure Sentry rules to trigger notifications based on conditions you set through the Sentry webhook integration.',
      },
    ],
    resourceLinks: [
      {title: 'Documentation', url: 'https://docs.datadoghq.com/integrations/sentry/'},
    ],
  },
  {
    slug: 'asayer',
    name: 'Asayer',
    author: 'The Sentry Team',
    docUrl: 'https://docs.asayer.io/integrations/sentry',
    description:
      'Asayer is a session replay tool for developers. Replay each user session alongside your front/backend logs and other data spread across your stack so you can immediately find, reproduce and fix bugs faster.',
    features: [
      {
        featureGate: 'session-replay',
        description:
          'By integrating Sentry with Asayer, you can see the moments that precede and that lead up to each problem. You can sync your Sentry logs alongside your session replay, JS console and network activity to gain complete visibility over every issue that affect your users.',
      },
    ],
    resourceLinks: [
      {title: 'Documentation', url: 'https://docs.asayer.io/integrations/sentry'},
    ],
  },
  {
    slug: 'rocketchat',
    name: 'Rocket.Chat',
    author: 'Rocket.Chat',
    docUrl: 'https://rocket.chat/docs/administrator-guides/integrations/sentry/',
    description:
      'Rocket.Chat is a free and open-source team chat collaboration platform that allows users to communicate securely in real-time across devices on the web, desktop or mobile and to customize their interface with a range of plugins, themes, and integrations with other key software.',
    features: [
      {
        featureGate: 'chat',
        description: 'Get Sentry notifications in Rocket.Chat.',
      },
      {
        featureGate: 'alert-rule',
        description:
          'Configure Sentry rules to trigger notifications based on conditions you set through the Sentry webhook integration.',
      },
    ],
    resourceLinks: [
      {
        title: 'Documentation',
        url: 'https://rocket.chat/docs/administrator-guides/integrations/sentry/',
      },
    ],
  },
  {
    slug: 'netlify',
    name: 'Netlify',
    author: 'The Sentry Team',
    docUrl: 'https://www.npmjs.com/package/@sentry/netlify-build-plugin',
    description:
      'The Sentry Netlify build plugin automatically uploads source maps and notifies Sentry of new releases being deployed to your site after it finishes building in Netlify.',
    features: [
      {
        featureGate: 'release-management',
        description: 'Notify Sentry of new releases being deployed.',
      },
    ],
    resourceLinks: [
      {
        title: 'Documentation',
        url: 'https://www.npmjs.com/package/@sentry/netlify-build-plugin',
      },
      {
        title: 'View Source',
        url: 'https://github.com/getsentry/sentry-netlify-build-plugin',
      },
      {
        title: 'Report Issue',
        url: 'https://github.com/getsentry/sentry-netlify-build-plugin/issues',
      },
    ],
  },
  {
    slug: 'bitbucket_pipelines',
    name: 'Bitbucket Pipelines',
    author: 'The Sentry Team',
    docUrl:
      'https://bitbucket.org/product/features/pipelines/integrations?p=sentryio/sentry-new-release',
    description:
      'Notify Sentry of any Bitbucket Pipelines builds to automatically manage releases and quickly surface any errors associated with a given build.\n\n**Requirement:** Bitbucket source code integration must be installed for the release pipe to work.',
    features: [
      {
        featureGate: 'release-management',
        description: 'Notify Sentry of new releases being deployed.',
      },
    ],
    resourceLinks: [
      {
        title: 'View Source',
        url: 'https://bitbucket.org/sentryio/sentry-new-release/src/master/',
      },
      {
        title: 'Report Issue',
        url: 'https://bitbucket.org/sentryio/sentry-new-release/issues',
      },
    ],
  },
  {
    slug: 'github_actions',
    name: 'GitHub Actions',
    author: 'The Sentry Team',
    docUrl: 'https://github.com/marketplace/actions/sentry-release',
    description:
      "The Sentry Release GitHub Action automatically notifies Sentry of new releases being deployed. After sending Sentry release information, you'll be able to identify suspect commits that are likely the culprit for new errors. You'll also be able to apply source maps to see the original code in Sentry.\n\n**Requirement:** GitHub source code integration must be installed and configured for the Sentry Release GitHub Action to work.",
    features: [
      {
        featureGate: 'release-management',
        description: 'Notify Sentry of new releases being deployed.',
      },
    ],
    resourceLinks: [
      {
        title: 'View Source',
        url: 'https://github.com/getsentry/action-release',
      },
      {
        title: 'Report Issue',
        url: 'https://github.com/getsentry/action-release/issues',
      },
    ],
  },
  {
    slug: 'grafana',
    name: 'Grafana',
    author: 'Grafana',
    docUrl: 'https://grafana.com/grafana/plugins/grafana-sentry-datasource/',
    description:
      'The Sentry Grafana data source plugin allows you to query and visualize Sentry data within Grafana.',
    features: [
      {
        featureGate: 'visualization',
        description: 'Query and visualize Sentry data in Grafana',
      },
    ],
    resourceLinks: [
      {
        title: 'Documentation',
        url: 'https://grafana.com/grafana/plugins/grafana-sentry-datasource/',
      },
    ],
  },
  {
    slug: 'insightfinder',
    name: 'InsightFinder',
    author: 'InsightFinder',
    docUrl: 'https://insightfinder.com/insightfinder-sentry-integration/',
    description:
      'InsightFinder ingests the errors that Sentry detects through its standard APIs and analyzes them using its patented, unsupervised, neural network algorithms. InsightFinder prioritizes those errors and provides context so anomalous events can be resolved before business is impacted.',
    features: [
      {
        featureGate: 'webhook',
        description: 'Forward Sentry events to InsightFinder.',
      },
    ],
    resourceLinks: [
      {
        title: 'Documentation',
        url: 'https://insightfinder.com/insightfinder-sentry-integration/',
      },
    ],
  },
  {
    slug: 'octohook',
    name: 'Octohook',
    author: 'Octohook',
    docUrl: 'https://docs.octohook.com/integrations/sentry.html',
    description:
      'Octohook is a platform that lets you visualize, debug and redistribute your webhooks.',
    features: [
      {
        featureGate: 'webhook',
        description: 'Record, forward or transform Sentry webhooks to other services.',
      },
      {
        featureGate: 'alert-rule',
        description:
          'Configure Sentry rules to trigger notifications based on conditions you set, through internal integrations.',
      },
    ],
    resourceLinks: [
      {title: 'Documentation', url: 'https://docs.octohook.com/integrations/sentry.html'},
    ],
  },
];

export const documentIntegrations: {
  [key: string]: DocumentIntegration;
} = Object.fromEntries(
  documentIntegrationList.map(integration => [integration.slug, integration])
);
