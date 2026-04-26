(function () {
  'use strict';

  const CASCADE = [
    { label: 'Load calc',    timing: '0.4s' },
    { label: 'Zoning',       timing: '0.7s' },
    { label: 'Air handlers', timing: '0.9s' },
    { label: 'Chillers',     timing: '1.2s' },
    { label: 'Ductwork',     timing: '1.5s' },
    { label: 'Diffusers',    timing: '1.8s' },
    { label: 'Controls',     timing: '2.1s' },
    { label: 'Refrigerant',  timing: '2.4s' },
    { label: 'Filtration',   timing: '2.7s' },
    { label: 'Commissioning',timing: '3.0s' }
  ];

  const INITIAL_QUOTE = {
    headline: 'Quote ready',
    sub: 'Standing quote · ready to send to customer',
    lines: [
      ['Configuration',     '12-zone VRF · 4 air handlers · 2 chillers'],
      ['Cooling capacity',  '400 kW'],
      ['Lead time',         '9 weeks to site'],
      ['Price',             '£420k']
    ]
  };

  const CHANGES = [
    {
      notification: {
        headline: 'We\u2019ve added a 3rd floor to the build. Does the design still work?',
        detail: 'Developer expanded the scheme mid-design.'
      },
      delta: { label: 'Zones', old: '12', new: '16' },
      options: [
        {
          label: 'OPTION A', headline: 'Extend existing VRF system',
          meta: [['Price', '£520k'], ['Lead time', '10 weeks'], ['Fit', 'Same system']]
        },
        {
          label: 'OPTION B', headline: 'Add separate rooftop unit for new floor',
          meta: [['Price', '£485k'], ['Lead time', '8 weeks'], ['Fit', 'Lower efficiency']]
        },
        {
          label: 'OPTION C', headline: 'Upgrade to centralised chiller plant',
          meta: [['Price', '£610k'], ['Lead time', '12 weeks'], ['Fit', 'Better long-term']]
        }
      ],
      selectedIdx: 0,
      selectedQuote: {
        headline: 'Quote re-solved',
        sub: 'Option A selected',
        lines: [
          ['Configuration',     '16-zone VRF · 5 air handlers · 2 chillers'],
          ['Cooling capacity',  '520 kW'],
          ['Lead time',         '10 weeks to site'],
          ['Price',             '£520k']
        ]
      }
    },
    {
      notification: {
        headline: 'Tenants are worried about noise. Can we make the system quieter?',
        detail: 'Acoustic consultant raised concerns on the top floor.'
      },
      delta: { label: 'Max noise', old: '78 dB(A)', new: '68 dB(A)' },
      options: [
        {
          label: 'OPTION A', headline: 'Sound attenuators + variable-speed fans',
          meta: [['Price', '£580k'], ['Lead time', '10 weeks'], ['Fit', 'Minimal disruption']]
        },
        {
          label: 'OPTION B', headline: 'Relocate plant to rooftop enclosure',
          meta: [['Price', '£640k'], ['Lead time', '11 weeks'], ['Fit', 'Best acoustic']]
        }
      ],
      selectedIdx: 0,
      selectedQuote: {
        headline: 'Quote re-solved',
        sub: 'Option A selected',
        lines: [
          ['Configuration',     '16-zone VRF · variable-speed fans · attenuators'],
          ['Cooling capacity',  '520 kW'],
          ['Lead time',         '10 weeks to site'],
          ['Price',             '£580k']
        ]
      }
    },
    {
      notification: {
        headline: 'Floor 2 is now a data centre instead of offices. How does that change the design?',
        detail: 'Tenant mix changed. Precision cooling needed.'
      },
      delta: { label: 'Floor 2 use', old: 'Offices', new: 'Data centre' },
      options: [
        {
          label: 'OPTION A', headline: 'Dedicated precision cooling + redundancy',
          meta: [['Price', '£720k'], ['Lead time', '13 weeks'], ['Fit', 'Industry standard']]
        },
        {
          label: 'OPTION B', headline: 'Oversized existing system + backup',
          meta: [['Price', '£660k'], ['Lead time', '11 weeks'], ['Fit', 'Cheaper, less resilient']]
        },
        {
          label: 'OPTION C', headline: 'Liquid cooling for servers + standard HVAC rest',
          meta: [['Price', '£810k'], ['Lead time', '14 weeks'], ['Fit', 'Best efficiency']]
        }
      ],
      selectedIdx: 0,
      selectedQuote: {
        headline: 'Quote re-solved',
        sub: 'Option A selected',
        lines: [
          ['Configuration',     'Precision cooling · N+1 redundancy · standard HVAC'],
          ['Cooling capacity',  '680 kW (incl. 180 kW precision)'],
          ['Lead time',         '13 weeks to site'],
          ['Price',             '£720k']
        ]
      }
    }
  ];

  const CHILLER_DETAIL = {
    title: 'Chillers',
    rows: [
      ['Selected unit',     'Carrier AquaForce 30XWV'],
      ['Capacity',          '450 kW'],
      ['Capacity margin',   '12% headroom above peak load'],
      ['Efficiency (COP)',  '5.8 at full load'],
      ['Noise level',       '72 dB(A) at 1m'],
      ['Supplier',          'Carrier · 6-week lead']
    ],
    reason: 'Best efficiency-to-footprint ratio for the zoning layout.'
  };
  const CHILLER_BOX_INDEX = 3;

  const BOX_STEP_MS = 800;
  const QUOTE_REVEAL_DELAY = 600;
  const INITIAL_QUOTE_DWELL = 4500;
  const CHANGE_REQUEST_DWELL = 3200;
  const DELTA_SETTLE_MS = 1200;
  const RETHINK_PAUSE_MS = 800;
  const BOX_STEP_FAST_MS = 400;
  const OPTIONS_DWELL_BEFORE_CURSOR = 5000;
  const CURSOR_MOVE_TIME = 1400;
  const CURSOR_CLICK_TIME = 400;
  const AFTER_SELECTION_DWELL = 2800;
  const DETAIL_CURSOR_MOVE = 1400;
  const DETAIL_POPOUT_DWELL = 4200;
  const DETAIL_POPOUT_CLOSE = 500;
  const FINAL_DWELL_MS = 5500;

  // Opening beat: order arrives
  const PRE_ORDER_PAUSE = 900;        // brief empty state before notification
  const ORDER_NOTIFY_SHOW_MS = 2600;  // order-arrival notification dwell
  const ORDER_FILE_POPULATE_MS = 1100; // time the file has populated before cascade starts

  function buildTimeline() {
    const steps = [];
    let t = 0;

    // Opening beat: empty state + incoming order
    steps.push({ at: t, apply: (s) => {
      s.phase = 'awaitingOrder';
      s.litCount = 0; s.changeIdx = -1;
      s.showOptions = false; s.selectedOptionIdx = -1;
      s.showDetail = false; s.detailCursorOnBox = false;
      s.cursorTarget = null;
      s.inputPopulated = false;
      s.showOrderNotification = false;
    }});
    t += PRE_ORDER_PAUSE;

    steps.push({ at: t, apply: (s) => { s.showOrderNotification = true; } });
    t += 400;

    steps.push({ at: t, apply: (s) => { s.inputPopulated = true; } });
    t += ORDER_NOTIFY_SHOW_MS;

    steps.push({ at: t, apply: (s) => { s.showOrderNotification = false; } });
    t += ORDER_FILE_POPULATE_MS;

    // Initial cascade
    steps.push({ at: t, apply: (s) => { s.phase = 'cascading'; } });

    CASCADE.forEach((_, i) => {
      t += BOX_STEP_MS;
      steps.push({ at: t, apply: (s) => { s.litCount = i + 1; } });
    });
    t += QUOTE_REVEAL_DELAY;
    steps.push({ at: t, apply: (s) => { s.phase = 'quote'; } });
    t += INITIAL_QUOTE_DWELL;

    CHANGES.forEach((_, changeI) => {
      const isLast = changeI === CHANGES.length - 1;

      steps.push({ at: t, apply: (s) => {
        s.phase = 'changeIncoming'; s.changeIdx = changeI;
        s.showOptions = false; s.selectedOptionIdx = -1;
      }});
      t += CHANGE_REQUEST_DWELL;

      steps.push({ at: t, apply: (s) => { s.phase = 'changeLanded'; } });
      t += DELTA_SETTLE_MS;

      steps.push({ at: t, apply: (s) => { s.phase = 'rethinking'; s.litCount = 0; } });
      t += RETHINK_PAUSE_MS;
      steps.push({ at: t, apply: (s) => { s.phase = 'resolving'; } });
      CASCADE.forEach((_, i) => {
        t += BOX_STEP_FAST_MS;
        steps.push({ at: t, apply: (s) => { s.litCount = i + 1; } });
      });
      t += QUOTE_REVEAL_DELAY;

      steps.push({ at: t, apply: (s) => {
        s.phase = 'optionsShown';
        s.showOptions = true;
        s.selectedOptionIdx = -1;
      }});
      t += OPTIONS_DWELL_BEFORE_CURSOR;

      steps.push({ at: t, apply: (s) => {
        s.cursorTarget = 'option-' + CHANGES[changeI].selectedIdx;
      }});
      t += CURSOR_MOVE_TIME;

      steps.push({ at: t, apply: (s) => {
        s.phase = 'optionClicked';
        s.selectedOptionIdx = CHANGES[changeI].selectedIdx;
      }});
      t += CURSOR_CLICK_TIME;

      steps.push({ at: t, apply: (s) => {
        s.phase = 'resolved';
        s.showOptions = false;
        s.cursorTarget = null;
      }});
      t += AFTER_SELECTION_DWELL;

      if (changeI === 0) {
        steps.push({ at: t, apply: (s) => {
          s.cursorTarget = 'cascade-' + CHILLER_BOX_INDEX;
          s.detailCursorOnBox = true;
        }});
        t += DETAIL_CURSOR_MOVE;

        steps.push({ at: t, apply: (s) => {
          s.phase = 'detailCursorClicked';
        }});
        t += CURSOR_CLICK_TIME;

        steps.push({ at: t, apply: (s) => {
          s.showDetail = true;
          s.cursorTarget = null;
        }});
        t += DETAIL_POPOUT_DWELL;

        steps.push({ at: t, apply: (s) => {
          s.showDetail = false;
          s.detailCursorOnBox = false;
          s.phase = 'resolved';
        }});
        t += DETAIL_POPOUT_CLOSE;
      }

      t += isLast ? FINAL_DWELL_MS : 2800;
    });

    return { steps, total: t };
  }

  const TIMELINE = buildTimeline();

  const state = {
    phase: 'idle',
    litCount: 0,
    changeIdx: -1,
    showOptions: false,
    selectedOptionIdx: -1,
    showDetail: false,
    detailCursorOnBox: false,
    cursorTarget: null,
    inputPopulated: false,
    showOrderNotification: false
  };

  let progress = 0;
  let nextStepIdx = 0;
  let lastTick = null;
  let rafId = null;
  let isPlaying = true;

  const el = (id) => document.getElementById(id);
  const elCascadeList   = el('cascade-list');
  const elCascadeStatus = el('cascade-status');
  const elInputPanel    = el('input-panel');
  const elInputEmpty    = el('input-empty-state');
  const elInputPopulated = el('input-populated');
  const elDeltaSlot     = el('delta-slot');
  const elHero          = el('hero');
  const elHeroEmpty     = el('hero-empty');
  const elHeroContent   = el('hero-content');
  const elHeroTitle     = el('hero-title');
  const elHeroSub       = el('hero-sub');
  const elHeroBadge     = el('hero-badge');
  const elHeroBody      = el('hero-body');
  const elNotifySlot    = el('notify-slot');
  const elDetailSlot    = el('detail-slot');
  const elCursor        = el('cursor');
  const elInner         = el('inner');
  const elBtnPlay       = el('btn-play');
  const elBtnRestart    = el('btn-restart');
  const elDots = [el('dot-0'), el('dot-1'), el('dot-2')];

  CASCADE.forEach((box, i) => {
    const d = document.createElement('div');
    d.className = 'cascade-box';
    d.id = 'cascade-' + i;
    d.innerHTML = `<span class="cascade-label">${box.label}</span><span class="cascade-timing">—</span>`;
    elCascadeList.appendChild(d);
  });

  let lastRender = {
    litCount: -1, phase: null, changeIdx: -2,
    deltaKey: null, heroKey: null, notifyKey: null,
    optionsKey: null, selectedIdx: -2,
    showDetail: null, cursorTarget: '__init__',
    highlightBoxKey: null,
    inputPopulated: null, showOrderNotification: null
  };

  function phaseStatusLabel(phase) {
    switch (phase) {
      case 'awaitingOrder':        return 'AWAITING ORDER';
      case 'cascading':            return 'RUNNING';
      case 'quote':                return 'COMPLETE';
      case 'changeIncoming':       return 'COMPLETE';
      case 'changeLanded':         return 'CHANGE RECEIVED';
      case 'rethinking':           return 'RETHINKING';
      case 'resolving':            return 'RE-SOLVING';
      case 'optionsShown':         return 'OPTIONS READY';
      case 'optionClicked':        return 'SELECTED';
      case 'resolved':             return 'COMPLETE';
      case 'detailCursorClicked':  return 'EXPLORING';
      default:                     return 'IDLE';
    }
  }

  function render() {
    const {
      phase, litCount, changeIdx,
      showOptions, selectedOptionIdx,
      showDetail, detailCursorOnBox, cursorTarget,
      inputPopulated, showOrderNotification
    } = state;
    const isResolving = phase === 'resolving' || phase === 'rethinking';
    const showAnyHero = phase !== 'cascading' && phase !== 'idle' && phase !== 'awaitingOrder';

    // Input card empty vs populated
    if (inputPopulated !== lastRender.inputPopulated) {
      if (inputPopulated) {
        elInputEmpty.style.display = 'none';
        elInputPopulated.style.display = 'flex';
      } else {
        elInputEmpty.style.display = '';
        elInputPopulated.style.display = 'none';
      }
      lastRender.inputPopulated = inputPopulated;
    }

    if (lastRender.litCount !== litCount || lastRender.phase !== phase) {
      const boxes = elCascadeList.children;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        const lit = i < litCount;
        b.classList.toggle('lit', lit);
        b.classList.toggle('resolving', isResolving);
        b.querySelector('.cascade-timing').textContent = lit ? CASCADE[i].timing : '—';
      }
      elCascadeStatus.textContent = phaseStatusLabel(phase);
      const activeStatus = (phase === 'rethinking' || phase === 'resolving' || phase === 'changeLanded' || phase === 'detailCursorClicked');
      elCascadeStatus.classList.toggle('active', activeStatus);
      elCascadeStatus.classList.toggle('pulsing', phase === 'rethinking');
    }

    const highlightKey = detailCursorOnBox ? 'on' : 'off';
    if (highlightKey !== lastRender.highlightBoxKey) {
      CASCADE.forEach((_, i) => {
        const b = el('cascade-' + i);
        if (b) b.classList.toggle('highlight-target', detailCursorOnBox && i === CHILLER_BOX_INDEX);
      });
      lastRender.highlightBoxKey = highlightKey;
    }

    const showDelta = phase === 'changeLanded' || phase === 'rethinking' || phase === 'resolving' ||
                      phase === 'optionsShown' || phase === 'optionClicked' || phase === 'resolved' ||
                      phase === 'detailCursorClicked';
    if (lastRender.phase !== phase || lastRender.changeIdx !== changeIdx) {
      elInputPanel.classList.toggle('accented', showDelta);
    }

    const deltaKey = showDelta && changeIdx >= 0 ? `${changeIdx}` : 'none';
    if (deltaKey !== lastRender.deltaKey) {
      elDeltaSlot.innerHTML = '';
      if (showDelta && changeIdx >= 0) {
        const c = CHANGES[changeIdx];
        const d = document.createElement('div');
        d.className = 'delta';
        d.innerHTML = `
          <div class="delta-label">CUSTOMER CHANGE APPLIED</div>
          <div class="delta-row">
            <span class="delta-from">${c.delta.label}</span>
            <span class="delta-old">${c.delta.old}</span>
            <span class="delta-arrow">→</span>
            <span class="delta-new">${c.delta.new}</span>
          </div>
        `;
        elDeltaSlot.appendChild(d);
      }
      lastRender.deltaKey = deltaKey;
    }

    elHero.classList.toggle('active', showAnyHero);

    if (!showAnyHero) {
      elHeroEmpty.style.display = '';
      elHeroContent.style.display = 'none';
      elHeroEmpty.textContent = phase === 'awaitingOrder'
        ? 'NO ACTIVE QUOTE · AWAITING ORDER'
        : 'QUOTE WILL APPEAR WHEN CASCADE COMPLETES';
      lastRender.heroKey = 'empty-' + phase;
      lastRender.optionsKey = null;
    } else {
      elHeroEmpty.style.display = 'none';
      elHeroContent.style.display = '';

      if (showOptions) {
        const opts = CHANGES[changeIdx].options;
        const optionsKey = `options-${changeIdx}-${selectedOptionIdx}`;
        if (optionsKey !== lastRender.optionsKey) {
          elHeroTitle.textContent = 'Flow presents options';
          elHeroSub.textContent = 'Engineer reviews and chooses';
          elHeroBadge.textContent = `QUESTION ${changeIdx + 1} OF 3`;

          elHeroBody.innerHTML = '';
          const wrap = document.createElement('div');
          wrap.className = 'options-wrap options-grid-' + opts.length;
          opts.forEach((opt, i) => {
            const card = document.createElement('div');
            card.className = 'option-card' + (i === selectedOptionIdx ? ' selected' : '');
            card.id = 'option-' + i;
            card.style.animationDelay = `${i * 120}ms`;
            const metaHtml = opt.meta.map(([k, v]) =>
              `<div class="option-meta-row"><span class="option-meta-key">${k}</span><span class="option-meta-val">${v}</span></div>`
            ).join('');
            card.innerHTML = `
              <div class="option-label">${opt.label}</div>
              <div class="option-headline">${opt.headline}</div>
              <div class="option-meta">${metaHtml}</div>
            `;
            wrap.appendChild(card);
          });
          elHeroBody.appendChild(wrap);
          lastRender.optionsKey = optionsKey;
          lastRender.heroKey = 'options-active';
        } else if (selectedOptionIdx !== lastRender.selectedIdx) {
          CHANGES[changeIdx].options.forEach((_, i) => {
            const card = el('option-' + i);
            if (card) card.classList.toggle('selected', i === selectedOptionIdx);
          });
          lastRender.selectedIdx = selectedOptionIdx;
        }
      } else {
        let quoteToShow = INITIAL_QUOTE;
        if (phase === 'resolved' && changeIdx >= 0) {
          quoteToShow = CHANGES[changeIdx].selectedQuote;
        } else if (phase === 'detailCursorClicked' && changeIdx >= 0) {
          quoteToShow = CHANGES[changeIdx].selectedQuote;
        } else if (changeIdx >= 1 && (phase === 'changeIncoming' || phase === 'changeLanded' || phase === 'rethinking' || phase === 'resolving')) {
          quoteToShow = CHANGES[changeIdx - 1].selectedQuote;
        }

        const badgeText =
          phase === 'resolved' ? `REVISION ${changeIdx + 1} OF 3`
          : phase === 'detailCursorClicked' ? `REVISION ${changeIdx + 1} OF 3`
          : (phase === 'quote' && changeIdx === -1) ? 'READY TO SEND'
          : 'STANDING';

        const heroKey = `q-${phase}-${changeIdx}-${quoteToShow.headline}-${badgeText}`;
        if (heroKey !== lastRender.heroKey) {
          elHeroTitle.textContent = quoteToShow.headline;
          elHeroSub.textContent = quoteToShow.sub || '';
          elHeroBadge.textContent = badgeText;
          const isRevised = phase === 'resolved' || phase === 'detailCursorClicked';

          elHeroBody.innerHTML = '';
          const grid = document.createElement('div');
          grid.className = 'quote-grid';
          quoteToShow.lines.forEach(([k, v], i) => {
            const line = document.createElement('div');
            line.className = 'quote-line';
            line.style.animationDelay = `${i * 100}ms`;
            const isPrice = k === 'Price';
            const priceClass = isPrice ? `price${isRevised ? ' revised' : ''}` : '';
            line.innerHTML = `<div class="quote-key">${k}</div><div class="quote-val ${priceClass}">${v}</div>`;
            grid.appendChild(line);
          });
          elHeroBody.appendChild(grid);
          lastRender.heroKey = heroKey;
          lastRender.optionsKey = null;
        }
      }
    }

    // Notification — order arrival or change question
    let notifyKey = 'none';
    if (showOrderNotification) {
      notifyKey = 'order';
    } else if (phase === 'changeIncoming' && changeIdx >= 0) {
      notifyKey = `change-${changeIdx}`;
    }
    if (notifyKey !== lastRender.notifyKey) {
      elNotifySlot.innerHTML = '';
      if (notifyKey === 'order') {
        const n = document.createElement('div');
        n.className = 'notify';
        n.innerHTML = `
          <div class="notify-head">
            <div class="notify-dot"></div>
            <div class="notify-label">NEW ORDER</div>
          </div>
          <div class="notify-from">From commercial developer</div>
          <div class="notify-headline">"New enquiry from commercial developer. Office HVAC design requested."</div>
          <div class="notify-detail">2 floors · 4,800m² · AutoCAD drawing attached.</div>
        `;
        elNotifySlot.appendChild(n);
      } else if (notifyKey.startsWith('change-') && changeIdx >= 0) {
        const c = CHANGES[changeIdx];
        const n = document.createElement('div');
        n.className = 'notify';
        n.innerHTML = `
          <div class="notify-head">
            <div class="notify-dot"></div>
            <div class="notify-label">INCOMING QUESTION · ${changeIdx + 1} OF 3</div>
          </div>
          <div class="notify-from">From customer</div>
          <div class="notify-headline">"${c.notification.headline}"</div>
          <div class="notify-detail">${c.notification.detail}</div>
        `;
        elNotifySlot.appendChild(n);
      }
      lastRender.notifyKey = notifyKey;
      lastRender.showOrderNotification = showOrderNotification;
    }

    if (showDetail !== lastRender.showDetail) {
      elDetailSlot.innerHTML = '';
      if (showDetail) {
        const d = document.createElement('div');
        d.className = 'detail-popout';
        const rowsHtml = CHILLER_DETAIL.rows.map(([k, v]) =>
          `<div class="detail-row"><span class="detail-k">${k}</span><span class="detail-v">${v}</span></div>`
        ).join('');
        d.innerHTML = `
          <div class="detail-label">CHILLER DETAIL · CLICKED BY ENGINEER</div>
          <div class="detail-title">${CHILLER_DETAIL.title}</div>
          ${rowsHtml}
          <div class="detail-row reason">
            <span class="detail-k">Why chosen</span>
            <span class="detail-v">${CHILLER_DETAIL.reason}</span>
          </div>
        `;
        elDetailSlot.appendChild(d);
      }
      lastRender.showDetail = showDetail;
    }

    if (cursorTarget !== lastRender.cursorTarget) {
      if (cursorTarget) {
        moveCursorTo(cursorTarget);
      } else {
        hideCursor();
      }
      lastRender.cursorTarget = cursorTarget;
    }
    if (phase === 'optionClicked' || phase === 'detailCursorClicked') {
      if (!elCursor.classList.contains('clicking')) {
        elCursor.classList.add('clicking');
        setTimeout(() => elCursor.classList.remove('clicking'), 400);
      }
    }

    for (let i = 0; i < 3; i++) {
      const done = changeIdx > i || (changeIdx === i && (phase === 'resolved' || phase === 'detailCursorClicked'));
      const active = changeIdx === i && !done;
      elDots[i].classList.toggle('done', done);
      elDots[i].classList.toggle('active', active);
    }

    lastRender.litCount = litCount;
    lastRender.phase = phase;
    lastRender.changeIdx = changeIdx;
    lastRender.selectedIdx = selectedOptionIdx;
  }

  function moveCursorTo(targetId) {
    const target = el(targetId);
    if (!target) return;
    const targetRect = target.getBoundingClientRect();
    const innerRect = elInner.getBoundingClientRect();
    const top = targetRect.top - innerRect.top + targetRect.height / 2 - 14;
    const left = targetRect.left - innerRect.left + targetRect.width / 2 - 4;
    elCursor.style.top = top + 'px';
    elCursor.style.left = left + 'px';
    elCursor.classList.add('visible');
  }

  function hideCursor() {
    elCursor.classList.remove('visible');
  }

  function tick(now) {
    if (!isPlaying) { lastTick = null; return; }
    if (lastTick == null) lastTick = now;
    const dt = now - lastTick;
    lastTick = now;
    progress += dt;

    while (nextStepIdx < TIMELINE.steps.length && TIMELINE.steps[nextStepIdx].at <= progress) {
      TIMELINE.steps[nextStepIdx].apply(state);
      nextStepIdx++;
    }

    if (progress >= TIMELINE.total) {
      progress = 0;
      nextStepIdx = 0;
    }

    render();
    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    lastTick = null;
    rafId = requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    lastTick = null;
  }
  function restart() {
    progress = 0; nextStepIdx = 0;
    Object.assign(state, {
      phase: 'idle', litCount: 0, changeIdx: -1,
      showOptions: false, selectedOptionIdx: -1,
      showDetail: false, detailCursorOnBox: false, cursorTarget: null,
      inputPopulated: false, showOrderNotification: false
    });
    lastRender = {
      litCount: -1, phase: null, changeIdx: -2,
      deltaKey: null, heroKey: null, notifyKey: null,
      optionsKey: null, selectedIdx: -2,
      showDetail: null, cursorTarget: '__init__', highlightBoxKey: null,
      inputPopulated: null, showOrderNotification: null
    };
    isPlaying = true;
    updatePlayButton();
    render();
    startLoop();
  }

  function updatePlayButton() {
    if (isPlaying) {
      elBtnPlay.setAttribute('aria-label', 'Pause');
      elBtnPlay.setAttribute('title', 'Pause');
      elBtnPlay.innerHTML = `<svg width="12" height="14" viewBox="0 0 12 14" fill="none">
        <rect x="1" y="1" width="3.5" height="12" rx="1" fill="currentColor"/>
        <rect x="7.5" y="1" width="3.5" height="12" rx="1" fill="currentColor"/>
      </svg>`;
    } else {
      elBtnPlay.setAttribute('aria-label', 'Play');
      elBtnPlay.setAttribute('title', 'Play');
      elBtnPlay.innerHTML = `<svg width="12" height="14" viewBox="0 0 12 14" fill="none">
        <path d="M1.5 1.5 L10.5 7 L1.5 12.5 Z" fill="currentColor"/>
      </svg>`;
    }
  }

  elBtnPlay.addEventListener('click', () => {
    isPlaying = !isPlaying;
    updatePlayButton();
    if (isPlaying) startLoop(); else stopLoop();
  });
  elBtnRestart.addEventListener('click', restart);

  window.addEventListener('resize', () => {
    if (state.cursorTarget) moveCursorTo(state.cursorTarget);
  });

  render();
  startLoop();
})();