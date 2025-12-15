import { useState, useEffect } from 'react';
import { Area, AidType, AID_TYPE_LABELS, Organization, DuplicateWarning } from '@/types/aid';
import { useAuth } from '@/contexts/AuthContext';
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
import { MapPin, Send, AlertCircle, Lock } from 'lucide-react';

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
  }) => Promise<unknown>;
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
  const { user, profile, isAdmin } = useAuth();
  
  // If user has an organization, pre-select it
  const defaultOrgId = profile?.organization_id || '';
  
  const [formData, setFormData] = useState({
    areaId: selectedArea?.id || '',
    aidType: '' as AidType | '',
    organizationId: defaultOrgId,
    quantity: '',
    unit: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update org when profile loads
  useEffect(() => {
    if (profile?.organization_id) {
      setFormData(prev => ({ ...prev, organizationId: profile.organization_id || '' }));
    }
  }, [profile?.organization_id]);

  // Reset form when area changes
  useEffect(() => {
    if (selectedArea) {
      setFormData(prev => ({ ...prev, areaId: selectedArea.id }));
    }
  }, [selectedArea]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to submit aid reports.',
        variant: 'destructive',
      });
      return;
    }

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

    await submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    
    const org = organizations.find(o => o.id === formData.organizationId);
    
    const result = await onSubmit({
      areaId: formData.areaId,
      aidType: formData.aidType as AidType,
      organizationId: formData.organizationId,
      organizationName: org?.name || '',
      quantity: Number(formData.quantity),
      unit: formData.unit,
      deliveryDate: formData.deliveryDate,
      notes: formData.notes || undefined,
    });

    setIsSubmitting(false);

    if (result) {
      toast({
        title: 'Aid report submitted',
        description: 'The aid delivery has been recorded successfully.',
      });

      // Reset form
      setFormData({
        areaId: '',
        aidType: '',
        organizationId: defaultOrgId,
        quantity: '',
        unit: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowWarningDialog(false);
      onClose();
    }
  };

  const selectedAreaData = areas.find(a => a.id === formData.areaId);

  // Check if user can select organization (admins can, regular users use their assigned org)
  const canSelectOrg = isAdmin || !profile?.organization_id;

  if (!user) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
            <p className="text-muted-foreground mb-4">
              You need to sign in to submit aid reports.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

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
              {canSelectOrg ? (
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
              ) : (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-medium">
                    {organizations.find(o => o.id === formData.organizationId)?.name || 'Your organization'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can only submit reports for your organization
                  </p>
                </div>
              )}
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
            <Button 
              type="submit" 
              className="w-full touch-target" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
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
