import { useCallback, useEffect, useMemo, useState } from 'react';
import { Crosshair, Home as HomeIcon, Search } from 'lucide-react';
import { DetailPanel } from '@/components/mindmap/DetailPanel';
import { MindmapCanvas } from '@/components/mindmap/MindmapCanvas';
import { displayNodeTitle, normalizeNode, rootId, starterNodes, type MindNode } from '@/lib/mindmap';

type IntroPhase = 'visible' | 'leaving' | 'hidden';

function Home() {
  const nodes = useMemo(() => starterNodes.map(normalizeNode), []);
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [homeAction, setHomeAction] = useState<(() => void) | null>(null);
  const [introPhase, setIntroPhase] = useState<IntroPhase>('visible');

  const selectedNode = selectedId ? nodeMap.get(selectedId) : undefined;
  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return nodes
      .filter((node) => `${node.title} ${displayNodeTitle(node)} ${node.description}`.toLowerCase().includes(needle))
      .slice(0, 7);
  }, [nodes, query]);

  const breadcrumbNodes = useMemo(() => {
    const path: MindNode[] = [];
    let current = nodeMap.get(selectedId ?? rootId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }
    return path;
  }, [nodeMap, selectedId]);

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => setHighlightId(null), 1600);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  useEffect(() => {
    if (introPhase !== 'leaving') return;
    const timer = window.setTimeout(() => setIntroPhase('hidden'), 520);
    return () => window.clearTimeout(timer);
  }, [introPhase]);

  const registerHome = useCallback((home: () => void) => setHomeAction(() => home), []);

  const focusNode = (id: string) => {
    setFocusId(id);
    setHighlightId(id);
    setSearchOpen(false);
    setSelectedId(id);
  };

  const selectNode = (id: string) => setSelectedId(id || null);

  const openMindmap = () => {
    homeAction?.();
    setIntroPhase('leaving');
  };

  const returnToIntro = () => {
    setSelectedId(null);
    setSearchOpen(false);
    setQuery('');
    homeAction?.();
    setIntroPhase('visible');
  };

  const noop = () => {};

  return (
    <main className="mindmap-app dark" data-testid="mindmap-app">
      {introPhase !== 'hidden' && (
        <section className={`intro-screen ${introPhase === 'leaving' ? 'is-leaving' : ''}`} aria-label="사이트 소개" data-testid="intro-screen">
          <div className="intro-light intro-light-one" aria-hidden="true" />
          <div className="intro-light intro-light-two" aria-hidden="true" />
          <div className="intro-content">
            <div className="intro-kicker">JINHWON LEE / PORTFOLIO</div>
            <h1 className="intro-title">이진훤</h1>
            <div className="intro-name">JINHWON LEE</div>
            <p className="intro-description">저에 대해 직접 탐색해보세요.</p>
            <button className="intro-button" type="button" onClick={openMindmap} data-testid="button-enter-mindmap">
              소개 보기
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
      )}

      <header className="map-header">
        <div className="brand-mark">
          <i className="brand-dot" aria-hidden="true" />
          <div>
            <div className="brand-title">이진훤 / JINHWON LEE</div>
            <div className="brand-subtitle">진행 중인 생각의 지도</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="map-button icon" type="button" onClick={returnToIntro} aria-label="홈으로 돌아가기" title="홈으로 돌아가기"><HomeIcon size={15} /></button>
          <button className={`map-button icon ${searchOpen ? 'active' : ''}`} type="button" onClick={() => setSearchOpen((open) => !open)} aria-label="검색" title="검색"><Search size={15} /></button>
          <button className="map-button icon" type="button" onClick={() => homeAction?.()} aria-label="중앙으로 돌아가기" title="중앙으로 돌아가기"><Crosshair size={15} /></button>
        </div>
      </header>

      <nav className="breadcrumb" aria-label="현재 선택 경로">
        {breadcrumbNodes.map((node, index) => (
          <span className="breadcrumb-item" key={node.id}>
            {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">›</span>}
            <span className={index === breadcrumbNodes.length - 1 ? 'is-current' : ''}>{displayNodeTitle(node)}</span>
          </span>
        ))}
      </nav>

      {searchOpen && (
        <div className="search-popover">
          <input className="search-input" type="search" autoFocus placeholder="노드 이름 검색" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="노드 검색" />
          {query && searchResults.length === 0 && <div className="detail-empty" style={{ marginTop: 8 }}>일치하는 노드가 없습니다.</div>}
          <div className="search-results">
            {searchResults.map((node) => (
              <button key={node.id} className="search-result" type="button" onClick={() => focusNode(node.id)}>
                <span>{displayNodeTitle(node)}</span>
                <small>{node.kind === 'branch' ? '분기' : node.kind === 'root' ? '중심' : '콘텐츠'}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <MindmapCanvas
        nodes={nodes}
        selectedId={selectedId}
        mode="view"
        focusId={focusId}
        highlightId={highlightId}
        onSelect={selectNode}
        onAdd={noop}
        onEdit={noop}
        onDelete={noop}
        onMove={noop}
        onHomeReady={registerHome}
      />

      {selectedNode && <DetailPanel key={selectedNode.id} node={selectedNode} onClose={() => setSelectedId(null)} />}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{nodes.length}개 노드가 연결됨</span>
    </main>
  );
}

export default Home;
