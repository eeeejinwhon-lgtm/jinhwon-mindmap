import { type FormEvent, useEffect, useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import {
  attachmentTypeLabels,
  attachmentsForNode,
  type AttachmentType,
  type MindAttachment,
  type MindNode,
} from '@/lib/mindmap';

type Props = {
  node: MindNode;
  onClose: () => void;
  onSave: (patch: Partial<MindNode>) => void;
  onDelete: () => void;
};

type EditorForm = {
  title: string;
  description: string;
  attachments: MindAttachment[];
};

function draftFromNode(node: MindNode): EditorForm {
  return {
    title: node.title,
    description: node.description,
    attachments: attachmentsForNode(node).map((attachment) => ({ ...attachment })),
  };
}

export function NodeEditor({ node, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<EditorForm>(() => draftFromNode(node));

  useEffect(() => {
    setForm(draftFromNode(node));
  }, [node]);

  const setText = (key: 'title' | 'description', value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addAttachment = () => {
    const id = `attachment-${Date.now().toString(36)}-${form.attachments.length}`;
    setForm((current) => ({
      ...current,
      attachments: [
        ...current.attachments,
        { id, type: 'external', name: '새 첨부파일', url: '' },
      ],
    }));
  };

  const updateAttachment = (id: string, patch: Partial<MindAttachment>) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.map((attachment) =>
        attachment.id === id ? { ...attachment, ...patch } : attachment,
      ),
    }));
  };

  const removeAttachment = (id: string) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== id),
    }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      title: form.title.trim() || '이름 없는 노드',
      description: form.description.trim(),
      attachments: form.attachments
        .map((attachment) => ({
          ...attachment,
          name: attachment.name.trim() || attachmentTypeLabels[attachment.type],
          url: attachment.url.trim(),
        }))
        .filter((attachment) => attachment.url),
    });
  };

  return (
    <div
      className="editor-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title" data-testid="node-editor">
        <div className="editor-head">
          <div>
            <h2 className="editor-title" id="editor-title">노드 수정</h2>
            <p className="editor-description">저장하면 이 브라우저에 변경 내용이 보관됩니다.</p>
          </div>
          <button className="editor-close" type="button" onClick={onClose} aria-label="수정창 닫기" data-testid="button-close-editor"><X size={15} /></button>
        </div>

        <form className="editor-form" onSubmit={submit}>
          <label className="field-wrap">
            <span className="field-label">이름</span>
            <input className="field" value={form.title} onChange={(event) => setText('title', event.target.value)} autoFocus data-testid="input-node-name" />
          </label>
          <label className="field-wrap">
            <span className="field-label">설명</span>
            <textarea className="field" value={form.description} onChange={(event) => setText('description', event.target.value)} data-testid="input-node-description" />
          </label>

          <div className="attachments-editor">
            <div className="attachments-editor-head">
              <span className="field-label">첨부파일</span>
              <button className="attachment-add-button" type="button" onClick={addAttachment} data-testid="button-add-attachment">
                <Plus size={13} /> 첨부 추가
              </button>
            </div>
            {form.attachments.length === 0 ? (
              <div className="attachment-editor-empty">이미지, PDF, 문서 또는 링크를 추가할 수 있습니다.</div>
            ) : (
              <div className="attachment-editor-list">
                {form.attachments.map((attachment) => (
                  <div className="attachment-editor-row" key={attachment.id}>
                    <div className="attachment-row-top">
                      <select
                        className="field attachment-type"
                        value={attachment.type}
                        aria-label="첨부 유형"
                        onChange={(event) => updateAttachment(attachment.id, { type: event.target.value as AttachmentType })}
                      >
                        {Object.entries(attachmentTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <button className="attachment-delete-button" type="button" onClick={() => removeAttachment(attachment.id)} aria-label={`${attachment.name || '첨부파일'} 삭제`} data-testid={`button-delete-attachment-${attachment.id}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      className="field"
                      value={attachment.name}
                      placeholder="첨부 이름"
                      aria-label="첨부 이름"
                      onChange={(event) => updateAttachment(attachment.id, { name: event.target.value })}
                    />
                    <input
                      className="field"
                      type="url"
                      value={attachment.url}
                      placeholder="https://..."
                      aria-label="첨부 URL"
                      onChange={(event) => updateAttachment(attachment.id, { url: event.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="editor-actions">
            <button className="map-button danger-button" type="button" onClick={onDelete} disabled={node.kind === 'root'} aria-label={node.kind === 'root' ? '루트 노드는 삭제할 수 없습니다' : '노드 삭제'} data-testid="button-delete-editing-node"><Trash2 size={14} /> 삭제</button>
            <div className="editor-action-group">
              <button className="map-button" type="button" onClick={onClose} data-testid="button-cancel-edit">취소</button>
              <button className="map-button active" type="submit" data-testid="button-save-node"><Save size={14} /> 저장</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}