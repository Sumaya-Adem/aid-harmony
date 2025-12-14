import { useState, useMemo, useCallback } from 'react';
import { areas as initialAreas, aidRecords as initialRecords, organizations } from '@/data/mockData';
import { Area, AidRecord, AidType, AidStatus, DuplicateWarning, AID_RESTRICTION_DAYS } from '@/types/aid';

export function useAidData() {
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [aidRecords, setAidRecords] = useState<AidRecord[]>(initialRecords);

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

  const calculateAreaStatus = useCallback((areaId: string): AidStatus => {
    const records = getRecordsByArea(areaId);
    if (records.length === 0) return 'not-aided';

    const now = new Date();
    const aidTypes: AidType[] = ['water', 'food', 'health', 'cash'];
    let coveredTypes = 0;
    let hasDuplicate = false;

    for (const type of aidTypes) {
      const typeRecords = records.filter(r => r.aidType === type);
      if (typeRecords.length === 0) continue;

      const latestRecord = typeRecords[0];
      const recordDate = new Date(latestRecord.deliveryDate);
      const daysDiff = Math.floor(
        (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= AID_RESTRICTION_DAYS[type]) {
        coveredTypes++;

        // Check for duplicate within same type
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
  }, [getRecordsByArea]);

  const addAidRecord = useCallback((record: Omit<AidRecord, 'id' | 'createdAt'>) => {
    const newRecord: AidRecord = {
      ...record,
      id: `aid-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setAidRecords(prev => [newRecord, ...prev]);

    // Update area status
    const newStatus = calculateAreaStatus(record.areaId);
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
  }, [calculateAreaStatus]);

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
      coveragePercent: Math.round((aidedPopulation / totalPopulation) * 100),
    };
  }, [areas]);

  return {
    areas,
    aidRecords,
    organizations,
    stats,
    getAreaById,
    getRecordsByArea,
    checkDuplicateAid,
    addAidRecord,
  };
}
