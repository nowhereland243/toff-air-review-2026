import fs from 'fs';
import path from 'path';

export interface WorkSample {
  name: string;
  original: string;
  web: string;
  isImage?: boolean;
  ext?: string;
}

export interface CvFile {
  name: string;
  path: string;
}

export interface RoomRequest {
  room: string;
  term: string | null;
  price: string | null;
}

export interface Applicant {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  city: string;
  country: string;
  medium: string;
  bio: string;
  proposal: string;
  artworkDescriptions: string;
  plansForArchive: string;
  writingSamples: string;
  pastResidency: string;
  anythingElse: string;
  website: string | null;
  socialUrl: string | null;
  otherLinks: string | null;
  videoAudioUrls: string | null;
  isLA: boolean;
  roomRequests: RoomRequest[];
  flexibilityNote: string | null;
  workSamples: WorkSample[];
  cvFiles: CvFile[];
  scoreUrl: string | null;
}

export interface CohortConfig {
  cohort: string;
  cohortTitle: string;
  notionDatabaseId: string;
  scoreFormPrefillTemplate: string;
  scoringDeadline: string;
}

export function getApplicants(cohort: string = '2026'): Applicant[] {
  const filePath = path.join(process.cwd(), 'data', cohort, 'applicants.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const fileData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileData) as Applicant[];
}

export function getApplicantBySlug(slug: string, cohort: string = '2026'): Applicant | null {
  const applicants = getApplicants(cohort);
  return applicants.find(a => a.slug === slug) || null;
}

export function getCohortConfig(cohort: string = '2026'): CohortConfig {
  const filePath = path.join(process.cwd(), 'config', `${cohort}.json`);
  if (!fs.existsSync(filePath)) {
    return {
      cohort: '2026',
      cohortTitle: 'Artist-in-Residence Applications — 2026',
      notionDatabaseId: '',
      scoreFormPrefillTemplate: '',
      scoringDeadline: '2026-08-15'
    };
  }
  const fileData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileData) as CohortConfig;
}
