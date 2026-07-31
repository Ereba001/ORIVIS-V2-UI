export type OrgTypeGroup = 'ACADEMIC' | 'GOVERNMENT' | 'CORPORATE' | 'CIVIC' | 'OTHER'

export type OrgSubType =
  | 'UNIVERSITY'
  | 'COLLEGE'
  | 'STUDENT_UNION'
  | 'RESEARCH_INSTITUTE'
  | 'ACADEMIC_ASSOCIATION'
  | 'SCHOOL_BOARD'
  | 'EXECUTIVE'
  | 'LEGISLATURE'
  | 'JUDICIARY'
  | 'FEDERAL_MINISTRY'
  | 'STATE_MINISTRY'
  | 'LOCAL_GOVT'
  | 'INDEPENDENT_COMMISSION'
  | 'REGULATORY_BODY'
  | 'STATE_ENTERPRISE'
  | 'PUBLIC_AUTHORITY'
  | 'CORPORATION'
  | 'PROFESSIONAL_BODY'
  | 'COOPERATIVE'
  | 'TRADE_UNION'
  | 'CHAMBER_OF_COMMERCE'
  | 'INDUSTRY_ASSOCIATION'
  | 'PARTNERSHIP'
  | 'LIMITED_LIABILITY'
  | 'NGO'
  | 'RELIGIOUS_ORG'
  | 'COMMUNITY_ORG'
  | 'ASSOCIATION'
  | 'FOUNDATION'
  | 'CHARITY'
  | 'CULTURAL_ORG'
  | 'SPORTS_CLUB'
  | 'ALUMNI_ASSOC'
  | 'OTHER'

export interface AcademicFields {
  institutionCategory: 'FEDERAL' | 'STATE' | 'PRIVATE' | ''
  yearEstablished: string
  facultyCount: string
  studentPopulation: string
  accreditationBody: string
}

export interface GovernmentFields {
  levelOfGovernment: 'FEDERAL_NATIONAL' | 'STATE_PROVINCIAL' | 'LOCAL_MUNICIPAL' | 'SUPRANATIONAL' | ''
  ministryDepartment: string
  jurisdictionArea: string
  registrationNumber: string
  yearEstablished: string
}

export interface CorporateFields {
  registrationNumber: string
  industry: string
  employeeCount: string
  yearEstablished: string
}

export interface CivicFields {
  registrationNumber: string
  areaOfOperation: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL' | ''
  yearFounded: string
  focusArea: string
}

export interface OtherFields {
  registrationNumber: string
  description: string
}

export type OrgTypeSpecificFields = AcademicFields | GovernmentFields | CorporateFields | CivicFields | OtherFields

export const ORG_TYPE_GROUP_LABELS: Record<OrgTypeGroup, string> = {
  ACADEMIC: 'Academic',
  GOVERNMENT: 'Government',
  CORPORATE: 'Corporate',
  CIVIC: 'Civic',
  OTHER: 'Other',
}

export type OrgTypeOption = {
  value: OrgSubType
  label: string
  group: OrgTypeGroup
}

export const ORG_TYPE_OPTIONS: OrgTypeOption[] = [
  { value: 'STUDENT_UNION', label: 'Student Union / Government', group: 'ACADEMIC' },
  { value: 'RESEARCH_INSTITUTE', label: 'Research Institute', group: 'ACADEMIC' },
  { value: 'ACADEMIC_ASSOCIATION', label: 'Faculty / Department', group: 'ACADEMIC' },
  { value: 'SCHOOL_BOARD', label: 'School Board / Education Authority', group: 'ACADEMIC' },

  { value: 'EXECUTIVE', label: 'Executive Branch (Presidency, Cabinet)', group: 'GOVERNMENT' },
  { value: 'LEGISLATURE', label: 'Legislative Branch (Parliament, Congress)', group: 'GOVERNMENT' },
  { value: 'JUDICIARY', label: 'Judicial Branch (Courts, Judicial Council)', group: 'GOVERNMENT' },
  { value: 'FEDERAL_MINISTRY', label: 'Federal / National Ministry', group: 'GOVERNMENT' },
  { value: 'STATE_MINISTRY', label: 'State / Provincial Ministry', group: 'GOVERNMENT' },
  { value: 'LOCAL_GOVT', label: 'Local / Municipal Government', group: 'GOVERNMENT' },
  { value: 'INDEPENDENT_COMMISSION', label: 'Independent Commission / Agency', group: 'GOVERNMENT' },
  { value: 'REGULATORY_BODY', label: 'Regulatory Authority', group: 'GOVERNMENT' },
  { value: 'STATE_ENTERPRISE', label: 'State-Owned Enterprise / Public Corporation', group: 'GOVERNMENT' },
  { value: 'PUBLIC_AUTHORITY', label: 'Public Authority / Board', group: 'GOVERNMENT' },

  { value: 'CORPORATION', label: 'Corporation', group: 'CORPORATE' },
  { value: 'PROFESSIONAL_BODY', label: 'Professional Body', group: 'CORPORATE' },
  { value: 'COOPERATIVE', label: 'Cooperative Society', group: 'CORPORATE' },
  { value: 'TRADE_UNION', label: 'Trade Union / Labor Union', group: 'CORPORATE' },
  { value: 'CHAMBER_OF_COMMERCE', label: 'Chamber of Commerce', group: 'CORPORATE' },
  { value: 'INDUSTRY_ASSOCIATION', label: 'Industry Association', group: 'CORPORATE' },
  { value: 'PARTNERSHIP', label: 'Partnership / Firm', group: 'CORPORATE' },
  { value: 'LIMITED_LIABILITY', label: 'Limited Liability Company (LLC)', group: 'CORPORATE' },

  { value: 'NGO', label: 'Non-Governmental Organization (NGO)', group: 'CIVIC' },
  { value: 'RELIGIOUS_ORG', label: 'Religious Organization', group: 'CIVIC' },
  { value: 'COMMUNITY_ORG', label: 'Community-Based Organization', group: 'CIVIC' },
  { value: 'ASSOCIATION', label: 'Association / Society', group: 'CIVIC' },
  { value: 'FOUNDATION', label: 'Foundation', group: 'CIVIC' },
  { value: 'CHARITY', label: 'Charitable Organization', group: 'CIVIC' },
  { value: 'CULTURAL_ORG', label: 'Cultural Organization', group: 'CIVIC' },
  { value: 'SPORTS_CLUB', label: 'Sports Club / Association', group: 'CIVIC' },
  { value: 'ALUMNI_ASSOC', label: 'Alumni Association', group: 'CIVIC' },

  { value: 'OTHER', label: 'Other', group: 'OTHER' },
]

export function getGroupForSubType(subType: OrgSubType): OrgTypeGroup {
  const option = ORG_TYPE_OPTIONS.find(o => o.value === subType)
  return option?.group ?? 'OTHER'
}

export const ORG_TYPES_BY_GROUP: Record<OrgTypeGroup, OrgTypeOption[]> = {
  ACADEMIC: ORG_TYPE_OPTIONS.filter(o => o.group === 'ACADEMIC'),
  GOVERNMENT: ORG_TYPE_OPTIONS.filter(o => o.group === 'GOVERNMENT'),
  CORPORATE: ORG_TYPE_OPTIONS.filter(o => o.group === 'CORPORATE'),
  CIVIC: ORG_TYPE_OPTIONS.filter(o => o.group === 'CIVIC'),
  OTHER: ORG_TYPE_OPTIONS.filter(o => o.group === 'OTHER'),
}

export interface OrganizePhase1 {
  orgCategory: OrgTypeGroup | ''
  organizationName: string
  organizationType: OrgSubType | ''
  country: string
  state: string
  city: string
  officialEmail: string
  phoneCodeLabel: string
  officialPhone: string
  website: string
  typeFields: OrgTypeSpecificFields
}

export const DEFAULT_ACADEMIC: AcademicFields = {
  institutionCategory: '',
  yearEstablished: '',
  facultyCount: '',
  studentPopulation: '',
  accreditationBody: '',
}

export const DEFAULT_GOVERNMENT: GovernmentFields = {
  levelOfGovernment: '',
  ministryDepartment: '',
  jurisdictionArea: '',
  registrationNumber: '',
  yearEstablished: '',
}

export const DEFAULT_CORPORATE: CorporateFields = {
  registrationNumber: '',
  industry: '',
  employeeCount: '',
  yearEstablished: '',
}

export const DEFAULT_CIVIC: CivicFields = {
  registrationNumber: '',
  areaOfOperation: '',
  yearFounded: '',
  focusArea: '',
}

export const DEFAULT_OTHER: OtherFields = {
  registrationNumber: '',
  description: '',
}

export function getDefaultFieldsForGroup(group: OrgTypeGroup): OrgTypeSpecificFields {
  switch (group) {
    case 'ACADEMIC': return { ...DEFAULT_ACADEMIC }
    case 'GOVERNMENT': return { ...DEFAULT_GOVERNMENT }
    case 'CORPORATE': return { ...DEFAULT_CORPORATE }
    case 'CIVIC': return { ...DEFAULT_CIVIC }
    case 'OTHER': return { ...DEFAULT_OTHER }
  }
}

export interface OrganizePhase2 {
  registrationCert: File | null
  logo: File | null
  banner: File | null
  brandColor: string
  tagline: string
  twitterUrl: string
  linkedinUrl: string
}

export interface OrganizePhase3 {
  electionTitle: string
  electionType: 'GENERAL' | 'BY_ELECTION' | 'REFERENDUM' | 'POLL' | ''
  description: string
  expectedCandidates: string
  electionDate: string
  startTime: string
  endTime: string
  timezone: string
  estimatedVoterPopulation: string
}

export interface OrganizeFormState {
  phase1: OrganizePhase1
  phase2: OrganizePhase2
  phase3: OrganizePhase3
  acceptedTerms: boolean
  useOrgEmail: boolean
  customAdminEmail: string
}

export const DEFAULT_PHASE1: OrganizePhase1 = {
  orgCategory: '',
  organizationName: '',
  organizationType: '',
  country: '',
  state: '',
  city: '',
  officialEmail: '',
  phoneCodeLabel: '+234 (NGA)',
  officialPhone: '',
  website: '',
  typeFields: { ...DEFAULT_OTHER },
}

export const DEFAULT_PHASE2: OrganizePhase2 = {
  registrationCert: null,
  logo: null,
  banner: null,
  brandColor: '#FCA311',
  tagline: '',
  twitterUrl: '',
  linkedinUrl: '',
}

export const DEFAULT_PHASE3: OrganizePhase3 = {
  electionTitle: '',
  electionType: '',
  description: '',
  expectedCandidates: '',
  electionDate: '',
  startTime: '',
  endTime: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  estimatedVoterPopulation: '',
}

export const INITIAL_FORM_STATE: OrganizeFormState = {
  phase1: { ...DEFAULT_PHASE1 },
  phase2: { ...DEFAULT_PHASE2 },
  phase3: { ...DEFAULT_PHASE3 },
  acceptedTerms: false,
  useOrgEmail: true,
  customAdminEmail: '',
}
