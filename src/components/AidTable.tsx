import { Area, AidRecord } from '@/types/aid';
import { StatusBadge } from './StatusBadge';
import { AidTypeIcon } from './AidTypeIcon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AidTableProps {
  areas: Area[];
  onAreaSelect: (area: Area) => void;
}

export function AidTable({ areas, onAreaSelect }: AidTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="font-semibold">Region</TableHead>
            <TableHead className="font-semibold text-center">Population</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold">Last Aid</TableHead>
            <TableHead className="font-semibold">Organization</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map(area => (
            <TableRow 
              key={area.id}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => onAreaSelect(area)}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{area.village}</p>
                  <p className="text-xs text-muted-foreground">{area.district}</p>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{area.region}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{area.population.toLocaleString()}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <StatusBadge status={area.status} showIcon={false} size="sm" />
              </TableCell>
              <TableCell>
                {area.lastAidDate ? (
                  <div className="flex items-center gap-2">
                    {area.lastAidType && <AidTypeIcon type={area.lastAidType} size="sm" />}
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(area.lastAidDate), { addSuffix: true })}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-destructive">Never</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {area.lastAidOrg || '—'}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {areas.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No areas match the current filters</p>
        </div>
      )}
    </div>
  );
}
