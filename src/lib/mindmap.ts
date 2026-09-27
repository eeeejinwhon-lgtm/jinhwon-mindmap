export type NodeKind = 'root' | 'branch' | 'content';

export type AttachmentType = 'image' | 'pdf' | 'document' | 'external' | 'github' | 'website';

export type MindAttachment = {
  id: string;
  type: AttachmentType;
  name: string;
  url: string;
};

export type MindNode = {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  title: string;
  description: string;
  x: number;
  y: number;
  imageUrl?: string;
  fileName?: string;
  fileUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  attachments?: MindAttachment[];
};

export const rootId = 'root';

export const starterNodes: MindNode[] = [
  { id: rootId, parentId: null, kind: 'root', title: '이진훤', description: 'A map of the things I make, study, and keep close.', x: 0, y: 0 },
  { id: 'projects', parentId: rootId, kind: 'branch', title: 'PROJECTS', description: 'Experiments that became useful, and useful things that stayed experimental.', x: -420, y: -280 },
  { id: 'skills', parentId: rootId, kind: 'branch', title: 'SKILLS', description: 'Tools I reach for when an idea needs a shape.', x: 420, y: -280 },
  { id: 'interests', parentId: rootId, kind: 'branch', title: 'INTERESTS', description: 'Questions I return to when there is no deadline.', x: -420, y: 300 },
  { id: 'activities', parentId: rootId, kind: 'branch', title: 'ACTIVITIES', description: 'Small practices and places where I keep learning in public.', x: 420, y: 300 },
  { id: 'about', parentId: rootId, kind: 'branch', title: 'ABOUT', description: 'A short note from the person behind this map. Edit this space to make it yours.', x: 0, y: -470 },
  { id: 'stock-backtest', parentId: 'projects', kind: 'content', title: 'Stock Trading Backtest', description: 'A research notebook for testing strategies against the noisy memory of the market.', x: -760, y: -190, githubUrl: 'https://github.com/', websiteUrl: '' },
  { id: 'personal-portfolio', parentId: 'projects', kind: 'content', title: 'Personal Portfolio', description: 'This living map: a portfolio that behaves more like a working desk than a résumé.', x: -760, y: -370, websiteUrl: '' },
  { id: 'python', parentId: 'skills', kind: 'content', title: 'Python', description: 'For fast experiments, data work, and making small ideas executable.', x: 760, y: -120 },
  { id: 'html', parentId: 'skills', kind: 'content', title: 'HTML', description: 'The quiet structure underneath everything I build.', x: 760, y: -270 },
  { id: 'css', parentId: 'skills', kind: 'content', title: 'CSS', description: 'A language for atmosphere, rhythm, and precise little moments.', x: 760, y: -420 },
  { id: 'javascript', parentId: 'skills', kind: 'content', title: 'JavaScript', description: 'The connective tissue between an idea and its interaction.', x: 760, y: -570 },
  { id: 'github', parentId: 'skills', kind: 'content', title: 'GitHub', description: 'Where unfinished work gets a history and a place to grow.', x: 760, y: -720 },
  { id: 'programming', parentId: 'interests', kind: 'content', title: 'Programming', description: 'Thinking by making. Making to find the next question.', x: -760, y: 150 },
  { id: 'ai', parentId: 'interests', kind: 'content', title: 'AI', description: 'Curious about tools that extend attention without replacing judgment.', x: -760, y: 300 },
  { id: 'cybersecurity', parentId: 'interests', kind: 'content', title: 'Cybersecurity', description: 'The craft of noticing what a system assumes, and what it forgets.', x: -760, y: 450 },
  { id: 'mathematics', parentId: 'interests', kind: 'content', title: 'Mathematics', description: 'A preference for elegant constraints and honest abstractions.', x: -760, y: 600 },
];

export const attachmentTypeLabels: Record<AttachmentType, string> = {
  image: '이미지',
  pdf: 'PDF',
  document: '문서',
  external: '외부 링크',
  github: 'GitHub',
  website: '웹사이트',
};

export const nodeTitleLabels: Record<string, string> = {
  PROJECTS: '프로젝트',
  SKILLS: '기술',
  INTERESTS: '관심사',
  ACTIVITIES: '활동',
  ABOUT: '소개',
};

export function displayNodeTitle(node: Pick<MindNode, 'id' | 'title' | 'kind'>): string {
  return node.kind === 'branch' ? nodeTitleLabels[node.title] ?? node.title : node.title;
}

function legacyAttachments(node: MindNode): MindAttachment[] {
  const attachments: MindAttachment[] = [];
  if (node.imageUrl) attachments.push({ id: 'legacy-image', type: 'image', name: '이미지', url: node.imageUrl });
  if (node.fileUrl || node.fileName) {
    const name = node.fileName || '문서';
    const type = /\.pdf(?:$|[?#])/i.test(name) ? 'pdf' : 'document';
    attachments.push({ id: 'legacy-file', type, name, url: node.fileUrl ?? '' });
  }
  if (node.githubUrl) attachments.push({ id: 'legacy-github', type: 'github', name: 'GitHub', url: node.githubUrl });
  if (node.websiteUrl) attachments.push({ id: 'legacy-website', type: 'website', name: '웹사이트', url: node.websiteUrl });
  return attachments;
}

export function attachmentsForNode(node: MindNode): MindAttachment[] {
  if (Array.isArray(node.attachments)) {
    return node.attachments;
  }
  return legacyAttachments(node);
}

export function normalizeNode(node: MindNode): MindNode {
  return {
    ...node,
    attachments: Array.isArray(node.attachments) ? node.attachments : legacyAttachments(node),
  };
}

export function descendantsOf(nodes: MindNode[], id: string): string[] {
  const children = nodes.filter((node) => node.parentId === id);
  return children.flatMap((child) => [child.id, ...descendantsOf(nodes, child.id)]);
}

export function nodeById(nodes: MindNode[], id: string | null): MindNode | undefined {
  return id ? nodes.find((node) => node.id === id) : undefined;
}