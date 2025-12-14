import { useState } from 'react';
import { Area, AidType, AID_TYPE_LABELS, Organization, DuplicateWarning } from '@/types/aid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AidTypeIcon } from './AidTypeIcon';
import { DuplicateWarningDialog } from './DuplicateWarningDialog';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Send, AlertCircle } from 'lucide-react';

interface AidSubmitFormProps {
  open: boolean;
  onClose: () => void;
  areas: Area[];
  organizations: Organization[];
  selectedArea?: Area | null;
  checkDuplicate: (areaId: string, aidType: AidType, date: string) => DuplicateWarning;
  onSubmit: (data: {
    areaId: string;
    aidType: AidType;
    organizationId: string;
    organizationName: string;
    quantity: number;
    unit: string;
    deliveryDate: string;
    notes?: string;
  }) => void;
}

const aidTypes: AidType[] = ['water', 'food', 'health', 'cash'];

const unitsByType: Record<AidType, string[]> = {
  water: ['liters', 'gallons', 'tanks'],
  food: ['kg', 'metric tons', 'packages'],
  health: ['medical kits', 'vaccines', 'units'],
  cash: ['USD', 'EUR', 'local currency'],
};

export function AidSubmitForm({
  open,
  onClose,
  areas,
  organizations,
  selectedArea,
  checkDuplicate,
  onSubmit,
}: AidSubmitFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    areaId: selectedArea?.id || '',
    aidType: '' as AidType | '',
    organizationId: '',
    quantity: '',
    unit: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const handleAreaChange = (areaId: string) => {
    setFormData(prev => ({ ...prev, areaId }));
  };

  const handleAidTypeChange = (aidType: AidType) => {
    setFormData(prev => ({ 
      ...prev, 
      aidType,
      unit: unitsByType[aidType][0],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.areaId || !formData.aidType || !formData.organizationId || !formData.quantity) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate
    const warning = checkDuplicate(
      formData.areaId,
      formData.aidType as AidType,
      formData.deliveryDate
    );

    if (warning.exists) {
      setDuplicateWarning(warning);
      setShowWarningDialog(true);
      return;
    }

    submitForm();
  };

  const submitForm = () => {
    const org = organizations.find(o => o.id === formData.organizationId);
    
    onSubmit({
      areaId: formData.areaId,
      aidType: formData.aidType as AidType,
      organizationId: formData.organizationId,
      organizationName: org?.name || '',
      quantity: Number(formData.quantity),
      unit: formData.unit,
      deliveryDate: formData.deliveryDate,
      notes: formData.notes || undefined,
    });

    toast({
      title: 'Aid report submitted',
      description: 'The aid delivery has been recorded successfully.',
    });

    // Reset form
    setFormData({
      areaId: '',
      aidType: '',
      organizationId: '',
      quantity: '',
      unit: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowWarningDialog(false);
    onClose();
  };

  const selectedAreaData = areas.find(a => a.id === formData.areaId);

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Submit Aid Report
            </SheetTitle>
            <SheetDescription>
              Record a new aid delivery. The system will check for duplicates automatically.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Location Selection */}
            <div className="space-y-2">
              <Label htmlFor="area" className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Location *
              </Label>
              <Select value={formData.areaId} onValueChange={handleAreaChange}>
                <SelectTrigger id="area" className="touch-target">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.village}, {area.district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAreaData && (
                <p className="text-xs text-muted-foreground">
                  {selectedAreaData.region}, {selectedAreaData.country} • Pop: {selectedAreaData.population.toLocaleString()}
                </p>
              )}
            </div>

            {/* Aid Type */}
            <div className="space-y-2">
              <Label>Aid Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                {aidTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAidTypeChange(type)}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border transition-all touch-target
                      ${formData.aidType === type 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50 bg-background'
                      }
                    `}
                  >
                    <AidTypeIcon type={type} size="md" />
                    <span className="text-sm font-medium">{AID_TYPE_LABELS[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="org">Organization *</Label>
              <Select 
                value={formData.organizationId} 
                onValueChange={v => setFormData(prev => ({ ...prev, organizationId: v }))}
              >
                <SelectTrigger id="org" className="touch-target">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="touch-target"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={v => setFormData(prev => ({ ...prev, unit: v }))}
                  disabled={!formData.aidType}
                >
                  <SelectTrigger id="unit" className="touch-target">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.aidType && unitsByType[formData.aidType as AidType].map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Delivery Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.deliveryDate}
                onChange={e => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                className="touch-target"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Duplicate Warning Info */}
            <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                The system will automatically check for duplicate aid deliveries based on area, 
                aid type, and time-based rules.
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full touch-target" size="lg">
              Submit Report
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Duplicate Warning Dialog */}
      {duplicateWarning && formData.aidType && selectedAreaData && (
        <DuplicateWarningDialog
          open={showWarningDialog}
          onClose={() => setShowWarningDialog(false)}
          onConfirm={submitForm}
          warning={duplicateWarning}
          aidType={formData.aidType as AidType}
          areaName={selectedAreaData.village}
        />
      )}
    </>
  );
}
