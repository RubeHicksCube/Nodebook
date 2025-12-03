import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nodesApi } from '@/api';
import { Node, NodeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreateNodeStore } from '@/stores/createNodeStore';
import { useCommandPaletteStore } from '@/stores/commandPaletteStore';
import { formatDateTime } from '@/lib/dateUtils';
import NodeEditorDialog from '@/components/NodeEditorDialog';
import { useToast } from '@/components/ui/use-toast';
import {
  FileText,
  Folder,
  Table,
  Calendar,
  Image,
  Paperclip,
  SortAsc,
  SortDesc,
  Filter,
  Plus,
  Database,
} from 'lucide-react';

type SortField = 'name' | 'createdAt' | 'updatedAt' | 'id';
type SortOrder = 'asc' | 'desc';

const getNodeIcon = (type: NodeType) => {
  const iconProps = { className: 'h-4 w-4' };
  switch (type) {
    case 'document':
      return <FileText {...iconProps} />;
    case 'folder':
      return <Folder {...iconProps} />;
    case 'table':
      return <Table {...iconProps} />;
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'image':
      return <Image {...iconProps} />;
    case 'file':
      return <Paperclip {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

const getContentPreview = (node: Node): string => {
  if (node.type === 'image' || node.type === 'file') {
    return node.content.filename || 'Uploaded file';
  }

  // Check metadata.description first (new location for searchable description)
  if (node.metadata?.description && typeof node.metadata.description === 'string') {
    return node.metadata.description.substring(0, 100) + (node.metadata.description.length > 100 ? '...' : '');
  }

  // Fallback to content fields for backward compatibility
  if (typeof node.content === 'object' && node.content !== null) {
    const text = node.content.text || node.content.body || node.content.description || '';
    if (typeof text === 'string') {
      return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }
  }

  return 'No description';
};

const getWordCount = (node: Node): number => {
  const preview = getContentPreview(node);
  return preview.split(/\s+/).filter(word => word.length > 0).length;
};

interface NodesIndexProps {
  zoneId?: string | null;
  zoneName?: string;
}

export default function NodesIndex({ zoneId = null, zoneName }: NodesIndexProps = {}) {
  const { open: openCreateNode } = useCreateNodeStore();
  const { open: openCommandPalette } = useCommandPaletteStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all');
  const [minWords, setMinWords] = useState<number>(0);
  const [maxWords, setMaxWords] = useState<number>(10000);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Index-specific: toggle to show all nodes vs unreferenced only
  const isIndexZone = !zoneId || zoneName === 'Index';
  const [showAllNodes, setShowAllNodes] = useState(false);

  // Inline rename state
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const { data: nodes = [], isLoading, error } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => nodesApi.list(),
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ nodeId, newName, version }: { nodeId: string; newName: string; version: number }) => {
      return nodesApi.update(nodeId, { name: newName, version });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      toast({
        title: 'Renamed',
        description: 'Node renamed successfully',
        duration: 2000,
      });
      setRenamingNodeId(null);
      setRenameValue('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to rename node',
      });
    },
  });

  // Rename handlers
  const startRename = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingNodeId(node.id);
    setRenameValue(node.name);
  };

  const cancelRename = () => {
    setRenamingNodeId(null);
    setRenameValue('');
  };

  const saveRename = (node: Node) => {
    const trimmedName = renameValue.trim();
    if (!trimmedName) {
      toast({
        variant: 'destructive',
        title: 'Invalid name',
        description: 'Node name cannot be empty',
      });
      return;
    }

    if (trimmedName === node.name) {
      cancelRename();
      return;
    }

    renameMutation.mutate({
      nodeId: node.id,
      newName: trimmedName,
      version: node.version,
    });
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, node: Node) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename(node);
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  // Filtering and sorting logic
  const filteredAndSortedNodes = useMemo(() => {
    let result = [...nodes];

    // Zone filter
    if (isIndexZone) {
      // Index zone: show unreferenced nodes by default, or all nodes if toggled
      if (!showAllNodes) {
        // Show only unreferenced nodes (no zones assigned)
        result = result.filter(node => {
          const zoneIds = node.metadata?.zoneIds || [];
          const zoneId = node.metadata?.zoneId; // Legacy single zoneId
          return zoneIds.length === 0 && !zoneId;
        });
      }
      // If showAllNodes is true, don't filter - show everything
    } else if (zoneId) {
      // Other zones: show nodes that include this zoneId
      result = result.filter(node => {
        const zoneIds = node.metadata?.zoneIds || [];
        const legacyZoneId = node.metadata?.zoneId; // Legacy single zoneId
        return zoneIds.includes(zoneId) || legacyZoneId === zoneId;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(node =>
        node.name.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query) ||
        getContentPreview(node).toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(node => node.type === filterType);
    }

    // Word count filter
    result = result.filter(node => {
      const wordCount = getWordCount(node);
      return wordCount >= minWords && wordCount <= maxWords;
    });

    // Sort
    result.sort((a, b) => {
      let compareA: any;
      let compareB: any;

      switch (sortField) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'id':
          compareA = a.id;
          compareB = b.id;
          break;
        case 'createdAt':
          compareA = new Date(a.createdAt).getTime();
          compareB = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          compareA = new Date(a.updatedAt).getTime();
          compareB = new Date(b.updatedAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    return result;
  }, [nodes, searchQuery, sortField, sortOrder, filterType, minWords, maxWords, zoneId, isIndexZone, showAllNodes]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSortField('createdAt');
    setSortOrder('desc');
    setFilterType('all');
    setMinWords(0);
    setMaxWords(10000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading nodes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive">Failed to load nodes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" />
              {zoneName || 'Index'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isIndexZone
                ? (showAllNodes ? 'All nodes' : 'Unreferenced nodes')
                : 'Zone nodes'} • {filteredAndSortedNodes.length} of {nodes.length} shown
            </p>
          </div>
          <div className="flex gap-2">
            {isIndexZone && (
              <Button
                variant={showAllNodes ? 'default' : 'outline'}
                onClick={() => setShowAllNodes(!showAllNodes)}
              >
                <Database className="h-4 w-4 mr-2" />
                {showAllNodes ? 'Show Unreferenced' : 'Show All Nodes'}
              </Button>
            )}
            <Button onClick={openCommandPalette}>
              <Plus className="h-4 w-4 mr-2" />
              Create Node
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />

          <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Last Modified</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="name">Alphabetical</SelectItem>
              <SelectItem value="id">Node ID</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <Label>Node Type</Label>
                  <Select value={filterType} onValueChange={(value) => setFilterType(value as NodeType | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="folder">Folder</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Word Count Range</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minWords}
                      onChange={(e) => setMinWords(Number(e.target.value))}
                      min={0}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxWords}
                      onChange={(e) => setMaxWords(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>

                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAndSortedNodes.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {nodes.length === 0 ? 'No nodes yet' : 'No nodes match your filters'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {nodes.length === 0
                ? 'Create your first node to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {nodes.length === 0 && (
              <Button onClick={openCommandPalette}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Node
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedNodes.map((node) => (
              <div
                key={node.id}
                className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer bg-card"
                onClick={() => {
                  setSelectedNode(node);
                  setEditorOpen(true);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(node.type)}
                    <span className="text-xs font-mono text-muted-foreground">
                      {node.id.substring(0, 8)}...
                    </span>
                  </div>
                  {node.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                  )}
                </div>
                {renamingNodeId === node.id ? (
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => saveRename(node)}
                    onKeyDown={(e) => handleRenameKeyDown(e, node)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="mb-2 h-8 font-semibold"
                    disabled={renameMutation.isPending}
                  />
                ) : (
                  <h3
                    className="font-semibold mb-2 line-clamp-1 cursor-text hover:bg-muted/50 px-1 -mx-1 rounded"
                    onDoubleClick={(e) => startRename(node, e)}
                    title="Double-click to rename"
                  >
                    {node.name}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {getContentPreview(node)}
                </p>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{formatDateTime(node.createdAt)}</span>
                    <span>{getWordCount(node)} words</span>
                  </div>
                </div>
                {node.tags && node.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {node.tags.slice(0, 3).map((nt) => (
                      <span
                        key={nt.tagId}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted"
                      >
                        {nt.tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Node Editor Dialog */}
      <NodeEditorDialog
        node={selectedNode}
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setSelectedNode(null);
        }}
      />
    </div>
  );
}
