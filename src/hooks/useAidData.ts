import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Area, AidRecord, AidType, AidStatus, DuplicateWarning, AID_RESTRICTION_DAYS, Organization } from '@/types/aid';
import { useToast } from '@/hooks/use-toast';

export function useAidData() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [aidRecords, setAidRecords] = useState<AidRecord[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Fetch data from database
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch organizations
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*');

        if (orgsError) throw orgsError;
        
        const mappedOrgs: Organization[] = (orgsData || []).map(org => ({
          id: org.id,
          name: org.name,
          type: org.type as 'ngo' | 'government' | 'partner',
          color: org.color || '#1E3A5F',
        }));
        setOrganizations(mappedOrgs);

        // Fetch areas
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .select('*');

        if (areasError) throw areasError;

        // Fetch aid records with organization names
        const { data: recordsData, error: recordsError } = await supabase
          .from('aid_records')
          .select(`
            *,
            organizations (name)
          `)
          .order('delivery_date', { ascending: false });

        if (recordsError) throw recordsError;

        const mappedRecords: AidRecord[] = (recordsData || []).map(record => ({
          id: record.id,
          areaId: record.area_id,
          aidType: record.aid_type as AidType,
          organizationId: record.organization_id,
          organizationName: record.organizations?.name || 'Unknown',
          quantity: Number(record.quantity),
          unit: record.unit,
          deliveryDate: record.delivery_date,
          notes: record.notes || undefined,
          createdAt: record.created_at,
        }));
        setAidRecords(mappedRecords);

        // Calculate area statuses
        const mappedAreas: Area[] = (areasData || []).map(area => {
          const areaRecords = mappedRecords.filter(r => r.areaId === area.id);
          const status = calculateStatus(areaRecords);
          const lastRecord = areaRecords[0];

          return {
            id: area.id,
            country: area.country,
            region: area.region,
            district: area.district,
            village: area.village,
            latitude: Number(area.latitude),
            longitude: Number(area.longitude),
            population: area.population,
            status,
            lastAidDate: lastRecord?.deliveryDate,
            lastAidType: lastRecord?.aidType,
            lastAidOrg: lastRecord?.organizationName,
          };
        });
        setAreas(mappedAreas);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error loading data',
          description: 'Failed to load aid data. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  const calculateStatus = (records: AidRecord[]): AidStatus => {
    if (records.length === 0) return 'not-aided';

    const now = new Date();
    const aidTypes: AidType[] = ['water', 'food', 'health', 'cash'];
    let coveredTypes = 0;
    let hasDuplicate = false;

    for (const type of aidTypes) {
      const typeRecords = records
        .filter(r => r.aidType === type)
        .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());

      if (typeRecords.length === 0) continue;

      const latestRecord = typeRecords[0];
      const recordDate = new Date(latestRecord.deliveryDate);
      const daysDiff = Math.floor(
        (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= AID_RESTRICTION_DAYS[type]) {
        coveredTypes++;

        if (typeRecords.length > 1) {
          const secondRecord = typeRecords[1];
          const secondDate = new Date(secondRecord.deliveryDate);
          const secondDaysDiff = Math.floor(
            (recordDate.getTime() - secondDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (secondDaysDiff < AID_RESTRICTION_DAYS[type]) {
            hasDuplicate = true;
          }
        }
      }
    }

    if (hasDuplicate) return 'duplicate';
    if (coveredTypes >= 3) return 'full';
    if (coveredTypes >= 1) return 'partial';
    return 'not-aided';
  };

  const getAreaById = useCallback((areaId: string) => {
    return areas.find(area => area.id === areaId);
  }, [areas]);

  const getRecordsByArea = useCallback((areaId: string) => {
    return aidRecords
      .filter(record => record.areaId === areaId)
      .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
  }, [aidRecords]);

  const checkDuplicateAid = useCallback((
    areaId: string,
    aidType: AidType,
    deliveryDate: string
  ): DuplicateWarning => {
    const restrictionDays = AID_RESTRICTION_DAYS[aidType];
    const deliveryDateObj = new Date(deliveryDate);
    
    const existingRecords = aidRecords.filter(
      record => record.areaId === areaId && record.aidType === aidType
    );

    for (const record of existingRecords) {
      const recordDate = new Date(record.deliveryDate);
      const daysDiff = Math.floor(
        (deliveryDateObj.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= 0 && daysDiff < restrictionDays) {
        return {
          exists: true,
          lastRecord: record,
          daysSinceLastAid: daysDiff,
          restrictionDays,
        };
      }
    }

    return { exists: false, restrictionDays };
  }, [aidRecords]);

  const addAidRecord = useCallback(async (record: {
    areaId: string;
    aidType: AidType;
    organizationId: string;
    organizationName: string;
    quantity: number;
    unit: string;
    deliveryDate: string;
    notes?: string;
  }) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be signed in to submit aid reports.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('aid_records')
        .insert({
          area_id: record.areaId,
          aid_type: record.aidType,
          organization_id: record.organizationId,
          submitted_by: user.id,
          quantity: record.quantity,
          unit: record.unit,
          delivery_date: record.deliveryDate,
          notes: record.notes,
        })
        .select(`
          *,
          organizations (name)
        `)
        .single();

      if (error) throw error;

      const newRecord: AidRecord = {
        id: data.id,
        areaId: data.area_id,
        aidType: data.aid_type as AidType,
        organizationId: data.organization_id,
        organizationName: data.organizations?.name || 'Unknown',
        quantity: Number(data.quantity),
        unit: data.unit,
        deliveryDate: data.delivery_date,
        notes: data.notes || undefined,
        createdAt: data.created_at,
      };

      setAidRecords(prev => [newRecord, ...prev]);

      // Update area status
      const updatedRecords = [newRecord, ...aidRecords.filter(r => r.areaId === record.areaId)];
      const newStatus = calculateStatus(updatedRecords);
      
      setAreas(prev => prev.map(area => 
        area.id === record.areaId
          ? {
              ...area,
              status: newStatus,
              lastAidDate: record.deliveryDate,
              lastAidType: record.aidType,
              lastAidOrg: record.organizationName,
            }
          : area
      ));

      return newRecord;
    } catch (error) {
      console.error('Error adding aid record:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit aid report. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, aidRecords, toast]);

  const stats = useMemo(() => {
    const statusCounts = {
      'not-aided': 0,
      'partial': 0,
      'full': 0,
      'duplicate': 0,
    };

    areas.forEach(area => {
      statusCounts[area.status]++;
    });

    const totalPopulation = areas.reduce((sum, area) => sum + area.population, 0);
    const aidedPopulation = areas
      .filter(a => a.status === 'full' || a.status === 'partial')
      .reduce((sum, area) => sum + area.population, 0);

    return {
      ...statusCounts,
      total: areas.length,
      totalPopulation,
      aidedPopulation,
      coveragePercent: totalPopulation > 0 ? Math.round((aidedPopulation / totalPopulation) * 100) : 0,
    };
  }, [areas]);

  return {
    areas,
    aidRecords,
    organizations,
    stats,
    loading,
    getAreaById,
    getRecordsByArea,
    checkDuplicateAid,
    addAidRecord,
  };
}
