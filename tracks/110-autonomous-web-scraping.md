# Track 110: Autonomous Web Scraping & Market Grounding

## Overview
This architectural change empowers Skylar with the ability to escape its context window and standard AI knowledge cutoff dates by directly querying any external web URL requested by the user, providing real-time market grounding, culture analysis, and specific employer insights.

## Implementation Details
1. **Tool (`scrapeUrl`)**:
   - Developed `scrapeUrl` inside `genkitService.ts`.
   - Takes a `url` string.
2. **Text Extraction Pipeline (`r.jina.ai`)**:
   - Skylar proxies all scrape requests through the `https://r.jina.ai/` endpoint, a free public proxy capable of instantly headless-rendering modern websites and reliably converting their DOM into structured Markdown.
   - Requires no API Keys, reducing dependency overhead, while preventing raw unminified HTML from overflowing the 2M token context window.
   - Built-in string truncation at 25,000 characters enforces that enormous PDFs or infinite-scrolling pages do not overflow Skylar's memory bounds during runtime.
3. **Prompt Augmentation**:
   - Modified `backend/prompts/skylarBase.prompt` to explicitly mention "Market Grounding: Use 'scrapeUrl' to autonomously retrieve content...".

## UI Usage
When users state, "What do you think of this company's latest posting at https://example.com/job?", Skylar's Genkit router will intercept the URL, trigger `scrapeUrl(https://example.com/job)`, and inject the Jina AI Markdown conversion as supplementary grounding text directly into the chat flow, analyzing cultural alignment using their internal Extinguishers and Blueprint.
