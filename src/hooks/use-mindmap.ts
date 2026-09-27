import { useCallback, useEffect, useMemo, useState } from 'react';
import { descendantsOf, MindNode, normalizeNode, rootId, starterNodes } from '@/lib/mindmap';

const STORAGE_KEY = 'jinhwon-lee-mindmap-v1';
const LAYOUT_VERSION_KEY = 'jinhwon-lee-mindmap-layout-version';
const LAYOUT_VERSION = '2';

function spreadLayout(nodes: MindNode[]): MindNode[] {
  return nodes.map((node) => {
    if (node.id === rootId) return node;
    return {
      ...node,
      x: Math.round(node.x * 1.45),
      y: Math.round(node.y * 1.4),
    };
  });
}

function loadNodes(): MindNode[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(LAYOUT_VERSION_KEY, LAYOUT_VERSION);
      return starterNodes.map(normalizeNode);
    }
    const parsed = JSON.parse(saved) as MindNode[];
    if (!Array.isArray(parsed) || parsed.length === 0) return starterNodes.map(normalizeNode);

    let normalized = parsed.map(normalizeNode);
    if (localStorage.getItem(LAYOUT_VERSION_KEY) !== LAYOUT_VERSION) {
      normalized = spreadLayout(normalized);
      localStorage.setItem(LAYOUT_VERSION_KEY, LAYOUT_VERSION);
    }
    return normalized;
  } catch {
    return starterNodes.map(normalizeNode);
  }
}

export function useMindmap() {
  const [nodes, setNodes] = useState<MindNode[]>(loadNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
    setHydrated(true);
  }, [nodes]);

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const updateNode = useCallback((id: string, patch: Partial<MindNode>) => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, ...patch } : node));
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    updateNode(id, { x, y });
  }, [updateNode]);

  const addChild = useCallback((parentId: string) => {
    const id = `thought-${Date.now()}`;
    setNodes((current) => {
      const parent = current.find((node) => node.id === parentId);
      if (!parent) return current;
      const siblings = current.filter((node) => node.parentId === parentId);
      const angle = siblings.length * 0.72 - 1.1;
      const radius = parent.kind === 'root' ? 390 : 310;
      const node: MindNode = {
        id,
        parentId,
        kind: 'content',
        title: 'New thought',
        description: 'A new point of view. Give it a name and a note.',
        attachments: [],
        x: parent.x + Math.cos(angle) * radius,
        y: parent.y + Math.sin(angle) * radius,
      };
      return [...current, node];
    });
    return id;
  }, []);

  const deleteNode = useCallback((id: string) => {
    if (id === rootId) return;
    setNodes((current) => {
      const removed = new Set([id, ...descendantsOf(current, id)]);
      return current.filter((node) => !removed.has(node.id));
    });
    setSelectedId((current) => current === id ? null : current);
  }, []);

  const resetNodes = useCallback(() => {
    setNodes(starterNodes.map(normalizeNode));
    setSelectedId(null);
  }, []);

  return {
    nodes,
    nodeMap,
    selectedId,
    setSelectedId,
    updateNode,
    moveNode,
    addChild,
    deleteNode,
    resetNodes,
    hydrated,
  };
}