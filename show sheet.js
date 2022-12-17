async function showSheet(idx) {


  if (idx === null) return                  // null is from browseDocument

  modal(true)
  
  var sht = []

  var vals = shtEnc ? await decryptArr(shtVals[idx]) : shtVals[idx]
  
  $("#ssSheet")[0].innerHTML = vals[shtHdrs.indexOf('Document')]
  $("#ssArrIdx").val(idx)

  for (var i=1; i<shtHdrs.length;i++) {

    var val = vals[i].replace(/\n|\r\n|\r/g, '<br/>');

    console.log(shtHdrs[i], val)

    if (shtHdrs[i] == 'Favorite') {
      var boolFav = val.toLowerCase() === 'true'
      if (boolFav) val = "Yes"
      var boolFav = val.toLowerCase() === 'false' || val.length == 0
      if (boolFav) val = "No"
      console.log(shtHdrs[i], val)
    }
    var icon = ''

    if (val) {

      icon = '<div class="label cursor-pointer" onClick="copyToClpbrd(' + "'" + val + "'" + ')"><span class="material-icons">content_copy</span></div>'
    
    }

    if (shtHdrs[i] == "File Id") {
      val = val.length < 17 ? val : val.substring(0,14) + "..."
    }

   if (['Img Front', 'Img Back'].indexOf(shtHdrs[i]) == -1) {
      sht.push([shtHdrs[i], val, icon])
    }

  }


  var imgs = await fetchImages(shtEnc, vals[shtHdrs.indexOf('File Id')])

  var val
  var icon

  console.log('showSheet', imgs)

  if (imgs[0]) {

    var fileInfo = parseFile(imgs[0])

    if (fileInfo.type == 'data:application/pdf') {

      // const blob = base64ToBlob( fileInfo.data, 'application/pdf' );
      // const url = URL.createObjectURL( blob );
      
      let src = atob(fileInfo.data)
      var img = await makeThumb(src)

      val = '<span><img class="showImg" src=' + img + "></embed></span>"
      icon = '<div class="label cursor-pointer" onClick="openPDF(' + "'" + fileInfo.data + "'" + ')"><span class="material-icons">open_in_new</span></div>'

    } else {
    
      val = '<span><img class="showImg" src=' + imgs[0] + "></embed></span>"
      icon = '<div class="label cursor-pointer" onClick="openImg(' + "'" + imgs[0] + "'" + ')"><span class="material-icons">open_in_new</span></div>'

    }

  } else val = ''

  sht.push(['Front', val, icon])

  imgs[1] ? val = '<span><img class="showImg" src=' + imgs[1] + "></embed></span>" : val=''
  icon = '<div class="label cursor-pointer" onClick="openImg(' + "'" + imgs[1] + "'" + ')"><span class="material-icons">open_in_new</span></div>'

  sht.push(['Back', val, icon])
  
  var tbl = new Table();
  
  tbl
    .setHeader()
    .setTableHeaderClass()
    .setData(sht)
    .setTableClass('table table-borderless')
    .setTrClass('d-flex')
    .setTcClass(['text-end col-4 h5 text-success', 'text-start col h4', 'col-1'])
    .setTdClass('py-1 pb-0 border-0 align-bottom border-bottom')
    .build('#tblSheet');

  gotoTab('ShowSheet')

  $('#shtContainer > div').eq(idx+1).trigger( "click" )

  modal(false)


} 

function base64ToBlob( base64, type = "application/octet-stream" ) {
  const binStr = atob( base64 );
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[ i ] = binStr.charCodeAt( i );
  }
  return new Blob( [ arr ], { type: type } );
}


async function makeThumb(pdfData) {

  let loadingTask  = pdfjsLib.getDocument({ data: pdfData });
  let pdfDoc = await loadingTask.promise;
  let page = await pdfDoc.getPage(1);
  let imgSrc = buildThumb(page)

  return imgSrc

}

async function pdfToImg(pdfData) {

  let src = atob(pdfData)

  let loadingTask  = await pdfjsLib.getDocument({ data: src });
  let pdfDoc = await loadingTask.promise;

  var imgSrc = ''

  for (let i=0;i<pdfDoc.numPages;i++) {
    let page = await pdfDoc.getPage(i+1);
    let thumb = await buildThumb(page, 400)

    imgSrc += "<img src=" + thumb   + " width='100%' height='auto'>"

  }

  imgSrc += "</div>"

  return imgSrc

}

async function buildThumb(page, desiredWidth = 200) {
  var viewport = page.getViewport({ scale: 1, });
  var scale = desiredWidth / viewport.width;
  var viewport = page.getViewport({ scale: scale, });
  console.log("Viewport:", viewport)
  // Support HiDPI-screens.
  var outputScale = window.devicePixelRatio || 1;

  var canvas = document.createElement("canvas");
  var context = canvas.getContext('2d');

  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = Math.floor(viewport.width) + "px";
  canvas.style.height =  Math.floor(viewport.height) + "px";
  console.log(canvas)
  var transform = outputScale !== 1
    ? [outputScale, 0, 0, outputScale, 0, 0]
    : null;

  var renderContext = {
    canvasContext: context,
    transform: transform,
    viewport: viewport
  };
  return await page.render(renderContext).promise.then(function() {
    return canvas.toDataURL('image/jpeg', 1);
  });
}

function openImg(img) {

  var newTab = window.open("", "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400");
  newTab.document.body.innerHTML = '<img src=' + img + '>'

}

async function openPDF(pdfData) {

  var w = window.outerWidth
  var h = window.outerHeight
  var y = window.outerHeight / 2 + window.screenY - ( h / 2)
    var x = window.outerWidth / 2 + window.screenX - ( w / 2)

  console.log('widths', window.outerWidth, window.screenX)
  console.log('Heights', window.outerHeight, window.screenY)

  var img = await pdfToImg(pdfData)
  var newTab = window.open("", "_blank", "toolbar=yes,scrollbars=yes,resizable=yes, width=" + w + ", height=" + h + ", top=" + y + ", left=" + x + ")");
  newTab.document.body.innerHTML = img

  // var win = window.open("", "Title", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=480,top="+(screen.height-200)+",left="+(screen.width-400));
  // win.document.body.innerHTML = '<iframe width="100%" height="100%" src=' + img + '></iframe>';
 
  // var i = document.getElementById('iframeSheet')
  // $(i).removeClass('d-none')
  // $('#tblSheet').addClass('d-none')
  // // i.width="100%"
  // i.src = img

}



function browseDocument(dir) {

  var idx   = $("#ssArrIdx").val()*1       
  var title = $('#shtTitle').text()

  var shtRows = secSht[title].rows*1 - 1                   // rows includes hdrs

  var eleArr = [...$('#shtContainer > div')].slice(1)      // remove the templace

  if (dir=="prev")  {
    var prevIdx = (idx-1 >= 0) ? idx-1 : null
    while (prevIdx !== null) {
      if ($(eleArr[prevIdx]).hasClass('d-none') || $(eleArr[prevIdx]).css('display') == 'none') {  
        prevIdx = (prevIdx-1 >= 0) ? prevIdx-1 : null
      } else {
        break;
      }
    }
    showSheet(prevIdx)
  } else {
    var nextIdx = (idx+1 <  shtRows) ? idx+1 : null
    while (nextIdx) {
      if ($(eleArr[nextIdx]).hasClass('d-none') || $(eleArr[nextIdx]).css('display') == 'none') {  
        nextIdx = (nextIdx+1 <  shtRows) ? nextIdx+1 : null
      } else {
        break;
      }
    }
     showSheet(nextIdx)
  }

}


function copyToClpbrd(txt) {

  navigator.clipboard.writeText(txt).then(function() {
    console.log('Async: Copying to clipboard was successful!');
    toast('Copied to clipboard', 1000)
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });

}

function clearAndGotoTab(sht) {

  $("#tblSheet").html('')
  $("#ssSheet").html('')
  
  gotoTab(sht)

}

function editFromShowSheet() {

  clearAndGotoTab("Sheets")

  var arrIdx = $("#ssArrIdx").val()

  editSheet(arrIdx)

}