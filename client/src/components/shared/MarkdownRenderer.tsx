import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { MermaidBlock } from './MermaidBlock';
import { WikiLink } from './WikiLink';
import { CodeBlock } from './CodeBlock';

interface Props {
  content: string;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function processWikiLinks(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, child => {
    if (typeof child !== 'string') return child;
    const parts = child.split(/(\[\[[^\]]+\]\])/g);
    if (parts.length === 1) return child;
    return parts.map((part, i) => {
      const match = part.match(/^\[\[([^\]]+)\]\]$/);
      if (match) {
        return <WikiLink key={i} name={match[1]} />;
      }
      return part;
    });
  });
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeKatex]}
      components={{
        a({ href, children, ...props }) {
          const audioExts = /\.(ogg|mp3|wav|webm|m4a)$/i;
          if (href && audioExts.test(href)) {
            return <audio controls src={href} />;
          }
          // Inline PDF viewer
          if (href && /\.pdf$/i.test(href)) {
            return (
              <div style={{ margin: '12px 0' }}>
                <div style={{
                  fontSize: '10px', color: 'var(--text-muted)', marginBottom: 4,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ color: 'var(--accent-tertiary)' }}>pdf</span>
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
                    {String(children) || href.split('/').pop()}
                  </a>
                </div>
                <object
                  data={href}
                  type="application/pdf"
                  style={{
                    width: '100%', height: '600px', border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <p style={{ padding: 12, fontSize: '11px', color: 'var(--text-muted)' }}>
                    PDF preview not supported in this browser.{' '}
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>
                      download
                    </a>
                  </p>
                </object>
              </div>
            );
          }
          return <a href={href} {...props}>{children}</a>;
        },
        p({ children, ...props }) {
          const processed = processWikiLinks(children);
          return <p {...props}>{processed}</p>;
        },
        code({ className, children, node, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match ? match[1] : '';
          const rawCode = extractText(children).replace(/\n$/, '');

          // Detect block code: has a parent <pre> element
          // In the AST, block code's parent is a <pre> — check via node
          const isBlock = node?.position &&
            node.position.start.line !== node.position.end.line;

          // Also treat any code with a language class as block code
          const isBlockCode = isBlock || (!!match && rawCode.includes('\n'));

          if (!isBlockCode) {
            // Inline code
            return <code className={className} {...props}>{children}</code>;
          }

          // Mermaid diagram
          if (lang === 'mermaid') {
            return <MermaidBlock chart={rawCode} />;
          }

          // Block code — render with CodeBlock wrapper
          // We return CodeBlock which wraps in its own pre, so we need to
          // signal the parent pre to not double-wrap
          return (
            <CodeBlock language={lang} rawCode={rawCode}>
              <code className={className} {...props}>{children}</code>
            </CodeBlock>
          );
        },
        pre({ children }) {
          // Check if children already contain a CodeBlock (from our code handler above)
          const childArray = React.Children.toArray(children);
          for (const child of childArray) {
            if (React.isValidElement(child) && (child.type as any) === CodeBlock) {
              // Already wrapped in CodeBlock — don't double-wrap in <pre>
              return <>{children}</>;
            }
            // Check if child is a code element whose children contain a CodeBlock
            if (React.isValidElement(child)) {
              const innerChildren = React.Children.toArray(
                (child.props as { children?: React.ReactNode }).children
              );
              for (const inner of innerChildren) {
                if (React.isValidElement(inner) && (inner.type as any) === CodeBlock) {
                  return <>{innerChildren}</>;
                }
              }
            }
          }
          // Fallback — regular pre
          return <pre>{children}</pre>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
