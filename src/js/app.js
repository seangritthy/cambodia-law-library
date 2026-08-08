// === PDF.js setup ===
pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.min.js';

// === State ===
let allBooks = [];
let filteredBooks = [];
let favoriteBookIds = new Set();
let activeCategory = 'all';
let searchQuery = '';

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let isReading = false;
let currentBook = null;

let zoomLevel = 1.0; // 100%
let viewMode = 'scroll'; // 'scroll' | 'flip'
let pageFlipInstance = null;
let readerThemeFilter = 'normal'; // 'normal' | 'sepia' | 'dark'

let libraryLayoutMode = 'grid'; // 'grid' | 'list'
let sortMode = 'recent'; // 'recent' | 'name' | 'fav'
let ttsSpeed = 0.85;
let bookBookmarks = []; // Array of { bookId, bookTitle, pageNum, note, timestamp }
let searchMatches = []; // Array of { pageNum, snippet, matchIndex }
let currentMatchIndex = -1;
let docSearchQuery = '';

// === DOM Cache ===
const screenLibrary = document.getElementById('screen-library');
const screenReader = document.getElementById('screen-reader');
const libraryGrid = document.getElementById('library-grid');
const libraryEmpty = document.getElementById('library-empty');
const searchInput = document.getElementById('search-input');
const btnSearchClear = document.getElementById('btn-search-clear');

const bookTitleBar = document.getElementById('book-title-bar');
const pageIndicator = document.getElementById('page-indicator');
const readerLoading = document.getElementById('reader-loading');
const loadingStatusText = document.getElementById('loading-status-text');

const pdfScrollContainer = document.getElementById('pdf-scroll-container');
const pdfPagesWrapper = document.getElementById('pdf-pages-wrapper');
const pdfFlipContainer = document.getElementById('pdf-flip-container');
const pageflipWrapper = document.getElementById('pageflip-wrapper');

const btnTts = document.getElementById('btn-tts');
const btnReaderFav = document.getElementById('btn-reader-fav');
const btnModeToggle = document.getElementById('btn-mode-toggle');
const btnReaderTheme = document.getElementById('btn-reader-theme');
const readerFilterLabel = document.getElementById('reader-filter-label');
const zoomLevelText = document.getElementById('zoom-level-text');

// === Init & Storage ===
function initStorage() {
    try {
        const savedFavs = JSON.parse(localStorage.getItem('cambodia_law_favs') || '[]');
        favoriteBookIds = new Set(savedFavs);

        const savedLayout = localStorage.getItem('cambodia_law_layout') || 'grid';
        libraryLayoutMode = savedLayout;
        applyLibraryLayout();

        const savedSort = localStorage.getItem('cambodia_law_sort') || 'recent';
        sortMode = savedSort;
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = sortMode;

        loadBookmarksStorage();
        
        const savedTheme = localStorage.getItem('cambodia_law_theme') || 'dark';
        applyTheme(savedTheme);
    } catch(e) {
        console.error('Storage init error:', e);
    }
}

function saveFavorites() {
    try {
        localStorage.setItem('cambodia_law_favs', JSON.stringify(Array.from(favoriteBookIds)));
    } catch(e) {}
}

function getBookLastPage(bookId) {
    return parseInt(localStorage.getItem(`law_book_last_page_${bookId}`) || '1', 10);
}

function saveBookLastPage(bookId, pageNum) {
    if (bookId && pageNum > 0) {
        localStorage.setItem(`law_book_last_page_${bookId}`, pageNum.toString());
        localStorage.setItem('cambodia_law_last_opened_book', JSON.stringify({ bookId, pageNum, timestamp: Date.now() }));
    }
}

// === Sort Mode Handler ===
function onSortChange(mode) {
    sortMode = mode;
    localStorage.setItem('cambodia_law_sort', sortMode);
    renderLibrary();
}

// === Layout Toggle ===
function toggleLibraryLayout() {
    libraryLayoutMode = (libraryLayoutMode === 'grid') ? 'list' : 'grid';
    localStorage.setItem('cambodia_law_layout', libraryLayoutMode);
    applyLibraryLayout();
}

function applyLibraryLayout() {
    const layoutIcon = document.getElementById('layout-icon');
    if (!libraryGrid) return;
    if (libraryLayoutMode === 'list') {
        libraryGrid.classList.remove('view-grid');
        libraryGrid.classList.add('view-list');
        if (layoutIcon) layoutIcon.textContent = '☰';
    } else {
        libraryGrid.classList.remove('view-list');
        libraryGrid.classList.add('view-grid');
        if (layoutIcon) layoutIcon.textContent = '⊞';
    }
}

// === Continue Reading Hero Banner ===
function updateContinueReadingBanner() {
    const container = document.getElementById('continue-reading-container');
    if (!container) return;

    try {
        const lastData = JSON.parse(localStorage.getItem('cambodia_law_last_opened_book') || 'null');
        if (!lastData || !lastData.bookId) {
            container.classList.add('hidden');
            return;
        }

        const book = allBooks.find(b => b.id === lastData.bookId);
        if (!book) {
            container.classList.add('hidden');
            return;
        }

        const pageNum = lastData.pageNum || getBookLastPage(book.id) || 1;
        document.getElementById('continue-book-title').textContent = book.title;
        document.getElementById('continue-book-meta').textContent = `ទំព័រទី ${pageNum}`;
        container.classList.remove('hidden');

    } catch(e) {
        container.classList.add('hidden');
    }
}

function resumeLastReadBook() {
    try {
        const lastData = JSON.parse(localStorage.getItem('cambodia_law_last_opened_book') || 'null');
        if (lastData && lastData.bookId) {
            const book = allBooks.find(b => b.id === lastData.bookId);
            if (book) openBook(book);
        }
    } catch(e) {}
}

// === Load Library ===
async function loadLibrary() {
    initStorage();
    try {
        const res = await fetch('library.json');
        allBooks = await res.json();
        
        // Auto-assign category & color fallback if not present
        allBooks.forEach(b => {
            if (!b.category) {
                if (b.title.includes('ក្រម')) b.category = 'code';
                else if (b.title.includes('ព្រះរាជក្រឹត្យ')) b.category = 'royal';
                else if (b.title.includes('អនុក្រឹត្យ')) b.category = 'sub';
                else b.category = 'law';
            }
            if (!b.color) {
                if (b.category === 'code') b.color = 'gold';
                else if (b.category === 'royal') b.color = 'yellow';
                else if (b.category === 'sub') b.color = 'green';
                else b.color = 'blue';
            }
        });

        renderLibrary();
    } catch (e) {
        libraryGrid.innerHTML = '<p style="color:#ef4444;padding:20px;text-align:center;">មិនអាចផ្ទុកបណ្ណាល័យបានទេ</p>';
        console.error('Library load error:', e);
    }
}

// === Render Library Grid ===
function renderLibrary() {
    applyLibraryLayout();
    updateContinueReadingBanner();

    // Filter books
    filteredBooks = allBooks.filter(book => {
        // Category check
        let matchCat = false;
        if (activeCategory === 'all') matchCat = true;
        else if (activeCategory === 'fav') matchCat = favoriteBookIds.has(book.id);
        else if (activeCategory === 'bookmark') matchCat = getBookmarkedPageIds().has(book.id);
        else matchCat = (book.category === activeCategory);

        // Search check
        let matchSearch = true;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            matchSearch = book.title.toLowerCase().includes(q) || (book.filename && book.filename.toLowerCase().includes(q));
        }

        return matchCat && matchSearch;
    });

    // Sort books
    filteredBooks.sort((a, b) => {
        if (sortMode === 'name') {
            return a.title.localeCompare(b.title, 'km');
        } else if (sortMode === 'fav') {
            const aFav = favoriteBookIds.has(a.id) ? 1 : 0;
            const bFav = favoriteBookIds.has(b.id) ? 1 : 0;
            return bFav - aFav;
        } else {
            // Recent mode: check last saved page timestamp or book ID
            const aPage = getBookLastPage(a.id);
            const bPage = getBookLastPage(b.id);
            return bPage - aPage;
        }
    });

    // Update Counts & Badges
    document.getElementById('count-all').textContent = allBooks.length;
    document.getElementById('count-fav').textContent = favoriteBookIds.size;
    document.getElementById('library-count-text').textContent = `កំពុងបង្ហាញ ${filteredBooks.length} ក្នុងចំណោម ${allBooks.length} សៀវភៅ`;

    // Clear Grid
    libraryGrid.innerHTML = '';

    if (filteredBooks.length === 0) {
        libraryEmpty.classList.remove('hidden');
        return;
    }
    libraryEmpty.classList.add('hidden');

    const catLabels = { code: 'ក្រម', royal: 'ព្រះរាជក្រឹត្យ', sub: 'អនុក្រឹត្យ', law: 'ច្បាប់' };

    filteredBooks.forEach(book => {
        const isFav = favoriteBookIds.has(book.id);
        const catLabel = catLabels[book.category] || 'ច្បាប់';
        const card = document.createElement('div');
        card.className = book.color ? `book-card book-${book.color}` : 'book-card';
        card.innerHTML = `
            <button class="book-fav-btn" onclick="event.stopPropagation(); toggleBookFavorite(${book.id})" title="ចូលចិត្ត">
                ${isFav ? '❤️' : '🤍'}
            </button>
            <div class="book-spine"></div>
            <div class="book-cover-content">
                <div class="book-emblem">⚖️</div>
                <div class="book-title-gold">${book.title}</div>
                <div class="book-bottom-stripe">ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div class="book-cat-tag">${catLabel}</div>
            </div>
        `;
        card.addEventListener('click', () => openBook(book));
        libraryGrid.appendChild(card);
    });
}

// === Search & Category Handlers ===
function onSearchInput(val) {
    searchQuery = val.trim();
    btnSearchClear.classList.toggle('hidden', searchQuery.length === 0);
    renderLibrary();
}

function clearSearch() {
    searchQuery = '';
    searchInput.value = '';
    btnSearchClear.classList.add('hidden');
    renderLibrary();
}

function setCategoryFilter(cat) {
    activeCategory = cat;
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === cat);
    });
    renderLibrary();
}

// === Favorite Bookmarks ===
function toggleBookFavorite(bookId) {
    if (favoriteBookIds.has(bookId)) {
        favoriteBookIds.delete(bookId);
        showToast('បានលុបចេញពីបញ្ជីចូលចិត្ត');
    } else {
        favoriteBookIds.add(bookId);
        showToast('បានរក្សាទុកក្នុងបញ្ជីចូលចិត្ត ❤️');
    }
    saveFavorites();
    renderLibrary();
    if (currentBook && currentBook.id === bookId) {
        updateReaderFavButton();
    }
}

function toggleCurrentBookFavorite() {
    if (currentBook) {
        toggleBookFavorite(currentBook.id);
    }
}

function updateReaderFavButton() {
    if (currentBook && favoriteBookIds.has(currentBook.id)) {
        btnReaderFav.textContent = '❤️';
    } else {
        btnReaderFav.textContent = '🤍';
    }
}

// === Global Themes ===
function toggleTheme() {
    const currentTheme = document.body.className.includes('theme-light') ? 'light' : 
                         document.body.className.includes('theme-sepia') ? 'sepia' : 'dark';
    let nextTheme = 'dark';
    if (currentTheme === 'dark') nextTheme = 'sepia';
    else if (currentTheme === 'sepia') nextTheme = 'light';
    else nextTheme = 'dark';

    applyTheme(nextTheme);
    localStorage.setItem('cambodia_law_theme', nextTheme);
}

function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-sepia');
    document.body.classList.add(`theme-${theme}`);
    document.documentElement.setAttribute('data-theme', theme);

    const iconMap = { dark: '🌙', sepia: '📜', light: '☀️' };
    const iconSpan = document.getElementById('theme-icon');
    if (iconSpan) iconSpan.textContent = iconMap[theme] || '🌙';
}

// === Open Book ===
async function openBook(book) {
    currentBook = book;
    const lastSavedPage = getBookLastPage(book.id);
    currentPage = lastSavedPage > 0 ? lastSavedPage : 1;
    isReading = false;
    zoomLevel = 1.0;

    screenLibrary.classList.add('hidden');
    screenReader.classList.remove('hidden');

    bookTitleBar.textContent = book.title;
    pageIndicator.textContent = `${currentPage} / --`;
    loadingStatusText.textContent = 'កំពុងផ្ទុកឯកសារ PDF...';
    readerLoading.classList.remove('hidden');
    
    pdfScrollContainer.classList.add('hidden');
    pdfFlipContainer.classList.add('hidden');
    
    if (btnTts) {
        btnTts.textContent = '🔊 អានអត្ថបទ';
        btnTts.classList.remove('reading');
    }
    updateReaderFavButton();
    updateZoomDisplay();

    const localUrl = book.filename ? 'pdfs/' + book.filename : null;
    const remoteUrl = book.url ? book.url : null;
    const primaryUrl = localUrl || remoteUrl;
    const fallbackUrl = remoteUrl || localUrl;

    try {
        if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null; }
        if (pageFlipInstance) {
            try { pageFlipInstance.destroy(); } catch(e) {}
            pageFlipInstance = null;
        }

        pdfDoc = await getPdfDocumentWithFallbacks(primaryUrl, fallbackUrl);

        totalPages = pdfDoc.numPages;
        if (currentPage > totalPages) currentPage = 1;

        pageIndicator.textContent = `${currentPage} / ${totalPages}`;
        readerLoading.classList.add('hidden');

        updateReadingProgressBar();
        updateBookmarkButton();

        if (lastSavedPage > 1) {
            showToast(`បន្តពីទំព័រទី ${lastSavedPage}`);
        }

        renderCurrentViewMode();

    } catch (err) {
        readerLoading.innerHTML = `
            <div style="text-align:center;padding:24px 16px;">
                <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
                <h3 style="color:#ef4444;margin-bottom:8px;">មិនអាចបើកឯកសារ PDF បានទេ</h3>
                <p style="color:#94a3b8;font-size:13px;margin-bottom:16px;">ឯកសារនេះត្រូវការការតភ្ជាប់អ៊ីនធឺណិត ឬមិនទាន់មានក្នុងប្រព័ន្ធ</p>
                <button class="btn-primary" onclick="openBook(currentBook)" style="padding:8px 20px;border-radius:20px;cursor:pointer;">🔄 ព្យាយាមម្តងទៀត</button>
            </div>
        `;
        console.error('PDF load error:', err);
    }
}

// === Robust PDF Binary & Document Loader ===
async function loadArrayBufferData(url) {
    if (!url) return null;
    try {
        const response = await fetch(url);
        if (response.ok) {
            return await response.arrayBuffer();
        }
    } catch (e) {
        console.warn('Fetch ArrayBuffer failed for:', url, e);
    }

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
                if (xhr.response && xhr.response.byteLength > 0) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(`XHR response empty for ${url}`));
                }
            } else {
                reject(new Error(`XHR failed: ${xhr.status} for ${url}`));
            }
        };
        xhr.onerror = function(err) {
            reject(new Error(`XHR network error for ${url}`));
        };
        xhr.send();
    });
}

async function getPdfDocumentWithFallbacks(primaryUrl, fallbackUrl) {
    const urlsToTry = [primaryUrl];
    if (fallbackUrl && fallbackUrl !== primaryUrl) {
        urlsToTry.push(fallbackUrl);
    }

    const localCMapUrl = 'cmaps/';
    const cdnCMapUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/';

    // 1. Try loading binary ArrayBuffer first (most reliable on Android WebViews & local files)
    for (const url of urlsToTry) {
        if (!url) continue;
        try {
            const buffer = await loadArrayBufferData(url);
            if (buffer) {
                try {
                    return await pdfjsLib.getDocument({
                        data: buffer,
                        cMapUrl: localCMapUrl,
                        cMapPacked: true
                    }).promise;
                } catch (e1) {
                    try {
                        return await pdfjsLib.getDocument({
                            data: buffer,
                            cMapUrl: cdnCMapUrl,
                            cMapPacked: true
                        }).promise;
                    } catch (e2) {
                        return await pdfjsLib.getDocument({ data: buffer }).promise;
                    }
                }
            }
        } catch (bufErr) {
            console.warn('Buffer load failed for:', url, bufErr);
        }
    }

    // 2. Fallback to direct URL loading
    for (const url of urlsToTry) {
        if (!url) continue;
        try {
            return await pdfjsLib.getDocument({
                url: url,
                cMapUrl: localCMapUrl,
                cMapPacked: true
            }).promise;
        } catch (e1) {
            try {
                return await pdfjsLib.getDocument({
                    url: url,
                    cMapUrl: cdnCMapUrl,
                    cMapPacked: true
                }).promise;
            } catch (e2) {
                try {
                    return await pdfjsLib.getDocument({ url: url }).promise;
                } catch (e3) {
                    console.warn('URL load failed for:', url, e3);
                }
            }
        }
    }

    throw new Error('All PDF load options failed');
}

// === View Mode Controller (Scroll vs PageFlip) ===
function toggleReaderMode() {
    viewMode = (viewMode === 'scroll') ? 'flip' : 'scroll';
    btnModeToggle.textContent = (viewMode === 'scroll') ? '📜' : '📖';
    showToast((viewMode === 'scroll') ? 'របៀបរមូរ' : 'របៀបប្រលេចទំព័រ');
    renderCurrentViewMode();
}

function renderCurrentViewMode() {
    if (viewMode === 'scroll') {
        pdfFlipContainer.classList.add('hidden');
        pdfScrollContainer.classList.remove('hidden');
        initScrollView();
    } else {
        pdfScrollContainer.classList.add('hidden');
        pdfFlipContainer.classList.remove('hidden');
        initPageFlipView();
    }
}

// === SMART VIRTUALIZED SCROLL VIEW ===
let renderingPages = new Set();

async function initScrollView() {
    pdfPagesWrapper.innerHTML = '';
    pdfScrollContainer.removeEventListener('scroll', onScroll);
    renderingPages.clear();

    // Create lightweight placeholder elements for all pages
    for (let i = 1; i <= totalPages; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper';
        wrapper.id = `page-wrapper-${i}`;
        wrapper.style.minHeight = '700px';
        pdfPagesWrapper.appendChild(wrapper);
    }

    // Initial render of visible pages near target page
    await updateVisiblePages();

    // Scroll to target page
    scrollToPage(currentPage);

    pdfScrollContainer.addEventListener('scroll', onScroll);
}

async function updateVisiblePages() {
    if (!pdfDoc || viewMode !== 'scroll') return;

    const startP = Math.max(1, currentPage - 2);
    const endP = Math.min(totalPages, currentPage + 2);

    // Render active pages
    for (let i = startP; i <= endP; i++) {
        renderScrollPageCanvas(i);
    }

    // Unrender distant pages to keep memory light
    for (let i = 1; i <= totalPages; i++) {
        if (i < currentPage - 5 || i > currentPage + 5) {
            unrenderScrollPageCanvas(i);
        }
    }
}

async function renderScrollPageCanvas(pageNum) {
    const wrapper = document.getElementById(`page-wrapper-${pageNum}`);
    if (!wrapper || wrapper.querySelector('canvas') || renderingPages.has(pageNum)) return;

    renderingPages.add(pageNum);
    try {
        const page = await pdfDoc.getPage(pageNum);
        const rawWidth = pdfScrollContainer.clientWidth;
        const containerWidth = (rawWidth > 100) ? (rawWidth - 16) : Math.max(300, window.innerWidth - 32);
        const viewport = page.getViewport({ scale: 1 });

        const devicePixelRatio = window.devicePixelRatio || 2;
        const scale = (containerWidth / viewport.width) * devicePixelRatio * zoomLevel;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.width = (scaledViewport.width / devicePixelRatio) + 'px';
        canvas.style.height = (scaledViewport.height / devicePixelRatio) + 'px';
        canvas.id = `canvas-${pageNum}`;

        wrapper.style.minHeight = (scaledViewport.height / devicePixelRatio) + 'px';
        wrapper.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    } catch (err) {
        console.error(`Error rendering page canvas ${pageNum}:`, err);
    } finally {
        renderingPages.delete(pageNum);
    }
}

function unrenderScrollPageCanvas(pageNum) {
    const wrapper = document.getElementById(`page-wrapper-${pageNum}`);
    if (wrapper) {
        const canvas = wrapper.querySelector('canvas');
        if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
            canvas.remove();
        }
    }
}

// === SMART VIRTUALIZED PAGEFLIP VIEW ===
async function initPageFlipView() {
    pageflipWrapper.innerHTML = '';
    renderingPages.clear();
    if (pageFlipInstance) {
        try { pageFlipInstance.destroy(); } catch(e) {}
        pageFlipInstance = null;
    }

    const containerWidth = pdfFlipContainer.clientWidth;
    const containerHeight = pdfFlipContainer.clientHeight;

    const flipDiv = document.createElement('div');
    flipDiv.id = 'pageflip-canvas-container';
    flipDiv.className = 'stf__parent';
    pageflipWrapper.appendChild(flipDiv);

    // Create page elements
    const pageElements = [];
    for (let i = 1; i <= totalPages; i++) {
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'pdf-page-wrapper pageflip-page';
        pageWrapper.style.width = '100%';
        pageWrapper.style.height = '100%';

        const canvas = document.createElement('canvas');
        canvas.id = `flip-canvas-${i}`;
        pageWrapper.appendChild(canvas);
        flipDiv.appendChild(pageWrapper);
        pageElements.push(pageWrapper);
    }

    // Initialize St.PageFlip
    pageFlipInstance = new St.PageFlip(flipDiv, {
        width: Math.min(containerWidth, 600),
        height: Math.min(containerHeight, 800),
        size: 'stretch',
        minWidth: 280,
        maxWidth: 1000,
        minHeight: 400,
        maxHeight: 1200,
        drawShadow: true,
        showCover: false,
        usePortrait: true
    });

    pageFlipInstance.loadFromHTML(pageElements);

    // Render active adjacent pages only
    renderFlipActiveWindow(currentPage);

    pageFlipInstance.on('flip', (e) => {
        currentPage = e.data + 1;
        pageIndicator.textContent = `${currentPage} / ${totalPages}`;
        saveBookLastPage(currentBook ? currentBook.id : null, currentPage);
        renderFlipActiveWindow(currentPage);
        if (isReading) stopReading();
    });

    if (currentPage > 1) {
        setTimeout(() => {
            try { pageFlipInstance.turnToPage(currentPage - 1); } catch(e) {}
        }, 300);
    }
}

function renderFlipActiveWindow(pageP) {
    const startP = Math.max(1, pageP - 1);
    const endP = Math.min(totalPages, pageP + 2);
    for (let i = startP; i <= endP; i++) {
        renderFlipPageCanvas(i);
    }
}

async function renderFlipPageCanvas(pageNum) {
    const canvas = document.getElementById(`flip-canvas-${pageNum}`);
    if (!canvas || canvas.width > 0 || renderingPages.has(pageNum)) return;

    renderingPages.add(pageNum);
    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 * zoomLevel });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    } catch(e) {
        console.error(`Error rendering flip canvas ${pageNum}:`, e);
    } finally {
        renderingPages.delete(pageNum);
    }
}

// === Scroll Tracking ===
function onScroll() {
    if (!pdfDoc || viewMode !== 'scroll') return;
    const wrappers = pdfPagesWrapper.querySelectorAll('.pdf-page-wrapper');
    const containerLeft = pdfScrollContainer.scrollLeft;
    let closestPage = 1;
    let closestDist = Infinity;
    wrappers.forEach((w) => {
        const pId = parseInt(w.id.replace('page-wrapper-', ''), 10);
        const dist = Math.abs(w.offsetLeft - containerLeft);
        if (dist < closestDist) {
            closestDist = dist;
            closestPage = pId;
        }
    });
    if (closestPage !== currentPage) {
        currentPage = closestPage;
        pageIndicator.textContent = `${currentPage} / ${totalPages}`;
        saveBookLastPage(currentBook ? currentBook.id : null, currentPage);
        updateReadingProgressBar();
        updateBookmarkButton();
        updateVisiblePages();
        if (isReading) stopReading();
    }
}

// === Navigation ===
function prevPage() {
    if (!pdfDoc || currentPage <= 1) return;
    currentPage--;
    jumpToPage(currentPage);
}

function nextPage() {
    if (!pdfDoc || currentPage >= totalPages) return;
    currentPage++;
    jumpToPage(currentPage);
}

function jumpToPage(pageNum) {
    currentPage = pageNum;
    pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    saveBookLastPage(currentBook ? currentBook.id : null, currentPage);
    updateReadingProgressBar();
    updateBookmarkButton();

    if (viewMode === 'scroll') {
        updateVisiblePages();
        scrollToPage(currentPage);
    } else if (pageFlipInstance) {
        renderFlipActiveWindow(currentPage);
        try { pageFlipInstance.turnToPage(currentPage - 1); } catch(e) {}
    }
}

function scrollToPage(pageNum) {
    const wrapper = document.getElementById(`page-wrapper-${pageNum}`);
    if (wrapper) {
        wrapper.scrollIntoView({ behavior: 'smooth', inline: 'start' });
    }
}

// === Close Book ===
function closeBook() {
    try { stopReading(); } catch(e) {}
    try { pdfScrollContainer.removeEventListener('scroll', onScroll); } catch(e) {}
    try { if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null; } } catch(e) {}
    if (pageFlipInstance) {
        try { pageFlipInstance.destroy(); } catch(e) {}
        pageFlipInstance = null;
    }
    pdfPagesWrapper.innerHTML = '';
    pageflipWrapper.innerHTML = '';

    screenReader.classList.add('hidden');
    screenLibrary.classList.remove('hidden');
    renderLibrary();
}

// === Zoom Controls ===
function zoomIn() {
    if (zoomLevel < 2.5) {
        zoomLevel += 0.25;
        updateZoomDisplay();
        reRenderPagesForZoom();
    }
}

function zoomOut() {
    if (zoomLevel > 0.75) {
        zoomLevel -= 0.25;
        updateZoomDisplay();
        reRenderPagesForZoom();
    }
}

function resetZoom() {
    zoomLevel = 1.0;
    updateZoomDisplay();
    reRenderPagesForZoom();
}

function updateZoomDisplay() {
    zoomLevelText.textContent = `${Math.round(zoomLevel * 100)}%`;
}

function reRenderPagesForZoom() {
    if (viewMode === 'scroll') {
        pdfPagesWrapper.innerHTML = '';
        initScrollView();
    } else {
        for (let i = 1; i <= totalPages; i++) {
            renderFlipPageCanvas(i);
        }
    }
}

// === Reader Filter Themes ===
function cycleReaderFilter() {
    const filters = ['normal', 'sepia', 'dark'];
    const labels = { normal: 'ធម្មតា', sepia: 'សេពពា', dark: 'ងងឹត' };

    const idx = filters.indexOf(readerThemeFilter);
    readerThemeFilter = filters[(idx + 1) % filters.length];

    document.body.classList.remove('reader-filter-normal', 'reader-filter-sepia', 'reader-filter-dark');
    document.body.classList.add(`reader-filter-${readerThemeFilter}`);
    readerFilterLabel.textContent = labels[readerThemeFilter];
    showToast(`ពណ៌ទំព័រ៖ ${labels[readerThemeFilter]}`);
}

// === Page Jump Modal ===
function openPageJumpModal() {
    if (!pdfDoc) return;
    document.getElementById('jump-max-page').textContent = totalPages;
    const jumpInput = document.getElementById('jump-input');
    const jumpSlider = document.getElementById('jump-slider');

    jumpInput.max = totalPages;
    jumpInput.value = currentPage;
    jumpSlider.max = totalPages;
    jumpSlider.value = currentPage;

    document.getElementById('modal-page-jump').classList.remove('hidden');
}

function closePageJumpModal(e) {
    document.getElementById('modal-page-jump').classList.add('hidden');
}

function syncJumpInput(val) {
    document.getElementById('jump-input').value = val;
}

function executePageJump() {
    const val = parseInt(document.getElementById('jump-input').value, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
        jumpToPage(val);
        closePageJumpModal();
    }
}

// === Fullscreen Reader Mode ===
function toggleFullscreenReader() {
    document.body.classList.toggle('reader-fullscreen');
    const isFs = document.body.classList.contains('reader-fullscreen');

    if (isFs && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else if (!isFs && document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }

    showToast(isFs ? 'របៀបមើលពេញអេក្រង់ ⛶' : 'ចាកចេញពីពេញអេក្រង់');
}

// === Page Grid Thumbnails Modal ===
function openThumbnailsModal() {
    if (!pdfDoc) return;
    const container = document.getElementById('thumbnails-grid-container');
    if (!container) return;
    container.innerHTML = '';

    for (let p = 1; p <= totalPages; p++) {
        const thumb = document.createElement('div');
        thumb.className = (p === currentPage) ? 'thumb-card active' : 'thumb-card';
        thumb.innerHTML = `
            <div class="thumb-icon">📄</div>
            <div class="thumb-page-num">ទំព័រ ${p}</div>
        `;
        const targetP = p;
        thumb.onclick = () => {
            jumpToPage(targetP);
            closeThumbnailsModal();
        };
        container.appendChild(thumb);
    }

    document.getElementById('modal-thumbnails').classList.remove('hidden');
}

function closeThumbnailsModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modal-thumbnails').classList.add('hidden');
}

// === Text to Speech ===
function setTtsSpeed(val) {
    ttsSpeed = parseFloat(val) || 0.85;
    showToast(`ល្បឿនអាន៖ ${ttsSpeed}x`);
    if (isReading) {
        stopReading();
        setTimeout(() => toggleRead(), 200);
    }
}

async function toggleRead() {
    if (isReading) {
        stopReading();
        return;
    }
    if (!pdfDoc) return;

    try {
        isReading = true;
        btnTts.textContent = '⏳ ផ្ទុក...';
        btnTts.classList.add('reading');

        const playerBar = document.getElementById('tts-player-bar');
        const statusText = document.getElementById('tts-status-text');
        if (playerBar) playerBar.classList.remove('hidden');
        if (statusText) statusText.textContent = `កំពុងអានទំព័រទី ${currentPage}...`;

        const page = await pdfDoc.getPage(currentPage);
        const text = await getOrOcrPageText(page, currentPage);

        if (!text || text.length < 3) {
            alert('រកមិនឃើញអត្ថបទនៅទំព័រនេះទេ (ទោះជាស្កេនរូបភាពរួចហើយ)។');
            stopReading();
            return;
        }

        btnTts.textContent = '⏹️ ឈប់អាន';

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);

            const voices = window.speechSynthesis.getVoices();
            const khmerVoice = voices.find(v => v.lang.startsWith('km') || v.lang.startsWith('kh'));

            if (khmerVoice) {
                utterance.voice = khmerVoice;
                utterance.lang = 'km-KH';
                utterance.rate = ttsSpeed;

                utterance.onend = () => stopReading();
                utterance.onerror = (e) => {
                    console.error('Speech error:', e);
                    playGoogleTTS(text);
                };

                window.speechSynthesis.speak(utterance);

                setTimeout(() => {
                    if (isReading && !window.speechSynthesis.speaking) {
                        playGoogleTTS(text);
                    }
                }, 2000);

            } else {
                // If phone doesn't have native Khmer TTS voice pack, use Google Khmer TTS Online Audio
                showToast('ទូរស័ព្ទមិនទាន់មាន Voice Pack ខ្មែរទេ! កំពុងប្រើប្រាស់សំឡេង Google Online 🔊');
                playGoogleTTS(text);
            }

        } else {
            playGoogleTTS(text);
        }

    } catch (err) {
        console.error('TTS error:', err);
        stopReading();
    }
}

function playGoogleTTS(text) {
    const chunks = [];
    const maxLen = 200;
    let remaining = text;
    while (remaining.length > 0) {
        chunks.push(remaining.substring(0, maxLen));
        remaining = remaining.substring(maxLen);
    }

    let i = 0;
    function playChunk() {
        if (!isReading || i >= chunks.length) { stopReading(); return; }
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunks[i])}&tl=km&client=tw-ob`;
        const audio = new Audio(url);
        audio.onended = () => { i++; playChunk(); };
        audio.onerror = () => { i++; playChunk(); };
        audio.play().catch(() => { i++; playChunk(); });
        i++;
    }
    playChunk();
}

function stopReading() {
    isReading = false;
    try { window.speechSynthesis.cancel(); } catch(e) {}
    if (btnTts) {
        btnTts.textContent = '🔊 អានអត្ថបទ';
        btnTts.classList.remove('reading');
    }
    const playerBar = document.getElementById('tts-player-bar');
    if (playerBar) playerBar.classList.add('hidden');
}

// === Toast System ===
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 2500);
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
    loadLibrary();
    setTimeout(() => checkForUpdates(false), 2000);
});

// === IN-APP UPDATER (GITHUB RELEASES) ===
const CURRENT_VERSION = '2.5.0';
const GITHUB_REPO = 'seangritthy/cambodia-law-library';
let latestReleaseData = null;

async function checkForUpdates(manual = false) {
    if (manual) showToast('កំពុងពិនិត្យមើលអាប់ដេត...');
    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!res.ok) {
            if (manual) showToast('មិនអាចភ្ជាប់ទៅកាន់ប្រព័ន្ធអាប់ដេតបានទេ');
            return;
        }
        const release = await res.json();
        latestReleaseData = release;
        const latestTag = release.tag_name ? release.tag_name.replace(/^v/, '') : '';

        if (latestTag && isNewerVersion(latestTag, CURRENT_VERSION)) {
            document.getElementById('update-banner-tag').textContent = 'v' + latestTag;
            document.getElementById('update-banner').classList.remove('hidden');
            openUpdateModal();
            showToast(`មានកំណែថ្មី v${latestTag}! កំពុងទាញយកអាប់ដេត...`);
            downloadAndInstallUpdate();
        } else {
            if (manual) showToast('កម្មវិធីរបស់អ្នកជាជំនាន់ចុងក្រោយបង្អស់ហើយ!');
        }
    } catch(e) {
        console.error('Update check error:', e);
        if (manual) showToast('មិនមានការភ្ជាប់អ៊ីនធឺណិតទេ');
    }
}

function isNewerVersion(latest, current) {
    const l = latest.split('.').map(n => parseInt(n, 10) || 0);
    const c = current.split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(l.length, c.length); i++) {
        const lVal = l[i] || 0;
        const cVal = c[i] || 0;
        if (lVal > cVal) return true;
        if (lVal < cVal) return false;
    }
    return false;
}

function openUpdateModal() {
    if (!latestReleaseData) return;
    const tag = latestReleaseData.tag_name || '';
    document.getElementById('modal-update-tag').textContent = tag;
    
    const bodyText = latestReleaseData.body || 'មានការកែលម្អនិងបំពេញបន្ថែមជំនាន់ថ្មី។';
    document.getElementById('update-changelog-box').innerText = bodyText;

    document.getElementById('modal-update').classList.remove('hidden');
}

function closeUpdateModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modal-update').classList.add('hidden');
}

function downloadAndInstallUpdate() {
    if (!latestReleaseData) return;
    let apkUrl = null;

    if (latestReleaseData.assets && latestReleaseData.assets.length > 0) {
        const apkAsset = latestReleaseData.assets.find(a => a.name.endsWith('.apk'));
        if (apkAsset) apkUrl = apkAsset.browser_download_url;
    }

    if (!apkUrl) {
        apkUrl = latestReleaseData.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`;
    }

    const btn = document.getElementById('btn-download-apk');
    const progressContainer = document.getElementById('update-progress-container');
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ កំពុងទាញយក...';
    }
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
    }

    const AppUpdater = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppUpdater;

    if (AppUpdater) {
        AppUpdater.addListener('downloadProgress', data => {
            const percent = data.progress || 0;
            const pctEl = document.getElementById('update-progress-percent');
            const fillEl = document.getElementById('update-progress-fill');
            const bytesEl = document.getElementById('update-progress-bytes');
            const statusEl = document.getElementById('update-progress-status');

            if (pctEl) pctEl.textContent = percent + '%';
            if (fillEl) fillEl.style.width = percent + '%';
            if (bytesEl && data.downloaded && data.total) {
                const dlMB = (data.downloaded / (1024 * 1024)).toFixed(1);
                const totMB = (data.total / (1024 * 1024)).toFixed(1);
                bytesEl.textContent = `${dlMB} MB / ${totMB} MB`;
            }

            if (percent >= 100 && statusEl) {
                statusEl.textContent = 'ទាញយកបានសម្រេច! កំពុងបើកកម្មវិធីដំឡើង...';
            }
        });

        AppUpdater.downloadAndInstall({ url: apkUrl }).then(() => {
            showToast('កំពុងបើកកម្មវិធីដំឡើង...');
        }).catch(err => {
            console.error('In-app update error:', err);
            showToast('មានបញ្ហាក្នុងការទាញយក APK');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '⬇️ ទាញយកតាមកម្មវិធីរុករក';
                btn.onclick = () => window.open(apkUrl, '_system');
            }
        });

    } else {
        // Fallback for browser
        window.location.href = apkUrl;
    }
}

// === READING PROGRESS BAR ===
function updateReadingProgressBar() {
    const fill = document.getElementById('reading-progress-fill');
    if (fill && totalPages > 0) {
        const pct = Math.min(100, Math.max(0, (currentPage / totalPages) * 100));
        fill.style.width = pct + '%';
    }
}

// === BOOKMARKS MANAGEMENT ===
function loadBookmarksStorage() {
    try {
        bookBookmarks = JSON.parse(localStorage.getItem('cambodia_law_bookmarks') || '[]');
    } catch(e) {
        bookBookmarks = [];
    }
}

function saveBookmarksStorage() {
    try {
        localStorage.setItem('cambodia_law_bookmarks', JSON.stringify(bookBookmarks));
    } catch(e) {}
}

function getBookmarkedPageIds() {
    const set = new Set();
    bookBookmarks.forEach(bm => set.add(bm.bookId));
    return set;
}

function toggleCurrentPageBookmark() {
    if (!currentBook) return;
    const existingIndex = bookBookmarks.findIndex(bm => bm.bookId === currentBook.id && bm.pageNum === currentPage);
    if (existingIndex >= 0) {
        bookBookmarks.splice(existingIndex, 1);
        showToast(`បានលុបចំណាំទំព័រទី ${currentPage}`);
    } else {
        bookBookmarks.push({
            bookId: currentBook.id,
            bookTitle: currentBook.title,
            pageNum: currentPage,
            note: `ទំព័រទី ${currentPage}`,
            timestamp: Date.now()
        });
        showToast(`បានចំណាំទំព័រទី ${currentPage} 🔖`);
    }
    saveBookmarksStorage();
    updateBookmarkButton();
}

function updateBookmarkButton() {
    const btnBookmark = document.getElementById('btn-reader-bookmark');
    const labelCount = document.getElementById('bookmarks-count-label');
    
    if (currentBook) {
        const isBm = bookBookmarks.some(bm => bm.bookId === currentBook.id && bm.pageNum === currentPage);
        if (btnBookmark) btnBookmark.textContent = isBm ? '🏷️' : '🔖';

        const currentBookBms = bookBookmarks.filter(bm => bm.bookId === currentBook.id);
        if (labelCount) labelCount.textContent = `ចំណាំ (${currentBookBms.length})`;
    }
}

function openBookmarksModal() {
    const container = document.getElementById('bookmarks-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (!currentBook) return;
    const currentBookBms = bookBookmarks.filter(bm => bm.bookId === currentBook.id);

    const countBookmarkBadge = document.getElementById('count-bookmark');
    if (countBookmarkBadge) countBookmarkBadge.textContent = getBookmarkedPageIds().size;

    if (currentBookBms.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;">មិនទាន់មានទំព័រដែលបានចំណាំក្នុងសៀវភៅនេះនៅឡើយទេ</p>';
    } else {
        currentBookBms.forEach(bm => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            const noteText = bm.note || `ទំព័រទី ${bm.pageNum}`;
            item.innerHTML = `
                <div class="bookmark-header-row">
                    <div class="bookmark-info">
                        <span class="bookmark-title">${bm.bookTitle}</span>
                        <span class="bookmark-page">📍 ទំព័រទី ${bm.pageNum}</span>
                    </div>
                    <div class="bookmark-actions">
                        <button class="btn-bookmark-jump" onclick="jumpToPage(${bm.pageNum}); closeBookmarksModal();">ទៅកាន់ទំព័រ</button>
                        <button class="btn-bookmark-delete" onclick="deleteBookmark(${bm.bookId}, ${bm.pageNum})">✕</button>
                    </div>
                </div>
                <div class="bookmark-note-row">
                    <input type="text" class="bookmark-note-input" id="note-input-${bm.bookId}-${bm.pageNum}" value="${escapeHtmlAttr(noteText)}" placeholder="បន្ថែមចំណាំ (ឧ. មាត្រា ៥ - កិច្ចសន្យា)...">
                    <button class="btn-save-note" onclick="saveBookmarkNote(${bm.bookId}, ${bm.pageNum})">រក្សាទុក</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    document.getElementById('modal-bookmarks').classList.remove('hidden');
}

function escapeHtmlAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function saveBookmarkNote(bookId, pageNum) {
    const input = document.getElementById(`note-input-${bookId}-${pageNum}`);
    if (!input) return;
    const noteText = input.value.trim();

    const bm = bookBookmarks.find(b => b.bookId === bookId && b.pageNum === pageNum);
    if (bm) {
        bm.note = noteText || `ទំព័រទី ${pageNum}`;
        saveBookmarksStorage();
        showToast('បានរក្សាទុកកំណត់ចំណាំ 📝');
    }
}

function closeBookmarksModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modal-bookmarks').classList.add('hidden');
}

function deleteBookmark(bookId, pageNum) {
    bookBookmarks = bookBookmarks.filter(bm => !(bm.bookId === bookId && bm.pageNum === pageNum));
    saveBookmarksStorage();
    updateBookmarkButton();
    openBookmarksModal();
    showToast('បានលុបចំណាំ');
}

// === TABLE OF CONTENTS (TOC) ===
function openTocModal() {
    document.getElementById('modal-toc').classList.remove('hidden');
    loadTableOfContents();
}

function closeTocModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modal-toc').classList.add('hidden');
}

async function loadTableOfContents() {
    const container = document.getElementById('toc-container');
    if (!container) return;
    if (!pdfDoc) {
        container.innerHTML = '<p class="toc-empty">មិនទាន់បានផ្ទុកឯកសារទេ</p>';
        return;
    }
    container.innerHTML = '<p class="toc-loading">កំពុងទាញយកបញ្ជីមាតិកា...</p>';

    try {
        const outline = await pdfDoc.getOutline();
        if (outline && outline.length > 0) {
            container.innerHTML = '';
            await renderOutlineItems(outline, container, 1);
            return;
        }

        // Auto-generate TOC by scanning pages for key Khmer legal headings
        const autoToc = [];
        const scanPages = Math.min(20, totalPages);
        const headingRegex = /(ជំពូកទី\s*[\u17e0-\u17e9\d]+|ផ្នែកទី\s*[\u17e0-\u17e9\d]+|មាត្រា\s*[\u17e0-\u17e9\d]+|មាតិកា|អារម្ភកថា)/gi;

        for (let p = 1; p <= scanPages; p++) {
            const page = await pdfDoc.getPage(p);
            const content = await page.getTextContent();
            const fullText = content.items.map(item => item.str).join(' ');
            let match;
            while ((match = headingRegex.exec(fullText)) !== null) {
                const title = match[0].trim();
                if (!autoToc.some(t => t.title === title && t.pageNum === p)) {
                    const level = title.includes('ជំពូក') ? 1 : (title.includes('ផ្នែក') ? 2 : 3);
                    autoToc.push({ title, pageNum: p, level });
                }
            }
        }

        if (autoToc.length > 0) {
            container.innerHTML = '';
            autoToc.forEach(item => {
                const el = document.createElement('div');
                el.className = `toc-item toc-item-level-${item.level}`;
                el.innerHTML = `
                    <span class="toc-item-title">${item.title}</span>
                    <span class="toc-item-page">ទំព័រ ${item.pageNum}</span>
                `;
                el.onclick = () => {
                    jumpToPage(item.pageNum);
                    closeTocModal();
                };
                container.appendChild(el);
            });
        } else {
            container.innerHTML = '<p class="toc-empty">ឯកសារនេះមិនមានបញ្ជីមាតិកា (Outline) ស្រាប់ទេ</p>';
        }

    } catch(err) {
        console.error('TOC load error:', err);
        container.innerHTML = '<p class="toc-empty">មិនអាចផ្ទុកមាតិកាបានទេ</p>';
    }
}

async function renderOutlineItems(items, parentElement, level) {
    for (const item of items) {
        let pageNum = 1;
        if (item.dest) {
            try {
                if (typeof item.dest === 'string') {
                    const destRef = await pdfDoc.getDestination(item.dest);
                    if (destRef) {
                        const pageIdx = await pdfDoc.getPageIndex(destRef[0]);
                        pageNum = pageIdx + 1;
                    }
                } else if (Array.isArray(item.dest) && item.dest[0]) {
                    const pageIdx = await pdfDoc.getPageIndex(item.dest[0]);
                    pageNum = pageIdx + 1;
                }
            } catch(e) {}
        }

        const el = document.createElement('div');
        el.className = `toc-item toc-item-level-${Math.min(3, level)}`;
        el.innerHTML = `
            <span class="toc-item-title">${item.title}</span>
            <span class="toc-item-page">ទំព័រ ${pageNum}</span>
        `;
        const targetPage = pageNum;
        el.onclick = () => {
            jumpToPage(targetPage);
            closeTocModal();
        };
        parentElement.appendChild(el);

        if (item.items && item.items.length > 0) {
            await renderOutlineItems(item.items, parentElement, level + 1);
        }
    }
}

// === IN-DOCUMENT SEARCH PANEL & SEARCH ENGINE ===
function toggleDocSearchPanel() {
    const panel = document.getElementById('doc-search-panel');
    const input = document.getElementById('doc-search-input');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (isHidden && input) {
        input.focus();
    }
}

async function executeDocSearch() {
    const input = document.getElementById('doc-search-input');
    const query = input ? input.value.trim() : '';
    if (!query) return;

    docSearchQuery = query;
    searchMatches = [];
    currentMatchIndex = -1;

    const countBadge = document.getElementById('doc-search-count');
    const controls = document.getElementById('doc-search-controls');
    const resultsList = document.getElementById('doc-search-results-list');
    
    if (countBadge) countBadge.textContent = 'កំពុងស្វែងរក...';
    if (controls) controls.classList.remove('hidden');
    if (resultsList) resultsList.innerHTML = '';

    showToast(`កំពុងស្វែងរកពាក្យ "${query}" ក្នុងឯកសារ...`);

    const qLower = query.toLowerCase();

    for (let p = 1; p <= totalPages; p++) {
        try {
            const page = await pdfDoc.getPage(p);
            const content = await page.getTextContent();
            const pageText = content.items.map(i => i.str).join(' ');
            
            let idx = pageText.toLowerCase().indexOf(qLower);
            while (idx !== -1) {
                const startSnippet = Math.max(0, idx - 25);
                const endSnippet = Math.min(pageText.length, idx + query.length + 35);
                const rawSnippet = pageText.substring(startSnippet, endSnippet);

                const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                const highlightedSnippet = rawSnippet.replace(regex, '<mark>$1</mark>');

                searchMatches.push({
                    pageNum: p,
                    snippet: '...' + highlightedSnippet + '...',
                    matchIndex: searchMatches.length
                });

                idx = pageText.toLowerCase().indexOf(qLower, idx + query.length);
            }
        } catch(e) {}
    }

    if (searchMatches.length > 0) {
        currentMatchIndex = 0;
        updateSearchMatchesUI();
        jumpToSearchMatch(0);
        showToast(`រកឃើញ ${searchMatches.length} ផល!`);
    } else {
        if (countBadge) countBadge.textContent = 'រកមិនឃើញផល';
        showToast(`រកមិនឃើញពាក្យ "${query}" ក្នុងឯកសារនេះទេ`);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateSearchMatchesUI() {
    const countBadge = document.getElementById('doc-search-count');
    const resultsList = document.getElementById('doc-search-results-list');

    if (countBadge) {
        countBadge.textContent = `${currentMatchIndex + 1} / ${searchMatches.length} ផល`;
    }

    if (resultsList) {
        resultsList.innerHTML = '';
        searchMatches.forEach((m, i) => {
            const item = document.createElement('div');
            item.className = (i === currentMatchIndex) ? 'search-result-item active' : 'search-result-item';
            item.innerHTML = `
                <span class="search-result-page-badge">ទំព័រ ${m.pageNum}</span>
                <span class="search-result-snippet">${m.snippet}</span>
            `;
            item.onclick = () => jumpToSearchMatch(i);
            resultsList.appendChild(item);
        });
    }
}

function prevSearchMatch() {
    if (searchMatches.length === 0) return;
    currentMatchIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    updateSearchMatchesUI();
    jumpToSearchMatch(currentMatchIndex);
}

async function triggerSaveToPicker(blob, filename, mimeType) {
    const file = new File([blob], filename, { type: mimeType });

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: mimeType === 'image/png' ? 'PNG Image' : 'Text Document',
                    accept: { [mimeType]: [mimeType === 'image/png' ? '.png' : '.txt'] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            showToast(`បានរក្សាទុក ${filename} ទៅកាន់ទីតាំងដែលបានជ្រើសរើស! 💾`);
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showSaveFilePicker error:', err);
        }
    }

    if (navigator.share) {
        try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: filename,
                    text: `រក្សាទុក ${filename}`
                });
                showToast(`បានជ្រើសរើសទីតាំងរក្សាទុក ${filename} 📲`);
                return;
            } else if (mimeType === 'text/plain') {
                const text = await blob.text();
                await navigator.share({
                    title: filename,
                    text: text
                });
                showToast(`បានបើកផ្ទាំងជ្រើសរើសទីតាំង ${filename} 📲`);
                return;
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('navigator.share error:', err);
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 1000);
    showToast(`បានទាញយក ${filename} 💾`);
}

async function downloadPdfPageImage() {
    if (!currentExportImageCanvas) return;
    const bookTitle = currentBook ? currentBook.title.replace(/[^a-zA-Z0-9\u1780-\u17FF_-]/g, '_') : 'Law_Page';
    const filename = `${bookTitle}_Page_${currentPage}.png`;

    currentExportImageCanvas.toBlob(async (blob) => {
        if (!blob) return;
        await triggerSaveToPicker(blob, filename, 'image/png');
    }, 'image/png');
}

async function sharePdfPageImage() {
    if (!currentExportImageCanvas) return;
    const bookTitle = currentBook ? currentBook.title.replace(/[^a-zA-Z0-9\u1780-\u17FF_-]/g, '_') : 'Law_Page';
    const filename = `${bookTitle}_Page_${currentPage}.png`;

    currentExportImageCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: filename
                });
                showToast('បានចែករំលែករូបភាព! 📲');
                return;
            } catch(e) {}
        }
        downloadPdfPageImage();
    }, 'image/png');
}

function nextSearchMatch() {
    if (searchMatches.length === 0) return;
    currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
    updateSearchMatchesUI();
    jumpToSearchMatch(currentMatchIndex);
}

function jumpToSearchMatch(index) {
    if (index >= 0 && index < searchMatches.length) {
        const match = searchMatches[index];
        jumpToPage(match.pageNum);
    }
}

function toggleSearchResultsList() {
    const resultsList = document.getElementById('doc-search-results-list');
    if (resultsList) {
        resultsList.classList.toggle('hidden');
    }
}

// === NATIVE ANDROID PDF VIEWER INTEGRATION ===
function openCurrentBookInNativeViewer() {
    if (!currentBook) return;
    const filename = currentBook.filename;
    if (!filename) {
        showToast('សៀវភៅនេះមិនទាន់មានឯកសារក្នុងម៉ាស៊ីនទេ');
        return;
    }

    const NativePdfViewer = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NativePdfViewer;

    if (NativePdfViewer) {
        showToast('កំពុងបើកកម្មវិធីមើល PDF Native... 📱');
        NativePdfViewer.openPdf({ filename }).catch(err => {
            console.error('Native PDF viewer error:', err);
            showToast('មិនអាចបើកកម្មវិធីមើល PDF Native បានទេ');
        });
    } else {
        const url = 'pdfs/' + filename;
        window.open(url, '_blank');
        showToast('កំពុងបើកឯកសារ PDF ក្នុងផ្ទាំងថ្មី 🌐');
    }
}

// === EXPORT PDF PAGE TO IMAGE (PNG) ===
let currentExportImageCanvas = null;

async function exportPdfPageToImage() {
    if (!pdfDoc) return;
    try {
        showToast(`កំពុងបម្លែងទំព័រទី ${currentPage} ជារូបភាព... 🖼️`);
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        currentExportImageCanvas = canvas;

        const dataUrl = canvas.toDataURL('image/png');
        const imgPreview = document.getElementById('pdf-image-preview');
        const pageLabel = document.getElementById('img-export-page-num');

        if (imgPreview) imgPreview.src = dataUrl;
        if (pageLabel) pageLabel.textContent = currentPage;

        const bookTitle = currentBook ? currentBook.title.replace(/[^a-zA-Z0-9\u1780-\u17FF_-]/g, '_') : 'Law_Page';
        const filename = `${bookTitle}_Page_${currentPage}.png`;
        const btnDlImg = document.getElementById('btn-dl-img-file');
        if (btnDlImg) {
            btnDlImg.href = dataUrl;
            btnDlImg.download = filename;
        }

        document.getElementById('modal-pdf-to-image').classList.remove('hidden');
    } catch(err) {
        console.error('PDF to Image error:', err);
        showToast('មិនអាចបម្លែងទំព័រជារូបភាពបានទេ');
    }
}

function downloadPdfPageImage() {
    if (!currentExportImageCanvas) return;
    const bookTitle = currentBook ? currentBook.title.replace(/[^a-zA-Z0-9\u1780-\u17FF_-]/g, '_') : 'Law_Page';
    const filename = `${bookTitle}_Page_${currentPage}.png`;

    const dataUrl = currentExportImageCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast(`បានទាញយករូបភាព ${filename} 💾`);
}

function closePdfImageModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modal-pdf-to-image').classList.add('hidden');
}

// === EXPORT PDF PAGE TO TEXT (.txt & Copy & Khmer OCR for Current Page) ===
let currentExtractedText = '';
const ocrTextCache = {};

async function ocrKhmerPdfPage(page, pageNumber) {
    const cacheKey = `${currentBook ? currentBook.id : 'doc'}_p${pageNumber}`;
    if (ocrTextCache[cacheKey]) {
        return ocrTextCache[cacheKey];
    }

    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    if (typeof Tesseract === 'undefined' || typeof Tesseract.recognize !== 'function') {
        throw new Error('Tesseract OCR engine is not loaded');
    }

    const result = await Tesseract.recognize(canvas, 'khm', {
        logger: m => {
            if (m && m.status === 'recognizing text') {
                const pct = Math.round((m.progress || 0) * 100);
                showToast(`កំពុងស្កេនរូបភាពទំព័រទី ${pageNumber} (OCR)... ${pct}% 🔍`);
            }
        }
    });

    const ocrText = (result && result.data && result.data.text) ? result.data.text.trim() : '';
    if (ocrText) {
        ocrTextCache[cacheKey] = ocrText;
    }
    return ocrText;
}

async function getOrOcrPageText(page, pageNumber) {
    const textContent = await page.getTextContent();
    const rawText = textContent.items.map(item => item.str).join(' ').trim();

    if (rawText && rawText.length > 15) {
        return rawText;
    }

    const cacheKey = `${currentBook ? currentBook.id : 'doc'}_p${pageNumber}`;
    if (ocrTextCache[cacheKey]) {
        return ocrTextCache[cacheKey];
    }

    showToast(`ទំព័រទី ${pageNumber}/${totalPages} គ្មានអត្ថបទ embedded ទេ ➔ កំពុងស្កេន Khmer OCR ស្វ័យប្រវត្តិ... 🔍`);
    try {
        const ocrText = await ocrKhmerPdfPage(page, pageNumber);
        if (ocrText) {
            showToast(`បានស្កេន Khmer OCR ទំព័រទី ${pageNumber}/${totalPages} រួចរាល់! ✨`);
            return ocrText;
        }
    } catch(err) {
        console.warn('Auto Khmer OCR error on page', pageNumber, err);
    }

    return rawText || 'រកមិនឃើញអត្ថបទនៅទំព័រនេះទេ (អាចជាទំព័រស្កែនរូបភាព)។';
}

async function runKhmerOcrOnCurrentPage() {
    if (!pdfDoc) return;
    const btn = document.getElementById('btn-ocr-trigger');
    const txtArea = document.getElementById('pdf-text-extracted-area');
    if (btn) btn.disabled = true;

    try {
        showToast(`កំពុងស្កេនរូបភាពទំព័រទី ${currentPage}/${totalPages} ជាមួយ Khmer OCR... 🔍`);
        const page = await pdfDoc.getPage(currentPage);
        const ocrText = await ocrKhmerPdfPage(page, currentPage);

        if (txtArea) txtArea.value = ocrText || 'មិនអាចស្កេនអត្ថបទខ្មែរចេញពីរូបភាពទំព័រនេះបានទេ';
        currentExtractedText = ocrText;

        const bookTitle = currentBook ? currentBook.title.replace(/[^a-zA-Z0-9\u1780-\u17FF_-]/g, '_') : 'Law_Page';
        const filename = `${bookTitle}_Page_${currentPage}.txt`;
        const blob = new Blob([currentExtractedText], { type: 'text/plain;charset=utf-8' });
        const btnDlTxt = document.getElementById('btn-dl-txt-file');
        if (btnDlTxt) {
            btnDlTxt.href = URL.createObjectURL(blob);
            btnDlTxt.download = filename;
        }

        showToast(`បានស្កេនអត្ថបទខ្មែរទំព័រទី ${currentPage}/${totalPages} (OCR) រួចរាល់! 🔍`);
    } catch(err) {
        console.error('Manual OCR error:', err);
        showToast('មិនអាចដំណើរការ Khmer OCR បានទេ');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function exportPdfPageToText() {
    if (!pdfDoc) return;
    try {
        showToast(`កំពុងស្រង់អត្ថបទពីទំព័រទី ${currentPage}/${totalPages}... 📄`);
        const page = await pdfDoc.getPage(currentPage);

        currentExtractedText = await getOrOcrPageText(page, currentPage);

        const txtArea = document.getElementById('pdf-text-extracted-area');
        const pageLabel = document.getElementById('txt-export-page-num');

        if (txtArea) txtArea.value = currentExtractedText;
        if (pageLabel) pageLabel.textContent = `${currentPage} / ${totalPages}`;

        const bookTitle = currentBook ? currentBook.title.replace(/[^a-zA-Z0-9\u1780-\u17FF_-]/g, '_') : 'Law_Page';
        const filename = `${bookTitle}_Page_${currentPage}.txt`;
        const blob = new Blob([currentExtractedText], { type: 'text/plain;charset=utf-8' });
        const btnDlTxt = document.getElementById('btn-dl-txt-file');
        if (btnDlTxt) {
            btnDlTxt.href = URL.createObjectURL(blob);
            btnDlTxt.download = filename;
        }

        document.getElementById('modal-pdf-to-text').classList.remove('hidden');
    } catch(err) {
        console.error('PDF to Text error:', err);
        showToast('មិនអាចស្រង់អត្ថបទពីទំព័រនេះបានទេ');
    }
}

function copyExtractedText() {
    if (!currentExtractedText) return;
    navigator.clipboard.writeText(currentExtractedText).then(() => {
        showToast('បានចម្លងអត្ថបទចូល Clipboard រួចរាល់! 📋');
    }).catch(() => {
        const txtArea = document.getElementById('pdf-text-extracted-area');
        if (txtArea) {
            txtArea.select();
            document.execCommand('copy');
            showToast('បានចម្លងអត្ថបទចូល Clipboard! 📋');
        }
    });
}

function onImageDownloadClicked(e) {
    showToast(`កំពុងទាញយករូបភាពទំព័រទី ${currentPage}... 💾`);
}

function onTextDownloadClicked(e) {
    showToast(`កំពុងទាញយកឯកសារអត្ថបទ (.txt)... 💾`);
}

async function shareExtractedText() {
    if (!currentExtractedText) return;
    const bookTitle = currentBook ? currentBook.title.replace(/[^a-zA-Z0-9\u1780-\u17FF_-]/g, '_') : 'Law_Page';
    const filename = `${bookTitle}_Page_${currentPage}.txt`;
    const file = new File([currentExtractedText], filename, { type: 'text/plain;charset=utf-8' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: filename,
                text: currentExtractedText.slice(0, 100)
            });
            showToast('បានចែករំលែកអត្ថបទ! 📲');
            return;
        } catch(e) {}
    } else if (navigator.share) {
        try {
            await navigator.share({
                title: filename,
                text: currentExtractedText
            });
            showToast('បានចែករំលែកអត្ថបទ! 📲');
            return;
        } catch(e) {}
    }
    copyExtractedText();
}

function closePdfTextModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modal-pdf-to-text').classList.add('hidden');
}




