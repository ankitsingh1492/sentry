from base64 import b64encode

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sentry import features
from sentry.api.base import Endpoint
from sentry.models import Authenticator


class AuthenticatorIndexEndpoint(Endpoint):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        """Returns u2f interface for a user, otherwise an empty array"""

        # Currently just expose u2f challenge, not sure if it's necessary to list all
        # authenticator interfaces that are enabled
        try:
            interface = Authenticator.objects.get_interface(request.user, "u2f")
            if not interface.is_enrolled():
                raise LookupError()
        except LookupError:
            return Response([])

        orgs = request.user.get_orgs()
        webauthn_ff = any(
            features.has("organizations:webauthn-login", org, actor=request.user) for org in orgs
        )

        challenge = interface.activate(request._request, webauthn_ff).challenge

        if webauthn_ff:
            webAuthnAuthenticationData = b64encode(challenge)
            challenge = {}
            challenge["webAuthnAuthenticationData"] = webAuthnAuthenticationData

        # I don't think we currently support multiple interfaces of the same type
        # but just future proofing I guess
        return Response([{"id": "u2f", "challenge": challenge}])
