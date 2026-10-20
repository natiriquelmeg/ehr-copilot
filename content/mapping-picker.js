// Selector manual de controles de texto. Solo obtiene atributos estructurales
// del elemento elegido; nunca su valor ni otro contenido de la ficha.
(() => {
  let activeKey = null;
  let banner = null;

  const selectorCount = (selector) => document.querySelectorAll(selector).length;
  const cssEscape = (value) => CSS.escape(String(value));

  function uniqueSelector(el) {
    const tag = el.tagName.toLowerCase();
    const candidates = [];
    if (el.id) candidates.push(`#${cssEscape(el.id)}`);
    if (el.name) candidates.push(`${tag}[name="${cssEscape(el.name)}"]`);
    if (el.dataset.testid) candidates.push(`${tag}[data-testid="${cssEscape(el.dataset.testid)}"]`);
    if (el.getAttribute('aria-label')) candidates.push(`${tag}[aria-label="${cssEscape(el.getAttribute('aria-label'))}"]`);
    if (el.placeholder) candidates.push(`${tag}[placeholder="${cssEscape(el.placeholder)}"]`);
    const unique = candidates.find((candidate) => selectorCount(candidate) === 1);
    if (unique) return unique;

    const parts = [];
    for (let node = el; node && node !== document.body && parts.length < 4; node = node.parentElement) {
      const siblings = [...node.parentElement?.children ?? []].filter((item) => item.tagName === node.tagName);
      const nth = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : '';
      parts.unshift(`${node.tagName.toLowerCase()}${nth}`);
    }
    return parts.join(' > ');
  }

  function stop() {
    activeKey = null;
    document.removeEventListener('click', select, true);
    document.removeEventListener('keydown', cancel, true);
    banner?.remove();
    banner = null;
    document.documentElement.style.cursor = '';
  }

  function cancel(event) {
    if (event.key !== 'Escape') return;
    stop();
    chrome.runtime.sendMessage({ type: 'EHR_MAPPING_PICK_CANCELLED' });
  }

  function select(event) {
    const field = event.target.closest('textarea, input');
    const invalidInput = field?.tagName === 'INPUT' && ['button', 'checkbox', 'file', 'hidden', 'radio', 'submit'].includes(field.type);
    if (!field || invalidInput) return;
    event.preventDefault();
    event.stopPropagation();
    const key = activeKey;
    const selector = uniqueSelector(field);
    stop();
    chrome.runtime.sendMessage({ type: 'EHR_MAPPING_FIELD_PICKED', key, selector });
  }

  window.EHR_MAPPING_PICKER = {
    start(key, label, instruction) {
      stop();
      activeKey = key;
      banner = document.createElement('div');
      banner.textContent = instruction || `Select field: ${label}. Press Esc to cancel.`;
      Object.assign(banner.style, {
        position: 'fixed', zIndex: '2147483647', top: '16px', left: '50%', transform: 'translateX(-50%)',
        padding: '10px 14px', borderRadius: '8px', background: '#0f766e', color: '#fff', font: '600 14px system-ui',
        boxShadow: '0 4px 18px rgba(0,0,0,.25)', pointerEvents: 'none',
      });
      document.documentElement.append(banner);
      document.documentElement.style.cursor = 'crosshair';
      document.addEventListener('click', select, true);
      document.addEventListener('keydown', cancel, true);
      return { ok: true };
    },
    stop,
  };
})();
