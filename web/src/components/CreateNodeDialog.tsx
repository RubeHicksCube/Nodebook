import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { nodesApi } from '@/api';
import { useCreateNodeStore } from '@/stores/createNodeStore';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Image, Paperclip, Upload, Folder, Table, Calendar } from 'lucide-react';

interface CreateNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateNodeDialog({ open, onOpenChange }: CreateNodeDialogProps) {
  const { nodeType, parentId, onNodeCreated, close } = useCreateNodeStore();
  
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isFileType = nodeType === 'image' || nodeType === 'file';
  
  // Reset state when dialog opens
  useEffect(() => {
    if(open) {
      setName('');
      setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please provide a name for the node',
      });
      return;
    }

    if (isFileType && !file) {
      toast({
        variant: 'destructive',
        title: 'File required',
        description: 'Please select a file to upload',
      });
      return;
    }

    setIsLoading(true);

    try {
      let newNode;
      if (isFileType && file) {
        // Upload file
        newNode = await nodesApi.uploadFile(file, name, nodeType as 'image' | 'file', parentId);
        toast({
          title: 'Success!',
          description: `${nodeType === 'image' ? 'Image' : 'File'} uploaded successfully`,
        });
      } else {
        // Create regular node
        newNode = await nodesApi.create({
          name,
          type: nodeType,
          parentId,
          content: {},
          metadata: {},
        });
        toast({
          title: 'Success!',
          description: `${nodeType} created successfully`,
        });
      }

      // Invalidate queries to refresh explorer
      queryClient.invalidateQueries({ queryKey: ['nodes'] });

      // Fire callback if provided
      if (onNodeCreated) {
        onNodeCreated(newNode);
      }
      
      // Close dialog
      close();

    } catch (error: any) {
      console.error('Error creating node:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || `Failed to create ${nodeType}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill name from filename if empty
      if (!name.trim()) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setName(nameWithoutExt);
      }
    }
  };

  const getIcon = () => {
    switch (nodeType) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'file':
        return <Paperclip className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (nodeType) {
      case 'image':
        return 'Upload Image';
      case 'file':
        return 'Upload File';
      case 'document':
        return 'Create Document';
      case 'folder':
        return 'Create Folder';
      case 'table':
        return 'Create Table';
      case 'calendar':
        return 'Create Calendar';
      default:
        return 'Create Node';
    }
  };

  const getDescription = () => {
    switch (nodeType) {
      case 'image':
        return 'Upload an image file (JPEG, PNG, GIF, WebP, SVG)';
      case 'file':
        return 'Upload a file (PDF, Word, Excel, Text, CSV)';
      default:
        return `Create a new ${nodeType} node`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${nodeType} name`}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {isFileType && (
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isLoading}
                    accept={
                      nodeType === 'image'
                        ? 'image/*'
                        : '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv'
                    }
                  />
                  {file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  {isFileType ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isFileType ? 'Upload' : 'Create'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
