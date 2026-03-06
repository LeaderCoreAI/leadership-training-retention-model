# Leadership Training Retention Model

An interactive, research-grounded model comparing leadership skill retention across six training approaches over 24 months.

**[Try the live interactive model →](https://leadercore.ai/leadership-training-retention)**

---

## What this is

Most leadership training loses the majority of its impact within months. Everyone in L&D knows this. Almost nobody can show it.

This model makes the decay visible — and makes the case for practice visible too.

It visualizes retention trajectories for six approaches to leadership development, from passive e-learning to continuous simulation practice, across a 24-month horizon. Every parameter is either anchored directly in published research or estimated from best available evidence and clearly labeled. The estimated parameters are adjustable — so you can test your own assumptions.

This is an exploratory model, not a predictive one. It is designed to support better conversations about training retention, not to replace judgment.

---

## The six approaches

| Approach | What it models | 24-month default retention |
|---|---|---|
| **E-Learning Only** | Passive content delivery | ~10% |
| **Single Workshop** | One-time experiential session | ~15% |
| **3 Workshops** (mo 0, 2, 4) | Spaced workshop program | ~25% |
| **Workshops + Sim → Stops at Mo 6** | 6 months of practice, then nothing | ~32% |
| **Workshops + Sim → Maintenance** | Intensive practice, then reduced frequency | ~65% |
| **Workshops + Continuous Sim** | Ongoing biweekly practice | ~73% |

Default values. Adjust parameters in the interactive model to test different assumptions.

---

## Research anchors

The model draws on six primary bodies of research:

- **Ebbinghaus (1885)** — foundational memory decay research
- **Cook et al. (2011)** — instructional design and skill decay in health professions
- **Tatel & Ackerman (2025)** — meta-analysis on skill retention, open vs. closed skill decay rates (~0.08 SD/month for open skills)
- **Lacerenza et al. (2017)** — meta-analysis of leadership training effectiveness (*Journal of Applied Psychology*)
- **Ericsson (2004, 2008)** — deliberate practice framework
- **Jørgensen et al. (2025)** — spacing effects in professional skill development

Every parameter in the code is tagged as `RESEARCH` (from published data) or `ESTIMATED` (interpolated, user-adjustable). The model defaults `simActiveDecayRate` to 0.07 as a conservative implementation of the ~0.08 SD/month literature finding.

**[Read the full research methodology (PDF) →](https://leadercore.ai/leadership-training-retention-research-leadercoreai.pdf)**

---

## Key model concepts

**Dual-memory system.** The model separates declarative memory (knowing what to do) from procedural memory (being able to do it under pressure). Workshops primarily build declarative knowledge. Simulation practice converts it into procedural memory, which decays more slowly.

**Procedural memory as a rising floor.** Repeated practice sessions raise a procedural memory baseline that resists further decay. This models the real-world observation that well-practiced skills are more durable than recently learned knowledge.

**Open skill decay.** Leadership skills are modeled as open skills — adaptive, context-dependent, requiring judgment. They decay faster than closed skills when practice stops (Tatel & Ackerman, 2025).

---

## Getting started

### Prerequisites

- React 18+
- Recharts

### Installation

```bash
# Clone the repository
git clone https://github.com/LeaderCoreAI/leadership-training-retention-model.git
cd leadership-training-retention-model

# Install dependencies
npm install

# Run locally
npm start
```

### Usage

The model is a single React component:

```jsx
import RetentionModel from './forgetting-curves-comparison';

function App() {
  return <RetentionModel />;
}
```

The component is self-contained — all parameters, curve generators, and UI are in one file.

### Embedding

To embed the model on your own site, include the component in your React application or use an iframe pointing to a hosted version. The `ResponsiveContainer` from Recharts handles responsive sizing automatically.

---

## Parameters

All 20 parameters are documented in the source code with inline comments. Here are the key ones:

| Parameter | Default | Tag | What it controls |
|---|---|---|---|
| `simActiveDecayRate` | 0.07 | RESEARCH | Monthly decay rate during active practice (~0.08 SD/mo in literature) |
| `elearningDecayRate` | 0.35 | ESTIMATED | How fast passive e-learning fades |
| `workshopExperientialRatio` | 55% | ESTIMATED | Portion of workshop learning that is experiential vs. lecture |
| `proceduralConversionRate` | 2.5% | ESTIMATED | Procedural memory floor gain per simulation session |
| `proceduralCeiling` | 65% | ESTIMATED | Maximum procedural floor achievable through practice |
| `openSkillDecayRate` | 0.10 | ESTIMATED | Faster-than-closed-skill decay when practice stops |
| `maintenancePotency` | 75% | ESTIMATED | Effectiveness of maintenance vs. intensive practice sessions |

Open the interactive model and click "Show Model Parameters" for the full list with sliders and explanations.

---

## Contributing

This is a living model. We welcome contributions that improve its accuracy, extend its scope, or strengthen its research foundations.

**Ways to contribute:**

- **Parameter improvements.** If you have published data that better estimates any `ESTIMATED` parameter, open an issue with the citation and proposed value. We take research sourcing seriously.
- **New research anchors.** If a new meta-analysis or study provides evidence relevant to the model, we want to know about it.
- **Additional training approaches.** The model currently covers six approaches. If there's a well-defined approach with distinct retention characteristics that should be included, propose it with supporting evidence.
- **Bug fixes and UI improvements.** Standard pull request process.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

### What we won't merge

- Changes that remove or obscure research citations
- Parameters changed without evidence
- Marketing or promotional content

---

## Citation

If you use this model in research, presentations, or publications:

```
LeaderCoreAI. (2026). Leadership Training Retention Model: An interactive 
research-grounded model comparing skill retention across training approaches. 
https://github.com/LeaderCoreAI/leadership-training-retention-model
```

Or in APA format:

```
LeaderCoreAI. (2026). Leadership training retention model [Interactive web application]. 
https://leadercore.ai/leadership-training-retention
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.

The model code is free to use, modify, and distribute. The LeaderCoreAI name and logo are trademarks and are not covered by the MIT license.

---

## Links

- **[Interactive model](https://leadercore.ai/leadership-training-retention)** — try it live, adjust parameters, compare approaches
- **[Research methodology (PDF)](https://leadercore.ai/leadership-training-retention-research-leadercoreai.pdf)** — full literature review, parameter justifications, and model design rationale
- **[Research methodology (web)](https://leadercore.ai/leadership-training-retention-research)** — same content, indexable
- **[LeaderCoreAI](https://leadercore.ai)** — AI-powered leadership simulation platform

---

Built by [LeaderCoreAI](https://leadercore.ai). We build tools that help leaders practice the skills that matter — because content without practice fades.
