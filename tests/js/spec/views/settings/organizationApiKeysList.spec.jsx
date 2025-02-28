import {mountWithTheme} from 'sentry-test/enzyme';
import {mountGlobalModal} from 'sentry-test/modal';

import OrganizationApiKeysList from 'sentry/views/settings/organizationApiKeys/organizationApiKeysList';

jest.unmock('sentry/utils/recreateRoute');

const routes = [
  {path: '/'},
  {path: '/:orgId/'},
  {path: '/organizations/:orgId/'},
  {path: 'api-keys/', name: 'API Key'},
];

describe('OrganizationApiKeysList', function () {
  beforeEach(function () {});

  it('renders', function () {
    const wrapper = mountWithTheme(
      <OrganizationApiKeysList
        params={{orgId: 'org-slug'}}
        routes={routes}
        keys={[TestStubs.ApiKey()]}
      />,
      TestStubs.routerContext()
    );
    expect(wrapper).toSnapshot();
  });

  it('opens a modal when trying to delete a key', async function () {
    const wrapper = mountWithTheme(
      <OrganizationApiKeysList
        params={{orgId: 'org-slug'}}
        routes={routes}
        keys={[TestStubs.ApiKey()]}
      />,
      TestStubs.routerContext()
    );

    wrapper.update();
    // Click remove button
    wrapper.find('ForwardRef(IconDelete)').simulate('click');
    wrapper.update();

    // expect a modal
    const modal = await mountGlobalModal();
    expect(modal.find('GlobalModal[visible=true]').exists()).toBe(true);
  });
});
