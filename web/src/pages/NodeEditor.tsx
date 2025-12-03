import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nodesApi } from '@/api';
import { Node, NodeType } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  FileText,
  Folder,
  Image,
  Calendar,
  Table,
  Type,
  Save,
  GripVertical,
  Plus,
  File,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { SlashCommandMenu } from '@/components/SlashCommandMenu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface NodeEditorProps {
  nodeId: string;
}

export default function NodeEditor({ nodeId }: NodeEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the single node (the "file") and its children (the "blocks")
  const { data: node, isLoading } = useQuery({
    queryKey: ['nodes', nodeId],
    queryFn: () => nodesApi.get(nodeId),
    enabled: !!nodeId,
  });

  const [blocks, setBlocks] = useState<Node[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockContent, setBlockContent] = useState<Map<string, string>>(new Map());

  // Slash command menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashMenuNodeId, setSlashMenuNodeId] = useState<string | null>(null);
  
  useEffect(() => {
    if (node?.children) {
      setBlocks(node.children);
    }
  }, [node]);

  const handleBlockSave = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const newContent = blockContent.get(blockId) || '';

    try {
      await nodesApi.update(blockId, {
        version: block.version,
        content: { ...block.content, text: newContent },
      });
      queryClient.invalidateQueries({ queryKey: ['nodes', nodeId] });
      toast({ title: 'Saved', description: 'Block updated' });
      setEditingBlockId(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save block',
      });
    }
  };

  const handleBlockEdit = (blockId: string, content: string) => {
    setBlockContent(prev => new Map(prev).set(blockId, content));
  };
  
  const renderBlock = (block: Node, isEditing: boolean, attributes?: any, listeners?: any) => {
    const content = blockContent.get(block.id) ?? block.content?.text ?? '';

    return (
      <div
        key={block.id}
        className={cn(
          'group relative border rounded-lg p-4 mb-3 transition-all hover:border-primary/50',
          isEditing && 'border-primary shadow-sm'
        )}
        onClick={() => {
          if (!isEditing) {
            setEditingBlockId(block.id);
            setBlockContent(prev => new Map(prev).set(block.id, content));
          }
        }}
      >
        <div className="flex items-start gap-3">
          {!isEditing && (
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <div className="mt-1">{getNodeIcon(block.type)}</div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  data-node-id={block.id}
                  value={content}
                  onChange={(e) => handleBlockEdit(block.id, e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                  placeholder="Type content or '/' for commands..."
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleBlockSave(block.id)}>
                    <Save className="h-3 w-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingBlockId(null); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose dark:prose-invert prose-sm max-w-none">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">Click to add content...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading Node...</div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Select a node to start editing.</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
       <header className="border-b bg-card px-6 py-3">
        <h1 className="text-xl font-bold">{node.name}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {blocks.map(block => renderBlock(block, editingBlockId === block.id))}
          <Button variant="outline" className="w-full mt-4">
            <Plus className="h-4 w-4 mr-2" /> Add Block
          </Button>
        </div>
      </main>
    </div>
  );
}
