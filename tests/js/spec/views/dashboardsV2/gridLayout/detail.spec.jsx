import {browserHistory} from 'react-router';

import {createListeners} from 'sentry-test/createListeners';
import {enforceActOnUseLegacyStoreHook, mountWithTheme} from 'sentry-test/enzyme';
import {initializeOrg} from 'sentry-test/initializeOrg';
import {mountGlobalModal} from 'sentry-test/modal';
import {act} from 'sentry-test/reactTestingLibrary';

import * as modals from 'sentry/actionCreators/modal';
import ProjectsStore from 'sentry/stores/projectsStore';
import {constructGridItemKey} from 'sentry/views/dashboardsV2/gridLayout/dashboard';
import {DashboardState} from 'sentry/views/dashboardsV2/types';
import * as types from 'sentry/views/dashboardsV2/types';
import ViewEditDashboard from 'sentry/views/dashboardsV2/view';

describe('Dashboards > Detail', function () {
  enforceActOnUseLegacyStoreHook();

  const organization = TestStubs.Organization({
    features: [
      'global-views',
      'dashboards-basic',
      'dashboards-edit',
      'discover-query',
      'dashboard-grid-layout',
    ],
  });
  const projects = [TestStubs.Project()];

  describe('prebuilt dashboards', function () {
    let wrapper;
    let initialData, mockVisit;

    beforeEach(function () {
      act(() => ProjectsStore.loadInitialData(projects));
      initialData = initializeOrg({organization});

      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/tags/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/projects/',
        body: [TestStubs.Project()],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/',
        body: [
          TestStubs.Dashboard([], {id: 'default-overview', title: 'Default'}),
          TestStubs.Dashboard([], {id: '1', title: 'Custom Errors'}),
        ],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/default-overview/',
        body: TestStubs.Dashboard([], {id: 'default-overview', title: 'Default'}),
      });
      mockVisit = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/visit/',
        method: 'POST',
        body: [],
        statusCode: 200,
      });
    });

    afterEach(function () {
      MockApiClient.clearMockResponses();
      if (wrapper) {
        wrapper.unmount();
      }
    });

    it('can delete', async function () {
      const deleteMock = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/default-overview/',
        method: 'DELETE',
      });
      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: 'default-overview'}}
          router={initialData.router}
          location={location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Enter edit mode.
      wrapper.find('Controls Button[data-test-id="dashboard-edit"]').simulate('click');

      const modal = await mountGlobalModal();

      // Click delete, confirm will show
      wrapper.find('Controls Button[data-test-id="dashboard-delete"]').simulate('click');
      await tick();

      await modal.update();

      // Click confirm
      modal.find('button[aria-label="Confirm"]').simulate('click');

      expect(deleteMock).toHaveBeenCalled();
    });

    it('can rename and save', async function () {
      const fireEvent = createListeners('window');

      const updateMock = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/default-overview/',
        method: 'PUT',
        body: TestStubs.Dashboard([], {id: '8', title: 'Updated prebuilt'}),
      });
      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: 'default-overview'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Enter edit mode.
      wrapper.find('Controls Button[data-test-id="dashboard-edit"]').simulate('click');

      // Rename
      const dashboardTitle = wrapper.find('DashboardTitle Label');
      dashboardTitle.simulate('click');

      wrapper.find('StyledInput').simulate('change', {
        target: {innerText: 'Updated prebuilt', value: 'Updated prebuilt'},
      });

      act(() => {
        // Press enter
        fireEvent.keyDown('Enter');
      });

      wrapper.find('Controls Button[data-test-id="dashboard-commit"]').simulate('click');
      await tick();

      expect(updateMock).toHaveBeenCalledWith(
        '/organizations/org-slug/dashboards/default-overview/',
        expect.objectContaining({
          data: expect.objectContaining({title: 'Updated prebuilt'}),
        })
      );
      // Should redirect to the new dashboard.
      expect(browserHistory.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/organizations/org-slug/dashboard/8/',
        })
      );
    });

    it('disables buttons based on features', async function () {
      initialData = initializeOrg({
        organization: TestStubs.Organization({
          features: [
            'global-views',
            'dashboards-basic',
            'discover-query',
            'dashboard-grid-layout',
          ],
          projects: [TestStubs.Project()],
        }),
      });

      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: 'default-overview'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Edit should be disabled
      const editProps = wrapper
        .find('Controls Button[data-test-id="dashboard-edit"]')
        .props();
      expect(editProps.disabled).toBe(true);
      expect(mockVisit).not.toHaveBeenCalled();
    });

    it('assigns unique IDs to all widgets so grid keys are unique', async function () {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/events-stats/',
        body: {data: []},
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/default-overview/',
        body: TestStubs.Dashboard(
          [
            TestStubs.Widget(
              [{name: '', conditions: 'event.type:error', fields: ['count()']}],
              {
                title: 'Default Widget 1',
                interval: '1d',
              }
            ),
            TestStubs.Widget(
              [{name: '', conditions: 'event.type:transaction', fields: ['count()']}],
              {
                title: 'Default Widget 2',
                interval: '1d',
              }
            ),
          ],
          {id: 'default-overview', title: 'Default'}
        ),
      });
      initialData = initializeOrg({
        organization: TestStubs.Organization({
          features: [
            'global-views',
            'dashboards-basic',
            'discover-query',
            'dashboard-grid-layout',
          ],
          projects: [TestStubs.Project()],
        }),
      });

      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: 'default-overview'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      const dashboardInstance = wrapper.find('Dashboard').instance();
      const assignedIds = new Set(
        dashboardInstance.props.dashboard.widgets.map(constructGridItemKey)
      );
      expect(assignedIds.size).toBe(dashboardInstance.props.dashboard.widgets.length);
    });
  });

  describe('custom dashboards', function () {
    let wrapper, initialData, widgets, mockVisit, mockPut;

    const openLibraryModal = jest.spyOn(modals, 'openDashboardWidgetLibraryModal');
    const openEditModal = jest.spyOn(modals, 'openAddDashboardWidgetModal');

    beforeEach(function () {
      initialData = initializeOrg({organization});
      widgets = [
        TestStubs.Widget(
          [{name: '', conditions: 'event.type:error', fields: ['count()']}],
          {
            title: 'Errors',
            interval: '1d',
            id: '1',
          }
        ),
        TestStubs.Widget(
          [{name: '', conditions: 'event.type:transaction', fields: ['count()']}],
          {
            title: 'Transactions',
            interval: '1d',
            id: '2',
          }
        ),
        TestStubs.Widget(
          [
            {
              name: '',
              conditions: 'event.type:transaction transaction:/api/cats',
              fields: ['p50()'],
            },
          ],
          {
            title: 'p50 of /api/cats',
            interval: '1d',
            id: '3',
          }
        ),
      ];
      mockVisit = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/visit/',
        method: 'POST',
        body: [],
        statusCode: 200,
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/tags/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/projects/',
        body: [TestStubs.Project()],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/',
        body: [
          TestStubs.Dashboard([], {
            id: 'default-overview',
            title: 'Default',
            widgetDisplay: ['area'],
          }),
          TestStubs.Dashboard([], {
            id: '1',
            title: 'Custom Errors',
            widgetDisplay: ['area'],
          }),
        ],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: TestStubs.Dashboard(widgets, {id: '1', title: 'Custom Errors'}),
      });
      mockPut = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        method: 'PUT',
        body: TestStubs.Dashboard(widgets, {id: '1', title: 'Custom Errors'}),
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/events-stats/',
        body: {data: []},
      });
      MockApiClient.addMockResponse({
        method: 'POST',
        url: '/organizations/org-slug/dashboards/widgets/',
        body: [],
      });
      MockApiClient.addMockResponse({
        method: 'GET',
        url: '/organizations/org-slug/recent-searches/',
        body: [],
      });
      MockApiClient.addMockResponse({
        method: 'GET',
        url: '/organizations/org-slug/issues/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/eventsv2/',
        method: 'GET',
        body: [],
      });
    });

    afterEach(function () {
      MockApiClient.clearMockResponses();
      jest.clearAllMocks();
      if (wrapper) {
        wrapper.unmount();
      }
    });

    it('can remove widgets', async function () {
      const updateMock = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        method: 'PUT',
        body: TestStubs.Dashboard([widgets[0]], {id: '1', title: 'Custom Errors'}),
      });
      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      expect(mockVisit).toHaveBeenCalledTimes(1);

      // Enter edit mode.
      wrapper.find('Controls Button[data-test-id="dashboard-edit"]').simulate('click');

      // Remove the second and third widgets
      wrapper
        .find('WidgetCard')
        .at(1)
        .find('IconClick[data-test-id="widget-delete"]')
        .simulate('click');

      wrapper
        .find('WidgetCard')
        .at(1)
        .find('IconClick[data-test-id="widget-delete"]')
        .simulate('click');

      // Save changes
      wrapper.find('Controls Button[data-test-id="dashboard-commit"]').simulate('click');
      await tick();

      expect(updateMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledWith(
        '/organizations/org-slug/dashboards/1/',
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Custom Errors',
            widgets: [widgets[0]],
          }),
        })
      );

      // Visit should not be called again on dashboard update
      expect(mockVisit).toHaveBeenCalledTimes(1);
    });

    it('can enter edit mode for widgets', async function () {
      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Enter edit mode.
      wrapper.find('Controls Button[data-test-id="dashboard-edit"]').simulate('click');

      const card = wrapper.find('WidgetCard').first();
      card.find('StyledPanel').simulate('mouseOver');

      // Edit the first widget
      wrapper
        .find('WidgetCard')
        .first()
        .find('IconClick[data-test-id="widget-edit"]')
        .simulate('click');

      await tick();
      await wrapper.update();
      const modal = await mountGlobalModal();

      expect(modal.find('AddDashboardWidgetModal').props().widget).toEqual(widgets[0]);
    });

    it('shows add widget option', async function () {
      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Enter edit mode.
      wrapper.find('Controls Button[data-test-id="dashboard-edit"]').simulate('click');
      wrapper.update();
      expect(wrapper.find('AddWidget').exists()).toBe(true);
    });

    it('opens custom modal when add widget option is clicked', async function () {
      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Enter edit mode.
      wrapper.find('Controls Button[data-test-id="dashboard-edit"]').simulate('click');
      wrapper.update();
      wrapper.find('AddButton[data-test-id="widget-add"]').simulate('click');
      expect(openEditModal).toHaveBeenCalledTimes(1);
    });

    it('opens widget library when add widget option is clicked', async function () {
      initialData = initializeOrg({
        organization: TestStubs.Organization({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
            'widget-library',
          ],
          projects: [TestStubs.Project()],
        }),
      });

      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Enter edit mode.
      wrapper.find('Controls Button[data-test-id="dashboard-edit"]').simulate('click');
      wrapper.update();
      wrapper.find('AddButton[data-test-id="widget-add"]').simulate('click');
      expect(openLibraryModal).toHaveBeenCalledTimes(1);
    });

    it('hides add widget option', async function () {
      types.MAX_WIDGETS = 1;

      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Enter edit mode.
      wrapper.find('Controls Button[data-test-id="dashboard-edit"]').simulate('click');
      wrapper.update();
      expect(wrapper.find('AddWidget').exists()).toBe(false);
    });

    it('hides and shows breadcrumbs based on feature', async function () {
      const newOrg = initializeOrg({
        organization: TestStubs.Organization({
          features: [
            'global-views',
            'dashboards-basic',
            'discover-query',
            'dashboard-grid-layout',
          ],
          projects: [TestStubs.Project()],
        }),
      });

      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={newOrg.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={newOrg.router}
          location={newOrg.router.location}
        />,
        newOrg.routerContext
      );
      await tick();
      wrapper.update();

      expect(wrapper.find('Breadcrumbs').exists()).toBe(false);

      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      const breadcrumbs = wrapper.find('Breadcrumbs');

      expect(breadcrumbs.exists()).toBe(true);
      expect(breadcrumbs.find('BreadcrumbLink').find('a').text()).toEqual('Dashboards');
      expect(breadcrumbs.find('BreadcrumbItem').last().text()).toEqual('Custom Errors');
    });

    it('enters edit mode when given a new widget in location query', async function () {
      initialData.router.location = {
        query: {
          displayType: 'line',
          interval: '5m',
          queryConditions: ['title:test', 'event.type:test'],
          queryFields: ['count()', 'failure_count()'],
          queryNames: ['1', '2'],
          queryOrderby: '',
          title: 'Widget Title',
        },
      };
      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();
      expect(wrapper.find('DashboardDetail').props().initialState).toEqual(
        DashboardState.EDIT
      );
    });

    it('enters view mode when not given a new widget in location query', async function () {
      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();
      expect(wrapper.find('DashboardDetail').props().initialState).toEqual(
        DashboardState.VIEW
      );
    });

    it('can add library widgets', async function () {
      types.MAX_WIDGETS = 10;
      initialData = initializeOrg({
        organization: TestStubs.Organization({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
            'widget-library',
            'dashboard-grid-layout',
          ],
          projects: [TestStubs.Project()],
        }),
      });

      wrapper = mountWithTheme(
        <ViewEditDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // Enter Add Widget mode
      wrapper
        .find('Controls Button[data-test-id="add-widget-library"] button')
        .simulate('click');

      const modal = await mountGlobalModal();
      await tick();
      await modal.update();

      modal.find('WidgetLibraryCard').at(1).simulate('click');

      modal.find('Button[data-test-id="confirm-widgets"]').simulate('click');

      await tick();
      wrapper.update();

      expect(wrapper.find('DashboardDetail').state().dashboardState).toEqual(
        DashboardState.VIEW
      );
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledWith(
        '/organizations/org-slug/dashboards/1/',
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Custom Errors',
            widgets: [
              {
                id: '1',
                interval: '1d',
                queries: [
                  {conditions: 'event.type:error', fields: ['count()'], name: ''},
                ],
                title: 'Errors',
                type: 'line',
              },
              {
                id: '2',
                interval: '1d',
                queries: [
                  {conditions: 'event.type:transaction', fields: ['count()'], name: ''},
                ],
                title: 'Transactions',
                type: 'line',
              },
              {
                id: '3',
                interval: '1d',
                queries: [
                  {
                    conditions: 'event.type:transaction transaction:/api/cats',
                    fields: ['p50()'],
                    name: '',
                  },
                ],
                title: 'p50 of /api/cats',
                type: 'line',
              },
              {
                displayType: 'top_n',
                id: undefined,
                interval: '5m',
                description: 'Top 5 transactions with the largest volume.',
                queries: [
                  {
                    conditions: '!event.type:error',
                    fields: ['transaction', 'count()'],
                    name: '',
                    orderby: '-count',
                  },
                ],
                title: 'High Throughput Transactions',
                widgetType: 'discover',
              },
            ],
          }),
        })
      );
    });
  });
});
