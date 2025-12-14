import { useState } from 'react';
import { Area, AidStatus } from '@/types/aid';
import { cn } from '@/lib/utils';
import { MapPin, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';

interface MapViewProps {
  areas: Area[];
  selectedArea: Area | null;
  onAreaSelect: (area: Area) => void;
}

const statusColors: Record<AidStatus, string> = {
  'not-aided': 'bg-destructive',
  'partial': 'bg-partial',
  'full': 'bg-success',
  'duplicate': 'bg-warning',
};

const statusBorderColors: Record<AidStatus, string> = {
  'not-aided': 'border-destructive',
  'partial': 'border-partial',
  'full': 'border-success',
  'duplicate': 'border-warning',
};

export function MapView({ areas, selectedArea, onAreaSelect }: MapViewProps) {
  const [zoom, setZoom] = useState(1);

  // Simplified map visualization using positioned markers
  // In production, integrate with Mapbox or Leaflet
  const getMarkerPosition = (area: Area, index: number) => {
    // Spread markers in a grid pattern for visualization
    const row = Math.floor(index / 4);
    const col = index % 4;
    return {
      left: `${15 + col * 22}%`,
      top: `${15 + row * 25}%`,
    };
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 border border-border">
      {/* Map Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/30" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button 
          size="icon" 
          variant="outline" 
          className="bg-background/90 backdrop-blur-sm"
          onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          className="bg-background/90 backdrop-blur-sm"
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.6))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="bg-background/90 backdrop-blur-sm">
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">Aid Status</p>
        <div className="space-y-1.5">
          {(['not-aided', 'partial', 'full', 'duplicate'] as AidStatus[]).map(status => (
            <div key={status} className="flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', statusColors[status])} />
              <span className="text-xs capitalize">{status.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Region Labels */}
      <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        <p className="text-sm font-semibold text-foreground">Somalia</p>
        <p className="text-xs text-muted-foreground">Drought Response Region</p>
      </div>

      {/* Area Markers */}
      <div 
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      >
        {areas.map((area, index) => {
          const position = getMarkerPosition(area, index);
          const isSelected = selectedArea?.id === area.id;

          return (
            <button
              key={area.id}
              onClick={() => onAreaSelect(area)}
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200',
                'group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full',
                isSelected && 'z-20'
              )}
              style={position}
            >
              {/* Marker */}
              <div className={cn(
                'relative flex items-center justify-center',
                isSelected && 'scale-125'
              )}>
                {/* Pulse animation for not-aided areas */}
                {area.status === 'not-aided' && (
                  <div className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
                )}
                
                {/* Marker body */}
                <div className={cn(
                  'h-8 w-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all',
                  'hover:scale-110',
                  statusColors[area.status],
                  statusBorderColors[area.status],
                  isSelected && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                )}>
                  <MapPin className="h-4 w-4 text-white" />
                </div>

                {/* Tooltip */}
                <div className={cn(
                  'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border border-border shadow-lg',
                  'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap',
                  'text-xs font-medium'
                )}>
                  {area.village}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {areas.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-muted-foreground">No areas to display</p>
          </div>
        </div>
      )}
    </div>
  );
}
