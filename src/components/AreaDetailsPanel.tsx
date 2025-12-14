import { Area, AidRecord, AID_TYPE_LABELS, AidType } from '@/types/aid';
import { StatusBadge } from './StatusBadge';
import { AidTypeIcon } from './AidTypeIcon';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, MapPin, Users, Calendar, Building2, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AreaDetailsPanelProps {
  area: Area;
  records: AidRecord[];
  onClose: () => void;
  onSubmitAid: () => void;
}

export function AreaDetailsPanel({ area, records, onClose, onSubmitAid }: AreaDetailsPanelProps) {
  const aidTypes: AidType[] = ['water', 'food', 'health', 'cash'];
  
  const getLastAidByType = (type: AidType) => {
    return records.find(r => r.aidType === type);
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{area.village}</h2>
            <p className="text-sm text-muted-foreground">
              {area.district}, {area.region}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <StatusBadge status={area.status} size="md" />
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Population</p>
            <p className="font-medium">{area.population.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Area ID</p>
            <p className="font-medium text-xs">{area.id}</p>
          </div>
        </div>
      </div>

      {/* Aid Coverage */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Aid Coverage</h3>
        <div className="space-y-2">
          {aidTypes.map(type => {
            const lastAid = getLastAidByType(type);
            return (
              <div 
                key={type} 
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <AidTypeIcon type={type} showLabel size="sm" />
                {lastAid ? (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lastAid.deliveryDate), { addSuffix: true })}
                  </span>
                ) : (
                  <span className="text-xs text-destructive font-medium">Not received</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Aid History */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium">Aid History</h3>
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 pb-4">
            {records.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No aid records found</p>
              </div>
            ) : (
              records.map(record => (
                <div 
                  key={record.id}
                  className="p-3 rounded-lg border border-border bg-background"
                >
                  <div className="flex items-start justify-between mb-2">
                    <AidTypeIcon type={record.aidType} showLabel size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(record.deliveryDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>{record.organizationName}</span>
                  </div>
                  <p className="text-sm mt-1 font-medium">
                    {record.quantity} {record.unit}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Action Button */}
      <div className="p-4 border-t border-border">
        <Button 
          className="w-full touch-target" 
          size="lg"
          onClick={onSubmitAid}
        >
          Submit Aid Report
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
