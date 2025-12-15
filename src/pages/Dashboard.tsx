import { useState, useMemo } from 'react';
import { useAidData } from '@/hooks/useAidData';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { StatsCard } from '@/components/StatsCard';
import { FilterBar } from '@/components/FilterBar';
import { MapView } from '@/components/MapView';
import { AidTable } from '@/components/AidTable';
import { AreaDetailsPanel } from '@/components/AreaDetailsPanel';
import { AidSubmitForm } from '@/components/AidSubmitForm';
import { Area, AidType, AidStatus } from '@/types/aid';
import { 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Loader2 
} from 'lucide-react';

export default function Dashboard() {
  const { 
    areas, 
    aidRecords, 
    organizations, 
    stats,
    loading,
    getRecordsByArea,
    checkDuplicateAid,
    addAidRecord,
  } = useAidData();

  const { user } = useAuth();

  // UI State
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter State
  const [selectedAidType, setSelectedAidType] = useState<AidType | 'all'>('all');
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<AidStatus | 'all'>('all');

  // Filtered Areas
  const filteredAreas = useMemo(() => {
    return areas.filter(area => {
      // Status filter
      if (selectedStatus !== 'all' && area.status !== selectedStatus) {
        return false;
      }

      // For other filters, we need to check aid records
      const areaRecords = getRecordsByArea(area.id);

      // Aid type filter
      if (selectedAidType !== 'all') {
        const hasType = areaRecords.some(r => r.aidType === selectedAidType);
        if (!hasType && area.lastAidType !== selectedAidType) {
          return false;
        }
      }

      // Organization filter
      if (selectedOrg !== 'all') {
        const hasOrg = areaRecords.some(r => r.organizationId === selectedOrg);
        if (!hasOrg) return false;
      }

      // Time period filter
      if (selectedTimePeriod !== 'all') {
        const days = parseInt(selectedTimePeriod);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const hasRecentAid = areaRecords.some(r => 
          new Date(r.deliveryDate) >= cutoffDate
        );
        if (!hasRecentAid) return false;
      }

      return true;
    });
  }, [areas, selectedStatus, selectedAidType, selectedOrg, selectedTimePeriod, getRecordsByArea]);

  const clearFilters = () => {
    setSelectedAidType('all');
    setSelectedOrg('all');
    setSelectedTimePeriod('all');
    setSelectedStatus('all');
  };

  const handleAreaSelect = (area: Area) => {
    setSelectedArea(area);
  };

  const handleCloseDetails = () => {
    setSelectedArea(null);
  };

  const handleOpenSubmitForm = () => {
    setShowSubmitForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading aid data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
        onSubmitAid={handleOpenSubmitForm}
      />

      <main className="container py-4 space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatsCard
            title="Total Areas"
            value={stats.total}
            icon={<MapPin className="h-5 w-5" />}
            variant="info"
          />
          <StatsCard
            title="Not Aided"
            value={stats['not-aided']}
            subtitle="Need immediate help"
            icon={<XCircle className="h-5 w-5" />}
            variant="danger"
          />
          <StatsCard
            title="Partially Aided"
            value={stats.partial}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="warning"
          />
          <StatsCard
            title="Fully Aided"
            value={stats.full}
            icon={<CheckCircle className="h-5 w-5" />}
            variant="success"
          />
          <StatsCard
            title="Duplicate Alerts"
            value={stats.duplicate}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="warning"
          />
          <StatsCard
            title="Coverage"
            value={`${stats.coveragePercent}%`}
            subtitle={`${stats.aidedPopulation.toLocaleString()} people`}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="success"
          />
        </div>

        {/* Priority Alert */}
        {stats['not-aided'] > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {stats['not-aided']} areas have not received any aid
              </p>
              <p className="text-sm text-muted-foreground">
                These locations should be prioritized for immediate humanitarian response.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <FilterBar
          selectedAidType={selectedAidType}
          selectedOrg={selectedOrg}
          selectedTimePeriod={selectedTimePeriod}
          selectedStatus={selectedStatus}
          organizations={organizations}
          onAidTypeChange={setSelectedAidType}
          onOrgChange={setSelectedOrg}
          onTimePeriodChange={setSelectedTimePeriod}
          onStatusChange={setSelectedStatus}
          onClearFilters={clearFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Main Content */}
        <div className="flex gap-4">
          {/* Map/Table View */}
          <div className={`flex-1 ${selectedArea && viewMode === 'map' ? 'lg:w-2/3' : 'w-full'}`}>
            {viewMode === 'map' ? (
              <div className="h-[500px] lg:h-[600px]">
                <MapView
                  areas={filteredAreas}
                  selectedArea={selectedArea}
                  onAreaSelect={handleAreaSelect}
                />
              </div>
            ) : (
              <AidTable
                areas={filteredAreas}
                onAreaSelect={handleAreaSelect}
              />
            )}
          </div>

          {/* Details Panel (Desktop) */}
          {selectedArea && viewMode === 'map' && (
            <div className="hidden lg:block w-80 xl:w-96">
              <AreaDetailsPanel
                area={selectedArea}
                records={getRecordsByArea(selectedArea.id)}
                onClose={handleCloseDetails}
                onSubmitAid={handleOpenSubmitForm}
              />
            </div>
          )}
        </div>

        {/* Mobile Details Panel */}
        {selectedArea && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-auto bg-background rounded-t-2xl shadow-xl border-t border-border">
            <AreaDetailsPanel
              area={selectedArea}
              records={getRecordsByArea(selectedArea.id)}
              onClose={handleCloseDetails}
              onSubmitAid={handleOpenSubmitForm}
            />
          </div>
        )}
      </main>

      {/* Submit Aid Form */}
      <AidSubmitForm
        open={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
        areas={areas}
        organizations={organizations}
        selectedArea={selectedArea}
        checkDuplicate={checkDuplicateAid}
        onSubmit={addAidRecord}
      />
    </div>
  );
}
