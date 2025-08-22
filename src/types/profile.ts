interface UserProfile {
  degreeTarget: 'Bachelor' | 'Master' | 'PhD' | '';
  fields: string[];
  nationality: string;
  currentCountryOfResidence: string;
  languageProofs: string[];
  gpaBand: '>=90' | '80-89' | '70-79' | '<70' | '';
  graduationYear: string;
  workResearchYears: '0' | '1' | '2-3' | '4+' | '';
  specialStatuses: string[];
  deadlineWindow: 'Any' | '<=30' | '<=60' | '<=120' | '';
  cheveningWorkYears?: boolean;
  ageCapConflict?: boolean;
  engineeringSubfield?: string;
  fundingTolerance?: 'Fully funded only' | 'Allow partial if stipend >= X';
}

export type { UserProfile };