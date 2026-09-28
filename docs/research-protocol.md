# Proposal based research prototype

The authoritative source is the intermediate Proposal titled “Design and Evaluation of a Risk-Aware Screening and Matching System for Peer-to-Peer Dog and Cat Rehoming in Japan”, retained at backup/Assessment-2/Assessment2_SerikaKAWANO.docx. The document is a research specification, not evidence of completed evaluation.

## Research question and contribution

Can structured care information, explanations, verification states and suggested checks help reviewers assess applicants with less effort, without increasing missed welfare-related risks?

The contribution is a reproducible synthetic scenario set and an instrumented, human-led review comparison. Potential social value is reducing repetitive screening work and making actionable follow-up clearer for small rescue groups and individual carers. Adoption completion, long-term welfare, abandonment and repeat rehoming are not measured here. They must not be claimed as improved.

## What is implemented

| Proposal purpose | Implementation | Evidence to collect |
| --- | --- | --- |
| Animal-specific review | Eight cases and 32 applicant profiles | Domain feedback about plausibility |
| Weighted suitability and explanation | Six care criteria, explicit points and evidence | Reviewer interpretation and rubric sensitivity |
| Risk and verification visibility | Unresolved risks remain visible even at 100 points | Critical misses and requested checks |
| Human final judgement | Saved reasons, verification states, workflow and history | Decisions and explanations |
| Same-case comparison | Baseline and risk-aware tasks for the identical candidates | Paired time, risks and priority |
| Automation bias | High-score cases with important unresolved checks | Coded misses, reasons and self-reported reliance |
| Data minimisation | Synthetic profiles; abstract verification only | No document upload or real adopter records |
| Evaluation analysis | Separate participant and simulated data, manual coding, CSV/JSON | Inspectable evidence with missing values preserved |

## Dataset and scoring

Eight cases cover continuing medical care, indoor housing, an active young dog, incomplete housing verification, multi-pet integration, preference/welfare conflict, emergency readiness, and equal-care profiles with different household descriptions.

The provisional weights are housing 25, time 20, care understanding 15, medical readiness 15, household integration 15 and continuity 10. A documented plan earns the full weight; an incomplete plan earns half. Unknown information and an incompatible plan earn no evidence credit but are explicitly distinguished. Coverage is the proportion of the six criteria that are not unknown. Verification does not add points: it generates separate checks. Demographics, occupation, income and preferences are not scoring inputs. The operational applicant list stays in submission order rather than sorting by this unvalidated score. The literature audit, source selection and explicit exclusions are documented in [scoring-evidence.md](scoring-evidence.md).

These weights and evidence classifications are author-created hypotheses, not empirically calibrated probabilities, medical advice or validated adoption thresholds. Expected risks are authored separately from the scoring function, but originate with the same author. This does not provide independent domain validation. Expert review of the scenarios, expected risks, criteria and suggested checks remains necessary.

## Running a comparison

This is a formative qualitative evaluation targeting **five consenting adults**, not a quantitative service benchmark. GOV.UK guidance recommends 5–6 participants for qualitative usability testing that identifies problems in specific tasks (Office for Health Improvement and Disparities, 2020). Its separate service-wide benchmarking guidance recommends 30–60 actual or likely users (GOV.UK User Research Community, 2018). Five participants are feasible for an individual project, but do not supply statistical power or a representative estimate of screening efficiency. Risk discovery, task-level ratings and written reasons are the primary evidence. Elapsed time is retained only as a secondary contextual observation: clicking through a prototype cannot reproduce the follow-up communication and document checks in a real adoption review. Researcher-run practice sessions and the eight simulated sessions are not counted as participants.

1. In /research/setup, inspect every selected case, candidate and expected-risk rubric. Record the basis for criteria and any feedback. Adjust weights if justified.
2. Prepare the participant explanation in line with the approved ethics process, including retention, withdrawal and reporting arrangements. Check the researcher-reviewed field.
3. Select the participant group and issue one session per participant. Only anonymous codes are needed. Use practice sessions to test the workflow; they remain excluded from participant results.
4. Use the same selected scenarios in both modes. The default is two cases and four tasks per person. AB and BA are assigned alternately within each source group; with five participants, the overall split will be three versus two unless grouping changes it. This is counterbalancing, not randomisation. Block order is recorded.
5. Both modes show the same profile facts and abstract verification records, in the same candidate order. The participant-facing labels are **Application information only** and **With PawMatch review support**. The latter adds computed scores, explanations and next checks. Expected answers and internal evidence classifications are not sent to the application-information-only client. The research comparison does not test score-based sorting independently.
6. The participant consents, starts a task, selects a response for every candidate, chooses a priority candidate or none, lists risks, explains the decision, proposes next checks and supplies four 1–5 ratings.
7. Start and submit timestamps are recorded by the server. This measures elapsed task time, not active attention time. A participant can mark interruptions; those times are excluded from time comparisons.
8. Submitted responses are immutable. An identical retry does not duplicate a response. Abandoning a session leaves it incomplete; the withdrawal action removes its answers and excludes the session from results.

Issued sessions retain the case content, criteria, weights, expected-risk rubric, explanation text and computed assessments including rule version. Changes in setup affect only future sessions. Operational review updates do not alter research cases.

## Coding and analysis

The researcher reads free text and marks only the expected risks that the answer identifies for the relevant candidate. A checkbox list is not shown to participants. Record reasonable alternative interpretations and unanticipated risks in the coding notes. The current interface supports one coder; for stronger evidence, export responses and use an independent second coder with an agreed rubric.

Explanation scoring is 0 (uninterpretable), 1 (decision without concrete evidence), 2 (connects animal needs and applicant facts) or 3 (also explains remaining uncertainty and coherent next checks). This ordinal author-created rubric is not a validated scale. Rating items are likewise exploratory.

Risk recall is matched expected risks divided by expected risks in that case. Unknown coding is missing, not zero; the zero-risk control has no recall denominator. Displayed means are descriptive. Per-case, same-session pairs show **With PawMatch review support minus Application information only** for risk recall, usefulness, information clarity, confidence in explaining the decision, self-reported reliance on the screen, and the secondary elapsed-time observation. Interrupted times are excluded only from time differences. Incomplete pairs are excluded from paired comparisons.

The modal priority proportion describes within-case agreement when at least two responses exist. Agreement need not be correct; disagreement may be reasonable in a multi-suitable-candidate case. Agreement with the rubric's candidate examples is reported separately and is not decision accuracy. Selecting a highest-scoring candidate while failing to identify an expected critical risk is an inspection cue, not proof of automation bias.

The results screen reports order and participant group counts. Exported data permits participant-level inspection. With five people, report each person's paired case observations, denominators, missing data and important disagreements rather than treating four tasks per person as 20 independent participants or reporting a pooled effect as a population estimate. Do not use statistical significance or claim power, population validity, organisation-wide efficiency gains or real-world adoption outcomes. If no animal-welfare practitioner participates, describe the study as a usability check with proxy users, not validation of professional screening.

Eight simulated sessions provide 32 artificial responses for verifying aggregation. They include varying outcomes and are marked SIM. They cannot substantiate efficiency, risk-detection, usability or adoption claims.

## Scope and limitations

The application is a local prototype. A shared HttpOnly, SameSite=Lax demo cookie identifies one of four freely selectable test users; the header, dashboard and consultation flow use this same identity. It is not production authentication. Consultation records are filtered by test-user ID, persisted using the existing MongoDB/local store, and are never sent externally. Users sharing the same test account share its history. Only fictional messages should be entered. Legacy sessionStorage logins are migrated once. Researcher screens still use the mock access model; they do not provide production authorisation or per-participant access isolation. A random session URL is a bearer link, not a full authentication mechanism. Keep the server bound to localhost. Before any external deployment or real participant collection, implement researcher authorisation, participant access controls and the approved retention/consent process.

MongoDB is used when MONGODB_URI is configured. Without it, .pawmatch-data contains persistent local JSON written by a single server process with a write queue and atomic replacement. MongoDB uses optimistic revision checks. Local mode is not intended for multi-instance deployment. Data files are ignored by Git. A database connection failure is reported rather than silently switching storage.

The withdrawal action removes answers from the active application store, not previously exported files or filesystem backups. The researcher must manage those according to the agreed withdrawal and retention arrangements.

## Technical verification

The included automated checks cover scenario/rubric integrity, score explanations, equal-care invariance, pending verification at a high score, missing-data semantics, invalid inputs, session snapshots, consent and order, repeat submissions, manual coding, simulation separation, withdrawal and review persistence. A complete synthetic journey also checks one Bella case from the adopter's enquiry, through rehomer and PawMatch reviewer participation, to joint meeting, trial and final approval, including role restrictions and chronological completion dates. HTTP smoke scripts exercise the rendered routes and a complete four-task research session against an isolated local server. These are software checks, not participant evaluation results. MongoDB must be integration-tested separately when a database is configured.

The process board's initial stages are synthetic fixtures. Subsequent save events are actual interactions with synthetic cases. Stage viewing does not advance a case; advancement is explicit. Final decisions and all verification states are mock records and do not constitute a real adoption or identity check.

## Conclusion reporting boundary

Before participant testing, report implemented capabilities, reproducibility, privacy-conscious representation and technical test results. Describe social benefit as a potential contribution. After evaluation, add actual sample composition, paired descriptive differences, coded critical misses, qualitative findings and limitations. Do not substitute simulated results for participant evidence.

## Evaluation design references

- GOV.UK User Research Community (2018) 'Usability benchmarking a website or whole service', *Service Manual*. https://www.gov.uk/service-manual/measuring-success/usability-benchmarking-a-website-or-whole-service (accessed 27 September 2026).
- Office for Health Improvement and Disparities (2020) 'Usability testing: qualitative studies', *GOV.UK*. https://www.gov.uk/guidance/usability-testing-qualitative-studies (accessed 27 September 2026).
