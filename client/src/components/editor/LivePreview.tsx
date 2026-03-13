import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { TableOfContents } from '../shared/TableOfContents';

interface Props {
  content: string;
}

export function LivePreview({ content }: Props) {
  // Strip any leaked frontmatter from body content
  const cleaned = content.replace(/^---\n[\s\S]*?\n---\n*/m, '').replace(/^\w+:\s*\[?\]?\n---\n*/m, '');

  return (
    <div
      className="markdown-preview"
      style={{
        height: '100%',
        overflow: 'auto',
        padding: '20px 28px',
        background: 'transparent',
      }}
    >
      {cleaned ? (
        <>
          <TableOfContents content={cleaned} />
          <MarkdownRenderer content={cleaned} />
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          start typing to see preview...
        </p>
      )}
    </div>
  );
}
