import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zonesApi } from '@/api';
import { useZoneStore } from '@/stores/zoneStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Folder,
  Calendar,
  DollarSign,
  Activity,
  BookOpen,
  Briefcase,
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Zone, CreateZoneInput } from '@/types';
import { cn } from '@/lib/utils';

// Icon mapping for zones
const iconMap: Record<string, any> = {
  folder: Folder,
  calendar: Calendar,
  dollar: DollarSign,
  activity: Activity,
  book: BookOpen,
  briefcase: Briefcase,
};

const defaultIcons = ['folder', 'calendar', 'dollar', 'activity', 'book', 'briefcase'];
const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ZoneSidebar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { zones, activeZoneId, setZones, setActiveZone, addZone, removeZone } = useZoneStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneIcon, setNewZoneIcon] = useState('folder');
  const [newZoneColor, setNewZoneColor] = useState('#3B82F6');

  // Fetch zones
  const { data: fetchedZones, isLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: zonesApi.list,
  });

  // Update local store when data is fetched
  useEffect(() => {
    if (fetchedZones) {
      setZones(fetchedZones);

      // Set active zone to default or first zone
      if (!activeZoneId && fetchedZones.length > 0) {
        const defaultZone = fetchedZones.find((z) => z.isDefault);
        setActiveZone(defaultZone?.id || fetchedZones[0].id);
      }
    }
  }, [fetchedZones, activeZoneId, setZones, setActiveZone]);

  // Create zone mutation
  const createZoneMutation = useMutation({
    mutationFn: (data: CreateZoneInput) => zonesApi.create(data),
    onSuccess: (newZone) => {
      addZone(newZone);
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      setIsCreateDialogOpen(false);
      setNewZoneName('');
      setNewZoneIcon('folder');
      setNewZoneColor('#3B82F6');
      toast({
        title: 'Zone created',
        description: `${newZone.name} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create zone',
      });
    },
  });

  // Delete zone mutation
  const deleteZoneMutation = useMutation({
    mutationFn: (id: string) => zonesApi.delete(id),
    onSuccess: (_, deletedId) => {
      removeZone(deletedId);
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: 'Zone deleted',
        description: 'Zone has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete zone',
      });
    },
  });

  const handleCreateZone = () => {
    if (!newZoneName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Zone name is required',
      });
      return;
    }

    createZoneMutation.mutate({
      name: newZoneName.trim(),
      icon: newZoneIcon,
      color: newZoneColor,
    });
  };

  const navigate = useNavigate();

  const handleZoneClick = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    // Navigate to appropriate URL
    if (zone.name === 'Index' || zone.referenceId === 'INDEX-001') {
      navigate('/');
    } else {
      navigate(`/zones/${zoneId}`);
    }
  };

  const handleDeleteZone = (zoneId: string, zoneName: string) => {
    // Prevent deleting Index zone
    const zone = zones.find(z => z.id === zoneId);
    if (zone && (zone.name === 'Index' || zone.referenceId === 'INDEX-001')) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete Index',
        description: 'The Index zone is permanent and cannot be deleted.',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${zoneName}"? All modules in this zone will also be deleted.`)) {
      deleteZoneMutation.mutate(zoneId);
    }
  };

  const getZoneIcon = (iconName: string | null) => {
    const Icon = iconName && iconMap[iconName] ? iconMap[iconName] : Folder;
    return Icon;
  };

  if (isLoading) {
    return (
      <aside className="w-64 border-r bg-card flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading zones...</div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-3">Zones</h2>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Zone</DialogTitle>
              <DialogDescription>
                Create a new zone to organize your modules and nodes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="zone-name">Name</Label>
                <Input
                  id="zone-name"
                  placeholder="e.g., Budget, Journal, Projects"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateZone();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                  {defaultIcons.map((icon) => {
                    const Icon = iconMap[icon];
                    return (
                      <Button
                        key={icon}
                        type="button"
                        variant={newZoneIcon === icon ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setNewZoneIcon(icon)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-all',
                        newZoneColor === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewZoneColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateZone}
                disabled={createZoneMutation.isPending}
              >
                {createZoneMutation.isPending ? 'Creating...' : 'Create Zone'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Index Zone - Always shown at top, cannot be deleted */}
          {(() => {
            const indexZone = zones.find(z => z.name === 'Index' || z.referenceId === 'INDEX-001');
            if (!indexZone) return null;

            const Icon = getZoneIcon(indexZone.icon);
            const isActive = indexZone.id === activeZoneId;

            return (
              <>
                <div
                  key={indexZone.id}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors border-2',
                    isActive
                      ? 'bg-accent text-accent-foreground border-primary'
                      : 'hover:bg-accent/50 border-transparent'
                  )}
                  onClick={() => handleZoneClick(indexZone.id)}
                >
                  <div
                    className="flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: indexZone.color || '#6B7280',
                      opacity: isActive ? 1 : 0.8,
                    }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {indexZone.name}
                    </div>
                    <div className="text-xs text-muted-foreground">Home</div>
                  </div>
                </div>

                <Separator className="my-2" />
              </>
            );
          })()}

          {/* User-created Zones */}
          {(() => {
            const userZones = zones.filter(z => z.name !== 'Index' && z.referenceId !== 'INDEX-001');

            if (userZones.length === 0) {
              return (
                <div className="px-3 py-8 text-center text-sm">
                  <p className="font-medium mb-2">Get started by creating your first zone!</p>
                  <p className="text-xs text-muted-foreground">
                    Zones are like workspaces that define what type of data you're working with
                  </p>
                </div>
              );
            }

            return userZones.map((zone) => {
              const Icon = getZoneIcon(zone.icon);
              const isActive = zone.id === activeZoneId;

              return (
                <div
                  key={zone.id}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                  onClick={() => handleZoneClick(zone.id)}
                >
                  <div
                    className="flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: zone.color || '#3B82F6',
                      opacity: isActive ? 1 : 0.8,
                    }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {zone.name}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteZone(zone.id, zone.name);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            });
          })()}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-3 border-t bg-muted/50">
        <div className="text-xs text-muted-foreground">
          {(() => {
            const userZoneCount = zones.filter(z => z.name !== 'Index' && z.referenceId !== 'INDEX-001').length;
            return `${userZoneCount} ${userZoneCount === 1 ? 'zone' : 'zones'}`;
          })()}
        </div>
      </div>
    </aside>
  );
}
