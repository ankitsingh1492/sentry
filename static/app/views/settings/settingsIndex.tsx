import * as React from 'react';
import {RouteComponentProps} from 'react-router';
import {css} from '@emotion/react';
import styled from '@emotion/styled';
import omit from 'lodash/omit';

import {fetchOrganizationDetails} from 'sentry/actionCreators/organizations';
import DemoModeGate from 'sentry/components/acl/demoModeGate';
import OrganizationAvatar from 'sentry/components/avatar/organizationAvatar';
import UserAvatar from 'sentry/components/avatar/userAvatar';
import ExternalLink from 'sentry/components/links/externalLink';
import Link from 'sentry/components/links/link';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {Panel, PanelBody, PanelHeader} from 'sentry/components/panels';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {IconDocs, IconLock, IconStack, IconSupport} from 'sentry/icons';
import {t} from 'sentry/locale';
import ConfigStore from 'sentry/stores/configStore';
import overflowEllipsis from 'sentry/styles/overflowEllipsis';
import {Organization} from 'sentry/types';
import withLatestContext from 'sentry/utils/withLatestContext';
import SettingsLayout from 'sentry/views/settings/components/settingsLayout';

const LINKS = {
  DOCUMENTATION: 'https://docs.sentry.io/',
  DOCUMENTATION_PLATFORMS: 'https://docs.sentry.io/clients/',
  DOCUMENTATION_QUICKSTART: 'https://docs.sentry.io/platform-redirect/?next=/',
  DOCUMENTATION_CLI: 'https://docs.sentry.io/product/cli/',
  DOCUMENTATION_API: 'https://docs.sentry.io/api/',
  API: '/settings/account/api/',
  MANAGE: '/manage/',
  FORUM: 'https://forum.sentry.io/',
  GITHUB_ISSUES: 'https://github.com/getsentry/sentry/issues',
  SERVICE_STATUS: 'https://status.sentry.io/',
};

const HOME_ICON_SIZE = 56;

const flexCenter = css`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

type Props = {
  organization: Organization;
} & RouteComponentProps<{}, {}>;

class SettingsIndex extends React.Component<Props> {
  componentDidUpdate(prevProps: Props) {
    const {organization} = this.props;
    if (prevProps.organization === organization) {
      return;
    }

    // if there is no org in context, SidebarDropdown uses an org from `withLatestContext`
    // (which queries the org index endpoint instead of org details)
    // and does not have `access` info
    if (organization && typeof organization.access === 'undefined') {
      fetchOrganizationDetails(organization.slug, {
        setActive: true,
        loadProjects: true,
      });
    }
  }

  render() {
    const {organization} = this.props;
    const user = ConfigStore.get('user');
    const isOnPremise = ConfigStore.get('isOnPremise');

    const organizationSettingsUrl =
      (organization && `/settings/${organization.slug}/`) || '';

    const supportLinkProps = {
      isOnPremise,
      href: LINKS.FORUM,
      to: `${organizationSettingsUrl}support`,
    };
    const supportText = isOnPremise ? t('Community Forums') : t('Contact Support');

    return (
      <SentryDocumentTitle
        title={organization ? `${organization.slug} Settings` : 'Settings'}
      >
        <SettingsLayout {...this.props}>
          <GridLayout>
            <DemoModeGate>
              <GridPanel>
                <HomePanelHeader>
                  <HomeLinkIcon to="/settings/account/">
                    <AvatarContainer>
                      <UserAvatar user={user} size={HOME_ICON_SIZE} />
                    </AvatarContainer>
                    {t('My Account')}
                  </HomeLinkIcon>
                </HomePanelHeader>

                <HomePanelBody>
                  <h3>{t('Quick links')}:</h3>
                  <ul>
                    <li>
                      <HomeLink to="/settings/account/security/">
                        {t('Change my password')}
                      </HomeLink>
                    </li>
                    <li>
                      <HomeLink to="/settings/account/notifications/">
                        {t('Notification Preferences')}
                      </HomeLink>
                    </li>
                    <li>
                      <HomeLink to="/settings/account/">{t('Change my avatar')}</HomeLink>
                    </li>
                  </ul>
                </HomePanelBody>
              </GridPanel>
            </DemoModeGate>

            {/* if admin */}
            <GridPanel>
              {!organization && <LoadingIndicator overlay hideSpinner />}
              <HomePanelHeader>
                <HomeLinkIcon to={organizationSettingsUrl}>
                  {organization ? (
                    <AvatarContainer>
                      <OrganizationAvatar
                        organization={organization}
                        size={HOME_ICON_SIZE}
                      />
                    </AvatarContainer>
                  ) : (
                    <HomeIcon color="green300">
                      <IconStack size="lg" />
                    </HomeIcon>
                  )}
                  <OrganizationName>
                    {organization ? organization.slug : t('No Organization')}
                  </OrganizationName>
                </HomeLinkIcon>
              </HomePanelHeader>
              <HomePanelBody>
                <h3>{t('Quick links')}:</h3>
                <ul>
                  <li>
                    <HomeLink to={`${organizationSettingsUrl}projects/`}>
                      {t('Projects')}
                    </HomeLink>
                  </li>
                  <li>
                    <HomeLink to={`${organizationSettingsUrl}teams/`}>
                      {t('Teams')}
                    </HomeLink>
                  </li>
                  <li>
                    <HomeLink to={`${organizationSettingsUrl}members/`}>
                      {t('Members')}
                    </HomeLink>
                  </li>
                </ul>
              </HomePanelBody>
            </GridPanel>

            <GridPanel>
              <HomePanelHeader>
                <ExternalHomeLink isCentered href={LINKS.DOCUMENTATION}>
                  <HomeIcon color="pink300">
                    <IconDocs size="lg" />
                  </HomeIcon>
                </ExternalHomeLink>
                <ExternalHomeLink href={LINKS.DOCUMENTATION}>
                  {t('Documentation')}
                </ExternalHomeLink>
              </HomePanelHeader>

              <HomePanelBody>
                <h3>{t('Quick links')}:</h3>
                <ul>
                  <li>
                    <ExternalHomeLink href={LINKS.DOCUMENTATION_QUICKSTART}>
                      {t('Quickstart Guide')}
                    </ExternalHomeLink>
                  </li>
                  <li>
                    <ExternalHomeLink href={LINKS.DOCUMENTATION_PLATFORMS}>
                      {t('Platforms & Frameworks')}
                    </ExternalHomeLink>
                  </li>
                  <li>
                    <ExternalHomeLink href={LINKS.DOCUMENTATION_CLI}>
                      {t('Sentry CLI')}
                    </ExternalHomeLink>
                  </li>
                </ul>
              </HomePanelBody>
            </GridPanel>

            <GridPanel>
              <HomePanelHeader>
                <SupportLinkComponent isCentered {...supportLinkProps}>
                  <HomeIcon color="purple300">
                    <IconSupport size="lg" />
                  </HomeIcon>
                  {t('Support')}
                </SupportLinkComponent>
              </HomePanelHeader>

              <HomePanelBody>
                <h3>{t('Quick links')}:</h3>
                <ul>
                  <li>
                    <SupportLinkComponent {...supportLinkProps}>
                      {supportText}
                    </SupportLinkComponent>
                  </li>
                  <li>
                    <ExternalHomeLink href={LINKS.GITHUB_ISSUES}>
                      {t('Sentry on GitHub')}
                    </ExternalHomeLink>
                  </li>
                  <li>
                    <ExternalHomeLink href={LINKS.SERVICE_STATUS}>
                      {t('Service Status')}
                    </ExternalHomeLink>
                  </li>
                </ul>
              </HomePanelBody>
            </GridPanel>

            <DemoModeGate>
              <GridPanel>
                <HomePanelHeader>
                  <HomeLinkIcon to={LINKS.API}>
                    <HomeIcon>
                      <IconLock size="lg" />
                    </HomeIcon>
                    {t('API Keys')}
                  </HomeLinkIcon>
                </HomePanelHeader>

                <HomePanelBody>
                  <h3>{t('Quick links')}:</h3>
                  <ul>
                    <li>
                      <HomeLink to={LINKS.API}>{t('Auth Tokens')}</HomeLink>
                    </li>
                    <li>
                      <HomeLink to={`${organizationSettingsUrl}developer-settings/`}>
                        {t('Your Integrations')}
                      </HomeLink>
                    </li>
                    <li>
                      <ExternalHomeLink href={LINKS.DOCUMENTATION_API}>
                        {t('Documentation')}
                      </ExternalHomeLink>
                    </li>
                  </ul>
                </HomePanelBody>
              </GridPanel>
            </DemoModeGate>
          </GridLayout>
        </SettingsLayout>
      </SentryDocumentTitle>
    );
  }
}

export {SettingsIndex};
export default withLatestContext(SettingsIndex);

const HomePanelHeader = styled(PanelHeader)`
  background: ${p => p.theme.background};
  flex-direction: column;
  text-align: center;
  justify-content: center;
  font-size: 18px;
  text-transform: unset;
  padding: 35px 30px;
`;

const HomePanelBody = styled(PanelBody)`
  padding: 30px;

  h3 {
    font-size: 14px;
  }

  ul {
    margin: 0;
    li {
      line-height: 1.6;
      /* Bullet color */
      color: ${p => p.theme.gray200};
    }
  }
`;

const HomeIcon = styled('div')<{color?: string}>`
  background: ${p => p.theme[p.color || 'gray300']};
  color: ${p => p.theme.white};
  width: ${HOME_ICON_SIZE}px;
  height: ${HOME_ICON_SIZE}px;
  border-radius: ${HOME_ICON_SIZE}px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
`;

const HomeLink = styled(Link)`
  color: ${p => p.theme.purple300};

  &:hover {
    color: ${p => p.theme.purple300};
  }
`;

const HomeLinkIcon = styled(HomeLink)`
  overflow: hidden;
  width: 100%;
  ${flexCenter};
`;

type CenterableProps = {
  isCentered?: boolean;
};

const ExternalHomeLink = styled(
  (props: CenterableProps & React.ComponentPropsWithRef<typeof ExternalLink>) => (
    <ExternalLink {...omit(props, 'isCentered')} />
  )
)<CenterableProps>`
  color: ${p => p.theme.purple300};

  &:hover {
    color: ${p => p.theme.purple300};
  }

  ${p => p.isCentered && flexCenter};
`;

type SupportLinkProps<T extends boolean> = {
  isOnPremise: T;
  href: string;
  to: string;
  isCentered?: boolean;
} & React.ComponentPropsWithoutRef<
  T extends true ? typeof ExternalLink : typeof HomeLink
>;

const SupportLinkComponent = <T extends boolean>({
  isCentered,
  isOnPremise,
  href,
  to,
  ...props
}: SupportLinkProps<T>) =>
  isOnPremise ? (
    <ExternalHomeLink isCentered={isCentered} href={href} {...props} />
  ) : (
    <HomeLink to={to} {...props} />
  );

const AvatarContainer = styled('div')`
  margin-bottom: 20px;
`;

const OrganizationName = styled('div')`
  line-height: 1.1em;

  ${overflowEllipsis};
`;

const GridLayout = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 16px;
`;

const GridPanel = styled(Panel)`
  margin-bottom: 0;
`;
