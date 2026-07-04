import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Root workspace folder (BirdsongObservatory)
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '500mb' })); // Support large BirdNET files
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// 1. Create Project folders
app.post('/api/create-project', (req, res) => {
  try {
    const projId = req.body.projectId;
    if (!projId) throw new Error('Missing projectId');

    const projDir = path.join(rootDir, 'dashboard', projId);
    const dataDir = path.join(projDir, 'data');
    const locationDir = path.join(projDir, 'Location');

    if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true });
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(locationDir)) fs.mkdirSync(locationDir, { recursive: true });

    const tstCodesDir = path.join(rootDir, 'dashboard', 'tst', 'codes');
    const destCodesDir = path.join(projDir, 'codes');
    if (fs.existsSync(tstCodesDir) && !fs.existsSync(destCodesDir)) {
      fs.mkdirSync(destCodesDir, { recursive: true });
      fs.readdirSync(tstCodesDir).forEach(file => {
        fs.copyFileSync(path.join(tstCodesDir, file), path.join(destCodesDir, file));
      });
    }

    res.json({ success: true, message: `Created project directory dashboard/${projId}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Create Site folder
app.post('/api/create-site', (req, res) => {
  try {
    const { projectId, siteId } = req.body;
    if (!projectId || !siteId) throw new Error('Missing projectId or siteId');

    const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId;
    const resolvedSiteId = projectId === 'tst-lantana' ? siteId.toUpperCase() : siteId;

    const siteDir = resolvedProjId === 'tst'
      ? path.join(rootDir, 'dashboard', 'tst', 'data', 'DATA', resolvedSiteId)
      : path.join(rootDir, 'dashboard', resolvedProjId, 'data', resolvedSiteId);

    if (!fs.existsSync(siteDir)) {
      fs.mkdirSync(siteDir, { recursive: true });
    }

    res.json({ success: true, message: `Created site folder: ${siteDir}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Upload File to Site data folder
app.post('/api/upload-file', (req, res) => {
  try {
    const { projectId, siteId, filename, content } = req.body;
    if (!projectId || !siteId || !filename || content === undefined) {
      throw new Error('Missing parameters');
    }

    const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId;
    const resolvedSiteId = projectId === 'tst-lantana' ? siteId.toUpperCase() : siteId;

    const baseSiteDir = resolvedProjId === 'tst'
      ? path.join(rootDir, 'dashboard', 'tst', 'data', 'DATA', resolvedSiteId)
      : path.join(rootDir, 'dashboard', resolvedProjId, 'data', resolvedSiteId);

    if (!fs.existsSync(baseSiteDir)) {
      fs.mkdirSync(baseSiteDir, { recursive: true });
    }

    let targetDir = baseSiteDir;
    if (resolvedProjId === 'tst') {
      const subdirs = fs.readdirSync(baseSiteDir).filter(f => fs.statSync(path.join(baseSiteDir, f)).isDirectory());
      const prefix = filename.split('_')[0];
      const matchedSubdir = subdirs.find(sd => {
        const sdPath = path.join(baseSiteDir, sd);
        return fs.readdirSync(sdPath).some(f => f.startsWith(prefix));
      });

      if (matchedSubdir) {
        targetDir = path.join(baseSiteDir, matchedSubdir);
      } else {
        const match = filename.match(/TST-(\d+)/);
        let subFolder = 'LC_01';
        if (match) {
          const num = parseInt(match[1], 10);
          if (num === 10) subFolder = 'LC_01';
          else if (num === 11) subFolder = 'LC_02';
          else if (num === 12) subFolder = 'LC_03';
          else if (num === 9) subFolder = 'LI_01';
          else if (num === 13) subFolder = 'LI_02';
          else if (num === 14) subFolder = 'LI_03';
          else if (num === 15) subFolder = 'LI_04';
        }
        targetDir = path.join(baseSiteDir, subFolder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }
    }

    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');

    res.json({ success: true, message: 'File written successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. List Files inside Site
app.post('/api/list-files', (req, res) => {
  try {
    const { projectId, siteId } = req.body;
    if (!projectId || !siteId) throw new Error('Missing parameters');

    const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId;
    const resolvedSiteId = projectId === 'tst-lantana' ? siteId.toUpperCase() : siteId;

    const siteDir = resolvedProjId === 'tst'
      ? path.join(rootDir, 'dashboard', 'tst', 'data', 'DATA', resolvedSiteId)
      : path.join(rootDir, 'dashboard', resolvedProjId, 'data', resolvedSiteId);

    let files = [];
    if (fs.existsSync(siteDir)) {
      const getFilesRecursively = (dir) => {
        let results = [];
        fs.readdirSync(dir).forEach((file) => {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isDirectory()) {
            getFilesRecursively(filePath).forEach((sf) => {
              results.push(path.join(file, sf).replace(/\\/g, '/'));
            });
          } else {
            results.push(file);
          }
        });
        return results;
      };
      files = getFilesRecursively(siteDir);
    }

    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete File
app.post('/api/delete-file', (req, res) => {
  try {
    const { projectId, siteId, filename } = req.body;
    if (!projectId || !siteId || !filename) throw new Error('Missing parameters');

    const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId;
    const resolvedSiteId = projectId === 'tst-lantana' ? siteId.toUpperCase() : siteId;

    const baseDir = resolvedProjId === 'tst'
      ? path.join(rootDir, 'dashboard', 'tst', 'data', 'DATA', resolvedSiteId)
      : path.join(rootDir, 'dashboard', resolvedProjId, 'data', resolvedSiteId);

    const filePath = path.join(baseDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'File deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Get Dashboard Data
app.post('/api/get-dashboard-data', (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) throw new Error('Missing projectId');

    const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId;
    const projectDataDir = path.join(rootDir, 'dashboard', resolvedProjId, 'data');

    // Return pre-generated data.json if it exists (for TST mainly)
    if (resolvedProjId === 'tst') {
      const dataFilePath = path.join(projectDataDir, 'data.json');
      if (fs.existsSync(dataFilePath)) {
        return res.json(JSON.parse(fs.readFileSync(dataFilePath, 'utf8')));
      }
    }

    // Process fresh data from CSVs
    const defaultPath = path.join(rootDir, 'dashboard', 'tst', 'data', 'data.json');
    let defaultData = { species_metadata: {}, species_list: [] };
    if (fs.existsSync(defaultPath)) {
      defaultData = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    }
    const speciesMetadata = { ...defaultData.species_metadata };
    const speciesList = [ ...defaultData.species_list ];

    const allFiles = [];
    if (fs.existsSync(projectDataDir)) {
      const scanFiles = (dir) => {
        fs.readdirSync(dir).forEach(file => {
          const fp = path.join(dir, file);
          if (fs.statSync(fp).isDirectory()) {
            scanFiles(fp);
          } else if (file !== 'data.json' && (file.endsWith('.csv') || file.endsWith('.txt'))) {
            allFiles.push(fp);
          }
        });
      };
      scanFiles(projectDataDir);
    }

    const recordersList = [];
    const recorderToIdx = {};
    const rawDetections = [];
    const activeRecorders = new Set();
    let baseDate = new Date(2026, 1, 11);
    let baseDateAssigned = false;

    const filesMeta = [];
    allFiles.forEach(fp => {
      const rel = path.relative(projectDataDir, fp).replace(/\\/g, '/');
      const parts = path.basename(fp).split('_');
      let fileDate = null;
      let hour = 0;

      if (parts.length >= 3) {
        const dateStr = parts[1];
        const timeStr = parts[2];
        if (dateStr.length === 8) {
          const y = parseInt(dateStr.substring(0, 4), 10);
          const m = parseInt(dateStr.substring(4, 6), 10) - 1;
          const d = parseInt(dateStr.substring(6, 8), 10);
          fileDate = new Date(y, m, d);
        }
        if (timeStr.length >= 2) {
          hour = parseInt(timeStr.substring(0, 2), 10);
        }
      }

      if (fileDate && (!baseDateAssigned || fileDate < baseDate)) {
        baseDate = fileDate;
        baseDateAssigned = true;
      }

      const dirParts = path.dirname(rel).split('/');
      const siteGroup = dirParts[0] || 'SITE';
      const recId = dirParts[1] || siteGroup;

      filesMeta.push({ filePath: fp, rel, siteGroup, recId, fileDate, hour });
    });

    filesMeta.forEach(fm => {
      const content = fs.readFileSync(fm.filePath, 'utf8');
      const isTab = fm.filePath.endsWith('.txt');
      const rkey = `${fm.siteGroup}/${fm.recId}`;
      activeRecorders.add(rkey);

      const lines = content.split(/\r?\n/);
      if (lines.length < 2) return;

      const delimiter = isTab ? '\t' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      const commonNameIdx = headers.findIndex(h => h.toLowerCase() === 'common name' || h.toLowerCase() === 'common_name');
      const sciNameIdx = headers.findIndex(h => h.toLowerCase() === 'scientific name' || h.toLowerCase() === 'scientific_name' || h.toLowerCase() === 'species');
      const confIdx = headers.findIndex(h => h.toLowerCase() === 'confidence');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let cols = [];
        if (isTab) {
          cols = line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
        } else {
          let insideQuote = false, entry = '';
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') insideQuote = !insideQuote;
            else if (char === ',' && !insideQuote) { cols.push(entry.trim().replace(/^"|"$/g, '')); entry = ''; }
            else entry += char;
          }
          cols.push(entry.trim().replace(/^"|"$/g, ''));
        }

        if (cols.length < Math.max(commonNameIdx, sciNameIdx, confIdx) + 1) continue;

        const commonName = commonNameIdx !== -1 ? cols[commonNameIdx] : '';
        const scientificName = sciNameIdx !== -1 ? cols[sciNameIdx] : '';
        const confidence = confIdx !== -1 ? parseFloat(cols[confIdx]) : 0;

        if (commonName && !isNaN(confidence) && confidence >= 0.1 && commonName.toLowerCase() !== 'common crane') {
          let spIdx = speciesList.indexOf(commonName);
          if (spIdx === -1) {
            speciesList.push(commonName);
            spIdx = speciesList.length - 1;
            speciesMetadata[commonName] = {
              scientific: scientificName, endemic: 'No', preferred_habitat: 'Unknown',
              guild: 'Unknown', vocal_activity: 'Unknown', iucn: 'LC', foraging_stratum: 'Unknown',
              indicator_group: 'Nil', image: '', audio: ''
            };
          }

          const dateOffset = fm.fileDate ? Math.round((fm.fileDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          rawDetections.push({ recKey: rkey, spIdx, dateOffset, hour: fm.hour, conf: confidence });
        }
      }
    });

    const orderedRecKeys = Array.from(activeRecorders).sort();
    orderedRecKeys.forEach((rkey, idx) => {
      recorderToIdx[rkey] = idx;
      const [siteGroup, recId] = rkey.split('/');
      const actualFiles = filesMeta.filter(fm => fm.siteGroup === siteGroup && fm.recId === recId).length;

      recordersList.push({
        site_group: siteGroup, recorder_id: recId,
        habitat: recId.startsWith('LI') ? 'LI' : 'LC',
        latitude: null, longitude: null, size_gb: null, expected_files: null, actual_files: actualFiles
      });
    });

    const compressedDetections = [];
    rawDetections.forEach(det => {
      const rIdx = recorderToIdx[det.recKey];
      if (rIdx !== undefined) {
        compressedDetections.push([rIdx, det.spIdx, det.dateOffset, det.hour, Math.round(det.conf * 100)]);
      }
    });

    const pad = n => n < 10 ? '0' + n : n;
    const baseDateStr = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`;

    const compiledJson = {
      base_date: baseDateStr, recorders: recordersList,
      species_list: speciesList, species_metadata: speciesMetadata, detections: compressedDetections
    };

    if (!fs.existsSync(projectDataDir)) fs.mkdirSync(projectDataDir, { recursive: true });
    fs.writeFileSync(path.join(projectDataDir, 'data.json'), JSON.stringify(compiledJson), 'utf8');

    res.json(compiledJson);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static files in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
