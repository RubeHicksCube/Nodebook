import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  addEdge,
  Background,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  NodeChange,
  OnNodesChange,
} from 'reactflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zonesApi, nodesApi } from '@/api';
import { useCreateNodeStore } from '@/stores/createNodeStore';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import 'reactflow/dist/style.css';

interface CanvasModuleProps {
  zoneId: string;
}

const CanvasModule: React.FC<CanvasModuleProps> = ({ zoneId }) => {
  const queryClient = useQueryClient();
  const { open: openCreateNode } = useCreateNodeStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch nodes for the zone
  const { data: zoneNodes, isLoading } = useQuery({
    queryKey: ['zone-nodes', zoneId],
    queryFn: () => zonesApi.getNodes(zoneId),
  });

  // Mutation for updating node positions
  const updateNodeMutation = useMutation({
    mutationFn: (node: { id: string; x: number; y: number, version: number }) =>
      nodesApi.update(node.id, { positionX: node.x, positionY: node.y, version: node.version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zone-nodes', zoneId] });
    },
  });

  // Debounce the mutation to avoid excessive API calls
  const [debouncedMutation] = useDebounce(updateNodeMutation.mutate, 300);

  // Transform fetched nodes for React Flow
  useEffect(() => {
    if (zoneNodes) {
      const flowNodes = zoneNodes.map((node) => ({
        id: node.id,
        type: 'default',
        position: { x: node.positionX || 0, y: node.positionY || 0 },
        data: { label: node.name, version: node.version },
      }));
      setNodes(flowNodes);
    }
  }, [zoneNodes, setNodes]);

  const handleNodesChange: OnNodesChange = (changes) => {
    onNodesChange(changes);
    
    // Find position changes and trigger mutation
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        const node = nodes.find(n => n.id === change.id);
        if (node) {
          debouncedMutation({
            id: change.id,
            x: change.position.x,
            y: change.position.y,
            version: node.data.version,
          });
        }
      }
    }
  };

  // Handle connecting nodes (creating edges)
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((els) => addEdge(params, els)),
    [setEdges]
  );
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Handle dropping a new node from a connection
  const onConnectEnd = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const isPane = target.classList.contains('react-flow__pane');

    if (isPane && reactFlowWrapper.current) {
        // We need to remove the wrapper bounds, in order to get the correct position
        const { top, left } = reactFlowWrapper.current.getBoundingClientRect();
        
        openCreateNode('document', null, (newNode: Node) => {
             const position = {
                x: event.clientX - left,
                y: event.clientY - top,
            };
            
            nodesApi.update(newNode.id, {
                positionX: position.x,
                positionY: position.y,
                version: newNode.version
            }).then(() => {
                 queryClient.invalidateQueries({ queryKey: ['zone-nodes', zoneId] });
            })
        }, zoneId);
    }
  }, [openCreateNode, zoneId, queryClient]);


  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading Canvas...</div>;
  }
  
  return (
    <div style={{ height: '100%', width: '100%' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        fitView
        className="bg-background"
      >
        <Background />
        <Controls />
        <MiniMap className="!z-0" />
        
        {nodes.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="text-center">
                <p className="text-muted-foreground mb-4">This canvas is empty.</p>
                <Button onClick={() => openCreateNode('document', null, undefined, zoneId)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Node
                </Button>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
};

export default CanvasModule;

