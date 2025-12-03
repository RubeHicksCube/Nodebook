import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nodesApi } from '@/api';
import { Node, NodeType } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Image,
  Calendar,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Save,
  Home,
  GripVertical,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const getNodeIcon = (type: NodeType) => {
  const iconProps = { className: 'h-4 w-4' };
  switch (type) {
    case 'document':
      return <FileText {...iconProps} />;
    case 'folder':
      return <Folder {...iconProps} />;
    case 'image':
      return <Image {...iconProps} />;
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'table':
      return <Table {...iconProps} />;
    default:
      return <Type {...iconProps} />;
  }
};

export default function MultiNodeEditor() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingType, setEditingType] = useState<NodeType>('paragraph');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch all nodes
  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['nodes'],
    queryFn: nodesApi.list,
  });

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Update editing state when node is selected
  useEffect(() => {
    if (selectedNode) {
      const content = selectedNode.content?.text || selectedNode.metadata?.description || '';
      setEditingContent(content);
      setEditingType(selectedNode.type);
    }
  }, [selectedNode]);

  // Save node mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedNode) return;

      const updates: any = {
        version: selectedNode.version,
        content: {
          ...selectedNode.content,
          text: editingContent,
        },
      };

      // If type changed, update it (would need backend support)
      if (editingType !== selectedNode.type) {
        // For now, just update content
        // TODO: Add type changing support to backend
      }

      return nodesApi.update(selectedNode.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      toast({
        title: 'Saved',
        description: 'Node updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNodeTree = (parentId: string | null = null, depth = 0) => {
    const childNodes = nodes.filter(n => n.parentId === parentId);

    if (childNodes.length === 0) return null;

    return (
      <div className={cn('space-y-0.5', depth > 0 && 'ml-4')}>
        {childNodes.map(node => {
          const hasChildren = nodes.some(n => n.parentId === node.id);
          const isExpanded = expandedNodes.has(node.id);
          const isSelected = node.id === selectedNodeId;

          return (
            <div key={node.id}>
              <div
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent transition-colors group',
                  isSelected && 'bg-accent border-l-2 border-primary'
                )}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.id);
                    }}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                )}
                {!hasChildren && <div className="w-4" />}
                {getNodeIcon(node.type)}
                <span className="text-sm flex-1 truncate">{node.name}</span>
              </div>
              {hasChildren && isExpanded && renderNodeTree(node.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // Render content as preview (basic markdown-like rendering)
  const renderPreview = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="prose dark:prose-invert max-w-none p-6">
        {lines.map((line, i) => {
          // Basic heading detection
          if (line.startsWith('### ')) {
            return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(4)}</h3>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
          }
          if (line.startsWith('# ')) {
            return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
          }
          if (line.trim() === '') {
            return <div key={i} className="h-4" />;
          }
          return <p key={i} className="mb-3">{line}</p>;
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold">Multi-Node Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          {selectedNode && (
            <>
              <Select value={editingType} onValueChange={(value) => setEditingType(value as NodeType)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraph">Paragraph</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="folder">Folder</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Tree */}
        <aside className="w-80 border-r bg-card overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">NODES</h2>
            {renderNodeTree()}
            {nodes.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                No nodes yet. Create some nodes to get started.
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area - Split View */}
        <main className="flex-1 flex overflow-hidden">
          {selectedNode ? (
            <>
              {/* Left Panel - Editor */}
              <div className="flex-1 flex flex-col border-r">
                <div className="border-b px-4 py-2 bg-muted/30">
                  <h3 className="text-sm font-semibold">Editor</h3>
                </div>
                <Textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="flex-1 resize-none border-0 focus-visible:ring-0 font-mono text-sm"
                  placeholder="Write your content here..."
                />
                <div className="border-t px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
                  {editingContent.split(/\s+/).filter(w => w.length > 0).length} words
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="flex-1 flex flex-col bg-muted/10">
                <div className="border-b px-4 py-2 bg-muted/30">
                  <h3 className="text-sm font-semibold">Preview</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {renderPreview(editingContent)}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a node to edit</p>
                <p className="text-sm">Choose a node from the tree on the left</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
