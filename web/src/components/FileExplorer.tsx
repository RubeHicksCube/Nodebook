import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nodesApi } from '@/api';
import { Node, NodeType } from '@/types';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Image,
  Calendar,
  Table,
  Type,
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useCreateNodeStore } from '@/stores/createNodeStore';

const getNodeIcon = (type: NodeType, isExpanded: boolean) => {
  const iconProps = { className: 'h-4 w-4' };
  if (type === 'folder') {
    return isExpanded ? <Folder {...iconProps} /> : <Folder {...iconProps} />;
  }
  switch (type) {
    case 'document':
      return <FileText {...iconProps} />;
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

interface FileExplorerProps {
  onNodeSelect: (nodeId: string) => void;
  activeNodeId: string | null;
}

export function FileExplorer({ onNodeSelect, activeNodeId }: FileExplorerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { open: openCreateNode } = useCreateNodeStore();

  const { data: allNodes = [], isLoading } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => nodesApi.list(),
  });

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

  const handleNewFile = () => {
    // If a node is active, find its parent to create a sibling.
    // If no node is active, or the active node is a root node, create at the root.
    const activeNode = activeNodeId ? allNodes.find(n => n.id === activeNodeId) : null;
    const parentId = activeNode ? activeNode.parentId : null;
    openCreateNode('document', parentId);
  };

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = allNodes.filter(node => node.parentId === parentId);

    return (
      <div className={cn('space-y-0.5', depth > 0 && 'ml-4')}>
        {children.map(node => {
          const hasChildren = allNodes.some(n => n.parentId === node.id);
          const isExpanded = expandedNodes.has(node.id);
          const isActive = node.id === activeNodeId;

          return (
            <div key={node.id}>
              <div
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors group',
                  isActive && 'bg-accent text-accent-foreground'
                )}
                onClick={() => onNodeSelect(node.id)}
              >
                {hasChildren ? (
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
                ) : (
                  <div className="w-4" /> // Placeholder for alignment
                )}
                {getNodeIcon(node.type, isExpanded)}
                <span className="text-sm flex-1 truncate">{node.name}</span>
              </div>
              {hasChildren && isExpanded && renderTree(node.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-80 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">File Explorer</h2>
      </div>
      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground p-4">Loading files...</p>
        ) : (
          renderTree()
        )}
      </ScrollArea>
      <div className="p-2 border-t">
        <Button variant="outline" size="sm" className="w-full" onClick={handleNewFile}>
          New File
        </Button>
      </div>
    </aside>
  );
}
