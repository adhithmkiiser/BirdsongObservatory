import React, { useState, useEffect } from 'react';
import { 
  FileText, Users, FolderPlus, Save, CheckCircle, 
  Edit2, Globe, Database, Upload, Volume2, Image as ImageIcon, X, Download, RefreshCw
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  tag: string;
  collaboration: string;
  description: string;
  image: string;
}

interface Site {
  id: string;
  projectId: string;
  name: string;
  elevation: string;
  status: string;
  latitude?: number;
  longitude?: number;
  expectedFiles?: number;
}

const normalizeSiteId = (name: string): string => {
  let clean = name.trim().toLowerCase();
  
  if (clean.includes('-') || clean.includes('_') || clean.includes(' ')) {
    const parts = clean.split(/[\s-_]+/);
    return parts.map(p => {
      if (/^\d+$/.test(p)) {
        return p.padStart(2, '0');
      }
      const match = p.match(/^([a-z]+)(\d+)$/);
      if (match && match[1].length > 1) {
        return `${match[1]}_${match[2].padStart(2, '0')}`;
      }
      return p;
    }).join('_');
  }
  
  const match = clean.match(/^([a-z]+)(\d+)$/);
  if (match && match[1].length > 1) {
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    const paddedNum = num.toString().padStart(2, '0');
    return `${prefix}_${paddedNum}`;
  }
  return clean;
};

const AdminDashboard: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'content' | 'projects' | 'species' | 'users' | 'files' | 'backup'>('content');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Manage Content states
  const [introText, setIntroText] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  // 2. Projects & Sites states
  const [sites, setSites] = useState<Site[]>([]);
  
  // Form: Create Project
  const [newProjId, setNewProjId] = useState('');
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjTag, setNewProjTag] = useState('');
  const [newProjCollab, setNewProjCollab] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjImg, setNewProjImg] = useState(''); // base64 or URL

  // Form: Create Site
  const [selectedProjId, setSelectedProjId] = useState('');
  const [newSiteId, setNewSiteId] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteElev, setNewSiteElev] = useState('');
  const [newSiteLat, setNewSiteLat] = useState<number | ''>('');
  const [newSiteLng, setNewSiteLng] = useState<number | ''>('');
  const [newSiteFiles, setNewSiteFiles] = useState<number | ''>('');
  const [newSiteStatus, setNewSiteStatus] = useState('Active');

  // Edit Site Coordinates state
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editSiteProj, setEditSiteProj] = useState('');
  const [editSiteName, setEditSiteName] = useState('');
  const [editSiteElev, setEditSiteElev] = useState('');
  const [editSiteLat, setEditSiteLat] = useState<number | ''>('');
  const [editSiteLng, setEditSiteLng] = useState<number | ''>('');
  const [editSiteFiles, setEditSiteFiles] = useState<number | ''>('');
  const [editSiteStatus, setEditSiteStatus] = useState('');

  // Form: Edit Existing Project states
  const [editingProjId, setEditingProjId] = useState('');
  const [editProjTitle, setEditProjTitle] = useState('');
  const [editProjTag, setEditProjTag] = useState('');
  const [editProjCollab, setEditProjCollab] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');
  const [editProjImg, setEditProjImg] = useState('');

  // About Page editing states
  const [editAboutMissionHeading, setEditAboutMissionHeading] = useState('Our Mission');
  const [editAboutMissionText1, setEditAboutMissionText1] = useState('');
  const [editAboutMissionText2, setEditAboutMissionText2] = useState('');
  const [editAboutWhyHeading, setEditAboutWhyHeading] = useState('Why Bioacoustics?');
  const [editAboutWhyText1, setEditAboutWhyText1] = useState('');
  const [editAboutWhyText2, setEditAboutWhyText2] = useState('');
  const [editAboutBullet1, setEditAboutBullet1] = useState('');
  const [editAboutBullet2, setEditAboutBullet2] = useState('');
  const [editAboutBullet3, setEditAboutBullet3] = useState('');
  const [editAboutBullet4, setEditAboutBullet4] = useState('');
  const [editAboutSideTitle1, setEditAboutSideTitle1] = useState('');
  const [editAboutSideText1, setEditAboutSideText1] = useState('');
  const [editAboutSideTitle2, setEditAboutSideTitle2] = useState('');
  const [editAboutSideText2, setEditAboutSideText2] = useState('');
  const [editAboutSideImg, setEditAboutSideImg] = useState('');
  const [editAboutSideImgCaption, setEditAboutSideImgCaption] = useState('');

  // Workflow steps editing states
  const [editStepTitle1, setEditStepTitle1] = useState('');
  const [editStepDesc1, setEditStepDesc1] = useState('');
  const [editStepTitle2, setEditStepTitle2] = useState('');
  const [editStepDesc2, setEditStepDesc2] = useState('');
  const [editStepTitle3, setEditStepTitle3] = useState('');
  const [editStepDesc3, setEditStepDesc3] = useState('');
  const [editStepTitle4, setEditStepTitle4] = useState('');
  const [editStepDesc4, setEditStepDesc4] = useState('');

  // Deletion confirmation states
  const [showDeleteProjConfirm, setShowDeleteProjConfirm] = useState(false);
  const [showDeleteSiteConfirmId, setShowDeleteSiteConfirmId] = useState<string | null>(null);

  // Files Tab Folder selectors & Inventory states
  const [selectedUploadProjId, setSelectedUploadProjId] = useState('');
  const [selectedUploadSiteId, setSelectedUploadSiteId] = useState('');
  const [siteFilesList, setSiteFilesList] = useState<string[]>([]);

  // 3. Species Ecology states
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [speciesMetadata, setSpeciesMetadata] = useState<Record<string, any>>({});
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [editingSpeciesName, setEditingSpeciesName] = useState<string | null>(null);
  
  // Edit Species Form states
  const [editSciName, setEditSciName] = useState('');
  const [editEndemic, setEditEndemic] = useState('');
  const [editHabitatPref, setEditHabitatPref] = useState('');
  const [editGuild, setEditGuild] = useState('');
  const [editVocalAct, setEditVocalAct] = useState('');
  const [editIucn, setEditIucn] = useState('');
  const [editStratum, setEditStratum] = useState('');
  const [editIndicator, setEditIndicator] = useState('');
  const [editSpeciesImage, setEditSpeciesImage] = useState('');
  const [editSpeciesAudio, setEditSpeciesAudio] = useState('');

  // 4. User Accounts states
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'manager_project' | 'manager_site'>('manager_project');

  // Edit User states
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<'admin' | 'manager_project' | 'manager_site'>('manager_project');

  // Multi-Site permission checklist states
  const [selectedNewUserSites, setSelectedNewUserSites] = useState<string[]>([]);
  const [selectedEditUserSites, setSelectedEditUserSites] = useState<string[]>([]);

  // 5. CSV Import & Site Creation flow states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedSiteCode, setParsedSiteCode] = useState('');
  const [csvSiteAction, setCsvSiteAction] = useState<'existing' | 'create'>('existing');
  
  // CSV inline site creation states
  const [csvNewSiteName, setCsvNewSiteName] = useState('');
  const [csvNewSiteElev, setCsvNewSiteElev] = useState('');
  const [csvNewSiteLat, setCsvNewSiteLat] = useState<number | ''>('');
  const [csvNewSiteLng, setCsvNewSiteLng] = useState<number | ''>('');

  // Load from localStorage
  useEffect(() => {
    // Load home intro
    const savedIntro = localStorage.getItem('homeIntroText') || 
      "We use bioacoustics to measure and monitor biodiversity at landscape scales. By combining rigorous field protocols, automated acoustic identification, and statistical modeling, we assess species richness and avian community dynamics. Our service transforms raw acoustic data into interactive dashboards and reports, providing forest departments, conservation NGOs, and research collaborators with the evidence-based insights required to guide ecological restoration and habitat conservation.";
    setIntroText(savedIntro);

    // Load projects list
    const savedProjs = localStorage.getItem('projects');
    if (savedProjs) {
      const parsedProjs = JSON.parse(savedProjs);
      setProjects(parsedProjs);
      if (parsedProjs.length > 0) {
        setSelectedProjId(parsedProjs[0].id);
        setSelectedUploadProjId(parsedProjs[0].id);
      }
    }

    // Load sites list
    const savedSites = localStorage.getItem('sites');
    if (savedSites) {
      setSites(JSON.parse(savedSites));
    }

    // Load species lists
    const savedSpList = localStorage.getItem('species_list');
    if (savedSpList) setSpeciesList(JSON.parse(savedSpList));

    const savedSpMeta = localStorage.getItem('species_metadata');
    if (savedSpMeta) setSpeciesMetadata(JSON.parse(savedSpMeta));

    // Load users
    const savedUsers = localStorage.getItem('userAccounts');
    if (savedUsers) setUsers(JSON.parse(savedUsers));

    // Load About page copy
    setEditAboutMissionHeading(localStorage.getItem('aboutMissionHeading') || 'Our Mission');
    setEditAboutMissionText1(localStorage.getItem('aboutMissionText1') || "The Birdsong Observatory is a specialized bioacoustics biodiversity monitoring service based at the Bird Ecology Lab, IISER Tirupati. We bridge the gap between advanced computational ecology and practical, on-the-ground conservation action.");
    setEditAboutMissionText2(localStorage.getItem('aboutMissionText2') || "Rather than treating bioacoustics as a purely academic endeavor, the Observatory operates as an active ecological service. We partner with forest departments, conservation trusts, non-governmental organisations, and land managers to design, deploy, and analyze robust acoustic monitoring networks. Our mission is to provide science-based, quantitative ecological evidence that directly informs forest restoration strategies, habitat management, and policy decisions.");
    setEditAboutWhyHeading(localStorage.getItem('aboutWhyHeading') || 'Why Bioacoustics?');
    setEditAboutWhyText1(localStorage.getItem('aboutWhyText1') || "Traditional biodiversity surveys—such as manual point counts, transects, or mist netting—are labor-intensive, seasonal, and often subject to observer bias. They struggle to scale across large landscapes or capture long-term environmental trends.");
    setEditAboutWhyText2(localStorage.getItem('aboutWhyText2') || "Bioacoustics offers a non-invasive, continuous, and highly scalable alternative:");
    setEditAboutBullet1(localStorage.getItem('aboutBullet1') || "Standardized Sampling: Recorders capture the entire soundscape, eliminating subjective variations in observer detection and identification.");
    setEditAboutBullet2(localStorage.getItem('aboutBullet2') || "24/7 Presence: Automated schedules record dawn choruses, nocturnal species, and rare vocalizations that manual surveyors might miss.");
    setEditAboutBullet3(localStorage.getItem('aboutBullet3') || "Verifiable Evidence: Sound recordings act as a permanent, auditable ecological record that can be re-analyzed as classifiers improve.");
    setEditAboutBullet4(localStorage.getItem('aboutBullet4') || "Minimal Disturbance: Unlike physical capture methods, passive recording does not alter wildlife behavior or disrupt ecological patterns.");
    setEditAboutSideTitle1(localStorage.getItem('aboutSideTitle1') || 'Acoustic Monitoring at Scale');
    setEditAboutSideText1(localStorage.getItem('aboutSideText1') || "Passive Acoustic Monitoring (PAM) records the acoustic environment continuously over weeks or months, creating massive audio libraries. We handle the computational complexity of indexing and analyzing these datasets, moving from gigabytes of audio files to precise, actionable species maps.");
    setEditAboutSideTitle2(localStorage.getItem('aboutSideTitle2') || 'Supporting Conservation Workflows');
    setEditAboutSideText2(localStorage.getItem('aboutSideText2') || "Our services are engineered to fit directly into reporting workflows for environmental stakeholders: Baseline Assessments, Restoration Audits, Guild Indicator Tracking, and Climate Elevation mapping.");
    setEditAboutSideImg(localStorage.getItem('aboutSideImg') || "https://images.unsplash.com/photo-1480044965905-02098d419e96?auto=format&fit=crop&w=800&q=80");
    setEditAboutSideImgCaption(localStorage.getItem('aboutSideImgCaption') || 'A vocal songbird perched in forest habitat');

    // Load Workflow steps copy
    setEditStepTitle1(localStorage.getItem('workflowStepTitle1') || 'Data Collection');
    setEditStepDesc1(localStorage.getItem('workflowStepDesc1') || 'Standardized spaced sampling protocol with a minimum distance of 600m to 700m between recording stations to reduce acoustic overlap and ensure representative sampling.');
    setEditStepTitle2(localStorage.getItem('workflowStepTitle2') || 'Automated Processing & Classification');
    setEditStepDesc2(localStorage.getItem('workflowStepDesc2') || 'Raw audio recordings are analyzed using BirdNET and customized acoustic classifiers to identify species detections with high temporal resolution and confidence scores.');
    setEditStepTitle3(localStorage.getItem('workflowStepTitle3') || 'Ecological Analysis & Dashboards');
    setEditStepDesc3(localStorage.getItem('workflowStepDesc3') || 'Detections are aggregated to evaluate species richness, indicator presence, and community structure. Insights are visualised in real-time dashboards and detailed reports.');
    setEditStepTitle4(localStorage.getItem('workflowStepTitle4') || 'Stakeholder Collaboration');
    setEditStepDesc4(localStorage.getItem('workflowStepDesc4') || 'Ecological insights and dashboard utilities are shared directly with forest departments, NGOs, land managers, and research teams to support evidence-based conservation.');
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Fetch files in the folder of the selected site
  const fetchSiteFiles = (projId: string, siteId: string) => {
    if (!projId || !siteId) return;
    fetch('/api/list-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: projId, siteId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSiteFilesList(data.files);
        }
      })
      .catch(err => console.error('Error listing files', err));
  };

  // Sync files whenever upload project or site changes
  useEffect(() => {
    if (selectedUploadProjId && selectedUploadSiteId) {
      fetchSiteFiles(selectedUploadProjId, selectedUploadSiteId);
    } else {
      setSiteFilesList([]);
    }
  }, [selectedUploadProjId, selectedUploadSiteId]);

  // Sync default upload site when upload project changes
  useEffect(() => {
    if (selectedUploadProjId) {
      const filtered = sites.filter(s => s.projectId === selectedUploadProjId);
      if (filtered.length > 0) {
        setSelectedUploadSiteId(filtered[0].id);
      } else {
        setSelectedUploadSiteId('');
      }
    }
  }, [selectedUploadProjId, sites]);

  // Helper: Convert Image File to Base64 String
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler: Save website intro text
  const handleSaveIntro = () => {
    localStorage.setItem('homeIntroText', introText);
    showSuccess('Homepage content updated successfully!');
  };

  // Handler: Save project descriptions from edit card list
  const handleSaveProjectDescriptions = (id: string, text: string) => {
    const updated = projects.map(p => p.id === id ? { ...p, description: text } : p);
    setProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
    showSuccess('Project description saved successfully!');
  };

  // Handler: Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjId || !newProjTitle) return;

    const newProj: Project = {
      id: newProjId.trim().toLowerCase().replace(/\s+/g, '-'),
      title: newProjTitle,
      tag: newProjTag || 'Bioacoustic Survey',
      collaboration: newProjCollab || 'IISER Tirupati Bird Lab',
      description: newProjDesc || 'Project details pending data updates.',
      image: newProjImg || 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
    };

    const updated = [...projects, newProj];
    setProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));

    // Physically create project folder structure on disk
    fetch('/api/create-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: newProj.id })
    }).catch(err => console.error('Error creating local project folder', err));
    
    // reset form
    setNewProjId('');
    setNewProjTitle('');
    setNewProjTag('');
    setNewProjCollab('');
    setNewProjDesc('');
    setNewProjImg('');

    showSuccess(`Project "${newProjTitle}" created successfully!`);
  };

  // Handler: Create Site
  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteId || !newSiteName || !selectedProjId) return;

    const cleanId = normalizeSiteId(newSiteId);
    const newSite: Site = {
      id: cleanId,
      projectId: selectedProjId,
      name: newSiteName,
      elevation: newSiteElev || 'Unknown',
      status: newSiteStatus,
      latitude: newSiteLat !== '' ? Number(newSiteLat) : undefined,
      longitude: newSiteLng !== '' ? Number(newSiteLng) : undefined,
      expectedFiles: newSiteFiles !== '' ? Number(newSiteFiles) : undefined
    };

    const updated = [...sites, newSite];
    setSites(updated);
    localStorage.setItem('sites', JSON.stringify(updated));

    // Physically create site folder structure on disk
    fetch('/api/create-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProjId, siteId: cleanId })
    }).catch(err => console.error('Error creating local site folder', err));
    setSites(updated);
    localStorage.setItem('sites', JSON.stringify(updated));

    setNewSiteId('');
    setNewSiteName('');
    setNewSiteElev('');
    setNewSiteLat('');
    setNewSiteLng('');
    setNewSiteFiles('');

    showSuccess(`Site "${newSiteName}" added successfully with coordinates.`);
  };

  // Handler: Edit Site Coordinates Inline
  const handleStartEditSite = (site: Site) => {
    setEditingSiteId(site.id);
    setEditSiteProj(site.projectId);
    setEditSiteName(site.name);
    setEditSiteElev(site.elevation);
    setEditSiteLat(site.latitude ?? '');
    setEditSiteLng(site.longitude ?? '');
    setEditSiteFiles(site.expectedFiles ?? '');
    setEditSiteStatus(site.status);
  };

  const handleSaveEditSite = (siteId: string) => {
    const updated = sites.map(s => {
      if (s.id === siteId) {
        return {
          ...s,
          projectId: editSiteProj,
          name: editSiteName,
          elevation: editSiteElev,
          latitude: editSiteLat !== '' ? Number(editSiteLat) : undefined,
          longitude: editSiteLng !== '' ? Number(editSiteLng) : undefined,
          expectedFiles: editSiteFiles !== '' ? Number(editSiteFiles) : undefined,
          status: editSiteStatus
        };
      }
      return s;
    });

    setSites(updated);
    localStorage.setItem('sites', JSON.stringify(updated));
    setEditingSiteId(null);
    showSuccess('Site details and project assignments updated successfully!');
  };

  // Handler: Select project to edit, load details
  const handleSelectProjToEdit = (projId: string) => {
    setEditingProjId(projId);
    const p = projects.find(proj => proj.id === projId);
    if (p) {
      setEditProjTitle(p.title);
      setEditProjTag(p.tag);
      setEditProjCollab(p.collaboration);
      setEditProjDesc(p.description);
      setEditProjImg(p.image);
    }
  };

  // Handler: Save Project Modifications
  const handleSaveProjectModifications = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjId) return;

    const updated = projects.map(p => {
      if (p.id === editingProjId) {
        return {
          ...p,
          title: editProjTitle,
          tag: editProjTag,
          collaboration: editProjCollab,
          description: editProjDesc,
          image: editProjImg
        };
      }
      return p;
    });

    setProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
    showSuccess(`Project "${editProjTitle}" details updated successfully!`);
  };

  // Handler: Save About Page content
  const handleSaveAboutPage = () => {
    localStorage.setItem('aboutMissionHeading', editAboutMissionHeading);
    localStorage.setItem('aboutMissionText1', editAboutMissionText1);
    localStorage.setItem('aboutMissionText2', editAboutMissionText2);
    localStorage.setItem('aboutWhyHeading', editAboutWhyHeading);
    localStorage.setItem('aboutWhyText1', editAboutWhyText1);
    localStorage.setItem('aboutWhyText2', editAboutWhyText2);
    localStorage.setItem('aboutBullet1', editAboutBullet1);
    localStorage.setItem('aboutBullet2', editAboutBullet2);
    localStorage.setItem('aboutBullet3', editAboutBullet3);
    localStorage.setItem('aboutBullet4', editAboutBullet4);
    localStorage.setItem('aboutSideTitle1', editAboutSideTitle1);
    localStorage.setItem('aboutSideText1', editAboutSideText1);
    localStorage.setItem('aboutSideTitle2', editAboutSideTitle2);
    localStorage.setItem('aboutSideText2', editAboutSideText2);
    localStorage.setItem('aboutSideImg', editAboutSideImg);
    localStorage.setItem('aboutSideImgCaption', editAboutSideImgCaption);

    showSuccess('About Page copy details saved successfully!');
  };

  // Handler: Save Workflow timeline steps
  const handleSaveWorkflowPage = () => {
    localStorage.setItem('workflowStepTitle1', editStepTitle1);
    localStorage.setItem('workflowStepDesc1', editStepDesc1);
    localStorage.setItem('workflowStepTitle2', editStepTitle2);
    localStorage.setItem('workflowStepDesc2', editStepDesc2);
    localStorage.setItem('workflowStepTitle3', editStepTitle3);
    localStorage.setItem('workflowStepDesc3', editStepDesc3);
    localStorage.setItem('workflowStepTitle4', editStepTitle4);
    localStorage.setItem('workflowStepDesc4', editStepDesc4);

    showSuccess('Scientific Workflow timeline copy saved successfully!');
  };

  // Handler: Confirm delete project
  const confirmDeleteProjectAction = () => {
    if (!editingProjId) return;
    const proj = projects.find(p => p.id === editingProjId);
    if (!proj) return;

    // 1. Remove project
    const updatedProjs = projects.filter(p => p.id !== editingProjId);
    setProjects(updatedProjs);
    localStorage.setItem('projects', JSON.stringify(updatedProjs));

    // 2. Cascading remove associated sites
    const updatedSites = sites.filter(s => s.projectId !== editingProjId);
    setSites(updatedSites);
    localStorage.setItem('sites', JSON.stringify(updatedSites));

    // 3. Clear editing state
    setEditingProjId('');
    setEditProjTitle('');
    setEditProjTag('');
    setEditProjCollab('');
    setEditProjDesc('');
    setEditProjImg('');
    setShowDeleteProjConfirm(false);

    showSuccess(`Project "${proj.title}" and its associated sites deleted successfully!`);
  };

  // Handler: Confirm delete site
  const confirmDeleteSiteAction = (siteId: string) => {
    const siteObj = sites.find(s => s.id === siteId);
    const siteName = siteObj ? siteObj.name : siteId;

    const updated = sites.filter(s => s.id !== siteId);
    setSites(updated);
    localStorage.setItem('sites', JSON.stringify(updated));
    setShowDeleteSiteConfirmId(null);
    showSuccess(`Site "${siteName}" deleted successfully.`);
  };

  // Handler: Species Ecology Save
  const handleStartEditSpecies = (name: string) => {
    setEditingSpeciesName(name);
    const meta = speciesMetadata[name] || {};
    setEditSciName(meta.scientific || '');
    setEditEndemic(meta.endemic || 'No');
    setEditHabitatPref(meta.preferred_habitat || 'Forest');
    setEditGuild(meta.guild || 'Insectivore');
    setEditVocalAct(meta.vocal_activity || 'Diurnal');
    setEditIucn(meta.iucn || 'LC');
    setEditStratum(meta.foraging_stratum || 'Canopy');
    setEditIndicator(meta.indicator_group || 'Nil');
    setEditSpeciesImage(meta.image || '');
    setEditSpeciesAudio(meta.audio || '');
  };

  const handleSaveSpecies = (name: string) => {
    const updatedMeta = {
      ...speciesMetadata,
      [name]: {
        scientific: editSciName,
        endemic: editEndemic,
        preferred_habitat: editHabitatPref,
        guild: editGuild,
        vocal_activity: editVocalAct,
        iucn: editIucn,
        foraging_stratum: editStratum,
        indicator_group: editIndicator,
        image: editSpeciesImage,
        audio: editSpeciesAudio
      }
    };

    setSpeciesMetadata(updatedMeta);
    localStorage.setItem('species_metadata', JSON.stringify(updatedMeta));
    setEditingSpeciesName(null);
    showSuccess(`Avian details for "${name}" saved successfully!`);
  };

  // Handler: Create User Manager Account
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUserEmail || !newUserPassword) return;

    const newUser = {
      username: newUsername.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword,
      role: newUserRole,
      assignedSites: selectedNewUserSites,
      tempPassword: true // Forces reset on first login
    };

    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('userAccounts', JSON.stringify(updated));

    setNewUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setSelectedNewUserSites([]);
    showSuccess(`Manager Account for "${newUser.username}" created with temp password!`);
  };

  // Handler: Edit Manager Credentials
  const handleStartEditUser = (user: any) => {
    setEditingUsername(user.username);
    setEditUserEmail(user.email || '');
    setEditUserPassword(user.password || '');
    setEditUserRole(user.role);
    setSelectedEditUserSites(user.assignedSites || []);
  };

  const handleSaveEditUser = (usernameKey: string) => {
    const updated = users.map(u => {
      if (u.username === usernameKey) {
        return {
          ...u,
          email: editUserEmail,
          password: editUserPassword,
          role: editUserRole,
          assignedSites: selectedEditUserSites,
          tempPassword: false // Marks as verified if reset by admin
        };
      }
      return u;
    });

    setUsers(updated);
    localStorage.setItem('userAccounts', JSON.stringify(updated));
    setEditingUsername(null);
    setSelectedEditUserSites([]);
    showSuccess(`Manager credentials for "${usernameKey}" updated!`);
  };

  const handleDeleteUser = (usernameKey: string) => {
    if (window.confirm(`Are you sure you want to delete manager account: ${usernameKey}?`)) {
      const updated = users.filter(u => u.username !== usernameKey);
      setUsers(updated);
      localStorage.setItem('userAccounts', JSON.stringify(updated));
      showSuccess(`Account "${usernameKey}" deleted.`);
    }
  };

  // Handler: CSV / TXT Filename Parser & Dynamic Site Check
  const handleCsvFilePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);

      const file = filesArray[0];
      const name = file.name;
      let detectedCode = '';

      // Match TST prefix: e.g. TST-LC03_... or TST-atr01_...
      const tstMatch = name.match(/TST-([A-Za-z0-9-]+)/);
      // Match Nilgiri prefix: e.g. D09-01_... or D09_01_...
      const dMatch = name.match(/^([Dd]\d+[-_]\d+)/);

      if (tstMatch) {
        detectedCode = normalizeSiteId(tstMatch[1]);
      } else if (dMatch) {
        detectedCode = normalizeSiteId(dMatch[1]);
      } else {
        // Fallback: split by underscore and take the first token
        const parts = name.split('_');
        if (parts.length > 1) {
          detectedCode = normalizeSiteId(parts[0]);
        } else {
          detectedCode = 'new_station';
        }
      }

      setParsedSiteCode(detectedCode);
      setCsvNewSiteName(`Recorder Site ${detectedCode.toUpperCase()}`);

      // Check if the site exists in current project list
      const exists = sites.some(s => s.id === detectedCode);
      if (exists) {
        setCsvSiteAction('existing');
      } else {
        setCsvSiteAction('create');
      }
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !selectedUploadProjId || !selectedUploadSiteId) return;

    // Handle inline site creation if selected (e.g. from parsed code check)
    if (csvSiteAction === 'create' && parsedSiteCode) {
      const cleanId = normalizeSiteId(parsedSiteCode);
      const newSiteObj: Site = {
        id: cleanId,
        projectId: selectedUploadProjId,
        name: csvNewSiteName,
        elevation: csvNewSiteElev || '1,100m',
        status: 'Active',
        latitude: csvNewSiteLat !== '' ? Number(csvNewSiteLat) : 11.59,
        longitude: csvNewSiteLng !== '' ? Number(csvNewSiteLng) : 76.94,
        expectedFiles: 48
      };
      
      const updatedSites = [...sites, newSiteObj];
      setSites(updatedSites);
      localStorage.setItem('sites', JSON.stringify(updatedSites));

      // Physically create site folder
      try {
        await fetch('/api/create-site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: selectedUploadProjId, siteId: cleanId })
        });
      } catch (err) {
        console.error('Inline create site folder failed', err);
      }
    }

    let uploadedCount = 0;
    for (const file of selectedFiles) {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
      });

      try {
        const res = await fetch('/api/upload-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedUploadProjId,
            siteId: selectedUploadSiteId,
            filename: file.name,
            content
          })
        });
        const data = await res.json();
        if (data.success) {
          uploadedCount++;
        }
      } catch (err) {
        console.error(`Upload failed for ${file.name}`, err);
      }
    }

    showSuccess(`Successfully uploaded ${uploadedCount} file(s) to filesystem.`);
    fetchSiteFiles(selectedUploadProjId, selectedUploadSiteId);
    setSelectedFiles([]);
    setParsedSiteCode('');
  };

  // Filter species list for search grid
  const filteredSpecies = speciesList.filter(sp => 
    sp.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    (speciesMetadata[sp]?.scientific || '').toLowerCase().includes(speciesSearch.toLowerCase())
  );

  return (
    <div className="admin-dashboard-container">
      {/* Admin Title Banner */}
      <section className="dashboard-header-banner admin-banner">
        <div className="banner-content">
          <span className="banner-tag">Admin Console</span>
          <h1 className="banner-title">Observatory Administration Panel</h1>
          <p className="banner-desc">
            Edit landing pages, register coordinates, manage manager users, edit species details, and process raw audio sheets.
          </p>
        </div>
      </section>

      {/* Main Administrative Layout */}
      <div className="admin-layout-wrapper">
        
        {/* Left Hand Tab Navigation */}
        <aside className="admin-sidebar-nav">
          <button 
            className={`admin-nav-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <FileText className="tab-btn-icon" />
            Manage Content
          </button>
          <button 
            className={`admin-nav-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderPlus className="tab-btn-icon" />
            Projects & Coordinates
          </button>
          <button 
            className={`admin-nav-tab-btn ${activeTab === 'species' ? 'active' : ''}`}
            onClick={() => setActiveTab('species')}
          >
            <Database className="tab-btn-icon" />
            Species Ecology
          </button>
          <button 
            className={`admin-nav-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="tab-btn-icon" />
            User Accounts
          </button>
          <button 
            className={`admin-nav-tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <Upload className="tab-btn-icon" />
            Import CSV Detections
          </button>
          <button 
            className={`admin-nav-tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <Download className="tab-btn-icon" />
            Backup &amp; Restore
          </button>
        </aside>

        {/* Right Hand Tab Content Screen */}
        <main className="admin-content-screen">
          {successMsg && (
            <div className="admin-toast-success animate-fade-in">
              <CheckCircle className="toast-icon" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: MANAGE CONTENT */}
          {activeTab === 'content' && (
            <div className="admin-tab-card">
              <div className="card-header-bar">
                <h2>Manage Website Content</h2>
                <p>Edit landing copy and project statements dynamically.</p>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Homepage Introductory Text</label>
                <textarea
                  className="admin-textarea"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  rows={5}
                />
                <button className="btn btn-primary admin-save-btn" onClick={handleSaveIntro}>
                  <Save size={16} /> Save Intro Text
                </button>
              </div>

              <div className="admin-divider" style={{ margin: '2rem 0' }} />

              <div className="edit-about-page-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800 }}>Edit About Page Copy & Visuals</h3>
                <div className="admin-mini-form">
                  <div className="form-group-sub">
                    <label>Mission Section Heading</label>
                    <input type="text" value={editAboutMissionHeading} onChange={(e) => setEditAboutMissionHeading(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Mission Paragraph 1</label>
                    <textarea value={editAboutMissionText1} onChange={(e) => setEditAboutMissionText1(e.target.value)} rows={3} />
                  </div>
                  <div className="form-group-sub">
                    <label>Mission Paragraph 2</label>
                    <textarea value={editAboutMissionText2} onChange={(e) => setEditAboutMissionText2(e.target.value)} rows={3} />
                  </div>
                  <div className="form-group-sub">
                    <label>Why Bioacoustics Heading</label>
                    <input type="text" value={editAboutWhyHeading} onChange={(e) => setEditAboutWhyHeading(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Why Bioacoustics Paragraph 1</label>
                    <textarea value={editAboutWhyText1} onChange={(e) => setEditAboutWhyText1(e.target.value)} rows={2} />
                  </div>
                  <div className="form-group-sub">
                    <label>Why Bioacoustics Paragraph 2</label>
                    <textarea value={editAboutWhyText2} onChange={(e) => setEditAboutWhyText2(e.target.value)} rows={2} />
                  </div>
                  
                  <div className="form-group-sub">
                    <label>Bullet Point 1</label>
                    <input type="text" value={editAboutBullet1} onChange={(e) => setEditAboutBullet1(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Bullet Point 2</label>
                    <input type="text" value={editAboutBullet2} onChange={(e) => setEditAboutBullet2(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Bullet Point 3</label>
                    <input type="text" value={editAboutBullet3} onChange={(e) => setEditAboutBullet3(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Bullet Point 4</label>
                    <input type="text" value={editAboutBullet4} onChange={(e) => setEditAboutBullet4(e.target.value)} />
                  </div>

                  <div className="admin-divider" style={{ margin: '1rem 0' }} />
                  <h4 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>About Sidebar Cards & Cover Image</h4>
                  <div className="form-group-sub">
                    <label>Sidebar Card 1 Title</label>
                    <input type="text" value={editAboutSideTitle1} onChange={(e) => setEditAboutSideTitle1(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Sidebar Card 1 Body Text</label>
                    <textarea value={editAboutSideText1} onChange={(e) => setEditAboutSideText1(e.target.value)} rows={3} />
                  </div>
                  <div className="form-group-sub">
                    <label>Sidebar Card 2 Title</label>
                    <input type="text" value={editAboutSideTitle2} onChange={(e) => setEditAboutSideTitle2(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Sidebar Card 2 Body Text</label>
                    <textarea value={editAboutSideText2} onChange={(e) => setEditAboutSideText2(e.target.value)} rows={3} />
                  </div>
                  <div className="form-group-sub">
                    <label>About Sidebar Cover Image (Local File Upload)</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, setEditAboutSideImg)} className="admin-select" />
                    {editAboutSideImg && (
                      <div className="image-preview-box">
                        <img src={editAboutSideImg} alt="Preview" className="img-thumbnail" />
                        <button type="button" className="btn-close-preview" onClick={() => setEditAboutSideImg('')}><X size={12} /></button>
                      </div>
                    )}
                  </div>
                  <div className="form-group-sub">
                    <label>Or Image External URL</label>
                    <input type="text" value={editAboutSideImg} onChange={(e) => setEditAboutSideImg(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Sidebar Image Caption text</label>
                    <input type="text" value={editAboutSideImgCaption} onChange={(e) => setEditAboutSideImgCaption(e.target.value)} />
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleSaveAboutPage}>
                    <Save size={16} /> Save About Page Copy
                  </button>
                </div>
              </div>

              <div className="admin-divider" style={{ margin: '2rem 0' }} />

              <div className="edit-workflow-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800 }}>Edit Scientific Workflow (How We Work)</h3>
                <div className="admin-mini-form">
                  <h4 style={{ color: 'var(--forest-dark)', fontWeight: 700 }}>Step 1: Data Collection</h4>
                  <div className="form-group-sub">
                    <label>Step Title</label>
                    <input type="text" value={editStepTitle1} onChange={(e) => setEditStepTitle1(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Step Description</label>
                    <textarea value={editStepDesc1} onChange={(e) => setEditStepDesc1(e.target.value)} rows={2} />
                  </div>

                  <h4 style={{ color: 'var(--forest-dark)', fontWeight: 700, marginTop: '1rem' }}>Step 2: Processing & Classification</h4>
                  <div className="form-group-sub">
                    <label>Step Title</label>
                    <input type="text" value={editStepTitle2} onChange={(e) => setEditStepTitle2(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Step Description</label>
                    <textarea value={editStepDesc2} onChange={(e) => setEditStepDesc2(e.target.value)} rows={2} />
                  </div>

                  <h4 style={{ color: 'var(--forest-dark)', fontWeight: 700, marginTop: '1rem' }}>Step 3: Ecological Analysis</h4>
                  <div className="form-group-sub">
                    <label>Step Title</label>
                    <input type="text" value={editStepTitle3} onChange={(e) => setEditStepTitle3(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Step Description</label>
                    <textarea value={editStepDesc3} onChange={(e) => setEditStepDesc3(e.target.value)} rows={2} />
                  </div>

                  <h4 style={{ color: 'var(--forest-dark)', fontWeight: 700, marginTop: '1rem' }}>Step 4: Collaboration</h4>
                  <div className="form-group-sub">
                    <label>Step Title</label>
                    <input type="text" value={editStepTitle4} onChange={(e) => setEditStepTitle4(e.target.value)} />
                  </div>
                  <div className="form-group-sub">
                    <label>Step Description</label>
                    <textarea value={editStepDesc4} onChange={(e) => setEditStepDesc4(e.target.value)} rows={2} />
                  </div>

                  <button type="button" className="btn btn-primary" onClick={handleSaveWorkflowPage} style={{ marginTop: '0.5rem' }}>
                    <Save size={16} /> Save Workflow Timeline
                  </button>
                </div>
              </div>

              <div className="admin-divider" />

              <div className="project-descriptions-list">
                <h3 style={{ marginBottom: '1.25rem', fontFamily: 'Outfit', fontWeight: 800 }}>
                  Edit Project Descriptions
                </h3>
                <div className="project-descriptions-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {projects.map((proj) => (
                    <div key={proj.id} className="edit-proj-desc-card" style={{ padding: '2rem', gap: '1.25rem' }}>
                      <div className="edit-proj-header">
                        <h4 style={{ margin: 0, fontSize: '1.25rem' }}>{proj.title}</h4>
                        <span className="proj-id-badge">ID: {proj.id}</span>
                      </div>
                      <textarea
                        className="admin-textarea text-small"
                        defaultValue={proj.description}
                        onBlur={(e) => handleSaveProjectDescriptions(proj.id, e.target.value)}
                        rows={5}
                        placeholder="Project description copy..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS & SITES COORDINATES */}
          {activeTab === 'projects' && (
            <div className="admin-tab-card">
              <div className="grid-split-layout">
                {/* Form: Create Project */}
                <div className="form-card-half">
                  <h3>Create New Project</h3>
                  <form onSubmit={handleCreateProject} className="admin-mini-form">
                    <div className="form-group-sub">
                      <label>Project ID (unique-slug-code)</label>
                      <input 
                        type="text" 
                        value={newProjId} 
                        onChange={(e) => setNewProjId(e.target.value)}
                        placeholder="e.g. hornbill-monitoring" 
                        required 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Project Name</label>
                      <input 
                        type="text" 
                        value={newProjTitle} 
                        onChange={(e) => setNewProjTitle(e.target.value)}
                        placeholder="e.g. Western Ghats Hornbills" 
                        required 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Focus Tag</label>
                      <input 
                        type="text" 
                        value={newProjTag} 
                        onChange={(e) => setNewProjTag(e.target.value)}
                        placeholder="e.g. Canopy Species Survey" 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Partners / Collaboration</label>
                      <input 
                        type="text" 
                        value={newProjCollab} 
                        onChange={(e) => setNewProjCollab(e.target.value)}
                        placeholder="e.g. IISER, Nature Conservation Foundation" 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Image File Picker Upload (Local Image)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, setNewProjImg)}
                        className="admin-select"
                      />
                      {newProjImg && (
                        <div className="image-preview-box">
                          <img src={newProjImg} alt="Preview" className="img-thumbnail" />
                          <button type="button" className="btn-close-preview" onClick={() => setNewProjImg('')}><X size={12} /></button>
                        </div>
                      )}
                    </div>
                    <div className="form-group-sub">
                      <label>Or Image External URL</label>
                      <input 
                        type="text" 
                        value={newProjImg} 
                        onChange={(e) => setNewProjImg(e.target.value)}
                        placeholder="https://..." 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Description Paragraph</label>
                      <textarea 
                        value={newProjDesc} 
                        onChange={(e) => setNewProjDesc(e.target.value)}
                        rows={3} 
                        placeholder="Project details..."
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">Create Project</button>
                  </form>

                  <div className="admin-divider" style={{ margin: '2rem 0' }} />

                  <h3>Modify Existing Project</h3>
                  <form onSubmit={handleSaveProjectModifications} className="admin-mini-form">
                    <div className="form-group-sub">
                      <label>Select Project to Edit</label>
                      <select 
                        value={editingProjId}
                        onChange={(e) => handleSelectProjToEdit(e.target.value)}
                        className="admin-select"
                      >
                        <option value="">-- Choose Project --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    {editingProjId && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="form-group-sub">
                          <label>Project Title Name</label>
                          <input type="text" value={editProjTitle} onChange={(e) => setEditProjTitle(e.target.value)} required />
                        </div>
                        <div className="form-group-sub">
                          <label>Focus Tag</label>
                          <input type="text" value={editProjTag} onChange={(e) => setEditProjTag(e.target.value)} />
                        </div>
                        <div className="form-group-sub">
                          <label>Collaboration Details</label>
                          <input type="text" value={editProjCollab} onChange={(e) => setEditProjCollab(e.target.value)} />
                        </div>
                        <div className="form-group-sub">
                          <label>Project Cover Image (Local Upload)</label>
                          <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, setEditProjImg)} className="admin-select" />
                          {editProjImg && (
                            <div className="image-preview-box">
                              <img src={editProjImg} alt="Preview" className="img-thumbnail" />
                              <button type="button" className="btn-close-preview" onClick={() => setEditProjImg('')}><X size={12} /></button>
                            </div>
                          )}
                        </div>
                        <div className="form-group-sub">
                          <label>Or Image External URL</label>
                          <input type="text" value={editProjImg} onChange={(e) => setEditProjImg(e.target.value)} />
                        </div>
                        <div className="form-group-sub">
                          <label>Description Narrative</label>
                          <textarea value={editProjDesc} onChange={(e) => setEditProjDesc(e.target.value)} rows={4} required />
                        </div>
                        {showDeleteProjConfirm ? (
                          <div className="confirm-delete-box animate-fade-in" style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', padding: '1rem', borderRadius: '8px', marginTop: '1rem', width: '100%' }}>
                            <p style={{ color: '#991b1b', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: 1.4, textAlign: 'left' }}>
                              ⚠️ Are you sure you want to permanently delete this project and all its associated research sites? This cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                type="button" 
                                className="btn btn-icon btn-cancel" 
                                style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.4rem 0.75rem' }}
                                onClick={confirmDeleteProjectAction}
                              >
                                Yes, Delete
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem 0.75rem' }}
                                onClick={() => setShowDeleteProjConfirm(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="btn-flex-row" style={{ marginTop: '0.75rem', gap: '0.75rem' }}>
                            <button type="submit" className="btn btn-primary flex-2">Save Project Details</button>
                            <button 
                              type="button" 
                              className="btn btn-icon btn-cancel flex-1" 
                              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteProjConfirm(true); }}
                            >
                              Delete Project
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </form>
                </div>

                {/* Form: Add Site Coordinates */}
                <div className="form-card-half border-left">
                  <h3>Register Research Site</h3>
                  <form onSubmit={handleCreateSite} className="admin-mini-form">
                    <div className="form-group-sub">
                      <label>Select Target Project</label>
                      <select 
                        value={selectedProjId} 
                        onChange={(e) => setSelectedProjId(e.target.value)}
                        className="admin-select"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group-sub">
                      <label>Site ID (e.g. atr_01 or site_03)</label>
                      <input 
                        type="text" 
                        value={newSiteId} 
                        onChange={(e) => setNewSiteId(e.target.value)}
                        placeholder="e.g. atr_01" 
                        required 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Site / Estate Location Name</label>
                      <input 
                        type="text" 
                        value={newSiteName} 
                        onChange={(e) => setNewSiteName(e.target.value)}
                        placeholder="e.g. ATR_01 Recorder Corridor" 
                        required 
                      />
                    </div>
                    <div className="grid-2-col">
                      <div className="form-group-sub">
                        <label>Latitude (DD)</label>
                        <input 
                          type="number" 
                          step="0.000001"
                          value={newSiteLat} 
                          onChange={(e) => setNewSiteLat(e.target.value !== '' ? Number(e.target.value) : '')}
                          placeholder="e.g. 11.58" 
                        />
                      </div>
                      <div className="form-group-sub">
                        <label>Longitude (DD)</label>
                        <input 
                          type="number" 
                          step="0.000001"
                          value={newSiteLng} 
                          onChange={(e) => setNewSiteLng(e.target.value !== '' ? Number(e.target.value) : '')}
                          placeholder="e.g. 76.92" 
                        />
                      </div>
                    </div>
                    <div className="grid-2-col">
                      <div className="form-group-sub">
                        <label>Elevation (m)</label>
                        <input 
                          type="text" 
                          value={newSiteElev} 
                          onChange={(e) => setNewSiteElev(e.target.value)}
                          placeholder="e.g. 950m" 
                        />
                      </div>
                      <div className="form-group-sub">
                        <label>Expected Audio Logs</label>
                        <input 
                          type="number" 
                          value={newSiteFiles} 
                          onChange={(e) => setNewSiteFiles(e.target.value !== '' ? Number(e.target.value) : '')}
                          placeholder="e.g. 48" 
                        />
                      </div>
                    </div>
                    <div className="form-group-sub">
                      <label>Site Status</label>
                      <select 
                        value={newSiteStatus} 
                        onChange={(e) => setNewSiteStatus(e.target.value)}
                        className="admin-select"
                      >
                        <option value="Active">Active</option>
                        <option value="Setup Pending">Setup Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Add Site Location</button>
                  </form>
                </div>
              </div>

              <div className="admin-divider" />

              {/* Coordinates Settings Grid */}
              <div className="coordinates-grid-section">
                <h3>Research Sites Coordinate Registry</h3>
                <div className="sites-table-wrapper">
                  <table className="admin-sites-table">
                    <thead>
                      <tr>
                        <th>Site Code</th>
                        <th>Project</th>
                        <th>Location Name</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Elevation</th>
                        <th>Files</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map(s => {
                        const isEditing = editingSiteId === s.id;
                        return (
                          <tr key={s.id}>
                            <td><code>{s.id}</code></td>
                            <td>
                              {isEditing ? (
                                <select 
                                  value={editSiteProj} 
                                  onChange={(e) => setEditSiteProj(e.target.value)} 
                                  className="admin-select select-inline"
                                >
                                  {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="proj-id-badge">{s.projectId}</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input type="text" value={editSiteName} onChange={(e) => setEditSiteName(e.target.value)} className="inline-table-input" />
                              ) : (
                                <strong>{s.name}</strong>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input type="number" step="0.0001" value={editSiteLat} onChange={(e) => setEditSiteLat(e.target.value !== '' ? Number(e.target.value) : '')} className="inline-table-input width-small" />
                              ) : (
                                s.latitude ?? '-'
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input type="number" step="0.0001" value={editSiteLng} onChange={(e) => setEditSiteLng(e.target.value !== '' ? Number(e.target.value) : '')} className="inline-table-input width-small" />
                              ) : (
                                s.longitude ?? '-'
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input type="text" value={editSiteElev} onChange={(e) => setEditSiteElev(e.target.value)} className="inline-table-input width-small" />
                              ) : (
                                s.elevation
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input type="number" value={editSiteFiles} onChange={(e) => setEditSiteFiles(e.target.value !== '' ? Number(e.target.value) : '')} className="inline-table-input width-small" />
                              ) : (
                                s.expectedFiles ?? '-'
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <select value={editSiteStatus} onChange={(e) => setEditSiteStatus(e.target.value)} className="admin-select select-inline">
                                  <option value="Active">Active</option>
                                  <option value="Setup Pending">Setup Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              ) : (
                                <span className={`site-status-badge ${s.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {s.status}
                                </span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div className="btn-inline-flex">
                                  <button className="btn-icon btn-save" onClick={() => handleSaveEditSite(s.id)}>Save</button>
                                  <button className="btn-icon btn-cancel" onClick={() => setEditingSiteId(null)}>X</button>
                                </div>
                              ) : showDeleteSiteConfirmId === s.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                                  <span style={{ color: '#b91c1c', fontSize: '0.75rem', fontWeight: 600 }}>Confirm?</span>
                                  <div className="btn-inline-flex" style={{ gap: '0.2rem' }}>
                                    <button 
                                      className="btn-icon btn-save" 
                                      style={{ backgroundColor: '#dc2626', fontSize: '0.75rem', padding: '0.1rem 0.4rem', border: 'none', color: 'white', borderRadius: '3px' }} 
                                      onClick={() => confirmDeleteSiteAction(s.id)}
                                    >
                                      Yes
                                    </button>
                                    <button 
                                      className="btn-icon btn-cancel" 
                                      style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '3px' }} 
                                      onClick={() => setShowDeleteSiteConfirmId(null)}
                                    >
                                      No
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="btn-inline-flex" style={{ gap: '0.4rem' }}>
                                  <button className="btn btn-secondary btn-small" onClick={() => handleStartEditSite(s)}>
                                    <Edit2 size={12} /> Edit
                                  </button>
                                  <button 
                                    className="btn btn-icon btn-cancel btn-small" 
                                    style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteSiteConfirmId(s.id); }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPECIES ECOLOGY EDITOR */}
          {activeTab === 'species' && (
            <div className="admin-tab-card">
              <div className="card-header-bar flex-row-justify">
                <div>
                  <h2>Avian Species Ecology Database</h2>
                  <p>Manually customize species parameters, preferred habitats, audio calls, and photo links.</p>
                </div>
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    value={speciesSearch}
                    onChange={(e) => setSpeciesSearch(e.target.value)}
                    placeholder="Search species common or scientific name..."
                    className="species-search-bar"
                  />
                </div>
              </div>

              {/* Editing Form Box (if species selected) */}
              {editingSpeciesName && (
                <div className="species-editor-panel animate-fade-in">
                  <div className="editor-panel-header">
                    <h3>Modify Species details: {editingSpeciesName}</h3>
                    <button className="btn-close-editor" onClick={() => setEditingSpeciesName(null)}><X size={16} /></button>
                  </div>

                  <div className="admin-mini-form species-edit-form">
                    <div className="grid-3-col">
                      <div className="form-group-sub">
                        <label>Scientific Name</label>
                        <input type="text" value={editSciName} onChange={(e) => setEditSciName(e.target.value)} />
                      </div>
                      <div className="form-group-sub">
                        <label>Endemic Status</label>
                        <select value={editEndemic} onChange={(e) => setEditEndemic(e.target.value)} className="admin-select">
                          <option value="No">No (Common)</option>
                          <option value="Yes">Yes (Western Ghats Endemic)</option>
                        </select>
                      </div>
                      <div className="form-group-sub">
                        <label>IUCN Red List Status</label>
                        <select value={editIucn} onChange={(e) => setEditIucn(e.target.value)} className="admin-select">
                          <option value="LC">LC (Least Concern)</option>
                          <option value="NT">NT (Near Threatened)</option>
                          <option value="VU">VU (Vulnerable)</option>
                          <option value="EN">EN (Endangered)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid-3-col">
                      <div className="form-group-sub">
                        <label>Preferred Habitat</label>
                        <input type="text" value={editHabitatPref} onChange={(e) => setEditHabitatPref(e.target.value)} placeholder="e.g. Forest Canopy" />
                      </div>
                      <div className="form-group-sub">
                        <label>Foraging Stratum</label>
                        <input type="text" value={editStratum} onChange={(e) => setEditStratum(e.target.value)} placeholder="e.g. Canopy, Understory" />
                      </div>
                      <div className="form-group-sub">
                        <label>Indicator Guild Group</label>
                        <input type="text" value={editIndicator} onChange={(e) => setEditIndicator(e.target.value)} placeholder="e.g. Canopy insectivore" />
                      </div>
                    </div>

                    <div className="form-group-sub">
                      <label>Photo URL (Dynamic picker upload below)</label>
                      <input type="text" value={editSpeciesImage} onChange={(e) => setEditSpeciesImage(e.target.value)} />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, setEditSpeciesImage)}
                        className="admin-select"
                        style={{ marginTop: '0.4rem' }}
                      />
                    </div>

                    <div className="form-group-sub">
                      <label>Audio Vocal Call URL (Audio File Link)</label>
                      <input type="text" value={editSpeciesAudio} onChange={(e) => setEditSpeciesAudio(e.target.value)} placeholder="https://..." />
                    </div>

                    <div className="btn-flex-row">
                      <button className="btn btn-secondary" type="button" onClick={() => setEditingSpeciesName(null)}>Cancel</button>
                      <button className="btn btn-primary" type="button" onClick={() => handleSaveSpecies(editingSpeciesName)}>
                        <Save size={16} /> Save Species Characteristics
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="species-grid-wrapper">
                <table className="admin-sites-table species-table">
                  <thead>
                    <tr>
                      <th>Avian Species (Common Name)</th>
                      <th>Scientific Name</th>
                      <th>Indicator Group</th>
                      <th>Stratum</th>
                      <th>Vocal</th>
                      <th>Media Call</th>
                      <th>Image</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpecies.slice(0, 10).map((sp) => {
                      const meta = speciesMetadata[sp] || {};
                      return (
                        <tr key={sp}>
                          <td><strong>{sp}</strong></td>
                          <td><em>{meta.scientific}</em></td>
                          <td><span className="tag-indicator">{meta.indicator_group || 'Nil'}</span></td>
                          <td>{meta.foraging_stratum || '-'}</td>
                          <td>{meta.vocal_activity || '-'}</td>
                          <td>
                            {meta.audio ? (
                              <span className="media-status yes" title={meta.audio}><Volume2 size={16} /> Active</span>
                            ) : (
                              <span className="media-status no">None</span>
                            )}
                          </td>
                          <td>
                            {meta.image ? (
                              <span className="media-status yes" title={meta.image}><ImageIcon size={16} /> Linked</span>
                            ) : (
                              <span className="media-status no">None</span>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-secondary btn-small" onClick={() => handleStartEditSpecies(sp)}>
                              <Edit2 size={12} /> Edit Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSpecies.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center text-muted">No species found matching search criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {filteredSpecies.length > 10 && (
                  <div className="table-pagination-footer text-muted">
                    Showing first 10 matches of {filteredSpecies.length} total species. Use search input to refine list.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: USER ACCOUNTS & PASSWORD WIZARD */}
          {activeTab === 'users' && (
            <div className="admin-tab-card">
              <div className="grid-split-layout">
                {/* 4a: Register Account */}
                <div className="form-card-half">
                  <h3>Register Account Credentials</h3>
                  <form onSubmit={handleCreateUser} className="admin-mini-form">
                    <div className="form-group-sub">
                      <label>Username</label>
                      <input 
                        type="text" 
                        value={newUsername} 
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. manager_ooty" 
                        required 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        value={newUserEmail} 
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="e.g. ooty_operator@iiser.ac.in" 
                        required 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Temporary Demo Password</label>
                      <input 
                        type="password" 
                        value={newUserPassword} 
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="e.g. welcome123" 
                        required 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Account Role</label>
                      <select 
                        value={newUserRole} 
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="admin-select"
                      >
                        <option value="manager_project">Manager 1 (Project Manager)</option>
                        <option value="manager_site">Manager 2 (Site Operator)</option>
                      </select>
                    </div>

                    <div className="form-group-sub">
                      <label style={{ fontWeight: 700 }}>Assign Stations Access (Grant site permissions across projects)</label>
                      <div className="admin-sites-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto', padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f8fafc', marginTop: '0.25rem' }}>
                        {projects.map(p => (
                          <div key={p.id} className="checklist-project-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--forest-dark)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem', marginTop: '0.4rem', textTransform: 'uppercase' }}>{p.title}</span>
                            {sites.filter(s => s.projectId === p.id).map(s => (
                              <label key={s.id} className="checklist-item-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedNewUserSites.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedNewUserSites([...selectedNewUserSites, s.id]);
                                    } else {
                                      setSelectedNewUserSites(selectedNewUserSites.filter(id => id !== s.id));
                                    }
                                  }}
                                />
                                <span>{s.name} (<code>{s.id}</code>)</span>
                              </label>
                            ))}
                            {sites.filter(s => s.projectId === p.id).length === 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', paddingLeft: '0.5rem' }}>No sites registered under this project</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Create User Account</button>
                  </form>
                </div>

                {/* 4b: Accounts list with Admin Override / password edits */}
                <div className="form-card-half border-left">
                  <h3>Registered User Accounts & Admin Overrides</h3>
                  
                  {editingUsername && (
                    <div className="inline-edit-user-panel animate-fade-in" style={{ padding: '1rem', backgroundColor: '#f1f8f5', borderRadius: '8px', border: '1px solid var(--forest-green)', marginBottom: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--forest-dark)' }}>Modify Credentials: {editingUsername}</h4>
                      <div className="admin-mini-form">
                        <div className="form-group-sub">
                          <label>Email Address</label>
                          <input type="email" value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)} />
                        </div>
                        <div className="form-group-sub">
                          <label>Reset/Change Password</label>
                          <input type="text" value={editUserPassword} onChange={(e) => setEditUserPassword(e.target.value)} placeholder="Type new password" />
                        </div>
                        <div className="form-group-sub">
                          <label>Account Role</label>
                          <select value={editUserRole} onChange={(e) => setEditUserRole(e.target.value as any)} className="admin-select">
                            <option value="admin">IISER Admin</option>
                            <option value="manager_project">Project Manager</option>
                            <option value="manager_site">Site Operator</option>
                          </select>
                        </div>
                        <div className="form-group-sub">
                          <label style={{ fontWeight: 700 }}>Modify Stations Access</label>
                          <div className="admin-sites-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '150px', overflowY: 'auto', padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#ffffff', marginTop: '0.25rem' }}>
                            {projects.map(p => (
                              <div key={p.id} className="checklist-project-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--forest-dark)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.2rem', marginTop: '0.4rem', textTransform: 'uppercase' }}>{p.title}</span>
                                {sites.filter(s => s.projectId === p.id).map(s => (
                                  <label key={s.id} className="checklist-item-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedEditUserSites.includes(s.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedEditUserSites([...selectedEditUserSites, s.id]);
                                        } else {
                                          setSelectedEditUserSites(selectedEditUserSites.filter(id => id !== s.id));
                                        }
                                      }}
                                    />
                                    <span>{s.name} (<code>{s.id}</code>)</span>
                                  </label>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="btn-inline-flex" style={{ gap: '0.5rem', marginTop: '1rem' }}>
                          <button className="btn btn-primary btn-small" type="button" onClick={() => handleSaveEditUser(editingUsername)}>Save Details</button>
                          <button className="btn btn-secondary btn-small" type="button" onClick={() => setEditingUsername(null)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="user-accounts-list">
                    {users.map((u, i) => (
                      <div key={i} className="user-account-badge" style={{ flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="user-info-left">
                            <strong>{u.username}</strong>
                            <span className={`role-label ${u.role}`}>
                              {u.role === 'admin' ? 'IISER Admin' : u.role === 'manager_project' ? 'Project Manager' : 'Site Operator'}
                            </span>
                          </div>
                          <div className="btn-inline-flex" style={{ gap: '0.4rem' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => handleStartEditUser(u)}>
                              <Edit2 size={12} /> Edit / Reset PW
                            </button>
                            {u.username !== 'admin' && (
                              <button className="btn-icon btn-cancel" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteUser(u.username)}>Delete</button>
                            )}
                          </div>
                        </div>
                        <div className="user-info-right text-muted" style={{ textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                          <div>Email: <code>{u.email || '-'}</code></div>
                          {u.assignedSites && u.assignedSites.length > 0 ? (
                            <div style={{ marginTop: '0.25rem' }}>
                              <span>Assigned Sites: </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                                {u.assignedSites.map((sid: string) => {
                                  const siteObj = sites.find(s => s.id === sid);
                                  return <code key={sid} style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>{siteObj ? siteObj.name : sid}</code>;
                                })}
                              </div>
                            </div>
                          ) : (
                            u.username !== 'admin' && <div style={{ color: '#dc2626', fontWeight: 600, marginTop: '0.25rem' }}>⚠️ Access Denied: No stations assigned</div>
                          )}
                          {u.tempPassword && <div style={{ color: '#d97706', fontWeight: 600, marginTop: '0.25rem' }}>⚠️ Temporary Demo Password active</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: IMPORT DATA (CSV/TXT) & SITE CREATION DIALOG */}
          {activeTab === 'files' && (
            <div className="admin-tab-card">
              <div className="card-header-bar">
                <h2>Import BirdNET Inference Logs (CSV / TXT)</h2>
                <p>Physically upload bioacoustic logs to the local project directories and manage site files.</p>
              </div>

              <form onSubmit={handleFileUpload} className="csv-upload-form">
                {/* Folder selectors */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group-sub" style={{ flex: 1 }}>
                    <label>Target Project Folder</label>
                    <select 
                      value={selectedUploadProjId}
                      onChange={(e) => setSelectedUploadProjId(e.target.value)}
                      className="admin-select"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group-sub" style={{ flex: 1 }}>
                    <label>Target Site Folder</label>
                    <select 
                      value={selectedUploadSiteId}
                      onChange={(e) => setSelectedUploadSiteId(e.target.value)}
                      className="admin-select"
                    >
                      {sites.filter(s => s.projectId === selectedUploadProjId).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                      ))}
                      {sites.filter(s => s.projectId === selectedUploadProjId).length === 0 && (
                        <option value="">-- No sites registered --</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="drag-drop-zone">
                  <input
                    type="file"
                    id="csv-file-picker"
                    className="file-picker-input"
                    accept=".csv,.txt"
                    multiple={true}
                    onChange={handleCsvFilePicker}
                  />
                  <label htmlFor="csv-file-picker" className="dropzone-label">
                    {selectedFiles.length > 0 ? (
                      <div className="file-selected-info">
                        <strong>Selected {selectedFiles.length} file(s):</strong>
                        <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem', maxHeight: '80px', overflowY: 'auto', textAlign: 'center' }}>
                          {selectedFiles.map(f => f.name).join(', ')}
                        </div>
                        <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', textDecoration: 'underline' }}>Click to select different logs</span>
                      </div>
                    ) : (
                      <div className="file-prompt">
                        <strong>Drag and drop BirdNET CSV or TXT Selection Tables here</strong>
                        <span>or click to browse filesystem (.csv, .txt)</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Simulated Parser: Site Creation Dialog */}
                {parsedSiteCode && (
                  <div className="site-creation-alert-panel animate-fade-in">
                    <div className="alert-panel-header">
                      <Globe className="alert-globe-icon" />
                      <h4>Study Site Check: {parsedSiteCode.toUpperCase()}</h4>
                    </div>

                    <p className="alert-panel-text">
                      Filename suggests site ID is <code>{parsedSiteCode}</code>.
                    </p>

                    <div className="site-action-selectors">
                      <label className="radio-label-wrapper">
                        <input
                          type="radio"
                          name="csvSiteAction"
                          checked={csvSiteAction === 'existing'}
                          onChange={() => setCsvSiteAction('existing')}
                        />
                        <span>Map to the selected site folder location</span>
                      </label>

                      <label className="radio-label-wrapper">
                        <input
                          type="radio"
                          name="csvSiteAction"
                          checked={csvSiteAction === 'create'}
                          onChange={() => setCsvSiteAction('create')}
                        />
                        <span>Create and register new Site Station <code>{parsedSiteCode}</code></span>
                      </label>
                    </div>

                    {/* Site Creation Fields inside the dialog */}
                    {csvSiteAction === 'create' && (
                      <div className="inline-site-creation-form animate-fade-in">
                        <div className="form-group-sub">
                          <label>Choose Site Display Name</label>
                          <input 
                            type="text" 
                            value={csvNewSiteName}
                            onChange={(e) => setCsvNewSiteName(e.target.value)}
                            placeholder="e.g. STR_03 Recorder Corridor"
                            required
                          />
                        </div>
                        <div className="grid-3-col">
                          <div className="form-group-sub">
                            <label>Latitude (DD)</label>
                            <input 
                              type="number" 
                              step="0.000001"
                              value={csvNewSiteLat}
                              onChange={(e) => setCsvNewSiteLat(e.target.value !== '' ? Number(e.target.value) : '')}
                              placeholder="e.g. 11.59"
                              required
                            />
                          </div>
                          <div className="form-group-sub">
                            <label>Longitude (DD)</label>
                            <input 
                              type="number" 
                              step="0.000001"
                              value={csvNewSiteLng}
                              onChange={(e) => setCsvNewSiteLng(e.target.value !== '' ? Number(e.target.value) : '')}
                              placeholder="e.g. 76.94"
                              required
                            />
                          </div>
                          <div className="form-group-sub">
                            <label>Elevation (m)</label>
                            <input 
                              type="text" 
                              value={csvNewSiteElev}
                              onChange={(e) => setCsvNewSiteElev(e.target.value)}
                              placeholder="e.g. 1,020m"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="submit" 
                  className={`btn btn-primary upload-submit-btn ${selectedFiles.length === 0 ? 'disabled' : ''}`}
                  disabled={selectedFiles.length === 0}
                  style={{ display: 'block', width: '100%', marginTop: '1.5rem' }}
                >
                  Process & Upload File(s) to Server Directory
                </button>
              </form>

              {/* Files Inventory list */}
              <div className="files-inventory-section" style={{ marginTop: '2.5rem' }}>
                <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1.25rem', fontFamily: 'Outfit', fontWeight: 800 }}>
                  Acoustic Logs Directory Inventory: {selectedUploadProjId}/{selectedUploadSiteId || 'None'}
                </h3>
                {selectedUploadProjId && selectedUploadSiteId ? (
                  siteFilesList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {siteFilesList.map((filename) => (
                        <div 
                          key={filename} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '0.65rem 1rem', 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '6px' 
                          }}
                        >
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#334155' }}>{filename}</span>
                          <button 
                            type="button" 
                            className="btn btn-icon btn-cancel btn-small" 
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', fontWeight: 'bold' }}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete "${filename}" from the filesystem?`)) {
                                fetch('/api/delete-file', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    projectId: selectedUploadProjId,
                                    siteId: selectedUploadSiteId,
                                    filename
                                  })
                                })
                                  .then(res => res.json())
                                  .then(data => {
                                    if (data.success) {
                                      showSuccess(`File "${filename}" deleted.`);
                                      fetchSiteFiles(selectedUploadProjId, selectedUploadSiteId);
                                    }
                                  });
                              }
                            }}
                          >
                            Delete File
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
                      No raw inference log files uploaded physically to this station corridor folder yet.
                    </div>
                  )
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Select a target Project and Site folder above to view inventory.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="admin-tab-card">
              <div className="card-header-bar">
                <h2>Backup &amp; Restore</h2>
                <p>Export all your project data, sites, species metadata, and settings to a JSON file. Use it to restore after a browser cache clear or to move data to another device.</p>
              </div>

              {/* Export */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={18} /> Export Data
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Downloads a <code>birdsong_backup.json</code> file containing all projects, sites, species metadata, user accounts, visibility settings, and page content stored in this browser. Keep this file safe as your recovery point.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const KEYS = [
                      'projects', 'sites', 'species_list', 'species_metadata',
                      'userAccounts', 'dashboardVisibility', 'audioLogs',
                      'homeIntroText',
                      'aboutMissionHeading','aboutMissionText1','aboutMissionText2',
                      'aboutWhyHeading','aboutWhyText1','aboutWhyText2',
                      'aboutBullet1','aboutBullet2','aboutBullet3','aboutBullet4',
                      'aboutSideTitle1','aboutSideTitle2','aboutSideText1','aboutSideText2',
                      'aboutSideImg','aboutSideImgCaption',
                      'workflowStepTitle1','workflowStepTitle2','workflowStepTitle3','workflowStepTitle4',
                      'workflowStepDesc1','workflowStepDesc2','workflowStepDesc3','workflowStepDesc4'
                    ];
                    const backup: Record<string, any> = { _version: 1, _date: new Date().toISOString() };
                    KEYS.forEach(k => {
                      const v = localStorage.getItem(k);
                      if (v !== null) backup[k] = v;
                    });
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `birdsong_backup_${new Date().toISOString().slice(0,10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={16} /> Download Backup JSON
                </button>
              </div>

              {/* Import */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={18} /> Restore from Backup
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Select a previously downloaded <code>birdsong_backup_*.json</code> file to restore all your data. <strong style={{ color: '#dc2626' }}>This will overwrite your current data.</strong> Refresh the page after restoring.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', backgroundColor: '#fff', border: '2px solid #4f46e5', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', color: '#4f46e5', cursor: 'pointer', fontFamily: 'Inter' }}
                  >
                    <Upload size={16} /> Choose Backup File
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          try {
                            const backup = JSON.parse(ev.target?.result as string);
                            if (!backup._version) { alert('Invalid backup file.'); return; }
                            const { _version, _date, ...data } = backup;
                            Object.entries(data).forEach(([k, v]) => {
                              localStorage.setItem(k, v as string);
                            });
                            alert(`✅ Backup from ${_date?.slice(0,10) ?? 'unknown date'} restored successfully!\n\nPlease refresh the page to see your data.`);
                          } catch {
                            alert('❌ Failed to parse backup file. Make sure it is a valid birdsong_backup.json file.');
                          }
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Accepted format: <code>.json</code> (Birdsong Observatory backup only)</span>
                </div>
              </div>

              {/* Tips */}
              <div style={{ marginTop: '2rem', padding: '1rem 1.5rem', background: '#ede9fe', borderRadius: '10px', borderLeft: '4px solid #4f46e5', fontSize: '0.85rem', color: '#4c1d95', lineHeight: 1.6 }}>
                <strong>💡 Tip:</strong> Export a fresh backup every time you add a new project, upload new BirdNET data, or edit species metadata. Store the file in your Google Drive or email it to yourself as a safety net.
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
};

export default AdminDashboard;
