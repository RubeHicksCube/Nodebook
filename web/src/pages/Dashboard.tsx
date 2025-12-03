import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { useZoneStore } from '@/stores/zoneStore';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ZoneSidebar } from '@/components/ZoneSidebar';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import ModuleGrid from '@/components/ModuleGrid';
import NodesSearchDialog from '@/components/NodesSearchDialog';
import { CreateModuleDialog } from '@/components/CreateModuleDialog';
import { LogOut, Search, Menu, Grid3x3, Command, Plus, FileEdit, List, Home } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { zones, activeZoneId, setActiveZone } = useZoneStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { open: openCommandPalette } = useCommandPaletteStore();
  const { zoneId: urlZoneId } = useParams();

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [createModuleOpen, setCreateModuleOpen] = useState(false);

  // Sync URL with active zone (only when zones are loaded)
  useEffect(() => {
    if (zones.length === 0) return; // Wait for zones to load

    if (urlZoneId) {
      // If URL has a zoneId, set it as active
      const zone = zones.find(z => z.id === urlZoneId);
      if (zone && zone.id !== activeZoneId) {
        setActiveZone(zone.id);
      }
    } else {
      // If URL is /, always set Index as active
      const indexZone = zones.find(z => z.name === 'Index' || z.referenceId === 'INDEX-001');
      if (indexZone && indexZone.id !== activeZoneId) {
        setActiveZone(indexZone.id);
      }
    }
  }, [urlZoneId, zones, activeZoneId, setActiveZone]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to logout',
      });
    }
  };

  const activeZone = zones.find((z) => z.id === activeZoneId);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1
            className="text-xl font-bold text-primary cursor-pointer hover:underline"
            onClick={() => navigate('/')}
          >
            Nodebook
          </h1>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
            title="Go to Index zone (Home)"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Index</span>
          </Button>
          {activeZone && (
            <>
              <span className="text-muted-foreground hidden md:inline">/</span>
              <span className="font-semibold hidden md:inline">{activeZone.name}</span>
            </>
          )}
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search all nodes..."
              readOnly
              onClick={() => setSearchDialogOpen(true)}
              className="pl-9 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={openCommandPalette}
            className="hidden md:flex items-center gap-2 shadow-sm cursor-pointer"
            title="Open command palette"
          >
            <Command className="h-4 w-4" />
            <span className="text-xs font-medium">Commands</span>
          </Button>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user?.name || user?.email}
          </span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Zones */}
        {leftSidebarOpen && <ZoneSidebar />}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {activeZone ? (
                <ModuleGrid
                  zoneId={activeZone.id}
                  onCreateModule={() => setCreateModuleOpen(true)}
                />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <h2 className="text-2xl font-bold mb-2">Welcome to Nodebook</h2>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first zone to organize your modules and nodes
                </p>
                <div className="text-sm text-muted-foreground">
                  Zones are like workspaces that contain modules for visualizing your data
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile sidebar toggle when closed */}
      {!leftSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 bottom-4 md:hidden shadow-lg"
          onClick={() => setLeftSidebarOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Floating Action Button - Add New Node (visible on all screen sizes) */}
      <Button
        size="icon"
        className="fixed right-6 bottom-6 h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 z-50"
        onClick={openCommandPalette}
        title="Create new node"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Nodes Search Dialog */}
      <NodesSearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />

      {/* Create Module Dialog */}
      {activeZone && (
        <CreateModuleDialog
          open={createModuleOpen}
          onOpenChange={setCreateModuleOpen}
          zoneId={activeZone.id}
        />
      )}
    </div>
  );
}