# Incident Runbook (First 24 Hours)

Scope: Suspension notice for Google Cloud project `gen-lang-client-0483161409`.

## 0-1 Hour (Containment)

1. Disable risky provider usage by default in app config.
2. Revoke affected API keys immediately.
3. Rotate any potentially related secrets.
4. Confirm environment files are not tracked in git.

## 1-4 Hours (Verification)

1. Review Google Cloud audit/activity logs:
- Request volume spikes
- Unexpected geographies / user agents
- Unexpected endpoints/models
2. Capture timeline:
- first suspicious event
- peak abuse window
- suspension timestamp
3. Verify no frontend/client key exposure paths remain.

## 4-12 Hours (Hardening)

1. Recreate keys with least privilege:
- API restriction: only required API
- Source restriction: backend-only, IP/source constrained where possible
2. Add quotas and alerts:
- daily request cap
- budget alert thresholds
- unusual usage anomaly alerts
3. Add guardrails in backend:
- provider feature flag default OFF
- rate limiting
- admin-only refresh endpoints

## 12-24 Hours (Recovery)

1. Submit formal appeal with:
- probable trigger
- remediation completed
- preventive controls implemented
2. Keep provider disabled until appeal response.
3. Prepare evidence bundle:
- before/after config summary
- log snippets
- incident timeline

## Response Templates

Use: docs/security/google-cloud-appeal.md

## Internal Checklist

- [ ] Keys revoked
- [ ] Keys rotated
- [ ] Quotas set
- [ ] Alerts set
- [ ] Provider disabled by default
- [ ] Appeal submitted
- [ ] Incident report drafted
