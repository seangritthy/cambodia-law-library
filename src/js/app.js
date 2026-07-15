// === PDF.js setup ===
pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.min.js';

// === State ===
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let isReading = false;
let currentAudio = null;
let currentBook = null;

// === DOM ===
const screenLibrary = document.getElementById('screen-library');
const screenReader = document.getElementById('screen-reader');
const libraryGrid = document.getElementById('library-grid');
const bookTitleBar = document.getElementById('book-title-bar');
const pageIndicator = document.getElementById('page-indicator');
const readerLoading = document.getElementById('reader-loading');
const pdfScrollContainer = document.getElementById('pdf-scroll-container');
const pdfPagesWrapper = document.getElementById('pdf-pages-wrapper');
const btnTts = document.getElementById('btn-tts');

// === Load Library ===
async function loadLibrary() {
    try {
        const res = await fetch('library.json');
        const books = await res.json();
        libraryGrid.innerHTML = '';
        books.forEach(book => {
            const card = document.createElement('div');
            card.className = book.color ? `book-card book-${book.color}` : 'book-card';
            card.innerHTML = `
                <div class="book-spine"></div>
                <div class="book-cover-content">
                    <div class="book-emblem">⚖️</div>
                    <div class="book-title-gold">${book.title}</div>
                    <div class="book-bottom-stripe">ព្រះរាជាណាចក្រកម្ពុជា</div>
                </div>
            `;
            card.addEventListener('click', () => openBook(book));
            libraryGrid.appendChild(card);
        });
    } catch (e) {
        libraryGrid.innerHTML = '<p style="color:#ef4444;padding:20px;text-align:center;">មិនអាចផ្ទុកបណ្ណាល័យបានទេ</p>';
        console.error('Library load error:', e);
    }
}

// === Open Book ===
async function openBook(book) {
    currentBook = book;
    currentPage = 1;
    isReading = false;

    // Show reader, hide library
    screenLibrary.classList.add('hidden');
    screenReader.classList.remove('hidden');

    bookTitleBar.textContent = book.title;
    pageIndicator.textContent = '-- / --';
    pdfPagesWrapper.innerHTML = '';
    readerLoading.classList.remove('hidden');
    pdfScrollContainer.classList.add('hidden');
    btnTts.textContent = '🔊 អាន';
    btnTts.classList.remove('reading');

    const pdfUrl = book.url ? book.url : 'pdfs/' + book.filename;

    try {
        if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null; }

        pdfDoc = await pdfjsLib.getDocument({
            url: pdfUrl,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true
        }).promise;

        totalPages = pdfDoc.numPages;
        pageIndicator.textContent = `1 / ${totalPages}`;

        readerLoading.classList.add('hidden');
        pdfScrollContainer.classList.remove('hidden');

        // Render first 3 pages immediately
        for (let i = 1; i <= Math.min(3, totalPages); i++) {
            await renderPage(i);
        }

        // Render the rest in background
        for (let i = 4; i <= totalPages; i++) {
            renderPage(i);
        }

        // Track current page on scroll
        pdfScrollContainer.addEventListener('scroll', onScroll);

    } catch (err) {
        readerLoading.innerHTML = `<p style="color:#ef4444;text-align:center;padding:20px;">មិនអាចបើកឯកសារ PDF បានទេ<br><small>${err.message}</small></p>`;
        console.error('PDF load error:', err);
    }
}

// === Render a single page ===
async function renderPage(pageNum) {
    try {
        const page = await pdfDoc.getPage(pageNum);
        const containerWidth = pdfScrollContainer.clientWidth - 16;
        const viewport = page.getViewport({ scale: 1 });

        // Use 2x pixel ratio for crisp, clear text on mobile screens
        const devicePixelRatio = window.devicePixelRatio || 2;
        const scale = (containerWidth / viewport.width) * devicePixelRatio;
        const scaledViewport = page.getViewport({ scale });

        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper';
        wrapper.id = `page-wrapper-${pageNum}`;

        const canvas = document.createElement('canvas');
        // Canvas draws at high resolution
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        // But CSS displays it at normal size (2x sharper)
        canvas.style.width = (scaledViewport.width / devicePixelRatio) + 'px';
        canvas.style.height = (scaledViewport.height / devicePixelRatio) + 'px';
        canvas.id = `canvas-${pageNum}`;

        wrapper.appendChild(canvas);
        pdfPagesWrapper.appendChild(wrapper);

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
    }
}

// === Scroll tracking ===
function onScroll() {
    if (!pdfDoc) return;
    const wrappers = pdfPagesWrapper.querySelectorAll('.pdf-page-wrapper');
    const containerLeft = pdfScrollContainer.scrollLeft;
    let closestPage = 1;
    let closestDist = Infinity;
    wrappers.forEach((w, i) => {
        const dist = Math.abs(w.offsetLeft - containerLeft);
        if (dist < closestDist) {
            closestDist = dist;
            closestPage = i + 1;
        }
    });
    if (closestPage !== currentPage) {
        currentPage = closestPage;
        pageIndicator.textContent = `${currentPage} / ${totalPages}`;
        if (isReading) stopReading();
    }
}

// === Navigation ===
function prevPage() {
    if (!pdfDoc || currentPage <= 1) return;
    currentPage--;
    scrollToPage(currentPage);
}

function nextPage() {
    if (!pdfDoc || currentPage >= totalPages) return;
    currentPage++;
    scrollToPage(currentPage);
}

function scrollToPage(pageNum) {
    const wrapper = document.getElementById(`page-wrapper-${pageNum}`);
    if (wrapper) {
        wrapper.scrollIntoView({ behavior: 'smooth', inline: 'start' });
        pageIndicator.textContent = `${pageNum} / ${totalPages}`;
    }
}

// === Close Book (Home button) ===
function closeBook() {
    try { stopReading(); } catch(e) {}
    try { pdfScrollContainer.removeEventListener('scroll', onScroll); } catch(e) {}
    try { if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null; } } catch(e) {}
    try { pdfPagesWrapper.innerHTML = ''; } catch(e) {}
    currentPage = 1;
    totalPages = 0;
    screenReader.classList.add('hidden');
    screenLibrary.classList.remove('hidden');
}

// === Text to Speech ===
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

        const page = await pdfDoc.getPage(currentPage);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ').trim();

        if (!text || text.length < 3) {
            alert('រកមិនឃើញអត្ថបទនៅទំព័រនេះ។\nPDF នេះអាចជាឯកសារស្កែន (រូបភាព)។');
            stopReading();
            return;
        }

        btnTts.textContent = '⏹️ ឈប់';

        // Try Web Speech API first
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);

            // Find a Khmer voice if available, otherwise use default
            const voices = window.speechSynthesis.getVoices();
            const khmerVoice = voices.find(v => v.lang.startsWith('km') || v.lang.startsWith('kh'));
            if (khmerVoice) utterance.voice = khmerVoice;
            
            utterance.lang = 'km-KH';
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => stopReading();
            utterance.onerror = (e) => {
                console.error('Speech error:', e);
                // Fallback to Google TTS audio
                playGoogleTTS(text);
            };

            window.speechSynthesis.speak(utterance);

            // Android bug: speechSynthesis sometimes stops silently — detect and restart
            setTimeout(() => {
                if (isReading && !window.speechSynthesis.speaking) {
                    playGoogleTTS(text);
                }
            }, 2000);

        } else {
            // Fallback: Google TTS
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
    window.speechSynthesis.cancel();
    btnTts.textContent = '🔊 អាន';
    btnTts.classList.remove('reading');
}

// === Init ===
document.addEventListener('DOMContentLoaded', loadLibrary);
