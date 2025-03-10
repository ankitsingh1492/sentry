import {mountWithTheme} from 'sentry-test/enzyme';
import {initializeOrg} from 'sentry-test/initializeOrg';

import Dashboard from 'sentry/views/dashboardsV2/dashboard';
import {DisplayType, WidgetType} from 'sentry/views/dashboardsV2/types';

describe('Dashboards > Dashboard', () => {
  const organization = TestStubs.Organization({
    features: ['dashboards-basic', 'dashboards-edit'],
  });
  const mockDashboard = {
    dateCreated: '2021-08-10T21:20:46.798237Z',
    id: '1',
    title: 'Test Dashboard',
    widgets: [],
  };
  const newWidget = {
    title: 'Test Query',
    displayType: DisplayType.LINE,
    widgetType: WidgetType.DISCOVER,
    interval: '5m',
    queries: [
      {
        name: '',
        conditions: '',
        fields: ['count()'],
        orderby: '',
      },
    ],
  };

  let initialData;

  beforeEach(() => {
    initialData = initializeOrg({organization, router: {}, project: 1, projects: []});
    MockApiClient.addMockResponse({
      url: `/organizations/org-slug/dashboards/widgets/`,
      method: 'POST',
      body: [],
    });
  });
  it('dashboard adds new widget if component is mounted with newWidget prop', async () => {
    const mock = jest.fn();
    const wrapper = mountWithTheme(
      <Dashboard
        paramDashboardId="1"
        dashboard={mockDashboard}
        organization={initialData.organization}
        isEditing={false}
        onUpdate={mock}
        handleAddLibraryWidgets={mock}
        onSetWidgetToBeUpdated={() => undefined}
        router={initialData.router}
        location={initialData.location}
        newWidget={newWidget}
        widgetLimitReached={false}
      />,
      initialData.routerContext
    );
    await tick();
    wrapper.update();
    expect(mock).toHaveBeenCalled();
  });

  it('dashboard adds new widget if component updated with newWidget prop', async () => {
    const mock = jest.fn();
    const wrapper = mountWithTheme(
      <Dashboard
        paramDashboardId="1"
        dashboard={mockDashboard}
        organization={initialData.organization}
        isEditing={false}
        onUpdate={mock}
        handleAddLibraryWidgets={mock}
        onSetWidgetToBeUpdated={() => undefined}
        router={initialData.router}
        location={initialData.location}
        widgetLimitReached={false}
      />,
      initialData.routerContext
    );
    expect(mock).not.toHaveBeenCalled();
    wrapper.setProps({newWidget});
    await tick();
    wrapper.update();
    expect(mock).toHaveBeenCalled();
  });

  it('displays widgets with drag handle when in edit mode', () => {
    const dashboardWithOneWidget = {...mockDashboard, widgets: [newWidget]};
    const wrapper = mountWithTheme(
      <Dashboard
        paramDashboardId="1"
        dashboard={dashboardWithOneWidget}
        organization={initialData.organization}
        onUpdate={() => undefined}
        onSetWidgetToBeUpdated={() => undefined}
        handleAddLibraryWidgets={() => undefined}
        router={initialData.router}
        location={initialData.location}
        widgetLimitReached={false}
        isEditing
      />,
      initialData.routerContext
    );
    expect(wrapper.find('StyledIconGrabbable')).toHaveLength(1);
  });
});
