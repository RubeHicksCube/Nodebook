import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { nodesApi, zonesApi, tagsApi, modulesApi } from '@/api';
import { Node, NodeType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useZoneStore } from '@/stores/zoneStore';
import { formatDateTime } from '@/lib/dateUtils';
import {
  FileText,
  Folder,
  Table,
  Calendar as CalendarIconLucide,
  Image,
  Paperclip,
  Save,
  X,
  Plus,
  Tag as TagIcon,
  DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NodeEditorDialogProps {
  node: Node | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getNodeIcon = (type: string) => {
  const iconProps = { className: 'h-5 w-5' };
  switch (type) {
    case 'document':
      return <FileText {...iconProps} />;
    case 'folder':
      return <Folder {...iconProps} />;
    case 'table':
      return <Table {...iconProps} />;
    case 'calendar':
      return <CalendarIconLucide {...iconProps} />;
    case 'image':
      return <Image {...iconProps} />;
    case 'file':
      return <Paperclip {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

// Workflow types based on zone icons
type WorkflowType = 'journal' | 'blog' | 'project' | 'finance' | 'document' | 'activity' | 'default';

const getWorkflowType = (zoneIcon: string | null): WorkflowType => {
  switch (zoneIcon) {
    case 'calendar':
      return 'journal';
    case 'book':
      return 'blog';
    case 'briefcase':
      return 'project';
    case 'dollar':
      return 'finance';
    case 'folder':
      return 'document';
    case 'activity':
      return 'activity';
    default:
      return 'default';
  }
};

export default function NodeEditorDialog({ node, open, onOpenChange }: NodeEditorDialogProps) {
  const [name, setName] = useState('');
  const [nodeType, setNodeType] = useState<NodeType>('paragraph');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('');
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Workflow-specific fields
  const [date, setDate] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { zones } = useZoneStore();

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  // Determine workflow type from first zone
  const workflowType = useMemo(() => {
    if (selectedZoneIds.length === 0) return 'default';
    const zone = zones.find(z => z.id === selectedZoneIds[0]);
    return getWorkflowType(zone?.icon || null);
  }, [zones, selectedZoneIds]);

  // Fetch modules for selected zones
  const { data: modules = [] } = useQuery({
    queryKey: ['modules', selectedZoneIds[0]],
    queryFn: async () => {
      if (selectedZoneIds.length === 0) return [];
      const allModules = await modulesApi.list();
      return allModules.filter(m => m.zoneId === selectedZoneIds[0]);
    },
    enabled: selectedZoneIds.length > 0,
  });

  useEffect(() => {
    if (node) {
      setName(node.name);
      setNodeType(node.type);
      setColor(node.color || '');
      setDescription(node.metadata?.description || '');
      setSelectedZoneIds(node.metadata?.zoneIds || (node.metadata?.zoneId ? [node.metadata.zoneId] : []));
      setSelectedModuleId(node.metadata?.moduleId || null);

      // Extract content
      if (node.type === 'image' || node.type === 'file') {
        setContent('');
      } else if (typeof node.content === 'object') {
        const text = node.content.text || node.content.body || '';
        setContent(typeof text === 'string' ? text : '');
      } else {
        setContent('');
      }

      // Extract workflow-specific metadata
      setDate(node.metadata?.date || node.metadata?.timestamp || '');
      setAmount(node.metadata?.amount?.toString() || '');
      setPriority(node.metadata?.priority || 'medium');
      setStatus(node.metadata?.status || 'todo');

      // Initialize tag input from existing tags
      if (node.tags && node.tags.length > 0) {
        const tagNames = node.tags.map(nt => nt.tag.name).join(', ');
        setTagInput(tagNames);
      }
    }
  }, [node]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!node) return;

      // Parse tag names from input (backend expects names, not IDs)
      const parsedTagNames = tagInput
        .split(/[\s,]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Build metadata
      const metadata: Record<string, any> = {
        ...node.metadata,
        description: description.trim(),
        zoneIds: selectedZoneIds,
      };

      if (selectedModuleId) metadata.moduleId = selectedModuleId;

      // Add workflow-specific metadata
      if (workflowType === 'journal' && date) {
        metadata.date = date;
      }
      if (workflowType === 'finance' && amount) {
        metadata.amount = parseFloat(amount);
      }
      if (workflowType === 'project') {
        metadata.priority = priority;
        metadata.status = status;
      }
      if (workflowType === 'activity' && date) {
        metadata.timestamp = date;
      }

      const updates: any = {
        name,
        color: color || null,
        metadata,
        version: node.version,
        tags: parsedTagNames, // Send tag names, not IDs
      };

      // Update content based on node type
      if (node.type !== 'image' && node.type !== 'file') {
        updates.content = {
          ...node.content,
          text: content,
        };
      }

      return nodesApi.update(node.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      toast({
        title: 'Node updated',
        description: 'Your changes have been saved.',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update node',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!node) return;
      return nodesApi.delete(node.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      toast({
        title: 'Node deleted',
        description: 'The node has been permanently deleted.',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete node',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleToggleZone = (zoneId: string) => {
    setSelectedZoneIds(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  if (!node) return null;

  const isFileType = node.type === 'image' || node.type === 'file';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getNodeIcon(node.type)}
            Edit Node
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 text-xs">
              <span>ID: {node.id.substring(0, 12)}...</span>
              <span>Created: {formatDateTime(node.createdAt)}</span>
              <span>Modified: {formatDateTime(node.updatedAt)}</span>
              <span className="capitalize">{node.type}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Node name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for search..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Used for searching and previews
            </p>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color || '#6B7280'}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6B7280"
                className="flex-1"
              />
              {color && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setColor('')}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Zones */}
          <div className="space-y-2">
            <Label>Zones (multi-select)</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {zones.filter(z => z.name !== 'Index' && z.referenceId !== 'INDEX-001').map(zone => (
                <label
                  key={zone.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedZoneIds.includes(zone.id)}
                    onChange={() => handleToggleZone(zone.id)}
                    className="h-4 w-4"
                  />
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: zone.color || '#6B7280' }}
                  />
                  <span className="text-sm">{zone.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedZoneIds.length} zone(s) selected
            </p>
          </div>

          {/* Workflow-specific fields */}
          {workflowType === 'journal' && (
            <div className="space-y-2 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg">
              <Label htmlFor="journal-date" className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <CalendarIconLucide className="h-4 w-4" />
                Journal Date
              </Label>
              <Input
                id="journal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white dark:bg-gray-900"
              />
            </div>
          )}

          {workflowType === 'finance' && (
            <div className="space-y-2 bg-green-50/50 dark:bg-green-950/20 p-3 rounded-lg">
              <Label htmlFor="amount" className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <DollarSign className="h-4 w-4" />
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-white dark:bg-gray-900"
              />
            </div>
          )}

          {workflowType === 'project' && (
            <div className="space-y-4 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Project Task Details</p>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">📋 To Do</SelectItem>
                    <SelectItem value="in-progress">⏳ In Progress</SelectItem>
                    <SelectItem value="done">✅ Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {workflowType === 'activity' && (
            <div className="space-y-2 bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-lg">
              <Label htmlFor="activity-date" className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <CalendarIconLucide className="h-4 w-4" />
                Activity Timestamp
              </Label>
              <Input
                id="activity-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white dark:bg-gray-900"
              />
            </div>
          )}

          {/* Module Reference */}
          {selectedZoneIds.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="module">Module Reference (optional)</Label>
              <Select
                value={selectedModuleId || 'none'}
                onValueChange={(value) => setSelectedModuleId(value === 'none' ? null : value)}
              >
                <SelectTrigger id="module">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {modules.map(module => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name} ({module.type})
                    </SelectItem>
                  ))}
                  {modules.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No modules in this zone
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              <TagIcon className="h-3 w-3 inline mr-1" />
              Tags
            </Label>
            <Input
              id="tags"
              placeholder="Type tags (space or comma separated)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {tagInput.trim() ? (
                <>
                  Tags: <strong>{tagInput.split(/[\s,]+/).filter(t => t.trim()).join(', ')}</strong>
                </>
              ) : (
                'Example: "work important" or "project, urgent"'
              )}
            </p>
          </div>

          {/* Content */}
          {!isFileType && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your content here..."
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {content.split(/\s+/).filter(w => w.length > 0).length} words
              </p>
            </div>
          )}

          {/* File info (read-only for file types) */}
          {isFileType && (
            <div className="space-y-2">
              <Label>File Information</Label>
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Filename:</span> {node.content.filename}
                </div>
                <div>
                  <span className="font-semibold">Type:</span> {node.content.mimetype}
                </div>
                <div>
                  <span className="font-semibold">Size:</span> {(node.content.size / 1024).toFixed(2)} KB
                </div>
                {node.type === 'image' && node.content.url && (
                  <div className="mt-4">
                    <img
                      src={`http://localhost:4000${node.content.url}`}
                      alt={node.name}
                      className="max-w-full h-auto rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete Node
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
