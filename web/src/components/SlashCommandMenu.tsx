import { useState, useEffect } from 'react';
import { NodeType } from '@/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FileText,
  Folder,
  Image,
  Calendar,
  Table,
  File,
  Type,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

interface SlashCommand {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  needsUpload?: boolean;
}

const slashCommands: SlashCommand[] = [
  {
    type: 'paragraph',
    label: 'Text',
    description: 'Plain text paragraph',
    icon: <Type className="h-4 w-4" />,
    keywords: ['text', 'paragraph', 'p'],
  },
  {
    type: 'document',
    label: 'Heading',
    description: 'Section heading',
    icon: <Heading1 className="h-4 w-4" />,
    keywords: ['heading', 'h1', 'h2', 'h3', 'title', 'header'],
  },
  {
    type: 'folder',
    label: 'Folder',
    description: 'Organize nodes',
    icon: <Folder className="h-4 w-4" />,
    keywords: ['folder', 'directory', 'group'],
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Upload an image',
    icon: <Image className="h-4 w-4" />,
    keywords: ['image', 'picture', 'photo', 'img'],
    needsUpload: true,
  },
  {
    type: 'file',
    label: 'File',
    description: 'Upload a file',
    icon: <File className="h-4 w-4" />,
    keywords: ['file', 'attachment', 'upload'],
    needsUpload: true,
  },
  {
    type: 'table',
    label: 'Table',
    description: 'Create a table',
    icon: <Table className="h-4 w-4" />,
    keywords: ['table', 'grid', 'spreadsheet'],
  },
  {
    type: 'calendar',
    label: 'Calendar',
    description: 'Date picker',
    icon: <Calendar className="h-4 w-4" />,
    keywords: ['calendar', 'date', 'event'],
  },
];

interface SlashCommandMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: NodeType, needsUpload: boolean) => void;
  position: { top: number; left: number };
}

export function SlashCommandMenu({
  open,
  onClose,
  onSelect,
  position,
}: SlashCommandMenuProps) {
  const [search, setSearch] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 50,
      }}
      className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
    >
      <div className="w-80 bg-popover border rounded-lg shadow-lg overflow-hidden">
        <Command>
          <CommandInput
            placeholder="Search for a block type..."
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Blocks">
              {slashCommands.map((cmd) => (
                <CommandItem
                  key={cmd.type}
                  value={`${cmd.label} ${cmd.keywords.join(' ')}`}
                  onSelect={() => {
                    onSelect(cmd.type, cmd.needsUpload || false);
                    onClose();
                  }}
                  className="flex items-start gap-3 px-3 py-2 cursor-pointer"
                >
                  <div className="mt-0.5">{cmd.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{cmd.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {cmd.description}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
