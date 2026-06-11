# Avian Bioacoustics Monitoring Dashboard

An interactive scientific dashboard developed for the **IISER Tirupati Bird Lab** to analyze and visualize passive acoustic monitoring telemetry data.

*Title*: **“Bioacoustics Monitoring in Lantana Invaded Landscapes”**

This application provides a modern, stakeholder-ready visualization of bird species richness, restoration recovery indicators, and ecological profiles across landscapes that are Lantana-Cleared (LC) vs. Lantana-Infested (LI).

---

## 📂 Project Structure

```
d:\IISER-T\Dashboard\
├── Location/
│   ├── TST recorder locations.xlsx   # Coordinates (DMS format) & survey effort metadata
│   └── species_master.xlsx           # Curated species list (IUCN status, endemics, guilds, images)
├── DATA/                             # Mother folder for acoustic surveys
│   ├── ATR_01/                       # Site Group subfolder
│   │   ├── LC_01/                    # Recorder folder (Lantana-Cleared)
│   │   │   └── *.csv                 # BirdNET results CSVs
│   │   ├── LI_01/                    # Recorder folder (Lantana-Infested)
│   │   │   └── *.csv
│   │   └── ...
│   ├── STR_01/
│   └── STR_02/
└── Code/                             # Dashboard React App source
    ├── preprocess.py                 # Data Engineering pipeline script
    ├── package.json
    ├── index.html
    └── src/
        ├── App.tsx                   # Main state & filters controller
        ├── types.ts                  # TypeScript interfaces
        ├── index.css                 # Custom scientific light-theme styling (glassmorphism)
        ├── data/
        │   ├── config.json           # Editable configurations (indicators, labels)
        │   └── data.json             # Output of preprocess.py (compressed dataset)
        ├── utils/
        │   └── stats.ts              # Statistical engine (Mann-Whitney U Test calculations)
        └── components/
            ├── Header.tsx            # Sticky top project info bar
            ├── FilterBar.tsx         # Site & confidence filters
            ├── SummaryCards.tsx      # KPI numeric cards
            ├── MapPanel.tsx          # Leaflet geographic maps
            ├── RichnessComparison.tsx# LC vs LI comparison & boxplot stats
            ├── RichnessOverview.tsx  # Detailed richness listing & chart
            ├── HeatmapPanel.tsx      # Interactive species-site matrices
            └── BirdSearch.tsx        # Bird Explorer & ecological profiles search
```

---

## 🛠️ Data Preprocessing & Compression

To achieve instant loading times and real-time client-side filtering (even on tablets and mobile displays), a Python script compiles the **6,252 separate CSV files** into a single compressed `data.json` file (~0.94MB) by mapping strings (recorder names, species names) to integer indices.

### Preprocessing Actions:
1. Coordinates are loaded from `Location/TST recorder locations.xlsx`. Latitudes and longitudes are parsed from Degrees-Minutes-Seconds (DMS) format (e.g. `10°28'17.85"N`) into Decimal Degrees (DD).
2. The site folder structure is scanned recursively to map site groups (e.g., `ATR_01`) and recorder IDs (e.g., `LC_01`).
3. Detections are filtered dynamically in Python to keep all records above `0.70` confidence.
4. Species attributes are joined from `Location/species_master.xlsx`.
5. Outputs are exported to `Code/src/data/data.json`.

**To run the preprocessing script again:**
```bash
# From the project root (d:\IISER-T\Dashboard)
python Code/preprocess.py
```

---

## 🚀 Setting Up the Local Dashboard

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Install Dependencies
Change directory to `Code/` and run install:
```bash
cd Code
npm install
```

### 2. Run the Development Server
Launch the local dev server:
```bash
npm run dev
```
The server will boot and display a local URL (usually `http://localhost:5173`). Open this URL in any browser to interact with the dashboard.

### 3. Build Production Bundle
To compile a production-ready, fully static bundle (suitable for offline usage or hosting on GitHub Pages / Netlify):
```bash
npm run build
```
This generates optimized HTML, CSS, and JS assets in the `Code/dist/` directory.

---

## 🗒️ Configuration Options

The list of indicator species, default thresholds, and labels are stored in the editable JSON file [config.json](file:///d:/IISER-T/Dashboard/Code/src/data/config.json). You can edit this file to add new indicators or modify text descriptions without altering React code:

*   `indicator_species.recovery`: Array of species common names that are restoration recovery-associated.
*   `indicator_species.lantana`: Array of species common names that are lantana-associated.
*   `confidence_threshold_default`: Set to `0.70` as default.
*   `display_labels.LC` and `display_labels.LI`: Visual display text labels for cleared and infested sites.

---

## 📜 Key Features & Design System
*   **Color-Coded Habitat Profiles**: Green family represents Lantana-Cleared (LC) sites, and Red/Orange/Amber represents Lantana-Infested (LI) sites. Slate is used for neutral, global summaries.
*   **Mann-Whitney U Test Engine**: Section 2 computes a live two-sided Mann-Whitney U test inside the browser, calculating statistical significance (U-statistic and p-value) dynamically based on the active landscape filters!
*   **Diurnal Detections Chart**: The Avian Species Explorer generates bar charts of bird call detections by hour of day (00:00 to 23:00) to trace vocal activity patterns.
*   **Download Matrix Options**: Download aggregated site performance tables, species detection matrices, or profiles directly to Excel/CSV spreadsheets.
*   **Strict Terminology Compliance**: All labels, charts, metrics, and documentation use "LI" (Lantana-Infested), with zero instances of "NLC".
