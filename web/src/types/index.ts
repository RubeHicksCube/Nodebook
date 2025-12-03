// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

// Node types
export type NodeType =
  | 'root'
  | 'folder'
  | 'document'
  | 'paragraph'
  | 'image'
  | 'file'
  | 'table'
  | 'table-row'
  | 'table-cell'
  | 'calendar'
  | 'event'
  | 'reference'
  | 'widget';

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface NodeTag {
  nodeId: string;
  tagId: string;
  tag: Tag;
}

export interface Node {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  type: NodeType;
  color: string | null;
  content: Record<string, any>;
  metadata: Record<string, any>;
  position: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  tags?: NodeTag[];
  parent?: {
    id: string;
    name: string;
  };
  children?: Node[];
}

export interface CreateNodeInput {
  name: string;
  type: NodeType;
  parentId?: string | null;
  color?: string;
  content?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateNodeInput {
  name?: string;
  color?: string;
  content?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  version: number;
}

export interface MoveNodeInput {
  parentId: string | null;
  position?: number;
}

export interface ReorderNodeInput {
  position: number;
}

// Zone types
export interface Zone {
  id: string;
  userId: string;
  name: string;
  referenceId: string | null;
  color: string | null;
  icon: string | null;
  position: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneInput {
  name: string;
  referenceId?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface UpdateZoneInput {
  name?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface ReorderZoneInput {
  position: number;
}

export interface BatchReorderZonesInput {
  zones: Array<{
    id: string;
    position: number;
  }>;
}

// Module types
export type ModuleType =
  | 'graph'
  | 'table'
  | 'calendar'
  | 'text'
  | 'kanban'
  | 'list'
  | 'grid'
  | 'canvas';

export type ChartType =
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'composed';

export interface ModuleFilter {
  nodeTypes?: string[];
  tags?: string[];
  dateRange?: {
    field: 'createdAt' | 'updatedAt';
    start?: string;
    end?: string;
  };
  parentId?: string | null;
  search?: string;
  customFilters?: Record<string, any>;
}

export interface ModuleConfig {
  filters?: ModuleFilter;
  sort?: {
    field: 'createdAt' | 'updatedAt' | 'name';
    order: 'asc' | 'desc';
  };
  limit?: number;
  // Graph-specific
  chartType?: ChartType;
  xAxisField?: string;
  yAxisField?: string;
  dataFields?: string[];
  // Table-specific
  tableColumns?: string[];
  pageSize?: number;
  // Calendar-specific
  dateField?: string;
  titleField?: string;
  defaultView?: 'month' | 'week' | 'day';
  // Kanban-specific
  statusField?: string;
  kanbanColumns?: Array<{
    id: string;
    title: string;
    color?: string;
  }>;
}

export interface Module {
  id: string;
  userId: string;
  zoneId: string;
  name: string;
  referenceId: string | null;
  type: ModuleType;
  config: ModuleConfig;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleNodesResponse {
  module: Module;
  nodes: Node[];
  total: number;
  appliedFilters: ModuleFilter;
}

export interface ModuleLayout {
  i: string; // module id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface CreateModuleInput {
  name: string;
  type: ModuleType;
  zoneId: string;
  referenceId?: string | null;
  config?: ModuleConfig;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

export interface UpdateModuleInput {
  name?: string;
  config?: ModuleConfig;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

export interface MoveModuleInput {
  zoneId: string;
}

export interface UpdateLayoutInput {
  layouts: ModuleLayout[];
}

// Workspace types (deprecated - use zones)
export interface Workspace {
  id: string;
  userId: string;
  name: string;
  layout: Record<string, any>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

export interface AuthResponse {
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}
