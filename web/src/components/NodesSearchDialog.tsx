import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nodesApi } from '@/api';
import { Node, NodeType } from '@/types';
import { formatDateTime } from '@/lib/dateUtils';
import NodeEditorDialog from '@/components/NodeEditorDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Folder,
  Table,
  Calendar,
  Image,
  Paperclip,
  Filter,
  X,
} from 'lucide-react';

interface NodesSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  if (typeof node.content === 'object' && node.content !== null) {
    const text = node.content.text || node.content.body || node.content.description || '';
    if (typeof text === 'string') {
      return text.substring(0, 150) + (text.length > 150 ? '...' : '');
    }
  }

  return 'No content';
};

export default function NodesSearchDialog({ open, onOpenChange }: NodesSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const { data: nodesResponse } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => nodesApi.list(),
    enabled: open,
  });

  const nodes = nodesResponse?.data || [];

  const filteredNodes = useMemo(() => {
    let result = [...nodes];

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

    // Sort by most recent first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [nodes, searchQuery, filterType]);

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setEditorOpen(true);
    onOpenChange(false);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Nodes</DialogTitle>
          <DialogDescription>
            Search and filter through all your nodes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Search by name, ID, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            {(searchQuery || filterType !== 'all') && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div>
                <Label className="text-sm">Node Type</Label>
                <Select value={filterType} onValueChange={(value) => setFilterType(value as NodeType | 'all')}>
                  <SelectTrigger className="mt-1">
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
            </div>
          )}

          {/* Results */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              {filteredNodes.length} {filteredNodes.length === 1 ? 'node' : 'nodes'} found
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              {filteredNodes.length === 0 ? (
                <div className="flex items-center justify-center h-full p-8 text-center">
                  <div>
                    <p className="text-muted-foreground">
                      {searchQuery || filterType !== 'all'
                        ? 'No nodes match your search'
                        : 'No nodes created yet'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleNodeClick(node)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          {getNodeIcon(node.type)}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{node.name}</h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              ID: {node.id.substring(0, 12)}...
                            </p>
                          </div>
                        </div>
                        {node.color && (
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 ml-2"
                            style={{ backgroundColor: node.color }}
                          />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getContentPreview(node)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatDateTime(node.createdAt)}</span>
                        <span className="capitalize">{node.type}</span>
                        {node.tags && node.tags.length > 0 && (
                          <span>{node.tags.length} tags</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* Node Editor Dialog */}
      <NodeEditorDialog
        node={selectedNode}
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setSelectedNode(null);
        }}
      />
    </Dialog>
  );
}
