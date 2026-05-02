# Track 113: Multi-format Asset Generation (PDF/Docx Export)

## Overview
HTML markdown resumes are sufficient for UI feedback, but users require perfectly formatted, downloadable files (PDFs, DOCX) to upload into ATS systems. This track provides Skylar with the capability to autonomously generate these assets and provide download links.

## Implementation Details
1. **Tool (`exportAsset`)**:
   - Developed `exportAssetTool` within `genkitService.ts`.
   - Accepts the `documentContent` (markdown or HTML), `format` (pdf/docx), and `documentName`.
2. **Asset Generation Architecture**:
   - Skylar triggers this tool when the user finalizes a resume or cover letter and asks for a file.
   - Behind the scenes, the tool is structured to interface with a serverless rendering engine (such as Puppeteer/Playwright for PDFs) to convert the optimized layout string into an ATS-friendly, downloadable file.
   - The generated asset download URL is returned to Skylar and stored in the user's `asset_exports` subcollection for future retrieval.
3. **Prompt Augmentation**:
   - Added capabilities to `skylarBase.prompt`: "Multi-format Asset Generation: Use 'exportAsset' to convert parsed layouts or finalized resumes into downloadable PDFs or DOCX files for ATS systems."

## UI Usage
When users state, "Looks good, generate a PDF of this resume," Skylar triggers `exportAssetTool`, which constructs the document and replies with: "I've generated your ATS-optimized PDF. You can download it here: [link]."
