(() => {
  const CORE_SRC = './app-core.js?v=20260822-OPERATIONS-INTRO-v5';
  const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const INTRO_MS = 1450;

  const loadCoreApplication = () => {
    const script = document.createElement('script');
    script.src = CORE_SRC;
    script.async = false;
    script.dataset.nubixorCore = 'true';
    script.onerror = () => console.error('No se pudo cargar el núcleo de Nubixor.');
    document.head.append(script);
  };

  const createOperationsIntro = () => {
    if (REDUCED_MOTION || !document.querySelector('#authGate')) return;
    const overlay = document.createElement('div');
    overlay.className = 'nubixor-operations-intro';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="nubixor-operations-intro__stage">
        <div class="nubixor-operations-intro__signal">
          <i class="nubixor-operations-intro__ring ring-one"></i>
          <i class="nubixor-operations-intro__ring ring-two"></i>
          <div class="nubixor-operations-intro__core"><span>N</span></div>
          <div class="nubixor-operations-intro__bars"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="nubixor-operations-intro__copy">
          <strong>Nubixor</strong><span>Sincronizando operación</span>
        </div>
      </div>`;
    const style = document.createElement('style');
    style.textContent = `
      .nubixor-operations-intro{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;background:#071437;transition:opacity .38s cubic-bezier(.22,1,.36,1),visibility .38s ease}
      .nubixor-operations-intro::before,.nubixor-operations-intro::after{position:absolute;width:54vmax;height:54vmax;border:1px solid rgba(97,218,251,.11);border-radius:50%;content:""}.nubixor-operations-intro::before{top:-29vmax;left:-21vmax}.nubixor-operations-intro::after{right:-28vmax;bottom:-31vmax;border-color:rgba(200,113,255,.14)}
      .nubixor-operations-intro.is-closing{opacity:0;visibility:hidden;pointer-events:none}.nubixor-operations-intro__stage{position:relative;display:grid;justify-items:center;gap:23px}.nubixor-operations-intro__signal{position:relative;display:grid;width:142px;height:142px;place-items:center}.nubixor-operations-intro__ring{position:absolute;border:1px solid rgba(97,218,251,.45);border-radius:50%;animation:nubixor-orbit 2.1s ease-in-out infinite}.nubixor-operations-intro__ring.ring-one{inset:4px}.nubixor-operations-intro__ring.ring-two{inset:21px;border-color:rgba(200,113,255,.52);animation-delay:-.7s}.nubixor-operations-intro__core{position:relative;z-index:2;display:grid;width:64px;height:64px;place-items:center;border-radius:22px;background:linear-gradient(135deg,#28c9ed,#6944f2 54%,#e635bf);box-shadow:0 0 0 9px rgba(104,94,246,.13),0 17px 42px rgba(11,20,79,.55);color:#fff;font:800 31px/1 Outfit,system-ui,sans-serif;animation:nubixor-core 1.8s cubic-bezier(.2,.8,.2,1) infinite}.nubixor-operations-intro__bars{position:absolute;right:-12px;bottom:16px;z-index:3;display:flex;align-items:end;gap:4px;height:32px}.nubixor-operations-intro__bars i{display:block;width:4px;border-radius:99px;background:#65ddf5;animation:nubixor-bars 1.1s ease-in-out infinite}.nubixor-operations-intro__bars i:nth-child(1){height:10px}.nubixor-operations-intro__bars i:nth-child(2){height:25px;animation-delay:-.2s}.nubixor-operations-intro__bars i:nth-child(3){height:17px;animation-delay:-.4s}.nubixor-operations-intro__bars i:nth-child(4){height:30px;animation-delay:-.6s}.nubixor-operations-intro__bars i:nth-child(5){height:14px;animation-delay:-.8s}.nubixor-operations-intro__copy{display:grid;gap:7px;text-align:center}.nubixor-operations-intro__copy strong{color:#fff;font:800 27px/1 Outfit,system-ui,sans-serif;letter-spacing:-.045em}.nubixor-operations-intro__copy span{color:rgba(220,232,255,.68);font:600 11px/1.4 Plus Jakarta Sans,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}@keyframes nubixor-orbit{50%{transform:scale(1.13);opacity:.28}}@keyframes nubixor-core{50%{transform:translateY(-5px) scale(1.04)}}@keyframes nubixor-bars{50%{transform:scaleY(.42);transform-origin:bottom}}@media (prefers-reduced-motion:reduce){.nubixor-operations-intro{display:none!important}}
    `;
    document.head.append(style);
    document.body.append(overlay);
    window.setTimeout(() => {
      overlay.classList.add('is-closing');
      window.setTimeout(() => overlay.remove(), 420);
    }, INTRO_MS);
  };

  createOperationsIntro();
  loadCoreApplication();
})();
