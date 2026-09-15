# Design and operational research

Reviewed 13 September 2026. These are references for product decisions, not copied source code or claims of clinical validation.

- [Linear's 2026 design refresh](https://linear.app/now/behind-the-latest-design-refresh): consistent navigation, reduced visual noise and a content-first hierarchy. Applied to the white workspace, quiet sidebar, restrained controls and shared table language. The supplied user screenshot remains the primary visual direction; Switzer is self-hosted throughout.
- [Cloudflare dashboard redesign](https://blog.cloudflare.com/a-new-look-on-your-cloudflare-dashboard/): clear information architecture for complex products. Applied to the distinction between everyday coordination and planning/analytics.
- [GE HealthCare Command Center](https://www.gehealthcare.com/en/products/software/command-center): reference for connecting patient flow and resource constraints. Inspired the capacity lab, not a claim that our model reproduces GE's platform.
- [HSMA programme](https://hsma.co.uk/) and [open-source repositories](https://github.com/hsma-programme): healthcare operations research and simulation examples. Informed the decision to make assumptions, queues, utilization and downstream effects inspectable.
- [OHIF Viewers](https://github.com/ohif/Viewers): credible future integration reference for actual medical imaging. The current procedural 3D model is illustrative, unlinked to uploaded files, and cannot interpret scans.

Public indexed X searches did not yield a sufficiently verifiable example to use as evidence. No claims about Astra-generated projects are relied on.

## What was built from these ideas

1. A deterministic resource-capacity experiment: imaging → theatre → recovery, independent resource pools, configurable demand and downtime, a baseline comparison, and a clickable visit timeline.
2. D1 scenario snapshots containing assumptions, source cohort and model version; CSV export includes the full stage schedule, including work beyond the visible shift.
3. A cross-pathway dependency map that connects an operational blocker to the responsible owner and underlying patient pathway.
4. Editable task ownership and real table/board views, backed by persistent changes and audit events.

## Model limits

The 12-hour model uses fixed illustrative service durations. All active cases are treated as demand for all three stages for the exercise; this is not a treatment allocation. Monitoring cases are excluded. Arrivals are first-ready-first-served with priority only breaking ties. There is no stochastic uncertainty, clinical prioritization, staffing rota, overnight calendar, upstream blocking, cost model or calibrated hospital dataset. Average waits include work after shift-end; utilization is clipped to the shift. Results are useful for explaining queueing and systems trade-offs, not for real clinical or staffing decisions.
