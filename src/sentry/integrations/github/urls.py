from django.conf.urls import url

from sentry.web.frontend.github_extension_installation import GithubExtensionConfigurationView

from .search import GitHubSearchEndpoint
from .webhook import GitHubIntegrationsWebhookEndpoint

urlpatterns = [
    url(r"^webhook/$", GitHubIntegrationsWebhookEndpoint.as_view()),
    url(
        r"^search/(?P<organization_slug>[^\/]+)/(?P<integration_id>\d+)/$",
        GitHubSearchEndpoint.as_view(),
        name="sentry-extensions-github-search",
    ),
    url(
        r"^configure/(?P<signed_params>[^\/]+)/$",
        GithubExtensionConfigurationView.as_view(),
        name="github-integration-installation",
    ),
]
