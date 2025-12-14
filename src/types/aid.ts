export type AidType = 'water' | 'food' | 'health' | 'cash';

export type AidStatus = 'not-aided' | 'partial' | 'full' | 'duplicate';

export interface Area {
  id: string;
  country: string;
  region: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  population: number;
  status: AidStatus;
  lastAidDate?: string;
  lastAidType?: AidType;
  lastAidOrg?: string;
}

export interface AidRecord {
  id: string;
  areaId: string;
  aidType: AidType;
  organizationId: string;
  organizationName: string;
  quantity: number;
  unit: string;
  deliveryDate: string;
  notes?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'ngo' | 'government' | 'partner';
  color: string;
}

export interface DuplicateWarning {
  exists: boolean;
  lastRecord?: AidRecord;
  daysSinceLastAid?: number;
  restrictionDays: number;
}

// Time-based rules for duplicate detection (in days)
export const AID_RESTRICTION_DAYS: Record<AidType, number> = {
  water: 14,
  food: 30,
  health: 60,
  cash: 90,
};

export const AID_TYPE_LABELS: Record<AidType, string> = {
  water: 'Water',
  food: 'Food',
  health: 'Health',
  cash: 'Cash',
};

export const AID_TYPE_ICONS: Record<AidType, string> = {
  water: '💧',
  food: '🍞',
  health: '🏥',
  cash: '💵',
};
