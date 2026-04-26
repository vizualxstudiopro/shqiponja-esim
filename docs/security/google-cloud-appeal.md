# Google Cloud Appeal - Final 1:1 Copy-Paste

Project ID: gen-lang-client-0483161409
Date: 2026-04-26

Use the exact blocks below in the Google appeal form fields.

## Field 1 - Possible trigger of this activity
We believe the likely trigger was unauthorized or abusive API traffic caused by compromised or insufficiently restricted credentials. The behavior was not intentional by our team.

## Field 2 - Planned steps to fix the problem
1. We disabled AI image-generation paths by default in production.
2. We revoked and rotated credentials related to the affected integration.
3. We enforced backend-only provider usage and removed any client-side exposure path.
4. We added stricter endpoint controls and rate limiting for generation routes.
5. We are reviewing audit logs and usage timelines for suspicious requests.
6. We will recreate keys with strict API restrictions and source restrictions.
7. We will set conservative quotas, budget alerts, and anomaly monitoring.
8. We will maintain periodic key rotation and incident-response checks.

## Field 3 - If behavior is intentional, explain business reasons
The behavior is not intentional. Our legitimate use case is limited to generating avatar assets for onboarding content in our eSIM platform.

## Field 4 - If project may be compromised by a third party, describe concerns
Yes, we are concerned the project credentials may have been abused by a third party. We are currently validating this through Google Cloud logs and have already applied immediate containment by disabling provider generation by default and rotating credentials.

## Optional additional note (if form allows)
We respectfully request project reinstatement after review. We can provide additional technical evidence from logs and a full remediation timeline if needed.

## Signature block
[Full Name]
[Role]
[Company]
[Google Account Email]
