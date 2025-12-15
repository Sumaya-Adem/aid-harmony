import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  ArrowLeft, 
  Users, 
  Building2, 
  Settings,
  UserPlus,
  Loader2 
} from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string | null;
  organization_name: string | null;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  type: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editOrgId, setEditOrgId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, type');
      
      setOrganizations(orgsData || []);

      // Fetch profiles with roles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          organization_id,
          organizations (name)
        `);

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      const usersWithRoles: UserWithRole[] = (profilesData || []).map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        organization_id: p.organization_id,
        organization_name: p.organizations?.name || null,
        role: rolesMap.get(p.id) || 'ngo_user',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditOrgId(user.organization_id || '');
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      // Update role - cast to the enum type expected by the database
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: editRole as 'admin' | 'ngo_user' | 'viewer' })
        .eq('user_id', selectedUser.id);

      if (roleError) throw roleError;

      // Update organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: editOrgId || null })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      toast({
        title: 'User updated',
        description: 'User settings have been saved successfully.',
      });

      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'ngo_user':
        return <Badge variant="secondary">NGO User</Badge>;
      case 'viewer':
        return <Badge variant="outline">Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Admin Settings</h1>
              <p className="text-xs text-muted-foreground">Manage users and system settings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organizations.length}</p>
                <p className="text-sm text-muted-foreground">Organizations</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">User Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage user roles and organization assignments
            </p>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.organization_name || (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update role and organization for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ngo_user">NGO User</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={editOrgId} onValueChange={setEditOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No organization</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
