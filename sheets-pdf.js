
var _PDF_DOC,
_CURRENT_PAGE,
_TOTAL_PAGES,
_PAGE_RENDERING_IN_PROGRESS = 0

// initialize and load the PDF
async function showPDF(pdf_url, frntback) {

// get handle of pdf document
try {
    _PDF_DOC = await pdfjsLib.getDocument({ url: pdf_url });
}
catch(error) {
    alert(error.message);
}

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

// original width of the pdf page at scale 1
var pdf_original_width = page.getViewport(1).width;

// as the canvas is of a fixed width we need to adjust the scale of the viewport where page is rendered
var scale_required = fb.canvas.width / pdf_original_width;

// get viewport to render the page at required scale
var viewport = page.getViewport(scale_required);

// set canvas height same as viewport height
fb.canvas.height = viewport.height;

// setting page loader height for smooth experience
document.querySelector("#page-loader").style.height =  fb.canvas.height + 'px';
document.querySelector("#page-loader").style.lineHeight = fb.canvas.height + 'px';

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
