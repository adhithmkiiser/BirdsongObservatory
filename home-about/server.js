import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Helper to fully rebuild data.json by fetching all files from Supabase
async function rebuildDataJson(projectId) {
  let currentData = { base_date: "2026-01-11", recorders: [], species_list: [], species_metadata: {}, detections: [] };
  const baseDate = new Date(currentData.base_date);

  // 1. Get all sites (folders) in this project
  const { data: sites } = await supabase.storage.from('observatory-data').list(projectId);
  if (!sites) return;

  for (const site of sites) {
    if (!site.id) continue; // Skip files, we only want folders (sites)
    
    const siteId = site.name;
    const { data: files } = await supabase.storage.from('observatory-data').list(`${projectId}/${siteId}`);
    if (!files) continue;

    for (const file of files) {
      if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        const { data: fileData } = await supabase.storage.from('observatory-data').download(`${projectId}/${siteId}/${file.name}`);
        if (!fileData) continue;
        
        const content = await fileData.text();
        const isTab = file.name.endsWith('.txt');
        const lines = content.split(/\r?\n/);
        
        if (lines.length > 1) {
          const delimiter = isTab ? '\t' : ',';
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
          const commonNameIdx = headers.findIndex(h => h.toLowerCase() === 'common name' || h.toLowerCase() === 'common_name');
          const sciNameIdx = headers.findIndex(h => h.toLowerCase() === 'scientific name' || h.toLowerCase() === 'scientific_name' || h.toLowerCase() === 'species');
          const confIdx = headers.findIndex(h => h.toLowerCase() === 'confidence');

          const parts = file.name.split('_');
          let fileDate = new Date();
          let hour = 0;
          if (parts.length >= 3) {
            const dateStr = parts[1];
            const timeStr = parts[2];
            if (dateStr.length === 8) {
              fileDate = new Date(parseInt(dateStr.substring(0, 4)), parseInt(dateStr.substring(4, 6)) - 1, parseInt(dateStr.substring(6, 8)));
            }
            if (timeStr.length >= 2) {
              hour = parseInt(timeStr.substring(0, 2), 10);
            }
          }

          const dateOffset = Math.round((fileDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
          const recKey = siteId;
          let rIdx = currentData.recorders.findIndex(r => r.site_group === siteId);
          if (rIdx === -1) {
            currentData.recorders.push({ site_group: siteId, recorder_id: siteId, habitat: 'LC', actual_files: 0 });
            rIdx = currentData.recorders.length - 1;
          }
          currentData.recorders[rIdx].actual_files += 1;

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
              let spIdx = currentData.species_list.indexOf(commonName);
              if (spIdx === -1) {
                currentData.species_list.push(commonName);
                spIdx = currentData.species_list.length - 1;
                currentData.species_metadata[commonName] = {
                  scientific: scientificName, endemic: 'No', iucn: 'LC'
                };
              }
              currentData.detections.push([rIdx, spIdx, dateOffset, hour, Math.round(confidence * 100)]);
            }
          }
        }
      }
    }
  }

  await supabase.storage.from('observatory-data').upload(`${projectId}/data.json`, JSON.stringify(currentData), { upsert: true });
}

// 1. Create Project
app.post('/api/create-project', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) throw new Error('Missing projectId');
    const { error } = await supabase.from('projects').insert([{ id: projectId, name: projectId }]);
    if (error && error.code !== '23505') throw error;
    res.json({ success: true, message: `Created project ${projectId}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Create Site
app.post('/api/create-site', async (req, res) => {
  try {
    const { projectId, siteId } = req.body;
    if (!projectId || !siteId) throw new Error('Missing projectId or siteId');
    const { error } = await supabase.from('sites').insert([{ id: siteId, project_id: projectId, name: siteId }]);
    if (error && error.code !== '23505') throw error;
    res.json({ success: true, message: `Created site ${siteId}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Upload File
app.post('/api/upload-file', async (req, res) => {
  try {
    const { projectId, siteId, filename, content } = req.body;
    if (!projectId || !siteId || !filename || content === undefined) {
      throw new Error('Missing parameters');
    }

    // Save raw file to Supabase Storage
    const storagePath = `${projectId}/${siteId}/${filename}`;
    const { error: uploadError } = await supabase.storage.from('observatory-data').upload(storagePath, content, { upsert: true });
    if (uploadError) throw uploadError;

    // Trigger full rebuild of data.json to ensure accurate data
    await rebuildDataJson(projectId);

    res.json({ success: true, message: 'File written successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. List Files
app.post('/api/list-files', async (req, res) => {
  try {
    const { projectId, siteId } = req.body;
    if (!projectId || !siteId) throw new Error('Missing parameters');
    
    const { data, error } = await supabase.storage.from('observatory-data').list(`${projectId}/${siteId}`);
    if (error) throw error;
    
    const files = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => f.name);
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete File
app.post('/api/delete-file', async (req, res) => {
  try {
    const { projectId, siteId, filename } = req.body;
    if (!projectId || !siteId || !filename) throw new Error('Missing parameters');
    
    const storagePath = `${projectId}/${siteId}/${filename}`;
    const { error } = await supabase.storage.from('observatory-data').remove([storagePath]);
    if (error) throw error;

    // Trigger full rebuild of data.json after deletion
    await rebuildDataJson(projectId);

    res.json({ success: true, message: 'File deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Get Dashboard Data - (Deprecated, frontend fetches directly from Supabase CDN now)
app.post('/api/get-dashboard-data', async (req, res) => {
  res.json({ success: true, message: 'Deprecated. Fetch data.json from Supabase CDN.' });
});

// Serve frontend static files in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
