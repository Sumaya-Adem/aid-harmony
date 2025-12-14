import { AidType, AidStatus, AID_TYPE_LABELS, Organization } from '@/types/aid';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AidTypeIcon } from './AidTypeIcon';
import { Filter, X, Map, Table } from 'lucide-react';

interface FilterBarProps {
  selectedAidType: AidType | 'all';
  selectedOrg: string;
  selectedTimePeriod: string;
  selectedStatus: AidStatus | 'all';
  organizations: Organization[];
  onAidTypeChange: (value: AidType | 'all') => void;
  onOrgChange: (value: string) => void;
  onTimePeriodChange: (value: string) => void;
  onStatusChange: (value: AidStatus | 'all') => void;
  onClearFilters: () => void;
  viewMode: 'map' | 'table';
  onViewModeChange: (mode: 'map' | 'table') => void;
}

const aidTypes: (AidType | 'all')[] = ['all', 'water', 'food', 'health', 'cash'];
const timePeriods = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];
const statuses: (AidStatus | 'all')[] = ['all', 'not-aided', 'partial', 'full', 'duplicate'];

export function FilterBar({
  selectedAidType,
  selectedOrg,
  selectedTimePeriod,
  selectedStatus,
  organizations,
  onAidTypeChange,
  onOrgChange,
  onTimePeriodChange,
  onStatusChange,
  onClearFilters,
  viewMode,
  onViewModeChange,
}: FilterBarProps) {
  const hasActiveFilters = 
    selectedAidType !== 'all' || 
    selectedOrg !== 'all' || 
    selectedTimePeriod !== 'all' ||
    selectedStatus !== 'all';

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Icon */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline">Filters</span>
        </div>

        {/* Aid Type Filter */}
        <Select value={selectedAidType} onValueChange={v => onAidTypeChange(v as AidType | 'all')}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Aid type" />
          </SelectTrigger>
          <SelectContent>
            {aidTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? (
                  'All types'
                ) : (
                  <span className="flex items-center gap-2">
                    <AidTypeIcon type={type} size="sm" />
                    {AID_TYPE_LABELS[type]}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Organization Filter */}
        <Select value={selectedOrg} onValueChange={onOrgChange}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All organizations</SelectItem>
            {organizations.map(org => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Period Filter */}
        <Select value={selectedTimePeriod} onValueChange={onTimePeriodChange}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            {timePeriods.map(period => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={v => onStatusChange(v as AidStatus | 'all')}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {status === 'all' ? 'All statuses' : status.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex items-center rounded-lg border border-border p-0.5">
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('map')}
            className="h-8"
          >
            <Map className="h-4 w-4 mr-1" />
            Map
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
            className="h-8"
          >
            <Table className="h-4 w-4 mr-1" />
            Table
          </Button>
        </div>
      </div>
    </div>
  );
}
