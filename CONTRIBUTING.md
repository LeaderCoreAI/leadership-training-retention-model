# Contributing to the Leadership Training Retention Model

Thank you for your interest in improving this model. This is a research-grounded tool, and we take the integrity of its foundations seriously. Contributions that strengthen the science, improve accuracy, or extend the model's usefulness are welcome.

## How to contribute

### Proposing parameter changes

Every parameter in the model is tagged as either `RESEARCH` (directly from published data) or `ESTIMATED` (interpolated from best available evidence).

If you have evidence that better estimates an `ESTIMATED` parameter:

1. Open an issue titled: `Parameter update: [parameter name]`
2. Include the current default value and your proposed value
3. Cite the published source — peer-reviewed preferred, but high-quality grey literature (meta-analyses, systematic reviews, well-designed organizational studies) is also considered
4. Explain how the source applies to the leadership development context specifically

We will review the evidence and, if it holds up, update the parameter default and credit the contribution.

### Adding new research anchors

If a new study or meta-analysis is relevant to the model:

1. Open an issue titled: `New research: [short description]`
2. Provide the full citation
3. Explain which aspect of the model it informs (decay rates, practice effects, memory systems, etc.)
4. If the research suggests a parameter change, include the specific recommendation

### Proposing new training approaches

The model currently compares six approaches. To propose a seventh:

1. Open an issue titled: `New approach: [approach name]`
2. Define the approach clearly — what does it involve, how is it structured, how does it differ from the existing six
3. Provide at least one published source supporting distinct retention characteristics
4. If possible, suggest the curve generation logic and parameter defaults

### Bug fixes and UI improvements

Standard pull request process. Fork the repo, make your changes, submit a PR with a clear description.

## What we won't merge

- Parameter changes without cited evidence
- Removal or obscuring of research citations or methodology transparency
- Marketing content, promotional language, or product pitches
- Changes that break the model's core principle: every parameter is either research-anchored or transparently estimated

## Code of conduct

Be rigorous. Be respectful. Disagree with evidence, not attitude. This model exists to improve conversations about leadership development — contributions should serve that purpose.

## Questions?

Open an issue or reach out at [leadercore.ai](https://leadercore.ai).
