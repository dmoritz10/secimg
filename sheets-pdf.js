
var _PDF_DOC,
_CURRENT_PAGE,
_TOTAL_PAGES,
_PAGE_RENDERING_IN_PROGRESS = 0

// initialize and load the PDF
async function showPDF(pdf_url, frntback) {
    var pdfData = atob(
        'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwog' +
        'IC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAv' +
        'TWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0K' +
        'Pj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAg' +
        'L1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+' +
        'PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9u' +
        'dAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2Jq' +
        'Cgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJU' +
        'CjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVu' +
        'ZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4g' +
        'CjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAw' +
        'MDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9v' +
        'dCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G');
// get handle of pdf document

pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

try {
    let loadingTask  = pdfjsLib.getDocument({ data: pdfData });
    _PDF_DOC = await loadingTask.promise;
    console.log('1')
}
catch(error) {
    alert(error.message);
}

console.log('_PDF_DOC', _PDF_DOC)

var fb = frntbackObj(frntback)

// total pages in pdf
_TOTAL_PAGES = _PDF_DOC.numPages;

// Hide the pdf loader and show pdf container

// show the first page
showPage(1, fb);
}

// load and render specific page of the PDF
async function showPage(page_no, fb) {
_PAGE_RENDERING_IN_PROGRESS = 1;
_CURRENT_PAGE = page_no;

// disable Previous & Next buttons while page is being loaded
// document.querySelector("#pdf-next").disabled = true;
// document.querySelector("#pdf-prev").disabled = true;

// // while page is being rendered hide the canvas and show a loading message
// document.querySelector("#pdf-canvas").style.display = 'none';
// document.querySelector("#page-loader").style.display = 'block';

// update current page
document.querySelector("#navPages").innerHTML = page_no + '/' + _TOTAL_PAGES;

// get handle of page
try {
    var page = await _PDF_DOC.getPage(page_no);
}
catch(error) {
    alert(error.message);
}

console.log('page', page)
// original width of the pdf page at scale 1
var pdf_original_width = page.getViewport(1).width;

// as the canvas is of a fixed width we need to adjust the scale of the viewport where page is rendered
var scale_required = fb.canvas.width / pdf_original_width;

// get viewport to render the page at required scale
var viewport = page.getViewport(scale_required);

// set canvas height same as viewport height
fb.canvas.height = viewport.height;

console.log('page', pdf_original_width, scale_required, viewport)

// setting page loader height for smooth experience
// document.querySelector("#page-loader").style.height =  fb.canvas.height + 'px';
// document.querySelector("#page-loader").style.lineHeight = fb.canvas.height + 'px';

// page is rendered on <canvas> element
var render_context = {
    canvasContext: fb.canvas.getContext('2d'),
    viewport: viewport
};
    
// render the page contents in the canvas
try {
    await page.render(render_context);
}
catch(error) {
    alert(error.message);
}

_PAGE_RENDERING_IN_PROGRESS = 0;

// re-enable Previous & Next buttons
// document.querySelector("#pdf-next").disabled = false;
// document.querySelector("#pdf-prev").disabled = false;

// show the canvas and hide the page loader
// document.querySelector("#pdf-canvas").style.display = 'block';
// document.querySelector("#page-loader").style.display = 'none';
}

// // click on the "Previous" page button
// document.querySelector("#pdf-prev").addEventListener('click', function() {
// if(_CURRENT_PAGE != 1)
//     showPage(--_CURRENT_PAGE);
// });

// // click on the "Next" page button
// document.querySelector("#pdf-next").addEventListener('click', function() {
// if(_CURRENT_PAGE != _TOTAL_PAGES)
//     showPage(++_CURRENT_PAGE);
// });
