import { ArrowUpRight, FileText, Github, Image as ImageIcon, Link2, X } from 'lucide-react';
import {
  attachmentTypeLabels,
  attachmentsForNode,
  displayNodeTitle,
  type MindAttachment,
  type MindNode,
} from '@/lib/mindmap';

type Props = {
  node: MindNode;
  onClose: () => void;
};

function attachmentIcon(attachment: MindAttachment) {
  if (attachment.type === 'github') return <Github size={13} />;
  if (attachment.type === 'image') return <ImageIcon size={13} />;
  return <Link2 size={13} />;
}

function attachmentLabel(attachment: MindAttachment) {
  return attachment.name || attachmentTypeLabels[attachment.type];
}

export function DetailPanel({ node, onClose }: Props) {
  const attachments = attachmentsForNode(node);
  const images = attachments.filter((attachment) => attachment.type === 'image' && attachment.url);
  const files = attachments.filter((attachment) => (attachment.type === 'pdf' || attachment.type === 'document') && attachment.url);
  const links = attachments.filter((attachment) => attachment.type === 'external' || attachment.type === 'github' || attachment.type === 'website');

  return (
    <aside className="detail-panel" data-testid="detail-panel" aria-label={`${displayNodeTitle(node)} 상세 정보`}>
      <button className="detail-close" type="button" onClick={onClose} aria-label="상세창 닫기" data-testid="button-close-details"><X size={16} /></button>
      <div className="detail-kicker">
        {node.kind === 'branch' ? '지도의 분기' : node.kind === 'root' ? '지도의 중심' : '자세히 보기'}
      </div>
      <h2 className="detail-title">{displayNodeTitle(node)}</h2>
      <div className="detail-rule" />
      <p className="detail-description">{node.description || '아직 설명이 없습니다. 수정 모드에서 내용을 남겨보세요.'}</p>

      <section className="detail-section detail-attachments-section">
        <div className="detail-label">첨부파일</div>
        {images.map((attachment) => (
          <a className="detail-image-link" key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" data-testid={`link-image-${attachment.id}`}>
            <img className="detail-image" src={attachment.url} alt={attachmentLabel(attachment)} data-testid={`img-detail-${attachment.id}`} />
          </a>
        ))}
        <div className="detail-links">
          {files.map((attachment) => (
            <a className="detail-link" key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" data-testid={`link-file-${attachment.id}`}>
              <FileText size={13} /> {attachmentLabel(attachment)} <ArrowUpRight size={12} />
            </a>
          ))}
        </div>
        {images.length === 0 && files.length === 0 && (
          <div className="detail-empty" data-testid={`empty-attachments-${node.id}`}>
            <ImageIcon size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} /> 첨부파일이 없습니다.
          </div>
        )}
      </section>

      <section className="detail-section detail-links-section">
        <div className="detail-label">링크</div>
        {links.length > 0 ? (
          <div className="detail-links">
            {links.map((attachment) => (
              <a className="detail-link" key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" data-testid={`link-${attachment.type}-${attachment.id}`}>
                {attachmentIcon(attachment)} {attachmentLabel(attachment)} <ArrowUpRight size={12} />
              </a>
            ))}
          </div>
        ) : (
          <div className="detail-empty" data-testid={`empty-links-${node.id}`}>
            <Link2 size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} /> 연결된 링크가 없습니다.
          </div>
        )}
      </section>
    </aside>
  );
}