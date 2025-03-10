from datetime import timedelta
from functools import partial

from django.utils import timezone

from sentry import eventstore, features
from sentry.api.bases.project import ProjectEndpoint
from sentry.api.helpers.group_index import rate_limit_endpoint
from sentry.api.serializers import EventSerializer, SimpleEventSerializer, serialize
from sentry.types.ratelimit import RateLimit, RateLimitCategory


class ProjectEventsEndpoint(ProjectEndpoint):

    rate_limits = {
        "GET": {
            RateLimitCategory.IP: RateLimit(5, 1),
            RateLimitCategory.USER: RateLimit(5, 1),
            RateLimitCategory.ORGANIZATION: RateLimit(5, 1),
        }
    }

    @rate_limit_endpoint(limit=5, window=1)
    def get(self, request, project):
        """
        List a Project's Events
        ```````````````````````

        Return a list of events bound to a project.

        Note: This endpoint is experimental and may be removed without notice.

        :qparam bool full: if this is set to true then the event payload will
                           include the full event body, including the stacktrace.
                           Set to 1 to enable.

        :pparam string organization_slug: the slug of the organization the
                                          groups belong to.
        :pparam string project_slug: the slug of the project the groups
                                     belong to.
        """
        from sentry.api.paginator import GenericOffsetPaginator

        query = request.GET.get("query")
        conditions = []
        if query:
            conditions.append([["positionCaseInsensitive", ["message", f"'{query}'"]], "!=", 0])

        event_filter = eventstore.Filter(conditions=conditions, project_ids=[project.id])
        if features.has(
            "organizations:project-event-date-limit", project.organization, actor=request.user
        ):
            event_filter.start = timezone.now() - timedelta(days=7)

        full = request.GET.get("full", False)

        data_fn = partial(
            eventstore.get_events,
            filter=event_filter,
            referrer="api.project-events",
        )

        serializer = EventSerializer() if full else SimpleEventSerializer()
        return self.paginate(
            request=request,
            on_results=lambda results: serialize(results, request.user, serializer),
            paginator=GenericOffsetPaginator(data_fn=data_fn),
        )
