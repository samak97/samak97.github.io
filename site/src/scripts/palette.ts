import { copyText, toggleTheme } from './ui';

type ScrollTo = (target: string) => void;

export function initPalette(scrollTo: ScrollTo) {
  const dialog = document.querySelector<HTMLDialogElement>('.palette');
  if (!dialog) return;
  const input = dialog.querySelector<HTMLInputElement>('.pal-input')!;
  const options = Array.from(dialog.querySelectorAll<HTMLLIElement>('[role="option"]'));
  const empty = dialog.querySelector<HTMLElement>('.pal-empty')!;
  let active = 0;

  const visible = () => options.filter((o) => !o.hidden);

  const setActive = (i: number) => {
    const list = visible();
    if (!list.length) return;
    active = (i + list.length) % list.length;
    options.forEach((o) => o.setAttribute('aria-selected', 'false'));
    list[active].setAttribute('aria-selected', 'true');
    list[active].scrollIntoView({ block: 'nearest' });
  };

  const filter = () => {
    const q = input.value.trim().toLowerCase();
    options.forEach((o) => (o.hidden = !!q && !q.split(/\s+/).every((w) => o.dataset.search!.includes(w))));
    empty.hidden = visible().length > 0;
    setActive(0);
  };

  const open = () => {
    if (dialog.open) return;
    input.value = '';
    filter();
    dialog.showModal();
    input.focus();
  };
  const close = () => dialog.open && dialog.close();

  const run = (o: HTMLLIElement) => {
    const { action, value } = o.dataset;
    close();
    switch (action) {
      case 'goto':
        scrollTo(`#${value}`);
        break;
      case 'copy':
        copyText(value!);
        break;
      case 'theme':
        toggleTheme();
        break;
      case 'download': {
        const a = document.createElement('a');
        a.href = value!;
        a.download = '';
        a.click();
        break;
      }
      case 'open':
        if (value!.startsWith('mailto:')) location.href = value!;
        else window.open(value, '_blank', 'noopener');
        break;
    }
  };

  document.querySelectorAll('[data-palette-open]').forEach((b) => b.addEventListener('click', open));
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog.open ? close() : open();
    } else if (e.key === '/' && !dialog.open && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      open();
    }
  });

  input.addEventListener('input', filter);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = visible()[active];
      if (o) run(o);
    }
  });
  options.forEach((o) => {
    o.addEventListener('click', () => run(o));
    o.addEventListener('pointermove', () => setActive(visible().indexOf(o)));
  });
  // Click on backdrop closes.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
}
