# Core Project Requirements & Workflow

*This document serves as the source of truth for the Birdsong Observatory web application architecture and user workflows, ensuring all future development aligns with the primary goals.*

## 1. Project Purpose
The web application is a post-processing visualization tool for biodiversity data. After raw audio is collected in the field and processed through BirdNET, this website is used to visualize the data and publish it. It is designed to be used collaboratively by multiple people for marketing, publishing, and data sharing.

## 2. User Roles & Collaboration
The application must support non-technical collaborators who cannot run code locally or use GitHub. All management must happen **online** via the deployed website.

### Admin Role (Can be a shared login)
- **Responsibilities:** Create new projects, create sites, upload BirdNET data files, and visualize the results.
- **Workflow:** Logs into the live website, uses the admin dashboard to build out the project structure and upload CSV/TXT data files.

### Manager Role (Individual logins required)
- **Responsibilities:** Manage their specific assigned site or project. 
- **Workflow:** Logs into the live website to curate what data goes public. They can toggle visibility settings (e.g., hiding the map for a specific site). 
- **Impact:** When a manager hides a map or changes a setting online, it must instantly and permanently affect the public-facing website for all visitors who do not have access.

## 3. Technical Implications
Because multiple non-technical users are modifying state, uploading files, and toggling public visibility settings concurrently online:
- The system **must** have a persistent, centralized database (not local storage).
- Changes to visibility settings must reflect instantly without requiring a full website redeployment.
- Data uploads must be saved to a permanent cloud storage bucket, not an ephemeral server disk.
