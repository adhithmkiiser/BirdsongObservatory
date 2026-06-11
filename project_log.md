# Project Log: Avian Bioacoustics Monitoring Dashboard

This log tracks the progress, features, and folder structures implemented for the **“Bioacoustics Monitoring in Lantana Invaded Landscapes”** project dashboard at IISER Tirupati Bird Lab.

---

## 📅 Log Timeline & Completed Actions

### 2026-06-11: Full Implementation & Verification
*   **scaffolded React App**: Initialized React 19 + TypeScript + Vite project inside the `Code/` directory using non-interactive template settings.
*   **Installed Visualization Packages**: Configured Leaflet (geographic mapping), Apache ECharts (for richness bar/line plots and species matrices), and Lucide React (vector UI icons).
*   **Ecological Species Merging**: Parsed the researcher's local spreadsheet at `species_ecology_template.xlsx` and merged it with the unique list of 129 detected bird species to construct a fully populated [species_master.xlsx](file:///d:/IISER-T/Dashboard/Location/species_master.xlsx) inside `Location/` (mapping IUCN status, endemic status, foraging guilds, and image search links).
*   **Created Preprocessing Pipeline**: Wrote [preprocess.py](file:///d:/IISER-T/Dashboard/Code/preprocess.py) to parse coordinates, clean site names, process all **6,252 CSV files (58,681 detections)**, and export a compressed database [data.json](file:///d:/IISER-T/Dashboard/Code/src/data/data.json) of just **0.94 MB** (enabling instant browser-only client-side updates).
*   **Coded UI Components**: Designed and coded the sticky header, dropdown site filters, KPI cards, custom-styled map marker popups, species richness histograms, visual heatmaps, indicator abundance ratios, and an autocomplete-enabled bird directory.
*   **Mann-Whitney U Test Engine**: Coded a statistical module in JavaScript [stats.ts](file:///d:/IISER-T/Dashboard/Code/src/utils/stats.ts) that automatically computes standard deviations and runs a **live two-sided Mann-Whitney U test** (calculating exact U-statistics and p-value significance) directly in the browser when filters are applied.
*   **Built Static Production Bundle**: Ran Vite bundling validation (`npm run build`) and confirmed the app compiles successfully without warnings or errors.
*   **Drafted Guides**: Created [README.md](file:///d:/IISER-T/Dashboard/Code/README.md) explaining setup commands and the indexing pipeline.
*   **Split Filtering Scopes**: Refined filtering scopes in `App.tsx` and `RichnessOverview.tsx` so that Global Filters (Landscape Group, Recorder, Confidence Cutoff) drive the KPI cards, MapPanel, and LC vs LI Comparison, while Landscape-Only Filters (ignoring Recorder dropdown) drive the overview table/chart, species matrix heatmap, and indicator species matrix heatmap. Added deduplication for recorder selections when selecting all site groups. Verified bundle integrity and hot-reloading stability.
*   **Collaborative Footer**: Coded and styled a new `Footer.tsx` containing the project's collaboration declaration. Configured it to use the original logo files for IISER Tirupati (`/iiser tpt.png`) and The Shola Trust (`/The_shola_trust.avif`) copied from the dashboard logo repository, while omitting the Tamil Nadu Forest Department logo image for now (retaining partnership text). Integrated footer styling into `index.css`.



---

## 📂 Active File Directory

*   **Preprocess Script**: [preprocess.py](file:///d:/IISER-T/Dashboard/Code/preprocess.py)
*   **Types & Configurations**: [types.ts](file:///d:/IISER-T/Dashboard/Code/src/types.ts) | [config.json](file:///d:/IISER-T/Dashboard/Code/src/data/config.json)
*   **Main Dashboard Entry**: [App.tsx](file:///d:/IISER-T/Dashboard/Code/src/App.tsx) | [index.html](file:///d:/IISER-T/Dashboard/Code/index.html)
*   **Footer Component**: [Footer.tsx](file:///d:/IISER-T/Dashboard/Code/src/components/Footer.tsx)
*   **Vanilla Stylesheet**: [index.css](file:///d:/IISER-T/Dashboard/Code/src/index.css)
*   **Guide and Setup**: [README.md](file:///d:/IISER-T/Dashboard/Code/README.md)
*   **Locations Metadata Spreadsheet**: [TST recorder locations.xlsx](file:///d:/IISER-T/Dashboard/Location/TST%20recorder%20locations.xlsx)
*   **Species Master Spreadsheet**: [species_master.xlsx](file:///d:/IISER-T/Dashboard/Location/species_master.xlsx)
