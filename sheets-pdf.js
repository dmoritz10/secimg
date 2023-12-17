
var _PDF_DOC,
_CURRENT_PAGE,
_TOTAL_PAGES,
_PAGE_RENDERING_IN_PROGRESS = 0,
_fb

// initialize and load the PDF
async function showPDF(pdf_url, frntback) {
// get handle of pdf document
var pdfData = pdf_url

console.log('pdfjslib', pdfjsLib)
// pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://www.jsdelivr.com/package/npm/pdfjs-dist';


pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.mjs';

try {
    let loadingTask  = pdfjsLib.getDocument({ data: pdfData });
    _PDF_DOC = await loadingTask.promise;
}
catch(error) {
    alert(error.message);
}

_fb = frntbackObj(frntback)

// total pages in pdf
_TOTAL_PAGES = _PDF_DOC.numPages;

// show the first page
showPage(1);
}

// load and render specific page of the PDF
async function showPage(page_no) {
_PAGE_RENDERING_IN_PROGRESS = 1;
_CURRENT_PAGE = page_no;

// update current page
document.getElementById('pdfPagesFront').innerHTML = page_no + '/' + _TOTAL_PAGES;

// get handle of page
try {
    var page = await _PDF_DOC.getPage(page_no);
}
catch(error) {
    alert(error.message);
}

// original width of the pdf page at scale 1

var pdf_original_width = page.getViewport({ scale: 1 }).width;

// as the canvas is of a fixed width we need to adjust the scale of the viewport where page is rendered
var scale_required = $(_fb.colContainer).width() / pdf_original_width;

// get viewport to render the page at required scale
var viewport = page.getViewport({ scale: scale_required });

console.log('viewport',viewport)
console.log('scale_required',scale_required)
console.log('_fb.colContainer.width',$(_fb.colContainer).width())

// set canvas height same as viewport height
_fb.canvas.height = viewport.height;
_fb.canvas.width = viewport.width;

console.log('page', pdf_original_width, scale_required, page.getViewport)

// page is rendered on <canvas> element
var render_context = {
    canvasContext: _fb.canvas.getContext('2d'),
    viewport: viewport
};

$(_fb.canvas).css("display", "");
    
// render the page contents in the canvas
try {
    await page.render(render_context);
}
catch(error) {
    alert(error.message);
}

_PAGE_RENDERING_IN_PROGRESS = 0;

}

// click on the "Previous" page button
document.getElementById('pdfPrevFront').addEventListener('click', function() {
if(_CURRENT_PAGE != 1)
    showPage(--_CURRENT_PAGE);
});

// click on the "Next" page button
document.getElementById('pdfNextFront').addEventListener('click', function() {
if(_CURRENT_PAGE != _TOTAL_PAGES)
    showPage(++_CURRENT_PAGE);
});
