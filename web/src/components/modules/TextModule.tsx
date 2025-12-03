import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Node, ModuleConfig } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface TextModuleProps {
  nodes: Node[];
  config: ModuleConfig;
  isLoading?: boolean;
}

export function TextModule({ nodes, isLoading }: TextModuleProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading content...</div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No Content</p>
            <p className="text-sm mt-2">Add text nodes to display them here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderNodeContent = (node: Node) => {
    // Check if content has a specific text field
    const textContent = node.content.text || node.content.body || node.content.content;

    if (textContent) {
      // If it's markdown or HTML, render with sanitization
      if (node.content.format === 'markdown' || node.content.format === 'html' || node.type === 'document') {
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {String(textContent)}
            </ReactMarkdown>
          </div>
        );
      }

      // Otherwise render as plain text
      return <div className="whitespace-pre-wrap">{String(textContent)}</div>;
    }

    // If no specific text field, render the entire content as JSON
    if (Object.keys(node.content).length > 0) {
      return (
        <div className="space-y-2">
          {Object.entries(node.content).map(([key, value]) => (
            <div key={key}>
              <span className="font-semibold text-sm">{key}: </span>
              <span className="text-sm">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return <div className="text-muted-foreground italic">No content available</div>;
  };

  return (
    <Card className="h-full">
      <ScrollArea className="h-full">
        <CardContent className="p-6 space-y-6">
          {nodes.map((node, index) => (
            <div key={node.id}>
              {index > 0 && <Separator className="mb-6" />}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{node.name}</h3>
                  {node.color && (
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: node.color }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-muted rounded-md">{node.type}</span>
                  <span>
                    {new Date(node.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="mt-4">{renderNodeContent(node)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </ScrollArea>

      <style>{`
        .prose {
          color: hsl(var(--foreground));
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          color: hsl(var(--foreground));
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .prose h1 {
          font-size: 1.5em;
        }
        .prose h2 {
          font-size: 1.3em;
        }
        .prose h3 {
          font-size: 1.1em;
        }
        .prose a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .prose a:hover {
          opacity: 0.8;
        }
        .prose code {
          background-color: hsl(var(--muted));
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        .prose pre {
          background-color: hsl(var(--muted));
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .prose pre code {
          background-color: transparent;
          padding: 0;
        }
        .prose blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 1em;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        .prose ul,
        .prose ol {
          padding-left: 1.5em;
        }
        .prose li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
        .prose table {
          width: 100%;
          border-collapse: collapse;
        }
        .prose th,
        .prose td {
          border: 1px solid hsl(var(--border));
          padding: 0.5em;
        }
        .prose th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }
      `}</style>
    </Card>
  );
}
