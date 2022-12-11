
async function listSheet(title) {

  modal(true)

  var shtOptions = readOption('shtFilter')
  var shtSelectFav = shtOptions.shtSelectFav

  var objSht = await openShts(
    [
      { title: title, type: "all" }
    ])

    console.log('objSht', objSht)

  shtTitle = title
  shtId   = secSht[shtTitle].id
  shtCols = secSht[shtTitle].cols
  shtRows = secSht[shtTitle].rows
  shtEnc  = secSht[shtTitle].enc

  if (shtEnc) {
    shtHdrs = await decryptArr(objSht[shtTitle].colHdrs)
  } else {
    shtHdrs = objSht[shtTitle].colHdrs
  }
  
  var vals = objSht[shtTitle].vals

  for (var i=0;i<vals.length;i++) {

    vals[i].push(i)
    
    if (shtEnc) vals[i].push(await decryptMessage(vals[i][0])) // sort won't take a promise
    else        vals[i].push(vals[i][0])
  
  }

  var sortCol = vals[0] ? vals[0].length - 1 : 0    // in case of empty sheet.  ie. hdrs only

  shtVals = vals.sort(function(a,b){return a[sortCol].toLowerCase() > b[sortCol].toLowerCase() ? 1 : -1; });
  
  shtVals.forEach((val, idx, arr)=> arr[idx].pop()) // remove sort element from end of array
  

  $("#shtTitle").html(shtTitle)
  $("#shtNbrDocuments").html(vals.length)

  var $tblSheets = $("#shtContainer > .d-none").eq(0)  // the 1st one is a template which is always d-none

  var x = $tblSheets.clone();
  $("#shtContainer").empty();
  x.appendTo("#shtContainer");

  shtIdxArr = []
  var arrIdx = 0

  for (var j = 0; j < shtVals.length; j++) {

    var shtObj = makeObj(shtVals[j], shtHdrs)

    var x = shtVals[j].pop()                    // remove idx shtVals after sort
    shtIdxArr.push(x)                           // create parallel xref of idxs to sheet

    if (shtEnc) {
      var fav = await decryptMessage(shtObj['Favorite'])
      var Document = await decryptMessage(shtObj['Document'])
    } else {
      var fav = shtObj['Favorite']
      var Document = shtObj['Document']
    }


    var ele = $tblSheets.clone();

    ele.find('#shtDocument')[0].innerHTML = Document

    ele.find('#btnShtEdit')[0].setAttribute("onclick", "editSheet(" + j + ")");

    ele.find('#btnShtFavorite')[0].setAttribute("onclick", "setFavorite(" + j + ")");

    ele.find('#btnShtShowSheet')[0].setAttribute("onclick", "showSheet(" + j + ")");


    var boolFav = fav.toLowerCase() === 'true'

    if (boolFav) {
      ele.find('#ScFavIcon')[0].innerHTML = "star"
      ele.find('#ScFavIcon').addClass('text-primary')
    } else {
      ele.find('#ScFavIcon')[0].innerHTML = "star_outline"
      ele.find('#ScFavIcon').removeClass('text-primary')
    }

    if ( (shtSelectFav && !(fav.toLowerCase() === 'true')) ) {}
    else
      ele.removeClass('d-none');


    ele.appendTo("#shtContainer");

    arrIdx++

  }

  gotoTab('Sheets')

  var srchVal = $("#shtSearch").val()

  if (srchVal) {

      $("#shtContainer #shtDocument").filter(function() {
        $(this).parent().parent().parent().toggle($(this).text().toLowerCase().indexOf(srchVal.toLowerCase()) > -1)
      });
   
  }

  $('#shtContainer > div').click(function(e){         // highlight clicked row
    
    $('#shtContainer > div').removeClass('sheets-focus');
    $(e.currentTarget).addClass('sheets-focus')
    
  });

  modal(false)

}


async function btnShtMoreVertHtml() {

  var shtOptions = readOption('shtFilter')
  var shtSelectFav = shtOptions.shtSelectFav

  $('#shtSelectFav').prop("checked", shtSelectFav);

}

async function btnShtSelectHtml(e) {

  var shtSelectFavVal = $('#shtSelectFav').prop('checked')

  await updateOption('shtFilter', {
    'shtSelectFav': shtSelectFavVal
  })

  listSheet(shtTitle)

}

async function setFavorite(arrIdx) {

  var favCurr = shtVals[arrIdx][shtHdrs.indexOf("Favorite")]

  if (shtEnc) {
    var x = await decryptMessage(favCurr)
    var fav = x.toLowerCase() === 'true'

    if (fav) {
      shtVals[arrIdx][shtHdrs.indexOf("Favorite")] = await encryptMessage("FALSE")
    } else {
      shtVals[arrIdx][shtHdrs.indexOf("Favorite")] = await encryptMessage("TRUE")
    }

  } else {
    var fav = favCurr.toLowerCase() === 'true'

    if (fav) {
      shtVals[arrIdx][shtHdrs.indexOf("Favorite")] = "FALSE"
    } else {
      shtVals[arrIdx][shtHdrs.indexOf("Favorite")] = "TRUE"
    }
  }

  var shtIdx = shtIdxArr[arrIdx]

  await updateSheetRow(shtVals[arrIdx], shtIdx)

  updateUI(shtVals[arrIdx], arrIdx)

}

async function editSheet(arrIdx) {

  modal(true)

 
  $("#sheet-form")[0].reset();

  $('#shtmSheetName').html(shtTitle)

  $("#sheet-modal").modal('show');

  $('#shtmArrIdx').val(arrIdx)

  var vals = shtEnc ? await decryptArr(shtVals[arrIdx]) : shtVals[arrIdx]

  var shtObj = makeObj(vals, shtHdrs)

  var imgs = await fetchImages(shtEnc, shtObj['File Id'])

  $('#shtmDocument').val(shtObj['Document'])
  $('#shtmExpiry').val(shtObj['Expiry'])
  $('#shtmImgBack').val(shtObj['Account Nbr'])
  $('#shtmNotes').val(shtObj['Notes'])
  $('#shtmFavorite').val(shtObj['Favorite'])
  $('#shtmFileId').val(shtObj['File Id'])
  
  $('#btnShtmDelete').removeClass('d-none')

  clearCanvas(frntbackObj('front'))
  clearCanvas(frntbackObj('back'))

  if (imgs[0])  {
    
    await displayFile (imgs[0], 'front')

  } 
  
  if (imgs[1]) {

    await displayFile (imgs[1], 'back')

  }
  
  modal(false)

}


async function btnShtmSubmitSheetHtml() {

  if (!$('#sheet-form').valid()) return

  var arrIdx = $('#shtmArrIdx').val() ? $('#shtmArrIdx').val()*1 : -1

  if (arrIdx > -1) {                                                       // update existing course

    var vals = [...shtVals[arrIdx]]

    vals[shtHdrs.indexOf("Document")] = $('#shtmDocument').val()
    vals[shtHdrs.indexOf("Expiry")] = $('#shtmExpiry').val()
    vals[shtHdrs.indexOf("Notes")] = $('#shtmNotes').val()
    vals[shtHdrs.indexOf("Last Change")] = formatDate(new Date())
    vals[shtHdrs.indexOf("Favorite")] = $('#shtmFavorite').val()
    vals[shtHdrs.indexOf("File Id")] = $('#shtmFileId').val()

    var fileId = $('#shtmFileId').val()


  } else {

    if (dupDocument($('#shtmDocument').val())) {
      toast("Document already exists")
      return
    }

    modal(true)

    var fileId = await buildImageFile()

    var vals = []

    vals[shtHdrs.indexOf("Document")] = $('#shtmDocument').val()
    vals[shtHdrs.indexOf("Expiry")] = $('#shtmExpiry').val()
    vals[shtHdrs.indexOf("Notes")] = $('#shtmNotes').val()
    vals[shtHdrs.indexOf("Last Change")] = formatDate(new Date())
    vals[shtHdrs.indexOf("Favorite")] = $('#shtmFavorite').val()
    vals[shtHdrs.indexOf("File Id")] = fileId

  }


  var shtIdx = arrIdx == -1 ? -1 : shtIdxArr[arrIdx]  // get the row nbr on the sheet from shtIdxArr

  var valsEnc = shtEnc ? await encryptArr(vals) : vals

  await updateSheetRow(valsEnc, shtIdx)

  var imgs = []
  var savImgs = []

  var fb = frntbackObj('front')
  imgs[0] = fb.canvas.fCanvas ? getImgURL(fb.canvas.fCanvas) : fb.canvas.imgSrc ? fb.canvas.imgSrc : null
 
  var fb = frntbackObj('back')
  imgs[1] = fb.canvas.fCanvas ? getImgURL(fb.canvas.fCanvas) : fb.canvas.imgSrc ? fb.canvas.imgSrc : null


  await postImages(shtEnc, fileId, imgs, savImgs)

  clearCanvas(frntbackObj('front'))
  clearCanvas(frntbackObj('back'))

  $("#sheet-modal").modal('hide');
  // $("#sheet-modal").modal('dispose');

  updateUI(valsEnc, arrIdx)

  modal(false)

}

async function buildImageFile() {

  // Create file in enc/img folder
  // Rename title = sheetId
  // Return sheetId

  var fileIdx = await gapi.client.drive.files.create({

    resource : {                  
                  name : 'Sheet',
                  mimeType: 'application/vnd.google-apps.spreadsheet',
                  parents: ['1eAwbR_yzsEaEpBEpFA0Pqp8KGP2XszDY']

                }

}).then(function(response) {
    console.log(response);
    return response
    
});

console.log(fileIdx)

var fileId = fileIdx.result.id

// rename sheet to that provided by user

const rq = {"requests" : [
  {
    updateSpreadsheetProperties: {
    properties: {
     title: fileId,
    },
    fields: 'title'
    }
   }]}
 ;
 
await gapi.client.sheets.spreadsheets.batchUpdate({
  spreadsheetId: fileId,
  resource: rq})

  .then(response => {

    console.log('rename complete')
    console.log(response)

  }, function (reason) {
    console.error('error updating sheet "' + "title" + '": ' + reason.result.error.message);
    alert('error updating sheet "' + 'title' + '": ' + reason.result.error.message);
  });


  return fileId

}

async function updateUI (valsEnc, arrIdx) {

// update shtVals conditionally encrypting
// secSht[shtTitle].Rows
// update / append shtContainer ? sort ???
// update / append

  var arrIdx = arrIdx*1

  console.log("arrIdx", arrIdx)

  if (arrIdx == -1) {                               // add.  In this case, still use listSheet 

    // shtVals.push(valsEnc)
    // arrIdx = shtVals.length-1
    secSht[shtTitle].rows++

    listSheet(shtTitle)
    return
  
  }

  // update. Update ui directly w/o listSheet
  shtVals[arrIdx] = valsEnc

  var DocumentDec = shtEnc ? await decryptMessage(valsEnc[0]) : valsEnc[0]
  var $Document = $('#shtContainer > div').find('#shtDocument').eq(arrIdx+1) // first ele is template d-none
  $Document.html(DocumentDec)

  var fav = valsEnc[shtHdrs.indexOf('Favorite')]

  if (shtEnc) {
    var favDec = await decryptMessage(fav)
  } else {
    var favDec = fav
  }

  var $fav = $('#shtContainer > div').find('#ScFavIcon').eq(arrIdx+1) 

  var boolFav = favDec.toLowerCase() === 'true'
  console.log('boolFav', boolFav)

  if (boolFav) {
    $fav[0].innerHTML = "star"
    $fav.addClass('text-primary')
  } else {
    $fav[0].innerHTML = "star_outline"
    $fav.removeClass('text-primary')
  }

}
async function btnAddSheetHtml() {

  $("#sheet-form")[0].reset();
  $('#shtmModalTitle').html('')
  $("#sheet-modal").modal('show');

   $('#btnShtmDelete').addClass('d-none')

   clearCanvas(frntbackObj('front'))
   clearCanvas(frntbackObj('back'))

}

async function btnDeleteSheetHtml() {

  var confirmOK = await confirm("Are you sure you want to delete this Document ?")

  if (!confirmOK) return

  modal(true)


  var idx = shtIdxArr[$('#shtmArrIdx').val() * 1]

  console.log('btnShtmDelete',idx,$('#shtmArrIdx').val(), shtIdxArr)

  var request = {
    "requests":
      [
        {
          "deleteDimension": {
            "range": {
              "sheetId": shtId,
              "dimension": "ROWS",
              "startIndex": idx + 1,
              "endIndex": idx + 2
            }
          }
        }
      ]
  }


  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: request

  }).then(response => {

    secSht[shtTitle].rows--

    console.log('delete complete - ', idx)
    console.log(response)

  })

  await gapi.client.drive.files.delete({
                
        fileId : $('#shtmFileId').val()

}).then(function(response) {
    console.log(response);
    return response
    
});

  $("#sheet-modal").modal('hide');

  modal(false)

  listSheet(shtTitle)

}

function dupDocument(Document) {

  let arrDocuments = shtVals.map(a => a[shtHdrs.indexOf('Document')]);

  if (arrDocuments.indexOf(Document) > -1) {
    return true
  } else {
    return false
  }

}


async function showFile(input) {

  enhancerClose()

  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = async function (e) {

      if (input.id == "shtmInputFront") var frntback = 'front'
      else                              var frntback = 'back'

      var rtn = await displayFile (e.target.result, frntback)
      if (!rtn) return

    }

    reader.readAsDataURL(input.files[0]);
  }

}

async function displayFile (imgSrc, frntback) {

  console.log('frntback', frntback)

  var fileInfo = parseFile(imgSrc)


  if (fileInfo.invalidFile) {
    
    toast(fileInfo.invalidFile, 5000)
    return null

  }

  if (fileInfo.type == 'data:application/pdf' && frntback == 'back') {
    
    toast('Cannot put .pdf file on Back', 5000)
    return null

  }

  clearCanvas(frntback)

  if (fileInfo.type == 'data:application/pdf') {

    var src = atob(fileInfo.data)
    showPDF(src, frntback)
    toggleEditButtons(frntback, 'pdf')
  
  } else {

    await showCanvas(frntback, imgSrc)
    showControls(frntback, false)
    toggleEditButtons(frntback, 'img')
                                    
  }

  frntbackObj(frntback).canvas.imgSrc = imgSrc

  return true
  
}

function toggleEditButtons(frntback, fType) {

  if (typeof frntback === 'string') var fb = frntbackObj(frntback)
  else                              var fb = frntback

  if (fType == 'pdf') {

    $(fb.options.edit).attr("hidden",true);
    $(fb.options.share).attr("hidden",false);
    $(fb.options.delete).attr("hidden",false);
    $(fb.options.prevPagePDF).attr("hidden",false);
    $(fb.options.nextPagePDF).attr("hidden",false);
    $(fb.options.pagesPDF).attr("hidden",false);

  } else if (fType == 'img') {

    $(fb.options.edit).attr("hidden",false);
    $(fb.options.share).attr("hidden",false);
    $(fb.options.delete).attr("hidden",false);
    $(fb.options.prevPagePDF).attr("hidden",true);
    $(fb.options.nextPagePDF).attr("hidden",true);
    $(fb.options.pagesPDF).attr("hidden",true);

  } else {

    $(fb.options.share).attr("hidden",true);
    $(fb.options.delete).attr("hidden",true);
    $(fb.options.edit).attr("hidden",true);
    $(fb.options.prevPagePDF).attr("hidden",true);
    $(fb.options.nextPagePDF).attr("hidden",true);
    $(fb.options.pagesPDF).attr("hidden",true);

  }



}

function parseFile(f) {

  var parseFileType = f.split(';');
  var fileType = parseFileType[0]
  var x = parseFileType[1].split(',')
  var base = x[0]
  var data = x[1]

  var validFileTypes = [
    'data:application/pdf',
    'data:image/png',
    'data:image/jpeg'
  ]

  if (validFileTypes.indexOf(fileType) == -1) {
    return { invalidFile: 'Invalid file type'}
  }

  return {

    type:         parseFileType[0],
    base:         base,
    data:         data, 
    invalidFile:  false

  }

}

async function showCanvas(frntback, src) {

  if (typeof frntback === 'string') var fb = frntbackObj(frntback)
  else                              var fb = frntback

  $(fb.canvas).css("display", "");
  var canvas = initCnvas(fb);
  canvas.preserveObjectStacking = true;
  await addImage(canvas, src, fb);

  canvas.renderAll();

}

function showControls(frntback, bool) {

  if (typeof frntback === 'string') var fb = frntbackObj(frntback)
  else                              var fb = frntback

  let canvas = fb.canvas.fCanvas
  let c = canvas.item(0)
  
  c.selectable = bool;
  c.hasControls = bool;
  c.lockMovementY = !bool;
  c.lockMovementX = !bool;
  c.hoverCursor = bool ? 'move' : 'default';

  canvas.renderAll();

}

function getImgURL(canvas) {

  let img = canvas.item(0)

//   let widthz = img.width * img.scaleX
//   let heightz = img.height * img.scaleY
//   let width = img.aCoords.tr.x - img.aCoords.tl.x
//   let height = img.aCoords.bl.y - img.aCoords.tl.y
//   let top = img.aCoords.tl.y 
//   let left = img.aCoords.tl.x 

// console.log('img', top, left, width, height,  widthz, heightz)

  var bRect = img.getBoundingRect()

  console.log('brect', bRect)

  return canvas.toDataURL({
    format: 'jpeg',
    quality: 1,
    left: bRect.left,
    top: bRect.top,
    width: bRect.width,
    height:bRect.height
  })

}


async function postImages(shtEnc, fileId, imgs, savImgs, pwd = currUser.pwd) {

  for (var i=0;i<2;i++) {             // 0 = front image, 1 = back image

    var img = imgs[i]
    
    if (img && img != savImgs[i]) {

      var idx = 0
      var encPromiseArr = []

      var removeImage = img.slice(-1) == '#'

      while (idx < img.length) {

        if (shtEnc) encPromiseArr.push(encryptMessage(img.substring(idx, idx + 35000), pwd))
        else        encPromiseArr.push(img.substring(idx, idx + 35000))

        idx = idx+35000

      }

      if (shtEnc) var encArr = await Promise.all(encPromiseArr)
      else        var encArr = encPromiseArr

      console.log('postImage encArr', i, img.length, encArr[0].length, encArr.length)

      await updateImages(fileId, i*1+1, encArr, removeImage)

    }

  }

}

async function updateImages(fileId, imgIdx, vals, removeImage) {

  var shtTitle = fileId
  var row = imgIdx

  await clearImage(shtTitle, row)         // always clear existing image


  if (!removeImage) {               // user has elected to add an image

    var rng = calcRngA1(row, 1, 1, vals.length)

    var params = {
      spreadsheetId: fileId,
      range: "'" + "Sheet1" + "'!" + rng,
      valueInputOption: 'RAW'
    };

    var resource = {
      "majorDimension": "ROWS",
      "values": [vals]    
    }

    await gapi.client.sheets.spreadsheets.values.update(params, resource)
      .then(async function (response) {
        console.log('update successful')
      },

        function (reason) {
          console.error('error updating sheet "' + shtTitle + '": ' + reason.result.error.message);
          bootbox.alert('error updating sheet "' + shtTitle + '": ' + reason.result.error.message);
        });

  }

}


async function fetchImages(shtEnc, shtTitle, pwd = currUser.pwd) {
  console.time("fetchImages")
  console.log("fetchImages")

  var rng = calcRngA1(1, 1, 2, 1000)

  var params = {
    spreadsheetId: shtTitle,
    range: "'" + "Sheet1" + "'!" + rng
  };

  var vals = await gapi.client.sheets.spreadsheets.values.get(params)
    .then(function(response) {
      
      console.timeLog("fetchImages")
      console.log("fetchImages", response);
      return response.result.values

    }, function(reason) {
      console.error('error: ' + reason.result.error.message);
    });

    console.log("fetchImages pre return", shtTitle, "'" + "Sheet1" + "'!" + rng, vals);


    if (!vals) return [null, null]
    console.log("fetchImages post return", vals);

    rtn = []

    for (let i in vals) {

      var val = vals[i]

      if (val.length == 0 ) rtn.push(null)
      else {

        if (shtEnc) {
          var decVals = val.map( ele => decryptMessage(ele, pwd))

          var decArr = await Promise.all(decVals)
        } else
          var decArr = val

        rtn.push(decArr.join(''))
      }
  }
  

  console.timeEnd("fetchImages")

  return rtn

}

async function pasteImage() {

  var item = pasteEvent.clipboardData.items[0];

  console.log(item)

 
  if (item.type.indexOf("image") === 0) {

      var blob = item.getAsFile();

      var reader = new FileReader();
      reader.onload = function(event) {
          document.getElementById("shtmImgFront").src = event.target.result;
      };

      reader.readAsDataURL(blob);
  }

}

async function clearImage(shtTitle, row) {        // recall that the sheet title is the same as the sheet id for image files

  var rng = calcRngA1(row, 1, 1, 500)

  var params = {
    spreadsheetId: shtTitle,
    range: "'" + "Sheet1" + "'!" + rng
  };

  await gapi.client.sheets.spreadsheets.values.clear(params)
    .then(async function (response) {
      console.log('update successful')
    },

      function (reason) {
        console.error('error updating sheet "' + shtTitle + '": ' + reason.result.error.message);
        bootbox.alert('error updating sheet "' + shtTitle + '": ' + reason.result.error.message);
      });

}


async function startCamera(frntBack) {

  if (!enhancer) {

    enhancer = await Dynamsoft.DCE.CameraEnhancer.createInstance();
    // await enhancer.setUIElement(Dynamsoft.DCE.CameraEnhancer.defaultUIElementURL);
    // enhancer.setResolution(1280, 720)
    // enhancer.setViewDecorator("focus")
    // console.log('getallcameras', await enhancer.getAllCameras())
    await enhancer.open();
    
    const d = enhancer.getUIElement()
    $( d ).css( {position: 'relative'} );
    document.getElementById("enhancerUIContainer").appendChild(d)
    
    $(".dce-btn-close").addClass('d-none')
    $(".dce-msg-poweredby").addClass('d-none')

  }

  document.getElementById("enhancerUIContainer").dataset.frntback = frntBack;
  
  $("#cameraOverlay").removeClass('d-none')
  
}

async function clickPhoto() {

  if (enhancer) {

    let frame = enhancer.getFrame();

    let image_data_url = frame.toCanvas().toDataURL('image/jpeg', 1);

    console.log('image', image_data_url.substring(0, 100))

    var frntback = document.getElementById("enhancerUIContainer").dataset.frntback;

    clearCanvas(frntback)
    await showCanvas(frntback, image_data_url)
    showControls(frntback, false)

    toggleEditButtons(frntback, 'img')
                                      
    enhancerClose()

  }

}

function enhancerClose() {

  $("#cameraOverlay").addClass('d-none')

}

// var maxSize = { width: 466, height: 466 }

function clockwise(frntback) { 

  var fb = frntbackObj(frntback)

  var canvas = fb.canvas.fCanvas
  var curAngle = canvas.item(0).angle;
  canvas.item(0).rotate(curAngle + 90) 
  // canvas.item(0).angle = (curAngle + 90);

  canvas.renderAll();

};

function counterclockwise(frntback) { 

  var fb = frntbackObj(frntback)

  var canvas = fb.canvas.fCanvas
  var curAngle = canvas.item(0).angle;
  canvas.item(0).rotate(curAngle - 90) 

  canvas.renderAll();

};

function contrast (frntback) { 

  var fb = frntbackObj(frntback)

  var canvas = fb.canvas.fCanvas
  var img = canvas.item(0)

  var filter = new fabric.Image.filters.Convolute({
    matrix: [ 0, -1,  0,
             -1,  5, -1,
              0, -1,  0 ]
  });

  // var lanczosFilter = new fabric.Image.filters.Resize({
  //   scaleX: 1,
  //   scaleY: 1,
  //   resizeType: 'lanczos',
  //   lanczosLobes: 3,
  // });
  

  img.filters.push(filter);
  img.applyFilters();

  canvas.renderAll();

};



function drawOptimizedImage (canvas, image, maxSize, rotationDirection) {
  let degrees = updateRotationDegrees(rotationDirection)
  let newSize = determineSize(image.width, image.height, maxSize.width, maxSize.height, degrees)

  canvas.width = newSize.width
  canvas.height = newSize.height

  let ctx = canvas.getContext('2d')
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (degrees === 0) {
      ctx.drawImage(image, 0, 0, newSize.width, newSize.height)
  } 
  else {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(degrees * Math.PI / 180)

      if (Math.abs(degrees) === 180) {
          ctx.drawImage(image, -newSize.width / 2, -newSize.height / 2, newSize.width, newSize.height)
      }
      else { // 90 or 270 degrees (values for width and height are swapped for these rotation positions)
          ctx.drawImage(image, -newSize.height / 2, -newSize.width / 2, newSize.height, newSize.width)
      }
  }

  ctx.restore()
}

function updateRotationDegrees(rotationDirection) {
  // if (rotationDirection === 'clockwise') { rotationDegrees += 90 }
  // else if (rotationDirection === 'anticlockwise') { rotationDegrees -= 90 }
  let rotationDegrees = 0 
  if (rotationDirection === 'clockwise') { rotationDegrees = 90 }
  else if (rotationDirection === 'anticlockwise') { rotationDegrees = -90 }
  if (Math.abs(rotationDegrees) === 360) { rotationDegrees = 0 }
  return rotationDegrees
}

function determineSize(width, height, maxW, maxH, degrees) {
  let w, h;
  degrees = Math.abs(degrees)
  if (degrees === 90 || degrees === 270) { // values for width and height are swapped for these rotation positions
      w = height
      h = width
  }
  else {
      w = width
      h = height
  }
  if (w > h) {
      if (w > maxW) {
          h = h * maxW / w
          w = maxW
      }
  }
  else {
      if (h > maxH) {
          w = w * maxH / h
          h = maxH
      }
  }
  return { width: w, height: h }
}

function updateImgPreview(canvas, img) {

  img.src = canvas.toDataURL('image/jpeg', 1)

}

function deleteImage(frntback) {

  clearCanvas(frntbackObj(frntback))

}

async function editImage(frntback) {

  let fb = frntbackObj(frntback)

  $(fb.edit.row).find("*").off("click.editListener")

  $(fb.options.row).addClass('d-none')
  $(fb.edit.row).removeClass('d-none')

  var selectionRect
  var currentImage;

  showControls(fb, true)

  let canvas = fb.canvas.fCanvas
  let imgSrc = getImgURL(canvas)

  createMaskForCrop(canvas, fb);
  crop(canvas, fb);
  saveImage(canvas, fb)
  cancelImage(canvas, fb, imgSrc)
  restoreImage(canvas, fb, imgSrc)

  
  function createMaskForCrop(canvas, fb) {
    //  After click start crop add the mask to canvas
    
    $(fb.edit.setupCrop).on("click.editListener", function  () {
      // Create mask layer and show to canvas
      addSelectionRect();
      canvas.setActiveObject(selectionRect);
      canvas.renderAll();
    });

  }

  function addSelectionRect() {

    if (selectionRect) {
      canvas.remove(selectionRect);
      selectionRect = null;
      canvas.renderAll();
      return
    }

    selectionRect = new fabric.Rect({
      fill: "rgba(0,0,0,0.3)",
      originX: "left",
      originY: "top",
      stroke: "black",
      opacity: 1,
      width: canvas.item(0).width,
      height: canvas.item(0).height,
      // width: currentImage.width,
      // height: currentImage.height,
      width: 200,
      height: 100,
      hasRotatingPoint: false,
      transparentCorners: false,
      cornerColor: "white",
      cornerStrokeColor: "black",
      borderColor: "black",
      cornerSize: 12,
      padding: 0,
      cornerStyle: "circle",
      borderDashArray: [5, 5],
      borderScaleFactor: 1.3
       
    });

    selectionRect.scaleToWidth(300);
    selectionRect.setControlsVisibility({ mtr:  false})
    canvas.centerObject(selectionRect);
    canvas.add(selectionRect);

  }

  function crop(canvas, fb) {
    // Click the crop button croped the masked area
    $(fb.edit.cropImage).on("click.editListener", function  () {

      if (!selectionRect) return
    
      // create mask rectabgle for crop
      let rect = new fabric.Rect({
        left: selectionRect.left,
        top: selectionRect.top,
        width: selectionRect.getScaledWidth(),
        height: selectionRect.getScaledHeight(),
        absolutePositioned: true,
      });

      // add to the current image clicpPath property
      // currentImage.clipPath = rect;
      canvas.item(0).clipPath = rect;

      // remove the mask layer
      canvas.remove(selectionRect);
      selectionRect = null

      // init new image instance
      var cropped = new Image();

      // set src value of canvas croped area as toDataURL
      cropped.src = canvas.toDataURL({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });

      // after onload clear the canvas and add cropped image to the canvas
      cropped.onload = function () {

        canvas.clear();

        var image = new fabric.Image(cropped);
        image.setControlsVisibility({ 
          mtr:  false,
          ml:   false,
          mt:   false,
          mb:   false,
          mr:   false
        })
        
        setDims (canvas, image, fb)
        
        canvas.add(image)
        canvas.renderAll();

      };
    });
  }

  function saveImage(canvas, fb) {

    $(fb.edit.saveImage).on("click.editListener", async function  () {

      if (selectionRect) {
        canvas.remove(selectionRect);
        selectionRect = null;
        canvas.renderAll();
      }

      var src = getImgURL(canvas)
      
      clearCanvas(fb)
      await showCanvas(fb, src)
      showControls(fb, false)

      $(fb.options.row).removeClass('d-none')
      $(fb.edit.row).addClass('d-none')

      toggleEditButtons(frntback, 'img')

    });

  }

  
  function cancelImage(canvas, fb, imgSrc) {

    $(fb.edit.cancelEditImage).on("click.editListener", async function  () {
      
      clearCanvas(fb)
      await showCanvas(fb, imgSrc)
      showControls(fb, false)

      toggleEditButtons(frntback, 'img')


    });

  }

  async function restoreImage(canvas, fb, imgSrc) {

    $(fb.edit.restoreImage).on("click.editListener", async function  () {
      
      clearCanvas(fb)
      await showCanvas(fb, imgSrc)
      showControls(fb, true)
      
    });

  }

}

function initCnvas(fb) {

  console.log('fb', fb)

  fb.canvas = fb.frntback == 'front' ? document.getElementById("shtmCanvasFront") : document.getElementById("shtmCanvasBack")
  $(fb.canvas).css("display", "");

  console.log('fb1', fb)

  var fCanvas = new fabric.Canvas(fb.canvas.id, {
    strokeWidth: 15,
    stroke: "rgba(100,200,200,0.5)",
  });

  fb.canvas.fCanvas = fCanvas
  return fCanvas
}

async function addImage(canvas, imgSrc, fb) {
  const img = new Image();
  img.src = imgSrc;
  await waitForImage(img)

  var oImg = new fabric.Image(img);
  oImg.setControlsVisibility({ 
    mtr:  false,
    ml:   false,
    mt:   false,
    mb:   false,
    mr:   false
  })
  
  setDims (canvas, oImg, fb)
    
  canvas.add(oImg);
  canvas.centerObject(oImg);
  canvas.setActiveObject(oImg);
  currentImage = oImg;
  canvas.renderAll();
    
}


function clearCanvas(frntback) {

  if (typeof frntback === 'string') var fb = frntbackObj(frntback)
  else                              var fb = frntback


  if ($(fb.canvas).parent('.canvas-container').length > 0 ) {

    $(fb.canvas).parent('.canvas-container').remove();
    $(fb.edit.row).find("*").off("click.editListener")

  } 

  $(fb.canvas).remove()

  if (fb.frntback == "Front") $('<canvas id="shtmCanvasFront" style="display:none"></canvas>').appendTo(fb.colContainer);
  else                        $('<canvas id="shtmCanvasBack" style="display:none"></canvas>').appendTo(fb.colContainer);

  $(fb.options.row).removeClass('d-none')
  $(fb.edit.row).addClass('d-none')

  toggleEditButtons(frntback, 'none')

}


function frntbackObj(fb) {


  if (fb == 'front') {

    var frntback            = "front"
    var colContainer        = document.getElementById("shtmFront")
    var canvas              = document.getElementById("shtmCanvasFront")

    var options             = document.getElementById("shtmImgOptionsFront")
      var editz             = document.getElementById("editImageFront")
      var share             = document.getElementById("shareImageFront")
      var deletez           = document.getElementById("deleteImageFront")
      var prevPagePDF       = document.getElementById("pdfPrevFront")
      var nextPagePDF       = document.getElementById("pdfNextFront")
      var pagesPDF          = document.getElementById("pdfPagesFront")
    

    var edit                = document.getElementById("shtmImgEditFront")
      var setupCrop         = document.getElementById("setupCropFront")
      var cropImage         = document.getElementById("cropImageFront")
      var contrastImage     = document.getElementById("contrastImageFront")
      var cancelEditImage   = document.getElementById("cancelEditImageFront")
      var saveImage         = document.getElementById("saveImageFront")

  } else {

    var frntback            = "back"
    var colContainer        = document.getElementById("shtmBack")
    var canvas              = document.getElementById("shtmCanvasBack")

    var options             = document.getElementById("shtmImgOptionsBack")
      var editz             = document.getElementById("editImageBack")
      var share             = document.getElementById("shareImageBack")
      var deletez           = document.getElementById("deleteImageBack")
      var prevPagePDF       = document.getElementById("pdfPrevBack")
      var nextPagePDF       = document.getElementById("pdfNextBack")
      var pagesPDF          = document.getElementById("pdfPagesBack")
    

    var edit                = document.getElementById("shtmImgEditBack")
      var setupCrop         = document.getElementById("setupCropBack")
      var cropImage         = document.getElementById("cropImageBack")
      var contrastImage     = document.getElementById("contrastImageBack")
      var cancelEditImage   = document.getElementById("cancelEditImageBack")
      var saveImage         = document.getElementById("saveImageBack")

  
  }

  return {

    frntback:       frntback,
    colContainer:   colContainer,
    canvas:         canvas,

    options:  {

      row:          options,
      edit:         editz,
      share:        share,
      delete:       deletez,
      prevPagePDF:  prevPagePDF,
      nextPagePDF:  nextPagePDF,
      pagesPDF:     pagesPDF

    },

    edit:     {
      
      row:              edit,
      setupCrop:        setupCrop,
      cropImage:        cropImage,
      contrastImage:    contrastImage,
      cancelEditImage:  cancelEditImage,
      saveImage:        saveImage

    }

  }

}

async function waitForImage(imgElem) {
  return new Promise((res, rej) => {
      if (imgElem.complete) {
          return res();
      }
      imgElem.onload = () => res();
      imgElem.onerror = () => rej(imgElem);
  });
}

function setDims (fCanvas, fImg, fb) {

  let iHeight = fImg.height
  let iWidth = fImg.width

  let containerWidth = $(fb.colContainer).width()
  
  let cWidth = containerWidth

  let cHeight =  iHeight * (containerWidth / iWidth)

  fCanvas.setDimensions({
          width:cWidth,
          height:cHeight
         });

  let iRatio = iWidth / iHeight;
  let cRatio = cWidth / cHeight;

  // var retina = fb.canvas.getRetinaScaling();

  console.log('setDims', cWidth, cHeight, containerWidth, iWidth, iHeight, iRatio, cRatio  )
  
  if(iRatio <= cRatio){

    if(iHeight > cHeight){
      fImg.scaleToHeight(cHeight);
    }
  }else{
    if(iWidth > cWidth){
      fImg.scaleToWidth(cWidth);
    }
  };

}
