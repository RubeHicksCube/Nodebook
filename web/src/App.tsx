import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import CommandPalette from '@/components/CommandPalette';
import CreateNodeDialog from '@/components/CreateNodeDialog';
import QuickNodeDialog from '@/components/QuickNodeDialog';
import NodeEditorDialog from '@/components/NodeEditorDialog';
import { useCreateNodeStore } from '@/stores/createNodeStore';
import { useQuickNodeStore } from '@/stores/quickNodeStore';
import type { Node } from '@/types';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import WorkspacePage from '@/pages/WorkspacePage';
import MultiNodeEditor from '@/pages/MultiNodeEditor';

export default function App() {
  const { isOpen, nodeType, parentId, close } = useCreateNodeStore();
  const {
    isOpen: quickNodeOpen,
    mode: quickNodeMode,
    close: closeQuickNode,
  } = useQuickNodeStore();

  // Global node editor for post-creation editing
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleNodeCreated = (node: Node) => {
    setEditingNode(node);
    setEditorOpen(true);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones/:zoneId"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nodes/:nodeId"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <MultiNodeEditor />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* <CommandPalette /> */}
      <CreateNodeDialog
        open={isOpen}
        onOpenChange={close}
      />
      <QuickNodeDialog
        open={quickNodeOpen}
        onOpenChange={closeQuickNode}
        mode={quickNodeMode}
        onNodeCreated={handleNodeCreated}
      />
      <NodeEditorDialog
        node={editingNode}
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingNode(null);
        }}
      />
      <Toaster />
    </>
  );
}
