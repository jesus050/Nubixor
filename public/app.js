(() => {
  const CORE_SRC = './app-core.js?v=20260822-LABEL-CENTER-v3';
  const VIDEO_SRC = './assets/brand/nubixor-login-intro.mp4';
  const POSTER_SRC = './assets/brand/nubixor-official-logo.png';
  const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const MAX_INTRO_MS = 3900;
  const MIN_INTRO_MS = 850;

  const loadCoreApplication = () => {
    const script = document.createElement('script');
    script.src = CORE_SRC;
    script.async = false;
    script.dataset.nubixorCore = 'true';
    script.onerror = () => {
      console.error('No se pudo cargar el núcleo de Nubixor.');
    };
    document.head.append(script);
  };

  const removeIntro = (overlay) => {
    if (!overlay || overlay.dataset.closing === 'true') return;
    overlay.dataset.closing = 'true';
    overlay.classList.add('nubixor-brand-intro--closing');
    window.setTimeout(() => overlay.remove(), 420);
  };

  const createBrandIntro = () => {
    if (REDUCED_MOTION || !document.querySelector('#authGate')) return null;

    const overlay = document.createElement('div');
    overlay.className = 'nubixor-brand-intro';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="nubixor-brand-intro__stage">
        <video
          class="nubixor-brand-intro__video"
          muted
          playsinline
          preload="auto"
          poster="${POSTER_SRC}"
          tabindex="-1"
        >
          <source src="${VIDEO_SRC}" type="video/mp4">
        </video>
        <img class="nubixor-brand-intro__fallback" src="${POSTER_SRC}" alt="">
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .nubixor-brand-intro {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: #f7f8fb;
        opacity: 1;
        transition: opacity 380ms cubic-bezier(.22,1,.36,1), visibility 380ms ease;
      }
      .nubixor-brand-intro--closing {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      .nubixor-brand-intro__stage {
        position: relative;
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 18% 22%, rgba(79,210,233,.08), transparent 28rem),
          radial-gradient(circle at 82% 78%, rgba(181,65,250,.07), transparent 30rem),
          #f7f8fb;
      }
      .nubixor-brand-intro__video {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #f7f8fb;
      }
      .nubixor-brand-intro__fallback {
        position: absolute;
        z-index: 1;
        width: min(330px, 62vw);
        max-height: 40vh;
        object-fit: contain;
        opacity: .96;
      }
      .nubixor-brand-intro[data-video-failed="true"] .nubixor-brand-intro__video {
        display: none;
      }
      @media (max-width: 720px) {
        .nubixor-brand-intro__video {
          width: 118%;
          max-width: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .nubixor-brand-intro { display: none !important; }
      }
    `;
    document.head.append(style);
    document.body.append(overlay);

    const video = overlay.querySelector('video');
    const startedAt = performance.now();
    let closeTimer = null;

    const scheduleClose = (delay = 0) => {
      window.clearTimeout(closeTimer);
      const elapsed = performance.now() - startedAt;
      const waitForMinimum = Math.max(0, MIN_INTRO_MS - elapsed);
      closeTimer = window.setTimeout(() => removeIntro(overlay), Math.max(delay, waitForMinimum));
    };

    const failToPoster = () => {
      overlay.dataset.videoFailed = 'true';
      scheduleClose(1150);
    };

    video.addEventListener('loadedmetadata', () => {
      try {
        video.playbackRate = 1.6;
        const playPromise = video.play();
        playPromise?.catch(failToPoster);
      } catch {
        failToPoster();
      }
    }, { once: true });

    video.addEventListener('ended', () => scheduleClose(90), { once: true });
    video.addEventListener('error', failToPoster, { once: true });

    window.setTimeout(() => removeIntro(overlay), MAX_INTRO_MS);
    return overlay;
  };

  createBrandIntro();
  loadCoreApplication();
})();
