import { create } from 'zustand';
import { NodeType, Node } from '@/types';

type OnNodeCreatedCallback = (node: Node) => void;

interface CreateNodeState {
  isOpen: boolean;
  nodeType: NodeType;
  parentId: string | null;
  onNodeCreated?: OnNodeCreatedCallback;
  open: (
    type: NodeType,
    parentId?: string | null,
    onNodeCreated?: OnNodeCreatedCallback,
  ) => void;
  close: () => void;
}

export const useCreateNodeStore = create<CreateNodeState>((set) => ({
  isOpen: false,
  nodeType: 'document',
  parentId: null,
  onNodeCreated: undefined,
  open: (type, parentId = null, onNodeCreated) =>
    set({ isOpen: true, nodeType: type, parentId, onNodeCreated }),
  close: () => set({ isOpen: false, onNodeCreated: undefined }),
}));
