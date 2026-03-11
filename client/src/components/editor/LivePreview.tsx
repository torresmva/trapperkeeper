import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { TableOfContents } from '../shared/TableOfContents';

interface Props {
  content: string;
}

export function LivePreview({ content }: Props) {
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
      {content ? (
        <>
          <TableOfContents content={content} />
          <MarkdownRenderer content={content} />
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          start typing to see preview...
        </p>
      )}
    </div>
  );
}
