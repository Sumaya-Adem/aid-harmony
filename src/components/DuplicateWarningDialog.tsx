import { DuplicateWarning, AID_TYPE_LABELS, AidType } from '@/types/aid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Building2, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';

interface DuplicateWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warning: DuplicateWarning;
  aidType: AidType;
  areaName: string;
}

export function DuplicateWarningDialog({
  open,
  onClose,
  onConfirm,
  warning,
  aidType,
  areaName,
}: DuplicateWarningDialogProps) {
  if (!warning.lastRecord) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <DialogTitle className="text-xl">Duplicate Aid Warning</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            This area has already received {AID_TYPE_LABELS[aidType]} aid within the restricted time window.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Organization</p>
              <p className="font-medium">{warning.lastRecord.organizationName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Aid Type</p>
              <p className="font-medium">{AID_TYPE_LABELS[warning.lastRecord.aidType]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Last Delivery</p>
              <p className="font-medium">
                {format(new Date(warning.lastRecord.deliveryDate), 'MMMM d, yyyy')}
                <span className="text-muted-foreground font-normal">
                  {' '}({warning.daysSinceLastAid} days ago)
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">
            <strong className="text-foreground">Restriction rule:</strong> {AID_TYPE_LABELS[aidType]} aid 
            should not be delivered to the same area within {warning.restrictionDays} days.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel & Redirect Aid
          </Button>
          <Button variant="warning" onClick={onConfirm}>
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
