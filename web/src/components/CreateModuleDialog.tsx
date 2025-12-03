import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/components/ui/use-toast';
import { modulesApi } from '@/api';
import { ModuleType } from '@/types';

interface CreateModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
}

const moduleTypes: ModuleType[] = [
  'graph',
  'table',
  'calendar',
  'text',
  'kanban',
  'list',
  'grid',
  'canvas',
];

export function CreateModuleDialog({ open, onOpenChange, zoneId }: CreateModuleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<ModuleType>('canvas');

  const createModuleMutation = useMutation({
    mutationFn: modulesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', zoneId] });
      toast({
        title: 'Module created',
        description: `${name} has been created successfully.`,
      });
      onOpenChange(false);
      setName('');
      setType('canvas');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create module',
      });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name is required',
        description: 'Please enter a name for the module.',
      });
      return;
    }

    createModuleMutation.mutate({
      name,
      type,
      zoneId,
      // Default layout - can be adjusted by user later
      width: 8,
      height: 6,
      positionX: 0,
      positionY: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Module</DialogTitle>
          <DialogDescription>
            A module is a configurable block for displaying and interacting with your nodes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="module-name">Name</Label>
            <Input
              id="module-name"
              placeholder="e.g., My Canvas, Project Tracker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as ModuleType)}>
              <SelectTrigger id="module-type">
                <SelectValue placeholder="Select a module type" />
              </SelectTrigger>
              <SelectContent>
                {moduleTypes.map((moduleType) => (
                  <SelectItem key={moduleType} value={moduleType} className="capitalize">
                    {moduleType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createModuleMutation.isPending}>
            {createModuleMutation.isPending ? 'Creating...' : 'Create Module'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
