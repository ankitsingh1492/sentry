from rest_framework.response import Response

from sentry.api.base import EnvironmentMixin, StatsMixin
from sentry.api.bases.project import ProjectEndpoint
from sentry.api.exceptions import ResourceDoesNotExist
from sentry.api.helpers.group_index import rate_limit_endpoint
from sentry.app import tsdb
from sentry.models import Environment, Group
from sentry.types.ratelimit import RateLimit, RateLimitCategory


class ProjectGroupStatsEndpoint(ProjectEndpoint, EnvironmentMixin, StatsMixin):

    rate_limits = {
        "GET": {
            RateLimitCategory.IP: RateLimit(20, 1),
            RateLimitCategory.USER: RateLimit(20, 1),
            RateLimitCategory.ORGANIZATION: RateLimit(20, 1),
        }
    }

    @rate_limit_endpoint(limit=20, window=1)
    def get(self, request, project):
        try:
            environment_id = self._get_environment_id_from_request(request, project.organization_id)
        except Environment.DoesNotExist:
            raise ResourceDoesNotExist

        group_ids = request.GET.getlist("id")
        if not group_ids:
            return Response(status=204)

        group_list = Group.objects.filter(project=project, id__in=group_ids)
        group_ids = [g.id for g in group_list]

        if not group_ids:
            return Response(status=204)

        data = tsdb.get_range(
            model=tsdb.models.group, keys=group_ids, **self._parse_args(request, environment_id)
        )

        return Response({str(k): v for k, v in data.items()})
