// Lightweight markdown renderer for Daftar v8
const MD = {
  render(src) {
    if (!src) return '';
    let html = src
      // Escape HTML first
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      // Headings
      .replace(/^### (.+)$/gm,'<h3 class="md-h3">$1</h3>')
      .replace(/^## (.+)$/gm,'<h2 class="md-h2">$1</h2>')
      .replace(/^# (.+)$/gm,'<h1 class="md-h1">$1</h1>')
      // Bold + italic
      .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/__(.+?)__/g,'<strong>$1</strong>')
      .replace(/_(.+?)_/g,'<em>$1</em>')
      // Strikethrough
      .replace(/~~(.+?)~~/g,'<del>$1</del>')
      // Inline code
      .replace(/`([^`]+)`/g,'<code class="md-code">$1</code>')
      // Blockquote
      .replace(/^&gt; (.+)$/gm,'<blockquote class="md-bq">$1</blockquote>')
      // Checklist
      .replace(/^- \[x\] (.+)$/gm,'<div class="md-check md-checked">✓ $1</div>')
      .replace(/^- \[ \] (.+)$/gm,'<div class="md-check">☐ $1</div>')
      // Unordered list items
      .replace(/^[-*] (.+)$/gm,'<li class="md-li">$1</li>')
      // Ordered list items
      .replace(/^\d+\. (.+)$/gm,'<li class="md-oli">$1</li>')
      // Horizontal rule
      .replace(/^---$/gm,'<hr class="md-hr"/>')
      // Line breaks → paragraphs
      .split(/\n\n+/).map(block => {
        block = block.trim();
        if (!block) return '';
        if (/^<(h[123]|blockquote|hr|div)/.test(block)) return block;
        if (/<li /.test(block)) {
          if (/<li class="md-oli"/.test(block)) return `<ol class="md-ol">${block}</ol>`;
          return `<ul class="md-ul">${block}</ul>`;
        }
        return `<p class="md-p">${block.replace(/\n/g,'<br/>')}</p>`;
      }).join('');
    return html;
  }
};
