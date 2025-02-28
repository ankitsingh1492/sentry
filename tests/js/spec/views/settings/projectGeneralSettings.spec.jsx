import {browserHistory} from 'react-router';

import {mountWithTheme} from 'sentry-test/enzyme';
import {mountGlobalModal} from 'sentry-test/modal';
import {act} from 'sentry-test/reactTestingLibrary';
import {selectByValue} from 'sentry-test/select-new';

import {addErrorMessage, addSuccessMessage} from 'sentry/actionCreators/indicator';
import {removeGlobalSelectionStorage} from 'sentry/components/organizations/globalSelectionHeader/utils';
import ProjectsStore from 'sentry/stores/projectsStore';
import ProjectContext from 'sentry/views/projects/projectContext';
import ProjectGeneralSettings from 'sentry/views/settings/projectGeneralSettings';

jest.mock('sentry/actionCreators/indicator');
jest.mock('sentry/components/organizations/globalSelectionHeader/utils');

describe('projectGeneralSettings', function () {
  const org = TestStubs.Organization();
  const project = TestStubs.ProjectDetails();
  const groupingConfigs = TestStubs.GroupingConfigs();
  const groupingEnhancements = TestStubs.GroupingEnhancements();
  let routerContext;
  let putMock;
  let wrapper;
  let modal;

  beforeEach(function () {
    jest.spyOn(window.location, 'assign');
    routerContext = TestStubs.routerContext([
      {
        router: TestStubs.router({
          params: {
            projectId: project.slug,
            orgId: org.slug,
          },
        }),
      },
    ]);

    MockApiClient.clearMockResponses();
    MockApiClient.addMockResponse({
      url: '/grouping-configs/',
      method: 'GET',
      body: groupingConfigs,
    });
    MockApiClient.addMockResponse({
      url: '/grouping-enhancements/',
      method: 'GET',
      body: groupingEnhancements,
    });
    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/`,
      method: 'GET',
      body: project,
    });
    MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/environments/`,
      method: 'GET',
      body: [],
    });
    MockApiClient.addMockResponse({
      url: `/organizations/${org.slug}/users/`,
      method: 'GET',
      body: [],
    });
  });

  afterEach(function () {
    window.location.assign.mockRestore();
    MockApiClient.clearMockResponses();
    addSuccessMessage.mockReset();
    addErrorMessage.mockReset();

    if (wrapper?.length) {
      wrapper.unmount();
      wrapper = undefined;
    }
    if (modal?.length) {
      modal.unmount();
      modal = undefined;
    }
  });

  it('renders form fields', function () {
    wrapper = mountWithTheme(
      <ProjectGeneralSettings params={{orgId: org.slug, projectId: project.slug}} />,
      TestStubs.routerContext()
    );

    expect(wrapper.find('Input[name="slug"]').prop('value')).toBe('project-slug');
    expect(wrapper.find('Input[name="subjectPrefix"]').prop('value')).toBe('[my-org]');
    expect(wrapper.find('RangeSlider[name="resolveAge"]').prop('value')).toBe(48);
    expect(wrapper.find('TextArea[name="allowedDomains"]').prop('value')).toBe(
      'example.com\nhttps://example.com'
    );
    expect(wrapper.find('Switch[name="scrapeJavaScript"]').prop('isDisabled')).toBe(
      false
    );
    expect(wrapper.find('Switch[name="scrapeJavaScript"]').prop('isActive')).toBeTruthy();
    expect(wrapper.find('Input[name="securityToken"]').prop('value')).toBe(
      'security-token'
    );
    expect(wrapper.find('Input[name="securityTokenHeader"]').prop('value')).toBe(
      'x-security-header'
    );
    expect(wrapper.find('Switch[name="verifySSL"]').prop('isActive')).toBeTruthy();
  });

  it('disables scrapeJavaScript when equivalent org setting is false', function () {
    routerContext.context.organization.scrapeJavaScript = false;
    wrapper = mountWithTheme(
      <ProjectGeneralSettings params={{orgId: org.slug, projectId: project.slug}} />,
      routerContext
    );
    expect(wrapper.find('Switch[name="scrapeJavaScript"]').prop('isDisabled')).toBe(true);
    expect(wrapper.find('Switch[name="scrapeJavaScript"]').prop('isActive')).toBeFalsy();
  });

  it('project admins can remove project', async function () {
    const deleteMock = MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/`,
      method: 'DELETE',
    });

    wrapper = mountWithTheme(
      <ProjectGeneralSettings params={{orgId: org.slug, projectId: project.slug}} />,
      TestStubs.routerContext()
    );

    const removeBtn = wrapper.find('.ref-remove-project').first();

    expect(removeBtn.prop('children')).toBe('Remove Project');

    // Click button
    removeBtn.simulate('click');

    // Confirm Modal
    modal = await mountGlobalModal();
    modal.find('Button[priority="danger"]').simulate('click');

    expect(deleteMock).toHaveBeenCalled();

    expect(removeGlobalSelectionStorage).toHaveBeenCalledWith('org-slug');
  });

  it('project admins can transfer project', async function () {
    const deleteMock = MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/transfer/`,
      method: 'POST',
    });

    wrapper = mountWithTheme(
      <ProjectGeneralSettings params={{orgId: org.slug, projectId: project.slug}} />,
      TestStubs.routerContext()
    );

    const removeBtn = wrapper.find('.ref-transfer-project').first();

    expect(removeBtn.prop('children')).toBe('Transfer Project');

    // Click button
    removeBtn.simulate('click');

    // Confirm Modal
    modal = await mountGlobalModal();
    modal
      .find('input[name="email"]')
      .simulate('change', {target: {value: 'billy@sentry.io'}});
    modal.find('Modal Button[priority="danger"]').simulate('click');
    await tick();
    await modal.update();

    expect(addSuccessMessage).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledWith(
      `/projects/${org.slug}/${project.slug}/transfer/`,
      expect.objectContaining({
        method: 'POST',
        data: {
          email: 'billy@sentry.io',
        },
      })
    );
  });

  it('handles errors on transfer project', async function () {
    const deleteMock = MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/transfer/`,
      method: 'POST',
      statusCode: 400,
      body: {detail: 'An organization owner could not be found'},
    });

    wrapper = mountWithTheme(
      <ProjectGeneralSettings params={{orgId: org.slug, projectId: project.slug}} />,
      TestStubs.routerContext()
    );

    const removeBtn = wrapper.find('.ref-transfer-project').first();

    expect(removeBtn.prop('children')).toBe('Transfer Project');

    // Click button
    removeBtn.simulate('click');

    // Confirm Modal
    modal = await mountGlobalModal();
    modal
      .find('input[name="email"]')
      .simulate('change', {target: {value: 'billy@sentry.io'}});
    modal.find('Modal Button[priority="danger"]').simulate('click');
    await tick();
    await modal.update();

    expect(deleteMock).toHaveBeenCalled();
    expect(addSuccessMessage).not.toHaveBeenCalled();

    expect(addErrorMessage).toHaveBeenCalled();
    const content = mountWithTheme(addErrorMessage.mock.calls[0][0]);
    expect(content.text()).toEqual(
      expect.stringContaining('An organization owner could not be found')
    );
  });

  it('displays transfer/remove message for non-admins', function () {
    routerContext.context.organization.access = ['org:read'];
    wrapper = mountWithTheme(
      <ProjectGeneralSettings params={{orgId: org.slug, projectId: project.slug}} />,
      routerContext
    );

    expect(wrapper.html()).toContain(
      'You do not have the required permission to remove this project.'
    );
    expect(wrapper.html()).toContain(
      'You do not have the required permission to transfer this project.'
    );
  });

  it('disables the form for users without write permissions', function () {
    routerContext.context.organization.access = ['org:read'];
    wrapper = mountWithTheme(
      <ProjectGeneralSettings params={{orgId: org.slug, projectId: project.slug}} />,
      routerContext
    );

    expect(wrapper.find('FormField[disabled=false]')).toHaveLength(0);
    expect(wrapper.find('Alert').first().text()).toBe(
      'These settings can only be edited by users with the organization owner, manager, or admin role.'
    );
  });

  it('changing project platform updates ProjectsStore', async function () {
    const params = {orgId: org.slug, projectId: project.slug};
    act(() => ProjectsStore.loadInitialData([project]));
    putMock = MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/`,
      method: 'PUT',
      body: {
        ...project,
        platform: 'javascript',
      },
    });

    wrapper = mountWithTheme(
      <ProjectContext orgId={org.slug} projectId={project.slug}>
        <ProjectGeneralSettings
          routes={[]}
          location={routerContext.context.location}
          params={params}
        />
      </ProjectContext>,
      routerContext
    );

    await act(tick);
    wrapper.update();

    // Change slug to new-slug
    selectByValue(wrapper, 'javascript');

    // Slug does not save on blur
    expect(putMock).toHaveBeenCalled();

    await tick();
    await act(tick);
    wrapper.update();

    // updates ProjectsStore
    expect(ProjectsStore.itemsById['2'].platform).toBe('javascript');
  });

  it('changing slug updates ProjectsStore', async function () {
    const params = {orgId: org.slug, projectId: project.slug};
    act(() => ProjectsStore.loadInitialData([project]));

    putMock = MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/${project.slug}/`,
      method: 'PUT',
      body: {
        ...project,
        slug: 'new-project',
      },
    });

    wrapper = mountWithTheme(
      <ProjectContext orgId={org.slug} projectId={project.slug}>
        <ProjectGeneralSettings
          routes={[]}
          location={routerContext.context.location}
          params={params}
        />
      </ProjectContext>,
      routerContext
    );

    await tick();
    wrapper.update();

    // Change slug to new-slug
    wrapper
      .find('input[name="slug"]')
      .simulate('change', {target: {value: 'NEW PROJECT'}})
      .simulate('blur');

    // Slug does not save on blur
    expect(putMock).not.toHaveBeenCalled();
    wrapper.find('MessageAndActions button[aria-label="Save"]').simulate('click');

    // fetches new slug
    const newProjectGet = MockApiClient.addMockResponse({
      url: `/projects/${org.slug}/new-project/`,
      method: 'GET',
      body: {...project, slug: 'new-project'},
    });
    const newProjectMembers = MockApiClient.addMockResponse({
      url: `/organizations/${org.slug}/users/`,
      method: 'GET',
      body: [],
    });

    await act(tick);
    wrapper.update();

    // updates ProjectsStore
    expect(ProjectsStore.itemsById['2'].slug).toBe('new-project');
    expect(browserHistory.replace).toHaveBeenCalled();
    expect(wrapper.find('Input[name="slug"]').prop('value')).toBe('new-project');

    wrapper.setProps({
      projectId: 'new-project',
    });
    await tick();
    wrapper.update();
    expect(newProjectGet).toHaveBeenCalled();
    expect(newProjectMembers).toHaveBeenCalled();
  });

  describe('Non-"save on blur" Field', function () {
    beforeEach(function () {
      const params = {orgId: org.slug, projectId: project.slug};
      act(() => ProjectsStore.loadInitialData([project]));
      putMock = MockApiClient.addMockResponse({
        url: `/projects/${org.slug}/${project.slug}/`,
        method: 'PUT',
        body: {
          ...project,
          slug: 'new-project',
        },
      });
      wrapper = mountWithTheme(
        <ProjectContext orgId={org.slug} projectId={project.slug}>
          <ProjectGeneralSettings
            routes={[]}
            location={routerContext.context.location}
            params={params}
          />
        </ProjectContext>,
        routerContext
      );
    });

    afterEach(() => {
      wrapper?.unmount();
      modal?.unmount();
    });

    it('can cancel unsaved changes for a field', async function () {
      await tick();
      wrapper.update();

      // Initially does not have "Cancel" button
      expect(wrapper.find('MessageAndActions button[aria-label="Cancel"]')).toHaveLength(
        0
      );
      // Has initial value
      expect(wrapper.find('input[name="resolveAge"]').prop('value')).toBe(19);

      // Change value
      wrapper
        .find('input[name="resolveAge"]')
        .simulate('input', {target: {value: 12}})
        .simulate('mouseUp');

      // Has updated value
      expect(wrapper.find('input[name="resolveAge"]').prop('value')).toBe(12);
      // Has "Cancel" button visible
      expect(wrapper.find('MessageAndActions button[aria-label="Cancel"]')).toHaveLength(
        1
      );

      // Click cancel
      wrapper.find('MessageAndActions button[aria-label="Cancel"]').simulate('click');
      wrapper.update();

      // Cancel row should disappear
      expect(wrapper.find('MessageAndActions button[aria-label="Cancel"]')).toHaveLength(
        0
      );
      // Value should be reverted
      expect(wrapper.find('input[name="resolveAge"]').prop('value')).toBe(19);
      // PUT should not be called
      expect(putMock).not.toHaveBeenCalled();
    });

    it('saves when value is changed and "Save" clicked', async function () {
      // This test has been flaky and using act() isn't removing the flakyness.
      await tick();
      wrapper.update();

      // Initially does not have "Save" button
      expect(wrapper.find('MessageAndActions button[aria-label="Save"]')).toHaveLength(0);

      // Change value
      wrapper
        .find('input[name="resolveAge"]')
        .simulate('input', {target: {value: 12}})
        .simulate('mouseUp');
      await tick();
      wrapper.update();

      // Has "Save" button visible
      expect(wrapper.find('MessageAndActions button[aria-label="Save"]')).toHaveLength(1);

      // Should not have put mock called yet
      expect(putMock).not.toHaveBeenCalled();

      // Click "Save"
      wrapper.find('MessageAndActions button[aria-label="Save"]').simulate('click');
      await tick();
      wrapper.update();

      // API endpoint should have been called
      expect(putMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: {
            resolveAge: 12,
          },
        })
      );

      // Should hide "Save" button after saving
      await act(tick);
      wrapper.update();

      expect(wrapper.find('MessageAndActions button[aria-label="Save"]')).toHaveLength(0);
    });
  });
});
