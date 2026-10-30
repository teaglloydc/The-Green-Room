/* Site-wide feedback tab. Lets a visitor point at a specific part of the
   page (or just leave general feedback) and sends it straight to the site
   owner's inbox via mailto, with the page and the picked component noted —
   no backend needed since this is a static site. Included on every page via
   a single <script src="feedback-widget.js" defer></script>. */
(function () {
  'use strict';

  var FEEDBACK_EMAIL = 'teaglloyd@outlook.com';

  var style = document.createElement('style');
  style.textContent = [
    '#fbTab{position:fixed;top:50%;right:0;transform:translateY(-50%);z-index:2147483000;',
    'background:var(--green-700,#416b55);color:#fffbf3;border:none;padding:16px 9px;',
    'border-radius:10px 0 0 10px;box-shadow:-4px 4px 16px rgba(16,36,27,0.24);cursor:pointer;',
    'writing-mode:vertical-rl;text-orientation:mixed;font-family:inherit;font-weight:600;',
    'font-size:0.82rem;letter-spacing:0.04em;transition:background 0.2s,padding 0.2s;}',
    '#fbTab:hover{background:var(--green-800,#2e5542);padding-right:13px;}',
    '#fbTab:focus-visible{outline:2px solid var(--wood,#b5722e);outline-offset:2px;}',
    '#fbTab[hidden]{display:none;}',

    '#fbOverlay{position:fixed;inset:0;background:rgba(16,36,27,0.32);z-index:2147483001;',
    'opacity:0;pointer-events:none;transition:opacity 0.25s ease;}',
    '#fbOverlay.open{opacity:1;pointer-events:auto;}',

    '#fbPanel{position:fixed;top:0;right:0;height:100%;width:min(380px,100vw);',
    'background:var(--surface,#fff);color:var(--text,#1e2b21);box-shadow:-12px 0 40px rgba(16,36,27,0.2);',
    'z-index:2147483002;padding:26px 24px;overflow-y:auto;transform:translateX(100%);',
    'transition:transform 0.3s ease;box-sizing:border-box;font-family:inherit;}',
    '#fbPanel.open{transform:translateX(0);}',
    '#fbPanel h2{margin:0 0 4px;font-size:1.3rem;}',
    '#fbPanelSub{margin:0 0 18px;color:var(--muted,#56675a);font-size:0.9rem;}',
    '#fbClose{position:absolute;top:18px;right:18px;background:none;border:none;',
    'font-size:1.5rem;line-height:1;cursor:pointer;color:var(--muted,#56675a);padding:4px;}',
    '#fbClose:hover{color:var(--text,#1e2b21);}',

    '#fbTargetBox{background:var(--surface-soft,#dceadb);border-radius:10px;padding:12px 14px;',
    'margin-bottom:14px;font-size:0.86rem;line-height:1.5;}',
    '#fbTargetBox strong{display:block;font-size:0.72rem;text-transform:uppercase;',
    'letter-spacing:0.05em;color:var(--muted,#56675a);margin-bottom:3px;font-weight:700;}',

    '#fbPick{display:inline-flex;align-items:center;gap:6px;background:none;',
    'border:1.5px dashed var(--wood,#b5722e);color:var(--wood-dark,#8a5423);border-radius:10px;',
    'padding:9px 14px;font-size:0.85rem;font-weight:600;cursor:pointer;margin-bottom:18px;',
    'font-family:inherit;transition:background 0.15s;}',
    '#fbPick:hover{background:rgba(181,114,46,0.08);}',

    '#fbPanel label{display:block;font-size:0.85rem;font-weight:600;margin-bottom:8px;}',
    '#fbMessage{width:100%;box-sizing:border-box;border:1px solid var(--line,rgba(31,52,39,0.14));',
    'border-radius:10px;padding:10px 12px;font-family:inherit;font-size:0.92rem;resize:vertical;',
    'min-height:110px;background:var(--surface,#fff);color:var(--text,#1e2b21);}',
    '#fbMessage:focus{outline:2px solid var(--green-600,#527a63);outline-offset:1px;}',

    '#fbSend{margin-top:16px;width:100%;background:var(--green-700,#416b55);color:#fffbf3;',
    'border:none;border-radius:10px;padding:12px 16px;font-size:0.95rem;font-weight:700;',
    'cursor:pointer;font-family:inherit;transition:background 0.2s;}',
    '#fbSend:hover{background:var(--green-800,#2e5542);}',
    '#fbStatus{margin-top:10px;font-size:0.82rem;color:var(--muted,#56675a);min-height:1.2em;}',

    'body.fb-picking,body.fb-picking *{cursor:crosshair !important;}',
    '.fb-hover-target{outline:2px dashed var(--wood,#b5722e) !important;outline-offset:2px;',
    'background:rgba(181,114,46,0.08) !important;}',
    '#fbPickBanner{position:fixed;top:18px;left:50%;transform:translateX(-50%);',
    'background:var(--green-900,#1e2b21);color:#fffbf3;padding:10px 18px;border-radius:30px;',
    'font-size:0.85rem;font-weight:600;z-index:2147483003;box-shadow:0 8px 24px rgba(16,36,27,0.3);}',

    '@media (max-width:560px){',
    '#fbPanel{top:auto;bottom:0;right:0;left:0;width:100%;height:auto;max-height:82vh;',
    'border-radius:18px 18px 0 0;transform:translateY(100%);}',
    '#fbPanel.open{transform:translateY(0);}',
    '#fbTab{padding:12px 7px;font-size:0.76rem;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  var tab = document.createElement('button');
  tab.id = 'fbTab';
  tab.type = 'button';
  tab.setAttribute('aria-label', 'Give feedback on this page');
  tab.textContent = 'Feedback';
  document.body.appendChild(tab);

  var overlay = document.createElement('div');
  overlay.id = 'fbOverlay';
  document.body.appendChild(overlay);

  var panel = document.createElement('div');
  panel.id = 'fbPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Send feedback');
  panel.hidden = true;
  panel.innerHTML =
    '<button id="fbClose" type="button" aria-label="Close feedback panel">&times;</button>' +
    '<h2>Send feedback</h2>' +
    '<p id="fbPanelSub">Goes straight to the person who runs this site.</p>' +
    '<div id="fbTargetBox"><strong>Commenting on</strong><span id="fbTargetText"></span></div>' +
    '<button id="fbPick" type="button">Point to a specific part of the page</button>' +
    '<label for="fbMessage">Your feedback</label>' +
    '<textarea id="fbMessage" placeholder="What would you like to tell us?"></textarea>' +
    '<button id="fbSend" type="button">Send feedback</button>' +
    '<p id="fbStatus"></p>';
  document.body.appendChild(panel);

  var targetText = panel.querySelector('#fbTargetText');
  var messageEl = panel.querySelector('#fbMessage');
  var statusEl = panel.querySelector('#fbStatus');
  var closeBtn = panel.querySelector('#fbClose');
  var pickBtn = panel.querySelector('#fbPick');
  var sendBtn = panel.querySelector('#fbSend');

  var currentTarget = '';
  var picking = false;
  var hoverEl = null;
  var pickBanner = null;

  function pageName() {
    return document.title.replace(/\s*[-|]\s*The Green Room.*$/i, '').trim() || document.title;
  }

  function describeElement(el) {
    var container = el.closest('section, header, footer, nav') || el;
    var heading = container.querySelector('h1, h2, h3');
    var sectionName = heading ? heading.textContent.trim() : (container.id || container.className.split(' ')[0] || container.tagName.toLowerCase());

    var specific;
    if (el.tagName === 'IMG') {
      specific = el.alt ? ('image: "' + el.alt + '"') : 'an image';
    } else if (el.tagName === 'VIDEO') {
      specific = 'the video';
    } else if (el.tagName === 'BUTTON' || el.tagName === 'A') {
      var label = el.textContent.trim() || el.getAttribute('aria-label') || '';
      specific = label ? ('"' + label.slice(0, 40) + '" ' + (el.tagName === 'A' ? 'link' : 'button')) : el.tagName.toLowerCase();
    } else {
      var text = (el.textContent || '').trim().replace(/\s+/g, ' ');
      specific = text ? ('"' + text.slice(0, 60) + (text.length > 60 ? '…' : '') + '"') : el.tagName.toLowerCase();
    }

    if (sectionName && specific && sectionName.toLowerCase() !== specific.toLowerCase()) {
      return sectionName + ' — ' + specific;
    }
    return specific || sectionName || 'this page';
  }

  function currentSectionLabel() {
    var el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    if (!el) return 'general page feedback';
    var container = el.closest('section, header, footer') || el;
    var heading = container.querySelector('h1, h2, h3');
    return heading ? heading.textContent.trim() : 'general page feedback';
  }

  function setTarget(label) {
    currentTarget = label;
    targetText.textContent = pageName() + ' — ' + label;
  }

  function openPanel(fromPick) {
    if (!fromPick) setTarget(currentSectionLabel());
    overlay.classList.add('open');
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add('open'); });
    statusEl.textContent = '';
    setTimeout(function () { messageEl.focus(); }, 300);
  }

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    setTimeout(function () { panel.hidden = true; }, 300);
    tab.focus();
  }

  function clearHover() {
    if (hoverEl) { hoverEl.classList.remove('fb-hover-target'); hoverEl = null; }
  }

  function isWidgetEl(el) {
    return !!(el && el.closest('#fbTab, #fbPanel, #fbOverlay, #fbPickBanner'));
  }

  function startPicking() {
    picking = true;
    document.body.classList.add('fb-picking');
    overlay.classList.remove('open');
    panel.classList.remove('open');
    pickBanner = document.createElement('div');
    pickBanner.id = 'fbPickBanner';
    pickBanner.textContent = 'Click the part of the page you want to comment on (Esc to cancel)';
    document.body.appendChild(pickBanner);
    document.addEventListener('mousemove', onPickMove);
    document.addEventListener('click', onPickClick, true);
    document.addEventListener('keydown', onPickKey);
  }

  function stopPicking(cancelled) {
    picking = false;
    document.body.classList.remove('fb-picking');
    clearHover();
    if (pickBanner) { pickBanner.remove(); pickBanner = null; }
    document.removeEventListener('mousemove', onPickMove);
    document.removeEventListener('click', onPickClick, true);
    document.removeEventListener('keydown', onPickKey);
    if (!cancelled) openPanel(true);
    else openPanel(false);
  }

  function onPickMove(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (isWidgetEl(el) || el === hoverEl) return;
    clearHover();
    if (el) { el.classList.add('fb-hover-target'); hoverEl = el; }
  }

  function onPickClick(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (isWidgetEl(el)) return;
    e.preventDefault();
    e.stopPropagation();
    if (el) setTarget(describeElement(el));
    stopPicking(false);
  }

  function onPickKey(e) {
    if (e.key === 'Escape') stopPicking(true);
  }

  function sendFeedback() {
    var message = messageEl.value.trim();
    if (!message) { messageEl.focus(); return; }
    var subject = 'Website feedback – ' + pageName();
    var body = 'Page: ' + pageName() + '\nURL: ' + location.href +
      '\nCommenting on: ' + (currentTarget || 'general page feedback') +
      '\n\nFeedback:\n' + message;
    window.location.href = 'mailto:' + FEEDBACK_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    statusEl.textContent = 'Opening your email app to send this…';
  }

  tab.addEventListener('click', function () {
    if (panel.classList.contains('open')) closePanel(); else openPanel(false);
  });
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  pickBtn.addEventListener('click', startPicking);
  sendBtn.addEventListener('click', sendFeedback);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open') && !picking) closePanel();
  });
})();
