import { useCallback, useEffect, useMemo } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import {
  BaseEdge,
  Background,
  Controls,
  type EdgeProps,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { displayNodeTitle, MindNode, rootId } from '@/lib/mindmap';

type Mode = 'view' | 'edit';

type Props = {
  nodes: MindNode[];
  selectedId: string | null;
  mode: Mode;
  focusId: string | null;
  highlightId: string | null;
  onSelect: (id: string) => void;
  onAdd: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onHomeReady?: (home: () => void) => void;
};

type MindmapNodeData = {
  model: MindNode;
  index: number;
  mode: Mode;
  selected: boolean;
  onPath: boolean;
  dimmed: boolean;
  highlighted: boolean;
  onSelect: (id: string) => void;
  onAdd: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

type FlowMindNode = Node<MindmapNodeData, 'mindmap'>;

const rootSize = { width: 158, height: 158 };
const branchSize = { width: 170, height: 66 };
const contentSize = { width: 204, height: 64 };

function dimensions(node: MindNode) {
  return node.kind === 'root' ? rootSize : node.kind === 'branch' ? branchSize : contentSize;
}

function FlowNode({ data }: NodeProps<FlowMindNode>) {
  const { model, index, mode, selected, onPath, dimmed, highlighted, onSelect, onAdd, onEdit, onDelete } = data;
  const isRoot = model.kind === 'root';
  const chipLabel = model.kind === 'branch' ? `MOD-${String(index).padStart(2, '0')}` : `IC-${String(index).padStart(2, '0')}`;

  return (
    <div
      className={`mindmap-node ${model.kind} ${selected ? 'is-selected' : ''} ${onPath ? 'is-on-path' : ''} ${dimmed ? 'is-dimmed' : ''} ${highlighted ? 'is-search-highlighted' : ''} ${mode === 'edit' ? 'is-editing' : ''}`}
      data-testid={`node-${model.id}`}
      role="button"
      tabIndex={0}
      aria-label={`${displayNodeTitle(model)}. ${model.kind === 'branch' ? '분기' : model.kind === 'root' ? '중심' : '콘텐츠'} 노드`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(model.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(model.id);
        }
      }}
    >
      <Handle className="mindmap-handle" type="target" position={Position.Top} isConnectable={false} />
      {isRoot ? (
        <>
          <div className="node-orbit" />
          <div className="node-root-card">
            <span className="chip-pins chip-pins-left" aria-hidden="true" />
            <span className="chip-pins chip-pins-right" aria-hidden="true" />
            <span className="chip-die-corners" aria-hidden="true" />
            <strong>{model.title}</strong><span className="root-subtitle">JINHWON LEE</span>
          </div>
        </>
      ) : (
        <div className={`node-card ${model.kind === 'branch' ? 'branch-card' : ''}`}>
          <span className="chip-pins chip-pins-left" aria-hidden="true" />
          <span className="chip-pins chip-pins-right" aria-hidden="true" />
          <span className="node-index">{chipLabel}</span>
          <div>
            <div className={model.kind === 'branch' ? 'node-name' : 'node-content-name'}>{displayNodeTitle(model)}</div>
            <div className="node-kind">{model.kind === 'branch' ? '분기' : '메모'}</div>
          </div>
        </div>
      )}
      <Handle className="mindmap-handle" type="source" position={Position.Bottom} isConnectable={false} />
      {mode === 'edit' && !isRoot && (
        <div className="node-edit-controls nodrag nopan" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
          <button type="button" aria-label={`${displayNodeTitle(model)} 하위 노드 추가`} data-testid={`button-add-child-${model.id}`} onClick={() => onAdd(model.id)}><Plus size={12} /></button>
          <button type="button" aria-label={`${displayNodeTitle(model)} 수정`} data-testid={`button-edit-node-${model.id}`} onClick={() => onEdit(model.id)}><Edit3 size={12} /></button>
          <button type="button" aria-label={`${displayNodeTitle(model)} 삭제`} data-testid={`button-delete-node-${model.id}`} onClick={() => onDelete(model.id)}><Trash2 size={12} /></button>
        </div>
      )}
      {mode === 'edit' && isRoot && selected && (
        <div className="node-edit-controls nodrag nopan" style={{ opacity: 1 }} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
          <button type="button" aria-label="하위 노드 추가" data-testid="button-add-root-child" onClick={() => onAdd(rootId)}><Plus size={12} /></button>
          <button type="button" aria-label="중심 노드 수정" data-testid="button-edit-root" onClick={() => onEdit(rootId)}><Edit3 size={12} /></button>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { mindmap: FlowNode };

function CircuitEdge({ sourceX, sourceY, targetX, targetY, style, className }: EdgeProps) {
  const midY = sourceY + (targetY - sourceY) / 2;
  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
  const isActive = className?.includes('is-active');

  return (
    <>
      <BaseEdge
        path={path}
        className={`circuit-trace-underlay ${isActive ? 'is-active' : ''}`}
        style={{
          ...style,
          strokeWidth: typeof style?.strokeWidth === 'number' ? style.strokeWidth + 3.4 : 4.6,
          opacity: isActive ? 0.15 : 0.08,
        }}
      />
      <BaseEdge path={path} style={style} className={className} />
      <g className={`circuit-vias ${isActive ? 'is-active' : ''}`} aria-hidden="true" pointerEvents="none">
        <circle cx={sourceX} cy={sourceY} r="2" />
        <circle cx={sourceX} cy={midY} r="2.5" />
        <circle cx={(sourceX + targetX) / 2} cy={midY} r="1.7" />
        <circle cx={targetX} cy={midY} r="2.5" />
        <circle cx={targetX} cy={targetY} r="2" />
        {isActive && (
          <>
            <circle className="circuit-signal" r="2.5">
              <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
            </circle>
            <circle className="circuit-signal circuit-signal-secondary" r="1.7">
              <animateMotion begin="0.9s" dur="1.8s" repeatCount="indefinite" path={path} />
            </circle>
          </>
        )}
      </g>
    </>
  );
}

const edgeTypes = { circuit: CircuitEdge };

function MindmapFlow({ nodes: models, selectedId, mode, focusId, highlightId, onSelect, onAdd, onEdit, onDelete, onMove, onHomeReady }: Props) {
  const { setCenter, fitView } = useReactFlow<FlowMindNode>();
  const nodeMap = useMemo(() => new Map(models.map((node) => [node.id, node])), [models]);
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    let current = selectedId ? nodeMap.get(selectedId) : undefined;
    while (current) {
      ids.add(current.id);
      current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }
    return ids;
  }, [nodeMap, selectedId]);

  const home = useCallback(() => {
    const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;
    setCenter(0, 0, { zoom: mobile ? 0.46 : 0.72, duration: 480 });
  }, [setCenter]);

  useEffect(() => onHomeReady?.(home), [home, onHomeReady]);

  useEffect(() => {
    if (!focusId) return;
    const node = nodeMap.get(focusId);
    if (node) setCenter(node.x, node.y, { zoom: typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches ? 0.72 : 1, duration: 480 });
  }, [focusId, nodeMap, setCenter]);

  const flowNodes = useMemo<FlowMindNode[]>(() => models.map((model, index) => {
    const size = dimensions(model);
    return {
      id: model.id,
      type: 'mindmap',
      position: { x: model.x - size.width / 2, y: model.y - size.height / 2 },
      data: {
        model,
        index,
        mode,
        selected: selectedId === model.id,
        onPath: activeNodeIds.has(model.id),
        dimmed: Boolean(selectedId) && !activeNodeIds.has(model.id),
        highlighted: highlightId === model.id,
        onSelect,
        onAdd,
        onEdit,
        onDelete,
      },
      draggable: mode === 'edit',
      selectable: true,
    };
  }), [activeNodeIds, highlightId, models, mode, onAdd, onDelete, onEdit, onSelect, selectedId]);

  const flowEdges = useMemo<Edge[]>(() => models.flatMap((model) => {
    if (!model.parentId || !nodeMap.has(model.parentId)) return [];
    const active = Boolean(selectedId) && activeNodeIds.has(model.id) && activeNodeIds.has(model.parentId);
    return [{
      id: `${model.parentId}-${model.id}`,
      source: model.parentId,
      target: model.id,
      type: 'circuit',
      className: `circuit-edge ${active ? 'is-active' : 'is-dimmed'}`,
      animated: active,
      style: {
        stroke: active ? 'hsl(177 61% 61% / .92)' : model.kind === 'content' ? 'hsl(219 22% 30% / .55)' : 'hsl(268 39% 52% / .62)',
        strokeWidth: active ? 2.1 : selectedId ? 1 : 1.3,
        opacity: selectedId && !active ? .28 : 1,
      },
    }];
  }), [activeNodeIds, models, nodeMap, selectedId]);

  return (
    <div className="absolute inset-0" data-testid="mindmap-canvas" aria-label="인터랙티브 포트폴리오 마인드맵. 드래그하여 이동하고 휠 또는 핀치로 확대하세요." role="application">
      <div className="mindmap-grid" />
      <div className="pcb-silkscreen" aria-hidden="true">
        <span className="pcb-ref pcb-ref-a">JH-MB / REV.02</span>
        <span className="pcb-ref pcb-ref-b">DATA BUS 24-BIT</span>
        <span className="pcb-ref pcb-ref-c">PORTFOLIO SYSTEM</span>
        <i className="pcb-pad pcb-pad-a" />
        <i className="pcb-pad pcb-pad-b" />
        <i className="pcb-pad pcb-pad-c" />
        <i className="pcb-board-trace pcb-board-trace-a" />
        <i className="pcb-board-trace pcb-board-trace-b" />
      </div>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onSelect(node.id)}
        onPaneClick={() => onSelect('')}
        onNodeDragStop={(_, node) => {
          const model = nodeMap.get(node.id);
          if (!model) return;
          const size = dimensions(model);
          onMove(node.id, node.position.x + size.width / 2, node.position.y + size.height / 2);
        }}
        onInit={() => {
          if (typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches) {
            setCenter(0, 0, { zoom: 0.52, duration: 450 });
          } else {
            setCenter(0, 0, { zoom: 0.72, duration: 450 });
          }
        }}
        nodesDraggable={mode === 'edit'}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        minZoom={0.28}
        maxZoom={1.8}
        aria-label="포트폴리오 마인드맵 캔버스"
      >
        <Background color="hsl(180 45% 48% / .075)" gap={48} size={1} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => node.type === 'mindmap' ? 'hsl(177 48% 44% / .82)' : 'hsl(270 48% 58% / .72)'}
          nodeStrokeColor="hsl(177 48% 66% / .52)"
          maskColor="hsl(220 42% 4% / .72)"
        />
        <Controls position="bottom-right" showInteractive={false} style={{ right: 178, bottom: 30 }} />
      </ReactFlow>
      <div className="canvas-help">드래그하여 탐색 · 휠 / 핀치 확대 · ⌂ 버튼으로 코어 복귀</div>
      <div className="map-legend">
        <span className="legend-item"><i className="legend-dot" /> 메모</span>
        <span className="legend-item"><i className="legend-dot gold" /> 분기</span>
      </div>
      <div className="map-hint">PCB MAP // VIEWER MODE</div>
    </div>
  );
}

export function MindmapCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <MindmapFlow {...props} />
    </ReactFlowProvider>
  );
}