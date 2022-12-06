
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

  // $('#shtmImgFront').removeAttr('src').addClass('d-none')
  // $('#shtmImgBack').removeAttr('src').addClass('d-none')

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
  // $('#shtmImgFront').attr('src', imgs[0])
  // $('#shtmImgBack').attr('src', imgs[1])
  // $('#shtmSaveImgFront').attr('src', imgs[0])
  // $('#shtmSaveImgBack').attr('src', imgs[1])

  // if (imgs[0])  $('#shtmImgFront').removeClass('d-none')
  // else          $('#shtmImgFront').addClass('d-none');
  // if (imgs[1])  $('#shtmImgBack').removeClass('d-none')
  // else          $('#shtmImgBack').addClass('d-none');

 
  $('#btnShtmDelete').removeClass('d-none')

  // clearCanvas(frntbackObj('front'))
  // clearCanvas(frntbackObj('back'))

  if (imgs[0])  {
    
    await showCanvas('front', imgs[0])
    // showControls('front', false)

  } 
  
  if (imgs[1]) {

    // await showCanvas('back', imgs[1])
    // showControls('back', false)

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

    var fileId = await buildImageFile()

    var vals = []

    vals[shtHdrs.indexOf("Document")] = $('#shtmDocument').val()
    vals[shtHdrs.indexOf("Expiry")] = $('#shtmExpiry').val()
    vals[shtHdrs.indexOf("Notes")] = $('#shtmNotes').val()
    vals[shtHdrs.indexOf("Last Change")] = formatDate(new Date())
    vals[shtHdrs.indexOf("Favorite")] = $('#shtmFavorite').val()
    vals[shtHdrs.indexOf("File Id")] = fileId

  }

  modal(true)

  var shtIdx = arrIdx == -1 ? -1 : shtIdxArr[arrIdx]  // get the row nbr on the sheet from shtIdxArr

  var valsEnc = shtEnc ? await encryptArr(vals) : vals

  await updateSheetRow(valsEnc, shtIdx)

  var imgs = []
  var savImgs = []

  var fb = frntbackObj('front')
  imgs[0] = fb.canvas ? fb.canvas.toDataURL('image/jpeg', 1) : null
  var fb = frntbackObj('back')
  imgs[1] = fb.canvas ? fb.canvas.toDataURL('image/jpeg', 1) : null

  // imgs[1] = document.getElementById("shtmImgBack").src
  // savImgs[0] = document.getElementById("shtmSaveImgFront").src;
  // savImgs[1] = document.getElementById("shtmSaveImgBack").src;

  // console.log('imgFront.src', document.getElementById("shtmImgFront").src.substring(0,100))
  // console.log('imgBack.src', document.getElementById("shtmImgBack").src.substring(0,100))

  // console.log('submit', [...imgs])
  // console.log('submit', [...savImgs])

  console.log('fileId', fileId)

  await postImages(shtEnc, fileId, imgs, savImgs)

  // $('#shtmImgFront').removeAttr('src').addClass('d-none')
  // $('#shtmImgBack').removeAttr('src').addClass('d-none')

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

function fixUrl(url) {

  if (url.substring(0, 8) !== 'https://' && url.substring(0, 7) !== 'http://') return 'https://' + url

  return url

}


async function btnAddSheetHtml() {

    $(frntbackObj('front').canvas).addClass('d-none')
    $(frntbackObj('back').canvas).addClass('d-none')
  // $('#shtmImgFront').removeAttr('src').addClass('d-none')
  // $('#shtmImgBack').removeAttr('src').addClass('d-none')

  $("#sheet-form")[0].reset();
  $('#shtmModalTitle').html('')
  $("#sheet-modal").modal('show');

   $('#btnShtmDelete').addClass('d-none')

   var fb = frntbackObj('front')
   clearCanvas(fb)
   var fb = frntbackObj('back')
   clearCanvas(fb)
 

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
console.log('delete file id', $('#shtmFileId').val())

  await gapi.client.drive.files.delete({
                
        fileId : $('#shtmFileId').val()

}).then(function(response) {
    console.log(response);
    return response
    
});

  $("#sheet-modal").modal('hide');
  // $("#sheet-modal").modal('dispose');

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

      var parseFileType = e.target.result.split(';');
      var fileType = parseFileType[0]
      var fileBase = parseFileType[1].split(',');

      var validFileTypes = [
        'data:application/pdf',
        'data:image/png',
        'data:image/jpeg'
      ]

      if (validFileTypes.indexOf(fileType) == -1) {
        toast('Invalid file type', 5000)
        return
      }

      if (input.id == "shtmInputFront") var frntback = 'front'
      else                              var frntback = 'back'

      console.log('e', e)

      if (fileType == 'data:application/pdf') {

        var src = getPdfData(e.target.result)
      
      } else {

        var src = e.target.result

      }

      await showCanvas(frntback, src)
      showControls(frntback, false)
                                      
    }

    reader.readAsDataURL(input.files[0]);
  }

}

async function showCanvas(frntback, src) {

  var fb = frntbackObj(frntback)
  // clearCanvas(fb)
  $(fb.canvas).removeClass('d-none');
  var canvas = initCnvas(fb.canvas);
  canvas.preserveObjectStacking = true;
  await addImage(canvas, src, fb);

  canvas.renderAll();

}

function showControls(frntback, bool) {

  if (typeof frntback === 'string') var fb = frntbackObj(frntback)
  else                              var fb = frntback

  var canvas = fb.canvas.fCanvas
  var c = canvas.item(0)
  c.selectable = bool;
  c.hasControls = bool;
  c.lockMovementY = !bool;
  c.lockMovementX = !bool;
  c.hoverCursor = bool ? 'move' : 'none';

  canvas.renderAll();

}

async function getPdfData(pdfData) {





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

  console.log("updateImages")


  var shtTitle = fileId
  var row = imgIdx

  console.log('updateImages vals', vals)

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
  
  // if (frntBack == 'front')  $('#shtmImgFront').addClass('d-none');
  // else                      $('#shtmImgBack').addClass('d-none');

  $("#cameraOverlay").removeClass('d-none')
  
}

async function clickPhoto() {

  if (enhancer) {

    let frame = enhancer.getFrame();

    let image_data_url = frame.toCanvas().toDataURL('image/jpeg', 1);

    console.log('image', image_data_url.substring(0, 100))

    var frntback = document.getElementById("enhancerUIContainer").dataset.frntback;

    await showCanvas(frntback, image_data_url)
    showControls(frntback, false)
                                      
    enhancerClose()

  }

}

function enhancerClose() {

  $("#cameraOverlay").addClass('d-none')

}

var maxSize = { width: 466, height: 466 }

// var img 
// var canvas = document.getElementById("shtmCanvas")

function clockwise(frntback) { 

  var fb = frntbackObj(frntback)

  drawOptimizedImage(fb.canvas, fb.image, maxSize, 'clockwise')
  updateImgPreview(fb.canvas, fb.image)

};

function counterclockwise(frntback) { 

  if (frntback == 'front') {
    var img = document.getElementById("shtmImgFront")
  } else {
    var img = document.getElementById("shtmImgBack")
  }

  // var canvas = document.getElementById("canvas");
  // if(canvas) {
  //   document.body.removeChild(canvas);
  // }
  // var canvas = document.createElement("canvas");

  drawOptimizedImage(canvas, img, maxSize, 'anticlockwise')
  updateImgPreview(canvas, img)
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

  var fb = frntbackObj(frntback)

  $(fb.image).attr('src', '#').addClass('d-none')

}

async function editImage(frntback) {

  var fb = frntbackObj(frntback)

  // clearCanvas(fb)
  $(fb.edit.row).find("*").off("click.editListener")

  console.log('fb', fb)

  $(fb.options.row).addClass('d-none')
  $(fb.edit.row).removeClass('d-none')

  // fb.canvas.width = fb.image.width
  // fb.canvas.height = fb.image.height

  // $(fb.canvas).removeClass('d-none')
  // $(fb.image).addClass('d-none')

  // fb.image.dataset['saveSrc'] = fb.image.src

  // var imgSrc = fb.image.src

  var selectionRect
  var currentImage;

  // init canvas
  // var canvas = initCnvas(fb.canvas);
  // canvas.preserveObjectStacking = true;
  // await addImage(canvas, imgSrc, fb);


  showControls(frntback, true)

  var canvas = fb.canvas.fCanvas
  var imgSrc = canvas.toDataURL('image/jpeg', 1)

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
      borderScaleFactor: 1.3,
    });

    selectionRect.scaleToWidth(300);
    canvas.centerObject(selectionRect);
    canvas.add(selectionRect);

  }

  function crop(canvas, fb) {
    // Click the crop button croped the masked area
    $(fb.edit.cropImage).on("click.editListener", function  () {

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

      // init new image instance
      var cropped = new Image();

      // set src value of canvas croped area as toDataURL
      cropped.src = canvas.toDataURL({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });

      console.log('rect', rect.left, rect.top, rect.width, rect.height )

      // after onload clear the canvas and add cropped image to the canvas
      cropped.onload = function () {

        // console.log('cropped', cropped)
        console.log('rect', rect)

        canvas.clear();

        var image = new fabric.Image(cropped);
        
        setDims (canvas, image, fb)
        
        canvas.add(image)
        console.log('canvas', canvas.left, canvas.top, canvas.width, canvas.height )
        canvas.renderAll();

      };
    });
  }

  function saveImage(canvas, fb) {
    //  After click start crop add the mask to canvas
    $(fb.edit.saveImage).on("click.editListener", async function  () {

      
      // let img = canvas.getObjects()[0]

      //    let widthz = img.width * img.scaleX
      //    let heightz = img.height * img.scaleY
      //    let width = img.aCoords.tr.x - img.aCoords.tl.x
      //    let height = img.aCoords.bl.y - img.aCoords.tl.y
      //    let top = img.aCoords.tl.y 
      //    let left = img.aCoords.tl.x 

      // console.log('img', top, left, width, height,  widthz, heightz)

      // // fb.image.removeAttribute('src');
      // $(fb.image).removeAttr('src');
      // $(fb.image).removeData('saveSrc');
      // // fb.image.src = canvas.toDataURL('image/jpeg', 1)

      // fb.image.src = canvas.toDataURL({
      //   // format: 'png',
      //   left: left,
      //   top: top,
      //   width: width,
      //   height:height

      showControls(fb, false)

      $(fb.options.row).removeClass('d-none')
      $(fb.edit.row).addClass('d-none')

    // })

      // await waitForImage(fb.image)
    
      // clearCanvas(fb)
      
    });

  }

  function cancelImage(canvas, fb, imgSrc) {

    $(fb.edit.cancelEditImage).on("click.editListener", async function  () {
      
      // let img = canvas.getObjects()[0]
      // if (img) canvas.remove(img);

      console.log('nbr', canvas.getObjects())
      // canvas.clear()
      canvas.remove(...canvas.getObjects());
      await addImage(canvas, imgSrc, fb);
      showControls(fb, false)

      $(fb.options.row).removeClass('d-none')
      $(fb.edit.row).addClass('d-none')
      
    });

  }

  async function restoreImage(canvas, fb, imgSrc) {

    $(fb.edit.restoreImage).on("click.editListener", async function  () {
      
      let img = canvas.getObjects()[0]
      if (img) canvas.remove(img);
      await addImage(canvas, imgSrc, fb);
      
    });

  }

}

function initCnvas(c) {
  var fCanvas = new fabric.Canvas(c.id, {
    strokeWidth: 15,
    stroke: "rgba(100,200,200,0.5)",
  });
  c.fCanvas = fCanvas
  return fCanvas
}

async function addImage(canvas, imgSrc, fb) {
  const img = new Image();
  img.src = imgSrc;
  await waitForImage(img)

  var oImg = new fabric.Image(img);
  oImg.setControlsVisibility({ mtr: false })

  setDims (canvas, oImg, fb)
    
  canvas.add(oImg);
  canvas.centerObject(oImg);
  canvas.setActiveObject(oImg);
  currentImage = oImg;
  canvas.renderAll();
    
}


function clearCanvas(fb) {

  if ($(fb.canvas).parent('.canvas-container').length > 0 ) {
    
    var canvasCol = $(fb.canvas).parent().parent()
    $(fb.canvas).parent('.canvas-container').remove();
    $('<canvas id="shtmCanvasFront" class="d-none"></canvas>').appendTo(canvasCol);
    $(fb.edit.row).find("*").off("click.editListener")

  }

  $(fb.options.row).removeClass('d-none')
  $(fb.edit.row).addClass('d-none')

  // $(fb.canvas).addClass('d-none')
  // $(fb.image).removeClass('d-none')

}


function frntbackObj(fb) {


  if (fb == 'front') {

    var image               = document.getElementById("shtmImgFront")
    var canvas              = document.getElementById("shtmCanvasFront")

    var options             = document.getElementById("shtmImgOptionsFront")
      var editImage         = document.getElementById("editImageFront")
      var shareImage        = document.getElementById("#shareImageFront")
      var deleteImage       = document.getElementById("#deleteImageFront")
    

    var edit                = document.getElementById("shtmImgEditFront")
      var setupCrop         = document.getElementById("setupCropFront")
      var cropImage         = document.getElementById("cropImageFront")
      var restoreImage      = document.getElementById("restoreImageFront")
      var cancelEditImage   = document.getElementById("cancelEditImageFront")
      var saveImage         = document.getElementById("saveImageFront")

  } else {

    var image = document.getElementById("shtmImgBack")
    var canvas = document.getElementById("shtmCanvasBack")
    var options = document.getElementById("shtmImgOptionsBack")
    var edit = document.getElementById("shtmImgEditBack")
  
  }

  return {

    image:    image,
    canvas:   canvas,

    options:  {

      row:    options,
      edit:   editImage,
      share:  shareImage,
      delete: deleteImage

    },

    edit:     {
      
      row:              edit,
      setupCrop:        setupCrop,
      cropImage:        cropImage,
      restoreImage:     restoreImage,
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

  let containerWidth = $(fb.canvas).parent().parent().width()
  
  console.log('fb.canvas', fb.canvas)
  console.log('container', $(fb.canvas).parent())
  console.log('container', $(fb.canvas).parent().parent())

  console.log('canvas', fb.canvas)
  console.log('fcanvas', fCanvas)

  console.log('fImg', fImg)

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

