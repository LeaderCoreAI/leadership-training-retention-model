# Parameter Sources & Justifications

*For the configurable retention curve model accompanying "Simulations as an Antidote to the Forgetting Curve for Interpersonal Skills"*

---

Every parameter in the model is tagged as either **RESEARCH** (directly from published data) or **ESTIMATED** (interpolated from best available evidence). Estimated parameters are user-configurable via sliders so that assumptions can be tested transparently.

This document explains the justification for every default value.

---

## Research-Anchored Parameters

| Parameter | Default | Slider Range | Source & Justification |
|---|---|---|---|
| **simActiveDecayRate** — Monthly decay rate during active simulation practice | 0.07 | 0.04–0.12 | Tatel & Ackerman's 2025 meta-analysis in *Psychological Bulletin* (1,344 effect sizes, 457 reports) established that accuracy-based procedural skills decay at approximately 0.08 SD/month. The model defaults to 0.07 as a slightly conservative implementation, reflecting that active simulation practice provides some ongoing reinforcement between sessions that may slow decay marginally below the meta-analytic average for periods of complete nonuse. |

---

## Estimated Parameters

### E-Learning Curve

| Parameter | Default | Slider Range | Justification |
|---|---|---|---|
| **elearningDecayRate** — Monthly decay rate for passive e-learning | 0.35 | 0.10–0.60 | No single meta-analysis provides a decay rate specifically for leadership e-learning. However, multiple convergent data points support this estimate. The PwC (2020) VR study found e-learners were far less confident in applying skills than classroom or VR learners, suggesting weak encoding. Sitzmann (2011) found simulation games produced only 11% higher declarative knowledge than comparison groups — implying passive formats retain even less. A rate of 0.35/month produces ~50% retention at 2 months and ~15% at 6 months, which aligns with the commonly cited industry figure (often attributed to the "Ebbinghaus curve" but more accurately reflecting training transfer research) that most passive training content is lost within weeks. The range allows users to model anything from very sticky e-learning (0.10, e.g., highly engaging interactive modules with built-in retrieval practice) to forgettable compliance videos (0.60). |
| **elearningFloor** — Residual retention floor (%) | 10 | 5–25 | E-learning about meaningful, job-relevant topics leaves *some* residual trace — unlike nonsense syllables, leadership concepts connect to existing schemas and real-world experience. A 10% floor means that after 24 months, someone retains a faint recognition-level awareness of the concepts (e.g., "I remember something about active listening") without any ability to perform the skill under pressure. This is deliberately set as the lowest floor in the hierarchy. The range accommodates high-quality interactive e-learning (up to 25%) or truly passive slide-based content (as low as 5%). |

### Single Workshop

| Parameter | Default | Slider Range | Justification |
|---|---|---|---|
| **workshopExperientialRatio** — % of learning that is experiential vs. declarative | 55% | 30–80% | A well-designed 2-day leadership workshop typically spends roughly half its time on exercises, role-plays, group activities, and case discussions (experiential) and half on frameworks, models, and facilitated lecture (declarative). The 55% default reflects a good-quality workshop with a practice orientation. A heavily lecture-based program might be 30%; a pure experiential workshop (all exercises, no theory) might reach 80%. This ratio matters because the two components decay at different rates. |
| **workshopDeclDecay** — Monthly decay rate for the declarative component | 0.30 | 0.15–0.45 | The declarative component of a workshop (frameworks, models, theory) decays faster than the experiential component but slower than pure e-learning, because it was learned in a richer context — with discussion, examples, and social reinforcement. A rate of 0.30/month is slower than the e-learning rate (0.35) but faster than the experiential component. This produces ~75% loss of the declarative portion at 4 months, which aligns with Arthur et al.'s (1998) finding of substantial skill loss within a year and the common observation that participants forget specific frameworks within months but retain general impressions longer. |
| **workshopExpDecay** — Monthly decay rate for the experiential component | 0.10 | 0.04–0.18 | The experiential component — what participants learned by *doing* during exercises and role-plays — decays significantly more slowly because it creates episodic memories (vivid, context-rich) and some initial procedural encoding. A rate of 0.10/month produces a half-life of approximately 7 months for the experiential portion, which is consistent with the Tatel & Ackerman procedural half-life of ~6.5 months for accuracy-based skills. The range allows for workshops with very strong experiential design (0.04, where exercises create deep episodic traces) versus superficial exercises that don't create much lasting impact (0.18). |
| **workshopFloor** — Single workshop residual retention floor (%) | 15 | 8–30 | A single 2-day workshop leaves a durable trace: participants remember the experience, retain some behavioral patterns from exercises, and maintain a general orientation toward the skill area even after specific content fades. The 15% default represents this residual — above e-learning (10%) because the workshop created experiential and episodic memories that passive content did not. The range accommodates transformative workshops with strong emotional impact (up to 30%) versus forgettable half-day sessions (as low as 8%). |

### Multi-Workshop Program

| Parameter | Default | Slider Range | Justification |
|---|---|---|---|
| **workshopBoostSubsequent** — Re-boost efficiency for workshops at months 2 and 4 (%) | 80% | 60–95% | When a second or third workshop occurs, it doesn't simply repeat the first — it builds on partially-retained learning. Ebbinghaus's "savings" effect shows that relearning is faster and more efficient than initial learning. The 80% default means each subsequent workshop closes 80% of the gap between current retention and 100%. This is consistent with the savings effect literature and produces realistic re-boost curves where each workshop lifts retention significantly but not all the way back to 100%. The range accommodates workshops that build strongly on each other (95%, e.g., a tightly sequenced program with pre-work) versus loosely connected sessions (60%). |
| **multiWorkshopDecay** — Monthly decay rate between and after workshops | 0.12 | 0.08–0.25 | The multi-workshop decay rate is slower than the single workshop's blended rate because the spacing effect provides additional consolidation. Lacerenza et al. (2017) found spaced leadership training produced δ = 0.88 versus δ = 0.71 for massed formats — a ~24% advantage. A rate of 0.12/month (vs. a blended ~0.18 for single workshop) reflects this spacing benefit. Jørgensen et al. (2025) found distributed practice superior to massed in 15 of 19 direct comparisons, further supporting a slower decay rate for spaced programs. |
| **multiWorkshopFloor** — Multi-workshop residual retention floor (%) | 25% | 15–40% | Three spaced workshops create a meaningfully higher floor than a single event because: (1) multiple retrieval and re-encoding events strengthen the memory trace, (2) real-world application between workshops converts some learning to practiced behavior, and (3) the spacing effect produces more durable encoding. The 25% default is 10pp above the single workshop floor (15%), reflecting the substantial additional investment in learning time and the research-supported advantages of spaced practice. The floor hierarchy must hold: multi-workshop should always be above single workshop. |

### Simulation Practice

| Parameter | Default | Slider Range | Justification |
|---|---|---|---|
| **simBoostBase** — Base retention boost per simulation session (%) | 5% | 2–10% | Each simulation session provides a flat boost to retention through retrieval practice and skill rehearsal. The 5% default is conservative — it represents a single 15-30 minute simulation practice session, not a full training day. The testing effect literature (Roediger & Karpicke, 2006) consistently shows that retrieval practice produces measurable retention benefits even in brief sessions. The range allows for short, low-intensity sims (2%) versus longer, highly challenging sessions with structured debriefing (10%). |
| **simBoostAdaptive** — Adaptive boost factor, scaled by gap from ceiling (%) | 15% | 5–25% | When retention has decayed significantly, a simulation session produces a larger boost because there is more room for improvement and the retrieval difficulty is higher — which the desirable difficulties literature (Bjork & Bjork) shows produces deeper encoding. The 15% default means that if retention is at 60%, the adaptive boost adds 15% × (1 - 0.60) = 6% on top of the base 5%, for a total boost of 11%. If retention is at 90%, the adaptive component adds only 1.5%. This creates a natural self-correcting dynamic where sessions are most impactful when they're most needed. |
| **proceduralConversionRate** — Procedural floor gain per simulation session (%) | 2.5% | 1–5% | This is the key mechanism differentiating simulation from passive learning: each practice session converts some declarative knowledge into procedural memory, raising the retention floor. The 2.5% default means that after 12 biweekly sessions (6 months), the procedural floor reaches approximately 30% — meaning even if all other memory traces decay, the person retains at least 30% of the skill in automated form. This is an estimated parameter with no direct meta-analytic anchor, but it is calibrated to produce outcomes consistent with the Northwestern mastery learning study (89% retention at 12 months with minimal boosters) and the LDHF literature (65%+ at 6 months). |
| **proceduralCeiling** — Maximum achievable procedural floor (%) | 65% | 45–80% | Not all of an interpersonal skill can become fully procedural — unlike typing or bicycle riding, interpersonal skills always require some conscious decision-making and adaptive judgment (the "open skill" characteristic). The 65% ceiling reflects the idea that roughly two-thirds of the skill components can become automated (e.g., active listening habits, default de-escalation responses, structured questioning patterns) while the remaining third always requires conscious, context-dependent judgment. The range allows for simpler skills that can become more automated (80%) versus highly complex adaptive skills (45%). |
| **proceduralBaseDecay** — Monthly decay of the procedural floor during active practice | 0.015 | 0.005–0.03 | Even during active practice periods, the procedural floor erodes very slowly — this reflects the fundamental durability of procedural memory (basal ganglia, cerebellum) versus declarative memory (hippocampus). A rate of 0.015/month means the procedural floor has a half-life of approximately 46 months (~4 years) during active practice, which is consistent with the literature showing procedural memory persists far longer than declarative memory and that amnesic patients retain procedural skills indefinitely. The range allows for very durable procedural encoding (0.005, ~12-year half-life) versus faster-eroding open-skill procedures (0.03, ~2-year half-life). |
| **maintenancePotency** — Effectiveness of maintenance sims vs. intensive sims (%) | 75% | 50–100% | Maintenance sessions (monthly or quarterly) are modelled as somewhat less potent than intensive-phase sessions because: (1) they are typically shorter or less challenging, (2) the learner is already proficient so there is less stretch, and (3) the novelty effect has diminished. The 75% default means maintenance sessions provide three-quarters of the boost and procedural conversion of intensive sessions. This is an estimated parameter — no study directly compares intensive vs. maintenance simulation session potency. The range allows for maintenance programs that are nearly as rigorous as initial training (100%) versus brief check-in sessions (50%). |

### When Practice Stops (Open Skill Decay)

| Parameter | Default | Slider Range | Justification |
|---|---|---|---|
| **openSkillDecayRate** — Monthly decay rate for open/adaptive skills after practice ceases | 0.10 | 0.06–0.15 | When simulation practice stops entirely, interpersonal skills (open skills) decay faster than the 0.07-0.08 rate observed during active practice, because: (1) there is no retrieval practice to counteract forgetting, (2) open skills require adaptive flexibility that erodes without varied challenge, and (3) Ericsson (2004, 2008) documented that even experts experience "premature automation" and gradual skill degradation when deliberate practice ceases. The 0.10 default is 25–40% faster than the active-practice rate. The 1992 overlearning meta-analysis found that cognitive task retention declined even with overlearning, while physical (closed) tasks did not — supporting a faster decay rate for cognitive/adaptive skills. |
| **openSkillProceduralDecay** — Monthly decay of procedural floor when practice has stopped | 0.04 | 0.02–0.08 | When practice stops, the procedural floor erodes faster than during active practice (0.015) but much slower than declarative knowledge — reflecting the fundamental durability of procedural memory even without reinforcement. The 0.04 default gives a half-life of approximately 17 months for the procedural floor after practice ceases. This is slower than declarative decay but faster than closed-skill procedural decay, consistent with the open-skill distinction: interpersonal procedures require more maintenance than fixed motor sequences because they involve adaptive decision-making components stored in prefrontal networks, not just basal ganglia routines. |
| **simStopsFloor** — Ultimate retention floor when all practice has ceased (%) | 32% | 20–45% | Even after all practice stops and significant time passes, someone who completed 6 months of intensive simulation practice retains a meaningful procedural base — they practiced skills dozens of times in varied scenarios, building automated response patterns that don't fully vanish. The 32% default is 7pp above the multi-workshop floor (25%), reflecting the additional procedural encoding from simulation practice. The floor hierarchy must hold: sim-stops should always be above multi-workshop, because the simulation practice created procedural memory that workshops alone did not. The range accommodates estimates from conservative (20%, barely above workshops) to optimistic (45%, substantial lasting procedural encoding). |

---

## User-Choice Parameters (Not Estimated)

| Parameter | Default | Options | Note |
|---|---|---|---|
| **simFrequency** — Weeks between intensive sim sessions | 2 weeks | 1, 2, 3, 4 weeks | User's design choice for the intensive phase. Biweekly is the default based on LDHF literature and practical scheduling considerations. |
| **maintenanceFrequency** — Weeks between maintenance sim sessions | 8 weeks | 4, 6, 8, 10, 12 weeks | User's design choice for the maintenance phase. Bi-monthly (8 weeks) balances the evidence that quarterly may be too infrequent (Matterson et al. 2018 found booster effects lasted ~2 months) with practical scheduling constraints. |

---

## Summary of Floor Hierarchy

The model enforces a logical hierarchy of residual retention floors, where each additional investment in practice depth produces a higher long-term minimum:

| Training Approach | Default Floor | Rationale |
|---|---|---|
| E-learning only | 10% | Passive consumption, minimal procedural encoding |
| Single workshop | 15% | Some experiential/episodic memory from exercises |
| Multi-workshop program | 25% | Spacing effect, multiple retrieval events, real-world application between sessions |
| Workshops + sim (practice stops) | 32% | Accumulated procedural encoding from months of varied practice |
| Workshops + sim (maintenance) | No hard floor | Ongoing practice prevents decay to any fixed minimum |
| Workshops + sim (continuous) | No hard floor | Continuous practice maintains near-peak retention |

If any parameter adjustment causes a lower-investment approach to outperform a higher-investment approach at any time horizon, the parameters should be re-examined — that outcome contradicts both the research evidence and common sense.

---

## Key Limitation

No single study has measured all of these parameters for leadership interpersonal skills training specifically. The model synthesizes findings from medical education (where simulation research is most advanced), military training, sports science, cognitive psychology, and the limited but growing body of corporate training research. The estimated parameters represent our best interpolation from this evidence base, not direct measurements. This is why they are user-configurable — so that different assumptions can be tested and the sensitivity of conclusions to specific parameter choices can be evaluated.
