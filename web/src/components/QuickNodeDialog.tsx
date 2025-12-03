import { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { nodesApi, zonesApi, tagsApi, modulesApi } from '@/api';
import { Node, NodeType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useZoneStore } from '@/stores/zoneStore';
import { Plus, Type, AlignLeft, Settings, Folder, Tag, X, Calendar as CalendarIcon, DollarSign } from 'lucide-react';

interface QuickNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'short' | 'long' | 'multi';
  onNodeCreated?: (node: Node) => void;
}

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

export default function QuickNodeDialog({ open, onOpenChange, mode, onNodeCreated }: QuickNodeDialogProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [multiText, setMultiText] = useState('');
  const [singleNodeType, setSingleNodeType] = useState<NodeType>('paragraph');
  const [multiNodeType, setMultiNodeType] = useState<NodeType>('paragraph');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showNewZoneInput, setShowNewZoneInput] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  // Workflow-specific fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { zones, activeZoneId } = useZoneStore();

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  // Determine workflow type based on zone
  const targetZoneId = selectedZoneId || activeZoneId;
  const workflowType = useMemo(() => {
    const zone = zones.find(z => z.id === targetZoneId);
    return getWorkflowType(zone?.icon || null);
  }, [zones, targetZoneId]);

  // Fetch modules for the selected zone
  const { data: modules = [] } = useQuery({
    queryKey: ['modules', targetZoneId],
    queryFn: async () => {
      if (!targetZoneId) return [];
      const allModules = await modulesApi.list();
      return allModules.filter(m => m.zoneId === targetZoneId);
    },
    enabled: !!targetZoneId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Parse tags from input (space or comma separated)
      // Backend expects tag NAMES, not IDs - it will create tags if needed
      const parsedTagNames = tagInput
        .split(/[\s,]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.length <= 100);

      // Create zone if needed
      let finalZoneId = selectedZoneId || activeZoneId;
      if (showNewZoneInput && newZoneName.trim()) {
        const newZone = await zonesApi.create({
          name: newZoneName.trim(),
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
        });
        finalZoneId = newZone.id;
        await queryClient.invalidateQueries({ queryKey: ['zones'] });
      }

      // Build metadata with zone, module, description, and workflow-specific data
      const metadata: Record<string, any> = {};
      if (finalZoneId) {
        // Store zone as array to support multiple zones
        metadata.zoneIds = [finalZoneId];
      }
      if (selectedModuleId) metadata.moduleId = selectedModuleId;

      // Add workflow-specific metadata
      if (mode !== 'multi') {
        // Store description in metadata for search purposes
        if (content.trim()) {
          metadata.description = content.trim();
        }

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
      }

      if (mode === 'multi') {
        // Create multiple nodes from lines
        const lines = multiText.split('\n').filter(line => line.trim());
        const promises = lines.map(line =>
          nodesApi.create({
            name: line.trim(),
            type: multiNodeType,
            content: {},
            tags: parsedTagNames,
            metadata: {
              ...metadata,
              description: line.trim(),
            },
          })
        );
        return Promise.all(promises);
      } else {
        // Create single node - content is empty initially, will be filled in editor
        return nodesApi.create({
          name: name.trim() || content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          type: singleNodeType,
          content: {},
          tags: parsedTagNames,
          metadata,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      const count = Array.isArray(data) ? data.length : 1;

      // For single nodes, open editor immediately
      if (!Array.isArray(data) && onNodeCreated) {
        onNodeCreated(data);
      }

      toast({
        title: 'Success!',
        description: `Created ${count} node${count > 1 ? 's' : ''} successfully${!Array.isArray(data) ? ' - Opening editor...' : ''}`,
        duration: 3000,
      });

      // Reset form
      setName('');
      setContent('');
      setMultiText('');
      setSingleNodeType('paragraph');
      setMultiNodeType('paragraph');
      setSelectedTags([]);
      setSelectedZoneId(null);
      setSelectedModuleId(null);
      setTagInput('');
      setShowNewZoneInput(false);
      setNewZoneName('');
      // Reset workflow-specific fields
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setPriority('medium');
      setStatus('todo');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create node(s)',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'multi') {
      if (!multiText.trim()) {
        toast({
          variant: 'destructive',
          title: 'Content required',
          description: 'Enter at least one line of text',
        });
        return;
      }
    } else {
      if (!content.trim()) {
        toast({
          variant: 'destructive',
          title: 'Content required',
          description: 'Enter some text for the node',
        });
        return;
      }
    }

    createMutation.mutate();
  };

  const getTitle = () => {
    switch (mode) {
      case 'short':
      case 'long':
        return 'Create Node';
      case 'multi':
        return 'Create Multiple Nodes';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'short':
      case 'long':
        return 'Create a new node with your chosen type';
      case 'multi':
        return 'Create multiple nodes at once (one per line)';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'short':
        return <Type className="h-5 w-5" />;
      case 'long':
        return <AlignLeft className="h-5 w-5" />;
      case 'multi':
        return <Plus className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {mode === 'multi' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="node-type">
                    Node Type
                  </Label>
                  <Select value={multiNodeType} onValueChange={(value) => setMultiNodeType(value as NodeType)}>
                    <SelectTrigger id="node-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paragraph">Paragraph (Text)</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="folder">Folder</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    All nodes will be created as <strong>{multiNodeType}</strong> type
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multi-text">
                    Nodes (one per line)
                  </Label>
                  <Textarea
                    id="multi-text"
                    value={multiText}
                    onChange={(e) => setMultiText(e.target.value)}
                    placeholder="First node&#10;Second node&#10;Third node"
                    rows={10}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    {multiText.split('\n').filter(line => line.trim()).length} nodes will be created
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Node Type Selector for Single Node */}
                <div className="space-y-2">
                  <Label htmlFor="single-node-type">
                    Node Type
                  </Label>
                  <Select value={singleNodeType} onValueChange={(value) => setSingleNodeType(value as NodeType)}>
                    <SelectTrigger id="single-node-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paragraph">Paragraph (Text)</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="folder">Folder</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name Field (always visible) */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Display name (leave blank to auto-generate)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Human-readable display name for this node
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">
                    Description
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={mode === 'short'
                      ? 'Quick note or snippet...'
                      : 'Write your paragraph or longer text here...'
                    }
                    rows={mode === 'short' ? 4 : 10}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.split(/\s+/).filter(w => w.length > 0).length} words
                  </p>
                </div>

                {/* Workflow-specific fields */}
                {workflowType === 'journal' && (
                  <div className="space-y-2 border-t pt-4 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg">
                    <Label htmlFor="journal-date" className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <CalendarIcon className="h-4 w-4" />
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
                  <div className="space-y-2 border-t pt-4 bg-green-50/50 dark:bg-green-950/20 p-3 rounded-lg">
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
                  <div className="space-y-4 border-t pt-4 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-lg">
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
                  <div className="space-y-2 border-t pt-4 bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-lg">
                    <Label htmlFor="activity-date" className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                      <CalendarIcon className="h-4 w-4" />
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

                {workflowType === 'blog' && (
                  <div className="space-y-2 border-t pt-4 bg-pink-50/50 dark:bg-pink-950/20 p-3 rounded-lg">
                    <p className="text-sm text-pink-700 dark:text-pink-300">
                      📝 <strong>Blog workflow:</strong> Use tags below to categorize your post
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Advanced Options */}
            <Accordion type="single" collapsible className="border-t pt-2">
              <AccordionItem value="advanced" className="border-none">
                <AccordionTrigger className="py-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Advanced Options</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-2">
                  {/* Zone Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone</Label>
                    {!showNewZoneInput ? (
                      <Select
                        value={selectedZoneId || activeZoneId || 'current'}
                        onValueChange={(value) => {
                          if (value === 'create-new') {
                            setShowNewZoneInput(true);
                          } else {
                            setSelectedZoneId(value === 'current' ? null : value);
                          }
                        }}
                      >
                        <SelectTrigger id="zone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">
                            Current Zone ({zones.find(z => z.id === activeZoneId)?.name || 'Index'})
                          </SelectItem>
                          {zones.map(zone => (
                            <SelectItem key={zone.id} value={zone.id}>
                              {zone.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="create-new">
                            <div className="flex items-center gap-2 text-primary">
                              <Plus className="h-3 w-3" />
                              Create New Zone
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="New zone name..."
                          value={newZoneName}
                          onChange={(e) => setNewZoneName(e.target.value)}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowNewZoneInput(false);
                            setNewZoneName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Module Selector */}
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

                  {/* Tags Input (Type to Add) */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">
                      <Tag className="h-3 w-3 inline mr-1" />
                      Tags (optional)
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
                          Will create/use: <strong>{tagInput.split(/[\s,]+/).filter(t => t.trim()).join(', ')}</strong>
                        </>
                      ) : (
                        'Example: "work important" or "project, urgent"'
                      )}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
