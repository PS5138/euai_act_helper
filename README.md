# EU AI act risks

Utility tool to identify where your company might be at risk of the EU AI act,
and what you can do about it.

## Getting started

This repo contains a frontend data collection form (`fe/`) and backend which uses LLMs to assess your AI act adherence (`be/`). You will need to run both.

### Environment variables

`be/` and `fe/` have examples env files (`.env.example`), but you will need to complete some information
(namely your Anthropic API key for the backend to summarise the data pertaining to the act).
1. In each subfolder copy `.env.example` to `.env`
2. Get your anthropic api key and populate `ANTHROPIC_API_KEY=<your_key>` in the backend .env

### Shortcuts

We've setup a [mise-en-place][mise] (`mise.toml`) file to provide shortcuts for running the app. Once you've installed [mise], you can run this repo with:

```bash
# Install JS and Python dependencies. Only needs to be run once.
mise r install

# Spin up the frontend and backend services.
mise r dev
```

[mise]: https://mise.jdx.dev/
