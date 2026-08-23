import { RaiseListingDraft, RaiseListingStage } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Step 1: Company & Raise Basics
export function validateStep1(data: Partial<RaiseListingDraft>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.company_name || data.company_name.trim().length === 0) {
    errors.push({ field: 'company_name', message: 'Company name is required' });
  } else if (data.company_name.length > 200) {
    errors.push({ field: 'company_name', message: 'Company name must be 200 characters or less' });
  }

  if (data.one_liner && data.one_liner.length > 500) {
    errors.push({ field: 'one_liner', message: 'One-liner must be 500 characters or less' });
  }

  if (data.company_website) {
    if (!isValidUrl(data.company_website)) {
      errors.push({ field: 'company_website', message: 'Please enter a valid website URL' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Step 2: Raise Details
export function validateStep2(data: Partial<RaiseListingDraft>): ValidationResult {
  const errors: ValidationError[] = [];

  if (data.stage && !isValidStage(data.stage)) {
    errors.push({ field: 'stage', message: 'Please select a valid funding stage' });
  }

  if (data.target_raise_amount !== undefined && data.target_raise_amount !== null) {
    if (data.target_raise_amount <= 0) {
      errors.push({ field: 'target_raise_amount', message: 'Target raise amount must be greater than 0' });
    }
    if (data.target_raise_amount > 1_000_000_000) {
      errors.push({ field: 'target_raise_amount', message: 'Target raise amount must be less than 1 billion' });
    }
  }

  if (!data.currency) {
    errors.push({ field: 'currency', message: 'Currency is required' });
  } else if (data.currency.length > 10) {
    errors.push({ field: 'currency', message: 'Currency code is invalid' });
  }

  if (data.raise_type && data.raise_type.length > 100) {
    errors.push({ field: 'raise_type', message: 'Raise type must be 100 characters or less' });
  }

  if (data.minimum_check_size !== undefined && data.minimum_check_size !== null) {
    if (data.minimum_check_size <= 0) {
      errors.push({ field: 'minimum_check_size', message: 'Minimum check size must be greater than 0' });
    }
    if (data.minimum_check_size > 1_000_000_000) {
      errors.push({ field: 'minimum_check_size', message: 'Minimum check size must be less than 1 billion' });
    }
  }

  if (data.use_of_funds && data.use_of_funds.length > 2000) {
    errors.push({ field: 'use_of_funds', message: 'Use of funds must be 2000 characters or less' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Step 3: Traction Summary
export function validateStep3(data: Partial<RaiseListingDraft>): ValidationResult {
  const errors: ValidationError[] = [];

  if (data.traction_summary && data.traction_summary.length > 3000) {
    errors.push({ field: 'traction_summary', message: 'Traction summary must be 3000 characters or less' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Step 4: Media
export function validateStep4(data: {
  company_logo_path?: string;
  pitch_deck_file_path?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // File paths are validated at upload time; here we just check that if they exist, they're non-empty strings
  if (data.company_logo_path !== undefined && typeof data.company_logo_path !== 'string') {
    errors.push({ field: 'company_logo_path', message: 'Logo path is invalid' });
  }

  if (data.pitch_deck_file_path !== undefined && typeof data.pitch_deck_file_path !== 'string') {
    errors.push({ field: 'pitch_deck_file_path', message: 'Deck path is invalid' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Step 5: Full pitch & description
export function validateStep5(data: Partial<RaiseListingDraft>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Pitch description is required' });
  } else if (data.description.length > 5000) {
    errors.push({ field: 'description', message: 'Pitch description must be 5000 characters or less' });
  }

  if (!Array.isArray(data.sector)) {
    errors.push({ field: 'sector', message: 'At least one sector is required' });
  } else if (data.sector.length === 0) {
    errors.push({ field: 'sector', message: 'At least one sector is required' });
  } else if (data.sector.length > 20) {
    errors.push({ field: 'sector', message: 'Maximum 20 sectors allowed' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Full form validation (used on submit)
export function validateFull(data: Partial<RaiseListingDraft>): ValidationResult {
  const errors: ValidationError[] = [];

  // Run all step validations
  const step1 = validateStep1(data);
  const step2 = validateStep2(data);
  const step3 = validateStep3(data);
  const step4 = validateStep4({ company_logo_path: data.company_logo_path, pitch_deck_file_path: data.pitch_deck_file_path });
  const step5 = validateStep5(data);

  errors.push(
    ...step1.errors,
    ...step2.errors,
    ...step3.errors,
    ...step4.errors,
    ...step5.errors
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Utility: validate URL format
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Utility: validate stage enum
function isValidStage(stage: string): stage is RaiseListingStage {
  const validStages: RaiseListingStage[] = [
    'pre_seed',
    'seed',
    'series_a',
    'series_b',
    'series_c_plus',
    'bridge',
    'other',
  ];
  return validStages.includes(stage as RaiseListingStage);
}
