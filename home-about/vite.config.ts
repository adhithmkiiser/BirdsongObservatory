import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve workspace directories
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..') // Root workspace folder

const devFsApiPlugin = () => ({
  name: 'dev-fs-api',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (!req.url) return next()

      // 1. Create Project folders (data, Location)
      if (req.url.startsWith('/api/create-project') && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const projId = data.projectId
            if (!projId) throw new Error('Missing projectId')

            const projDir = path.join(rootDir, 'dashboard', projId)
            const dataDir = path.join(projDir, 'data')
            const locationDir = path.join(projDir, 'Location')

            // Create directories recursively
            if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true })
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
            if (!fs.existsSync(locationDir)) fs.mkdirSync(locationDir, { recursive: true })

            // Copy dashboard code files from tst/codes to new project codes folder
            const tstCodesDir = path.join(rootDir, 'dashboard', 'tst', 'codes')
            const destCodesDir = path.join(projDir, 'codes')
            if (fs.existsSync(tstCodesDir) && !fs.existsSync(destCodesDir)) {
              fs.mkdirSync(destCodesDir, { recursive: true })
              fs.readdirSync(tstCodesDir).forEach(file => {
                fs.copyFileSync(path.join(tstCodesDir, file), path.join(destCodesDir, file))
              })
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, message: `Created project directory dashboard/${projId}` }))
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
        return
      }

      // 2. Create Site folder inside project data
      if (req.url.startsWith('/api/create-site') && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const { projectId, siteId } = data
            if (!projectId || !siteId) throw new Error('Missing projectId or siteId')

            const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId
            const resolvedSiteId = projectId === 'tst-lantana' ? siteId.toUpperCase() : siteId

            const siteDir = resolvedProjId === 'tst'
              ? path.join(rootDir, 'dashboard', 'tst', 'data', 'DATA', resolvedSiteId)
              : path.join(rootDir, 'dashboard', resolvedProjId, 'data', resolvedSiteId)

            if (!fs.existsSync(siteDir)) {
              fs.mkdirSync(siteDir, { recursive: true })
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, message: `Created site folder: ${siteDir}` }))
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
        return
      }

      // 3. Upload File to Site data folder
      if (req.url.startsWith('/api/upload-file') && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const { projectId, siteId, filename, content } = data
            if (!projectId || !siteId || !filename || content === undefined) {
              throw new Error('Missing parameters')
            }

            const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId
            const resolvedSiteId = projectId === 'tst-lantana' ? siteId.toUpperCase() : siteId

            const baseSiteDir = resolvedProjId === 'tst'
              ? path.join(rootDir, 'dashboard', 'tst', 'data', 'DATA', resolvedSiteId)
              : path.join(rootDir, 'dashboard', resolvedProjId, 'data', resolvedSiteId)

            if (!fs.existsSync(baseSiteDir)) {
              fs.mkdirSync(baseSiteDir, { recursive: true })
            }

            // Determine final write path
            let targetDir = baseSiteDir
            if (resolvedProjId === 'tst') {
              // Read existing subdirectories like LC_01, LC_02, LI_01, etc.
              const subdirs = fs.readdirSync(baseSiteDir).filter(f => fs.statSync(path.join(baseSiteDir, f)).isDirectory())
              const prefix = filename.split('_')[0] // e.g. TST-10

              const matchedSubdir = subdirs.find(sd => {
                const sdPath = path.join(baseSiteDir, sd)
                return fs.readdirSync(sdPath).some(f => f.startsWith(prefix))
              })

              if (matchedSubdir) {
                targetDir = path.join(baseSiteDir, matchedSubdir)
              } else {
                // Fallback mapping if no file matches prefix
                const match = filename.match(/TST-(\d+)/)
                let subFolder = 'LC_01'
                if (match) {
                  const num = parseInt(match[1])
                  if (num === 10) subFolder = 'LC_01'
                  else if (num === 11) subFolder = 'LC_02'
                  else if (num === 12) subFolder = 'LC_03'
                  else if (num === 9) subFolder = 'LI_01'
                  else if (num === 13) subFolder = 'LI_02'
                  else if (num === 14) subFolder = 'LI_03'
                  else if (num === 15) subFolder = 'LI_04'
                }
                targetDir = path.join(baseSiteDir, subFolder)
                if (!fs.existsSync(targetDir)) {
                  fs.mkdirSync(targetDir, { recursive: true })
                }
              }
            }

            const filePath = path.join(targetDir, filename)
            fs.writeFileSync(filePath, content, 'utf8')

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, message: 'File written successfully.' }))
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
        return
      }

      // 4. List Files inside Site data folder
      if (req.url.startsWith('/api/list-files') && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const { projectId, siteId } = data
            if (!projectId || !siteId) throw new Error('Missing parameters')

            const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId
            const resolvedSiteId = projectId === 'tst-lantana' ? siteId.toUpperCase() : siteId

            const siteDir = resolvedProjId === 'tst'
              ? path.join(rootDir, 'dashboard', 'tst', 'data', 'DATA', resolvedSiteId)
              : path.join(rootDir, 'dashboard', resolvedProjId, 'data', resolvedSiteId)

            let files: string[] = []
            if (fs.existsSync(siteDir)) {
              // Helper to list recursively
              const getFilesRecursively = (dir: string): string[] => {
                let results: string[] = []
                const list = fs.readdirSync(dir)
                list.forEach((file) => {
                  const filePath = path.join(dir, file)
                  const stat = fs.statSync(filePath)
                  if (stat && stat.isDirectory()) {
                    const subFiles = getFilesRecursively(filePath)
                    subFiles.forEach((sf) => {
                      results.push(path.join(file, sf).replace(/\\/g, '/'))
                    })
                  } else {
                    results.push(file)
                  }
                })
                return results
              }
              files = getFilesRecursively(siteDir)
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, files }))
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
        return
      }

      // 5. Delete File from Site data folder
      if (req.url.startsWith('/api/delete-file') && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const { projectId, siteId, filename } = data
            if (!projectId || !siteId || !filename) throw new Error('Missing parameters')

            const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId
            const resolvedSiteId = projectId === 'tst-lantana' ? siteId.toUpperCase() : siteId

            const baseDir = resolvedProjId === 'tst'
              ? path.join(rootDir, 'dashboard', 'tst', 'data', 'DATA', resolvedSiteId)
              : path.join(rootDir, 'dashboard', resolvedProjId, 'data', resolvedSiteId)

            const filePath = path.join(baseDir, filename)
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, message: 'File deleted.' }))
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
        return
      }

      // 6. Get Dashboard preprocessed data.json
      if (req.url.startsWith('/api/get-dashboard-data') && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const { projectId } = data
            if (!projectId) throw new Error('Missing projectId')

            const resolvedProjId = projectId === 'tst-lantana' ? 'tst' : projectId
            const projectDataDir = path.join(rootDir, 'dashboard', resolvedProjId, 'data')

            // For TST project, load pre-generated data.json directly if available
            if (resolvedProjId === 'tst') {
              const dataFilePath = path.join(projectDataDir, 'data.json')
              if (fs.existsSync(dataFilePath)) {
                const content = fs.readFileSync(dataFilePath, 'utf8')
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(content)
                return
              }
            }

            // Seed reference species/metadata from default TST dataset
            const defaultPath = path.join(rootDir, 'dashboard', 'tst', 'data', 'data.json')
            const defaultData = JSON.parse(fs.readFileSync(defaultPath, 'utf8'))
            const speciesMetadata = { ...defaultData.species_metadata }
            const speciesList = [ ...defaultData.species_list ]

            // Look up all raw bioacoustic logs recursively (CSV / TXT)
            const allFiles: string[] = []
            if (fs.existsSync(projectDataDir)) {
              const scanFiles = (dir: string) => {
                const list = fs.readdirSync(dir)
                list.forEach(file => {
                  const fp = path.join(dir, file)
                  const stat = fs.statSync(fp)
                  if (stat.isDirectory()) {
                    scanFiles(fp)
                  } else if (file !== 'data.json' && (file.endsWith('.csv') || file.endsWith('.txt'))) {
                    allFiles.push(fp)
                  }
                })
              }
              scanFiles(projectDataDir)
            }

            const recordersList: any[] = []
            const recorderToIdx: Record<string, number> = {}
            const rawDetections: any[] = []
            const activeRecorders = new Set<string>()
            let baseDate = new Date(2026, 1, 11)
            let baseDateAssigned = false

            // First pass: extract date/time metadata from filenames
            const filesMeta: any[] = []
            allFiles.forEach(fp => {
              const rel = path.relative(projectDataDir, fp).replace(/\\/g, '/')
              const parts = path.basename(fp).split('_')
              let fileDate: Date | null = null
              let hour = 0

              if (parts.length >= 3) {
                const dateStr = parts[1] // YYYYMMDD
                const timeStr = parts[2] // HHMMSS
                if (dateStr.length === 8) {
                  const y = parseInt(dateStr.substring(0, 4))
                  const m = parseInt(dateStr.substring(4, 6)) - 1
                  const d = parseInt(dateStr.substring(6, 8))
                  fileDate = new Date(y, m, d)
                }
                if (timeStr.length >= 2) {
                  hour = parseInt(timeStr.substring(0, 2))
                }
              }

              if (fileDate) {
                if (!baseDateAssigned || fileDate < baseDate) {
                  baseDate = fileDate
                  baseDateAssigned = true
                }
              }

              const dirParts = path.dirname(rel).split('/')
              const siteGroup = dirParts[0] || 'SITE'
              const recId = dirParts[1] || siteGroup

              filesMeta.push({
                filePath: fp,
                rel,
                siteGroup,
                recId,
                fileDate,
                hour
              })
            })

            // Second pass: parse detections inside logs
            filesMeta.forEach(fm => {
              const content = fs.readFileSync(fm.filePath, 'utf8')
              const isTab = fm.filePath.endsWith('.txt')
              const rkey = `${fm.siteGroup}/${fm.recId}`
              activeRecorders.add(rkey)

              const lines = content.split(/\r?\n/)
              if (lines.length < 2) return

              const delimiter = isTab ? '\t' : ','
              const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))

              const commonNameIdx = headers.findIndex(h => h.toLowerCase() === 'common name' || h.toLowerCase() === 'common_name')
              const sciNameIdx = headers.findIndex(h => h.toLowerCase() === 'scientific name' || h.toLowerCase() === 'scientific_name' || h.toLowerCase() === 'species')
              const confIdx = headers.findIndex(h => h.toLowerCase() === 'confidence')

              for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim()
                if (!line) continue

                let cols: string[] = []
                if (isTab) {
                  cols = line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''))
                } else {
                  let insideQuote = false
                  let entry = ''
                  for (let j = 0; j < line.length; j++) {
                    const char = line[j]
                    if (char === '"') {
                      insideQuote = !insideQuote
                    } else if (char === ',' && !insideQuote) {
                      cols.push(entry.trim().replace(/^"|"$/g, ''))
                      entry = ''
                    } else {
                      entry += char
                    }
                  }
                  cols.push(entry.trim().replace(/^"|"$/g, ''))
                }

                if (cols.length < Math.max(commonNameIdx, sciNameIdx, confIdx) + 1) continue

                const commonName = commonNameIdx !== -1 ? cols[commonNameIdx] : ''
                const scientificName = sciNameIdx !== -1 ? cols[sciNameIdx] : ''
                const confidence = confIdx !== -1 ? parseFloat(cols[confIdx]) : 0

                if (commonName && !isNaN(confidence) && confidence >= 0.1 && commonName.toLowerCase() !== 'common crane') {
                  let spIdx = speciesList.indexOf(commonName)
                  if (spIdx === -1) {
                    speciesList.push(commonName)
                    spIdx = speciesList.length - 1
                    speciesMetadata[commonName] = {
                      scientific: scientificName,
                      endemic: 'No',
                      preferred_habitat: 'Unknown',
                      guild: 'Unknown',
                      vocal_activity: 'Unknown',
                      iucn: 'LC',
                      foraging_stratum: 'Unknown',
                      indicator_group: 'Nil',
                      image: '',
                      audio: ''
                    }
                  }

                  const dateOffset = fm.fileDate 
                    ? Math.round((fm.fileDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0

                  rawDetections.push({
                    recKey: rkey,
                    spIdx,
                    dateOffset,
                    hour: fm.hour,
                    conf: confidence
                  })
                }
              }
            })

            // Compile recorders list
            const orderedRecKeys = Array.from(activeRecorders).sort()
            orderedRecKeys.forEach((rkey, idx) => {
              recorderToIdx[rkey] = idx
              const [siteGroup, recId] = rkey.split('/')
              const actualFiles = filesMeta.filter(fm => fm.siteGroup === siteGroup && fm.recId === recId).length

              recordersList.push({
                site_group: siteGroup,
                recorder_id: recId,
                habitat: recId.startsWith('LI') ? 'LI' : 'LC',
                latitude: null,
                longitude: null,
                size_gb: null,
                expected_files: null,
                actual_files: actualFiles
              })
            })

            // Compress detections into structure [rec_idx, species_idx, date_offset, hour, confidence_percentage]
            const compressedDetections: number[][] = []
            rawDetections.forEach(det => {
              const rIdx = recorderToIdx[det.recKey]
              if (rIdx !== undefined) {
                const confInt = Math.round(det.conf * 100)
                compressedDetections.push([rIdx, det.spIdx, det.dateOffset, det.hour, confInt])
              }
            })

            const pad = (n: number) => n < 10 ? '0' + n : n
            const baseDateStr = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`

            const compiledJson = {
              base_date: baseDateStr,
              recorders: recordersList,
              species_list: speciesList,
              species_metadata: speciesMetadata,
              detections: compressedDetections
            }

            // Write preprocessed file to disk
            if (!fs.existsSync(projectDataDir)) {
              fs.mkdirSync(projectDataDir, { recursive: true })
            }
            fs.writeFileSync(path.join(projectDataDir, 'data.json'), JSON.stringify(compiledJson), 'utf8')

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(compiledJson))
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
        return
      }

      next()
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devFsApiPlugin()],
  server: {
    fs: {
      allow: ['..']
    }
  }
})
