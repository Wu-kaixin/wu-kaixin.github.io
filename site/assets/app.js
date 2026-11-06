'use strict';
(() => {
  const zh = document.body.dataset.language === 'zh';
  const txt = (cn, en) => zh ? cn : en;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.main-nav');
  const closeMenu = () => { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });

  if (menu && nav) document.querySelector('.site-header').classList.add('nav-ready');

})();

// Pre-rendered conceptual illustrations remain visible when JavaScript is unavailable.
(() => {
  const root = document.querySelector('[data-concept-root]');
  if (!root) return;
  const zh = root.dataset.language === 'zh';
  let mode = 'transport', sensing = false;
  const update = () => {
    const image = root.querySelector('[data-concept-image]');
    image.src = root.dataset.prefix+'assets/concept-'+mode+'-'+root.dataset.language+(sensing?'-sensing':'')+'.svg';
    image.alt = zh ? (mode==='transport'?'未知物体周围的机器人配置概念图':'静态人群周围的引导智能体概念图') : (mode==='transport'?'Conceptual robots around an unknown object':'Conceptual guide agents around a static crowd');
    root.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    root.querySelector('[data-sensing]').setAttribute('aria-pressed',String(sensing));
    root.querySelector('[data-concept-index]').textContent = mode==='transport'?'FIG. 01':'FIG. 02';
    root.querySelector('[data-concept-caption]').textContent = sensing
      ? (zh?'高亮单个智能体的局部观测范围；位置与视野均为示意。':'Highlighting one agent’s local sensing region; positions and visibility are illustrative.')
      : (zh?'从有限的局部信息，理解协作如何发生。':'Exploring how cooperation can emerge from limited local information.');
  };
  root.querySelectorAll('[data-mode]').forEach(b => { b.disabled=false; b.addEventListener('click',()=>{mode=b.dataset.mode;update();}); });
  const sense = root.querySelector('[data-sensing]');
  sense.disabled=false; sense.addEventListener('click',()=>{sensing=!sensing;update();});
})();
