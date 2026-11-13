(() => {
  'use strict';

  const room = document.querySelector('#studyRoom');
  const entry = document.querySelector('#studyEntry');
  const back = document.querySelector('#studyBack');
  const viewport = document.querySelector('#studyViewport');
  const stage = document.querySelector('#studyStage');
  const background = document.querySelector('#studyBackground');
  const shelf = document.querySelector('#studyBooks');
  const loadState = document.querySelector('#studyLoadState');
  const loadText = document.querySelector('#studyLoadText');
  const retry = document.querySelector('#studyRetry');
  const actionName = document.querySelector('#studyActionName');
  const actionHint = document.querySelector('#studyActionHint');
  const openButton = document.querySelector('#studyOpenBook');
  const returnButton = document.querySelector('#studyReturnBook');
  const reader = document.querySelector('#studyReader');
  const readerClose = document.querySelector('#readerClose');
  const readerTitle = document.querySelector('#readerTitle');
  const readerChapter = document.querySelector('#readerChapter');
  const readerOriginal = document.querySelector('#readerOriginal');
  const readerAttribution = document.querySelector('#readerAttribution');
  const readerSource = document.querySelector('#readerSource');
  const readerNoteTitle = document.querySelector('#readerNoteTitle');
  const readerExplanation = document.querySelector('#readerExplanation');
  const readerObservation = document.querySelector('#readerObservation');
  const previous = document.querySelector('#readerPrevious');
  const next = document.querySelector('#readerNext');
  const pageStatus = document.querySelector('#readerPageStatus');
  const status = document.querySelector('#studyStatus');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const books = [
    {
      id: 'yueling', title: '月令七十二候集解', source: 'https://zh.wikisource.org/zh-hans/月令七十二候集解',
      center: .253, bounds: [47, 177, 362, 821],
      pages: [
        { chapter: '立春', original: '立春，正月节。立，建始也。', noteTitle: '一年春意，从此说起', explanation: '书中用“建始”解释“立”，把立春放在春季时序的开端。读节气时，既可以认识名称，也可以继续观察草木和生活的变化。', observation: '书中立春三候为东风解冻、蛰虫始振、鱼陟负冰。这是传统物候记述，理解时需结合地域与时代背景。' },
        { chapter: '春分', original: '分者，半也。此当九十日之半，故谓之分。', noteTitle: '读一个“分”字', explanation: '这段文字从春季进程解释“春分”之名。书中的节气释名与物候记录，为观察一年提供了层次：先辨时，再识物。', observation: '留意长卷中的疏枝、新绿和春日花木，思考哪些细节表达了时令。' }
      ]
    },
    {
      id: 'huainan', title: '淮南子', source: 'https://www.shidianguji.com/book/SBCK089/chapter/1j713d3s4tatv_7',
      center: .389, bounds: [37, 177, 353, 821],
      pages: [
        { chapter: '天文训 · 二十四时', original: '日行一度，十五日为一节，以生二十四时之变。', noteTitle: '以天象组织时序', explanation: '这段古文用太阳运行与时间间隔描述一年内的节段。它呈现了古人把天象、四时和生活联系起来的思路。', observation: '原典中的“度”与推步方式应放在古代历法背景中理解；这句话不能直接当作现代精确节气时刻的计算公式。' },
        { chapter: '天文训 · 日夜', original: '阴阳气均，日夜分平。', noteTitle: '从日夜读四时', explanation: '古文以阴阳消长讲述日夜与四季。阅读时，可以把天文观念与物候记述分别辨认，再理解它们怎样共同进入古人的时间经验。', observation: '记一笔：一本节气古籍里，哪些句子在说天象，哪些句子在说草木与农事？' }
      ]
    },
    {
      id: 'zhoubi', title: '周髀算经', source: 'https://zh.wikisource.org/zh-hans/周髀算經_(四庫全書本)/全覽',
      center: .524, bounds: [28, 177, 344, 821],
      pages: [
        { chapter: '立表测影', original: '周髀长八尺，夏至之日晷尺六寸。', noteTitle: '以一根表，观察日影', explanation: '这段记载把表高、节令和影长联系起来。表与地面承接影子的部分构成测影装置，观察影子能帮助人认识太阳位置的变化。', observation: '这里保留原典数值。它属于特定文献语境，不能视为所有地点都适用的实测结果。' },
        { chapter: '注文摘读', original: '日高影短，日卑影长。', noteTitle: '让观察有可比性', explanation: '古注用高低与长短解释日影。比较不同日期的影长时，需要说明地点、表高和观测时刻，才能理解差别从何而来。', observation: '把书合上后，也可以留意窗格、屋檐和庭院里的影子，认识“光照在物上”的直观现象。' }
      ]
    },
    {
      id: 'qimin', title: '齐民要术', source: 'https://zh.wikisource.org/zh-hans/齊民要術_(四庫全書本)/卷01',
      center: .658, bounds: [18, 176, 336, 821],
      pages: [
        { chapter: '卷一 · 种谷', original: '顺天时，量地利，则用力少而成功多。', noteTitle: '农事与天时相应', explanation: '这句话把时令、土地条件与劳作放在一起。节气进入农业生活，不只有名称，也体现在人们如何观察环境、安排生产。', observation: '画里的田畦、灌溉水道和晒场，都可以成为理解农耕生活的线索。' },
        { chapter: '种谷 · 引前代农书', original: '种无期，因地为时。', noteTitle: '因地理解农时', explanation: '原典引用前代农书的这句话，提示农时与地点有关。阅读古代经验时，应结合地域、作物与具体环境，不把同一种景象套用于所有地方。', observation: '在长卷中比较田地、水岸和山麓：地形与水土不同，会带来怎样不同的劳动场景？' }
      ]
    }
  ];

  const atlas = new Image();
  const bookButtons = [];
  let assetPromise = null;
  let ready = false;
  let attempt = 0;
  let revision = 0;
  let motionTimer = 0;
  let selected = -1;
  let page = 0;
  let phase = 'closed';

  function say(text) { status.textContent = text; }
  function setPhase(value) { phase = value; room.dataset.state = value; }
  function clearMotion() { window.clearTimeout(motionTimer); motionTimer = 0; }
  function settleMotion(callback) {
    clearMotion();
    const token = revision;
    motionTimer = window.setTimeout(() => {
      motionTimer = 0;
      if (room.open && revision === token) callback();
    }, reduceMotion.matches ? 0 : 650);
  }

  function loadImage(image, source) {
    if (image.complete && image.naturalWidth > 0 && image.getAttribute('src') === source) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let timer;
      function cleanup() {
        window.clearTimeout(timer);
        image.removeEventListener('load', loaded);
        image.removeEventListener('error', failed);
      }
      function loaded() { cleanup(); resolve(); }
      function failed() { cleanup(); reject(new Error('画面载入失败')); }
      image.addEventListener('load', loaded);
      image.addEventListener('error', failed);
      timer = window.setTimeout(failed, 25000);
      image.src = source;
      if (image.complete && image.naturalWidth > 0) loaded();
    });
  }

  function prepareAssets() {
    if (ready) return Promise.resolve();
    if (!assetPromise) {
      const suffix = attempt ? `?retry=${attempt}` : '';
      assetPromise = Promise.all([
        loadImage(background, `assets/study/interior-v1.png${suffix}`),
        loadImage(atlas, `assets/study/books-v1.png${suffix}`)
      ]).then(() => { ready = true; }).catch(error => { assetPromise = null; throw error; });
    }
    return assetPromise;
  }

  function createBooks() {
    if (bookButtons.length) return;
    books.forEach((book, index) => {
      const [left, top, right, bottom] = book.bounds;
      // Atlas cells are 384x1024. Align the opaque bottom edge with the
      // illustrated shelf at y=48.1%, not the transparent sprite-cell edge.
      const cellHeight = .18 * 1024 / (bottom - top);
      const cellWidth = cellHeight * (384 / 1024) / 1.75;
      const placement = {
        left: book.center - ((left + right) / 2 / 384) * cellWidth,
        top: .481 - bottom / 1024 * cellHeight,
        width: cellWidth,
        height: cellHeight
      };
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'study-book';
      button.dataset.book = book.id;
      button.setAttribute('aria-label', `从书架取出《${book.title}》`);
      button.style.left = `${placement.left * 100}%`;
      button.style.top = `${placement.top * 100}%`;
      button.style.width = `${placement.width * 100}%`;
      button.style.height = `${placement.height * 100}%`;
      button.style.setProperty('--book-index', String(index));
      button.style.setProperty('--label-x', `${(left + 64) / 384 * 100}%`);
      const art = document.createElement('span');
      art.className = 'book-sprite';
      const image = document.createElement('img');
      image.src = 'assets/study/books-v1.png';
      image.alt = '';
      image.draggable = false;
      art.append(image);
      const title = document.createElement('span');
      title.className = 'book-cover-title';
      title.textContent = book.title;
      title.setAttribute('aria-hidden', 'true');
      const caption = document.createElement('span');
      caption.className = 'book-caption';
      caption.textContent = book.title;
      button.append(art, title, caption);
      button.addEventListener('click', () => {
        if (selected === index && phase === 'taken') openBook();
        else if (phase === 'shelf') takeBook(index);
      });
      bookButtons.push({ button, placement });
      shelf.append(button);
    });
  }

  function fitStudy() {
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--study-height', `${bounds.height}px`);
    if (selected < 0) return;
    const { button, placement } = bookButtons[selected];
    const originX = (placement.left + placement.width / 2) * bounds.width;
    const originY = (placement.top + placement.height / 2) * bounds.height;
    button.style.setProperty('--take-x', `${bounds.width * .60 - originX}px`);
    button.style.setProperty('--take-y', `${bounds.height * .728 - originY}px`);
  }

  function panTo(fraction, animate = true) {
    const target = stage.offsetLeft + stage.clientWidth * fraction - viewport.clientWidth / 2;
    viewport.scrollTo({ left: Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, target)), behavior: animate && !reduceMotion.matches ? 'smooth' : 'auto' });
  }

  function resetShelf() {
    clearMotion();
    selected = -1;
    page = 0;
    reader.hidden = true;
    shelf.inert = false;
    bookButtons.forEach(({ button }, index) => {
      button.classList.remove('is-taken');
      button.disabled = false;
      button.setAttribute('aria-label', `从书架取出《${books[index].title}》`);
    });
    openButton.hidden = true;
    returnButton.hidden = true;
    openButton.disabled = false;
    returnButton.disabled = false;
    actionName.textContent = '书架藏四时';
    actionHint.textContent = '点击书籍取下；窄屏可左右移步。';
  }

  function loadRoom() {
    const token = ++revision;
    setPhase('loading');
    shelf.hidden = true;
    loadState.hidden = false;
    retry.hidden = true;
    loadText.textContent = '书斋正在展开……';
    prepareAssets().then(() => {
      if (!room.open || token !== revision) return;
      createBooks();
      resetShelf();
      shelf.hidden = false;
      loadState.hidden = true;
      setPhase('shelf');
      fitStudy();
      panTo(.45, false);
      say('已进入节气书斋。书架上有四册书，可选择取阅。');
    }).catch(() => {
      if (!room.open || token !== revision) return;
      setPhase('error');
      loadText.textContent = '书斋画面未能载入，请重试。';
      retry.hidden = false;
    });
  }

  function enterStudy() {
    if (room.open) return;
    document.dispatchEvent(new CustomEvent('study:open'));
    document.documentElement.classList.add('is-studying');
    room.showModal();
    back.focus({ preventScroll: true });
    loadRoom();
  }

  function takeBook(index) {
    if (phase !== 'shelf') return;
    selected = index;
    page = 0;
    const book = books[index];
    setPhase('taking');
    fitStudy();
    bookButtons.forEach(({ button }) => { button.disabled = true; });
    bookButtons[index].button.classList.add('is-taken');
    openButton.hidden = false;
    returnButton.hidden = false;
    openButton.disabled = true;
    returnButton.disabled = true;
    actionName.textContent = `《${book.title}》`;
    actionHint.textContent = '正从书架移至案上……';
    panTo(.60);
    settleMotion(() => {
      setPhase('taken');
      openButton.disabled = false;
      returnButton.disabled = false;
      bookButtons[index].button.disabled = false;
      bookButtons[index].button.setAttribute('aria-label', `翻开案上的《${book.title}》`);
      actionHint.textContent = '书已置于案上，可以翻开或放回。';
      openButton.focus({ preventScroll: true });
      say(`已取下《${book.title}》，放在书案上。`);
    });
  }

  function renderPage() {
    const book = books[selected];
    const content = book.pages[page];
    readerTitle.textContent = book.title;
    readerChapter.textContent = content.chapter;
    readerOriginal.textContent = content.original;
    readerAttribution.textContent = `《${book.title}》相关原文节录，简繁与标点统一整理。`;
    readerSource.href = book.source;
    readerNoteTitle.textContent = content.noteTitle;
    readerExplanation.textContent = content.explanation;
    readerObservation.textContent = content.observation;
    previous.disabled = page === 0;
    next.disabled = page === book.pages.length - 1;
    pageStatus.textContent = `摘读 ${page + 1} / ${book.pages.length}`;
    reader.querySelector('.book-spread').scrollTop = 0;
  }

  function openBook() {
    if (phase !== 'taken') return;
    setPhase('reading');
    reader.hidden = false;
    shelf.inert = true;
    bookButtons[selected].button.disabled = true;
    openButton.disabled = true;
    actionHint.textContent = '正在案前翻阅；合上后可归还书架。';
    renderPage();
    readerClose.focus({ preventScroll: true });
    say(`已翻开《${books[selected].title}》。`);
  }

  function closeBook() {
    if (phase !== 'reading') return;
    setPhase('taken');
    reader.hidden = true;
    shelf.inert = false;
    bookButtons[selected].button.disabled = false;
    openButton.disabled = false;
    actionHint.textContent = '书已合上，可以再读或放回书架。';
    openButton.focus({ preventScroll: true });
  }

  function returnBook() {
    if (selected < 0 || phase === 'returning') return;
    const index = selected;
    reader.hidden = true;
    shelf.inert = false;
    setPhase('returning');
    openButton.disabled = true;
    returnButton.disabled = true;
    bookButtons.forEach(({ button }) => { button.disabled = true; });
    bookButtons[index].button.classList.remove('is-taken');
    actionHint.textContent = '正将书归还原位……';
    panTo(books[index].center);
    settleMotion(() => {
      const title = books[index].title;
      resetShelf();
      setPhase('shelf');
      bookButtons[index].button.focus({ preventScroll: true });
      say(`《${title}》已放回书架。`);
    });
  }

  entry.addEventListener('click', enterStudy);
  back.addEventListener('click', () => room.close());
  retry.addEventListener('click', () => { attempt += 1; loadRoom(); });
  openButton.addEventListener('click', openBook);
  returnButton.addEventListener('click', returnBook);
  readerClose.addEventListener('click', closeBook);
  previous.addEventListener('click', () => {
    if (phase === 'reading' && page > 0) { page -= 1; renderPage(); }
  });
  next.addEventListener('click', () => {
    if (phase === 'reading' && page < books[selected].pages.length - 1) { page += 1; renderPage(); }
  });
  function stepBack() {
    if (phase === 'reading') closeBook();
    else if (selected >= 0 && phase !== 'returning') returnBook();
    else if (phase !== 'returning') room.close();
  }
  room.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) stepBack();
  });
  room.addEventListener('cancel', event => {
    event.preventDefault();
    stepBack();
  });
  room.addEventListener('close', () => {
    revision += 1;
    document.documentElement.classList.remove('is-studying');
    resetShelf();
    setPhase('closed');
    entry.focus({ preventScroll: true });
  });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => { if (room.open && ready) fitStudy(); });
    observer.observe(stage);
  } else window.addEventListener('resize', () => { if (room.open && ready) fitStudy(); });
})();
