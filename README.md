# EU AI act risks

**<u>NOTE: Ongoing development is happening at [TTitcombe/euai_act_helper](https://github.com/TTitcombe/euai_act_helper).</u>**

---

Utility tool to identify where your company might be at risk of the EU AI act,
and what you can do about it.

## Getting started

### Environment variables

The root has an example env file (`.env.example`), but you will need to complete some information
(namely your Anthropic API key for the backend to summarise the data pertaining to the act).
1. Copy `.env.example` to `.env`
2. Get your anthropic api key and populate `ANTHROPIC_API_KEY=<your_key>`

### Shortcuts

We've setup a [mise-en-place][mise] (`mise.toml`) file to provide shortcuts for running the app. Once you've installed [mise], you can run this repo with:

```bash
npm i

# Spin up the frontend and backend services.
mise r dev
```

[mise]: https://mise.jdx.dev/
