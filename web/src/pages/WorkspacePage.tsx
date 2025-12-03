import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import NodeEditor from '@/pages/NodeEditor';
import { FileExplorer } from '@/components/FileExplorer';
import NodesSearchDialog from '@/components/NodesSearchDialog';
import { LogOut, Search, Menu, Command, Plus, Home } from 'lucide-react';

export default function WorkspacePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { open: openCommandPalette } = useCommandPaletteStore();
  const { zoneId, nodeId: urlNodeId } = useParams();

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (urlNodeId) {
      setActiveNodeId(urlNodeId);
    } else {
      // When navigating to a zone, clear the active node
      setActiveNodeId(null);
    }
  }, [urlNodeId, zoneId]);

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
  
  const handleNodeSelect = (nodeId: string) => {
    setActiveNodeId(nodeId);
    navigate(`/nodes/${nodeId}`);
  };

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
        {/* Left Sidebar - File Explorer */}
        {leftSidebarOpen && <FileExplorer onNodeSelect={handleNodeSelect} activeNodeId={activeNodeId} />}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {activeNodeId ? (
            <NodeEditor key={activeNodeId} nodeId={activeNodeId} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <h2 className="text-2xl font-bold mb-2">Welcome to Nodebook</h2>
                <p className="text-muted-foreground mb-6">
                  Select a node from the file explorer to edit it, or create a new node to get started.
                </p>
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
    </div>
  );
}
