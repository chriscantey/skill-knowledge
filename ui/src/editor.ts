import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import { Markdown } from 'tiptap-markdown';

// ── Toolbar ────────────────────────────────────────────────────────────

function btn(icon: string, title: string, action: () => void, activeCheck?: () => boolean): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'toolbar-btn';
  b.title = title;
  b.innerHTML = icon;
  b.addEventListener('click', (e) => { e.preventDefault(); action(); });
  (b as any)._activeCheck = activeCheck;
  return b;
}

function sep(): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'toolbar-separator';
  return d;
}

function buildToolbar(editor: Editor): HTMLElement {
  const toolbar = document.getElementById('toolbar')!;
  if (!toolbar) return document.createElement('div');

  const buttons: (HTMLButtonElement | HTMLDivElement)[] = [
    btn('<b>B</b>', 'Bold (Ctrl+B)', () => editor.chain().focus().toggleBold().run(), () => editor.isActive('bold')),
    btn('<i>I</i>', 'Italic (Ctrl+I)', () => editor.chain().focus().toggleItalic().run(), () => editor.isActive('italic')),
    btn('<u>U</u>', 'Underline (Ctrl+U)', () => editor.chain().focus().toggleUnderline().run(), () => editor.isActive('underline')),
    btn('<s>S</s>', 'Strikethrough', () => editor.chain().focus().toggleStrike().run(), () => editor.isActive('strike')),
    sep(),
    btn('H1', 'Heading 1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), () => editor.isActive('heading', { level: 1 })),
    btn('H2', 'Heading 2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), () => editor.isActive('heading', { level: 2 })),
    btn('H3', 'Heading 3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), () => editor.isActive('heading', { level: 3 })),
    sep(),
    btn('&#8226;', 'Bullet List', () => editor.chain().focus().toggleBulletList().run(), () => editor.isActive('bulletList')),
    btn('1.', 'Ordered List', () => editor.chain().focus().toggleOrderedList().run(), () => editor.isActive('orderedList')),
    btn('&#9745;', 'Task List', () => editor.chain().focus().toggleTaskList().run(), () => editor.isActive('taskList')),
    sep(),
    btn('<code>&lt;/&gt;</code>', 'Inline Code', () => editor.chain().focus().toggleCode().run(), () => editor.isActive('code')),
    btn('<code>{}</code>', 'Code Block', () => editor.chain().focus().toggleCodeBlock().run(), () => editor.isActive('codeBlock')),
    btn('&#8220;', 'Blockquote', () => editor.chain().focus().toggleBlockquote().run(), () => editor.isActive('blockquote')),
    sep(),
    btn('&#8212;', 'Horizontal Rule', () => editor.chain().focus().setHorizontalRule().run()),
    btn('&#128279;', 'Link', () => {
      if (editor.isActive('link')) {
        editor.chain().focus().unsetLink().run();
      } else {
        const url = prompt('URL:');
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }
    }, () => editor.isActive('link')),
  ];

  buttons.forEach(b => toolbar.appendChild(b));

  editor.on('transaction', () => {
    buttons.forEach(b => {
      if (b instanceof HTMLButtonElement && (b as any)._activeCheck) {
        b.classList.toggle('is-active', (b as any)._activeCheck());
      }
    });
  });

  return toolbar;
}

// ── Source toggle ───────────────────────────────────────────────────────

function setupSourceToggle(editor: Editor) {
  const sourceToggle = document.getElementById('source-toggle');
  const sourceEl = document.getElementById('source') as HTMLTextAreaElement | null;
  const editorEl = document.getElementById('editor');
  if (!sourceToggle || !sourceEl || !editorEl) return;

  let sourceMode = false;

  function toggle() {
    sourceMode = !sourceMode;
    if (sourceMode) {
      sourceEl!.value = editor.storage.markdown.getMarkdown();
      sourceEl!.classList.remove('hidden');
      editorEl!.classList.add('hidden');
      sourceToggle!.classList.add('is-active');
    } else {
      editor.commands.setContent(sourceEl!.value);
      sourceEl!.classList.add('hidden');
      editorEl!.classList.remove('hidden');
      sourceToggle!.classList.remove('is-active');
    }
  }

  sourceToggle.addEventListener('click', toggle);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'm') {
      e.preventDefault();
      toggle();
    }
  });
}

// ── Copy / Download buttons ────────────────────────────────────────────

function setupHeaderActions(editor: Editor) {
  const copyBtn = document.getElementById('copy-btn');
  const downloadBtn = document.getElementById('download-btn');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const md = editor.storage.markdown.getMarkdown();
      try {
        await navigator.clipboard.writeText(md);
        copyBtn.classList.add('copied');
        const span = copyBtn.querySelector('span');
        if (span) {
          const old = span.textContent;
          span.textContent = 'Copied!';
          setTimeout(() => { span.textContent = old; copyBtn.classList.remove('copied'); }, 2000);
        }
      } catch { /* clipboard not available */ }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const md = editor.storage.markdown.getMarkdown();
      const blob = new Blob([md], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'document.md';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}

// ── Init ───────────────────────────────────────────────────────────────

const editorEl = document.getElementById('editor');
if (!editorEl) throw new Error('No #editor element found');

const editor = new Editor({
  element: editorEl,
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
    Placeholder.configure({ placeholder: 'Start writing...' }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Underline,
    Markdown.configure({ html: true, transformPastedText: true, transformCopiedText: true }),
  ],
  editorProps: { attributes: { class: 'editor-content' } },
  content: '',
});

(window as any).__editor = editor;

buildToolbar(editor);
setupSourceToggle(editor);
setupHeaderActions(editor);
