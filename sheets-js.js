
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

  $('#shtmImgFront').removeAttr('src').addClass('d-none')
  $('#shtmImgBack').removeAttr('src').addClass('d-none')

  $('#shtmSheetName').html(shtTitle)

  $("#sheet-modal").modal('show');


  $('#shtmArrIdx').val(arrIdx)

  var vals = shtEnc ? await decryptArr(shtVals[arrIdx]) : shtVals[arrIdx]


  var shtObj = makeObj(vals, shtHdrs)

  var imgs = await fetchImages(shtEnc, shtObj['File Id'])

  console.log('imgs', imgs.length)

  $('#shtmDocument').val(shtObj['Document'])
  $('#shtmExpiry').val(shtObj['Expiry'])
  $('#shtmImgBack').val(shtObj['Account Nbr'])
  $('#shtmNotes').val(shtObj['Notes'])
  $('#shtmFavorite').val(shtObj['Favorite'])
  $('#shtmFileId').val(shtObj['File Id'])
  $('#shtmImgFront').attr('src', imgs[0])
  $('#shtmImgBack').attr('src', imgs[1])
  $('#shtmSaveImgFront').attr('src', imgs[0])
  $('#shtmSaveImgBack').attr('src', imgs[1])

  if (imgs[0])  $('#shtmImgFront').removeClass('d-none')
  else          $('#shtmImgFront').addClass('d-none');
  if (imgs[1])  $('#shtmImgBack').removeClass('d-none')
  else          $('#shtmImgBack').addClass('d-none');
  // document.getElementById("shtmImgFront").src = imgs[0];
  // document.getElementById("shtmImgBack").src = imgs[1];
  // document.getElementById("shtmSaveImgFront").src = imgs[0];
  // document.getElementById("shtmSaveImgBack").src = imgs[1];

  $('#btnShtmDelete').removeClass('d-none')

  modal(false)

}

async function btnShtmSubmitSheetHtml() {

  if (!$('#sheet-form').valid()) return

  var arrIdx = $('#shtmArrIdx').val() ? $('#shtmArrIdx').val()*1 : -1

  if (arrIdx > -1) {                                                       // update existing course

    var vals = [...shtVals[arrIdx]]

    vals[shtHdrs.indexOf("Document")] = $('#shtmDocument').val()
    vals[shtHdrs.indexOf("Expiry")] = $('#shtmExpiry').val()
    vals[shtHdrs.indexOf("Img Front")] = $('#shtmImgFront').val()
    vals[shtHdrs.indexOf("Img Back")] = $('#shtmImgBack').val()
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
    vals[shtHdrs.indexOf("Img Front")] = $('#shtmImgFront').val()
    vals[shtHdrs.indexOf("Img Back")] = $('#shtmImgBack').val()
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

  imgs[0] = document.getElementById("shtmImgFront").src
  imgs[1] = document.getElementById("shtmImgBack").src
  savImgs[0] = document.getElementById("shtmSaveImgFront").src;
  savImgs[1] = document.getElementById("shtmSaveImgBack").src;

  // console.log('submit', [...imgs])
  // console.log('submit', [...savImgs])

  console.log('fileId', fileId)

  await postImages(shtEnc, fileId, imgs, savImgs)

  $('#shtmImgFront').removeAttr('src').addClass('d-none')
  $('#shtmImgBack').removeAttr('src').addClass('d-none')

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

  $('#shtmImgFront').removeAttr('src').addClass('d-none')
  $('#shtmImgBack').removeAttr('src').addClass('d-none')

  $("#sheet-form")[0].reset();
  $('#shtmModalTitle').html('')
  $("#sheet-modal").modal('show');

   $('#btnShtmDelete').addClass('d-none')

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

  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {

      if (input.id == "shtmInputFront")   {
        $('#shtmImgFront').attr('src', e.target.result);
        $('#shtmImgFront').removeClass('d-none');
      } else {
        $('#shtmImgBack').attr('src', e.target.result);
        $('#shtmImgBack').removeClass('d-none');
      }
                                      
    }

    reader.readAsDataURL(input.files[0]);
  }

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

 
  if (item.type.indexOf("image") === 0)
  {
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
