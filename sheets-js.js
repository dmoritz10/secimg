
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
  $("#shtNbrProviders").html(vals.length)

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
      var provider = await decryptMessage(shtObj['Provider'])
    } else {
      var fav = shtObj['Favorite']
      var provider = shtObj['Provider']
    }


    var ele = $tblSheets.clone();

    ele.find('#shtProvider')[0].innerHTML = provider

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

      $("#shtContainer #shtProvider").filter(function() {
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


  $("#sheet-modal").modal('show');
  $("#sheet-form")[0].reset();

  $('#shtmSheetName').html(shtTitle)

  $('#shtmArrIdx').val(arrIdx)

  var vals = shtEnc ? await decryptArr(shtVals[arrIdx]) : shtVals[arrIdx]

  var shtObj = makeObj(vals, shtHdrs)

  $('#shtmProvider').val(shtObj['Provider'])
  $('#shtmExpiry').val(shtObj['Expiry'])
  $('#shtmImgFront').val(shtObj['Img Front'])
  $('#shtmImgBack').val(shtObj['Account Nbr'])
  $('#shtmNotes').val(shtObj['Notes'])
  $('#shtmFavorite').val(shtObj['Favorite'])
  $('#shtmFileId').val(shtObj['File Id'])

  $('#btnDeleteSheet').removeClass('d-none')

}

async function btnShtmSubmitSheetHtml() {

  if (!$('#sheet-form').valid()) return

  var arrIdx = $('#shtmArrIdx').val() ? $('#shtmArrIdx').val()*1 : -1

  if (arrIdx > -1) {                                                       // update existing course

    var vals = [...shtVals[arrIdx]]

    vals[shtHdrs.indexOf("Provider")] = $('#shtmProvider').val()
    vals[shtHdrs.indexOf("Expiry")] = $('#shtmExpiry').val()
    vals[shtHdrs.indexOf("Img Front")] = $('#shtmImgFront').val()
    vals[shtHdrs.indexOf("Img Back")] = $('#shtmImgBack').val()
    vals[shtHdrs.indexOf("Notes")] = $('#shtmNotes').val()
    vals[shtHdrs.indexOf("Last Change")] = formatDate(new Date())
    vals[shtHdrs.indexOf("Favorite")] = $('#shtmFavorite').val()
    vals[shtHdrs.indexOf("File Id")] = $('#shtmFileId').val()

  } else {

    if (dupProvider($('#shtmProvider').val())) {
      toast("Provider already exists")
      return
    }

    var fileId = await buildImageFile()

    var vals = []

    vals[shtHdrs.indexOf("Provider")] = $('#shtmProvider').val()
    vals[shtHdrs.indexOf("Expiry")] = $('#shtmExpiry').val()
    vals[shtHdrs.indexOf("Img Front")] = $('#shtmImgFront').val()
    vals[shtHdrs.indexOf("Img Back")] = $('#shtmImgBack').val()
    vals[shtHdrs.indexOf("Notes")] = $('#shtmNotes').val()
    vals[shtHdrs.indexOf("Last Change")] = formatDate(new Date())
    vals[shtHdrs.indexOf("Favorite")] = $('#shtmFavorite').val()
    vals[shtHdrs.indexOf("File Id")] = fileId

  }

  var shtIdx = arrIdx == -1 ? -1 : shtIdxArr[arrIdx]  // get the row nbr on the sheet from shtIdxArr

  var valsEnc = shtEnc ? await encryptArr(vals) : vals

  await updateSheetRow(valsEnc, shtIdx)

  $("#sheet-modal").modal('hide');

  updateUI(valsEnc, arrIdx)

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

  var providerDec = shtEnc ? await decryptMessage(valsEnc[0]) : valsEnc[0]
  var $provider = $('#shtContainer > div').find('#shtProvider').eq(arrIdx+1) // first ele is template d-none
  $provider.html(providerDec)

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

  $("#sheet-modal").modal('show');
  $("#sheet-form")[0].reset();
  $('#shtmModalTitle').html('')

   $('#btnDeleteSheet').addClass('d-none')

}

async function btnDeleteSheetHtml() {

  var confirmOK = await confirm("Are you sure you want to delete this provider ?")

  if (!confirmOK) return

  var idx = shtIdxArr[$('#shtmArrIdx').val() * 1]

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
        },
        {
          "deleteSpreadsheet": {
            
              "sheetId": $('#shtmFileId').val()
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

  $("#sheet-modal").modal('hide');

  listSheet(shtTitle)

}

function dupProvider(provider) {

  let arrProviders = shtVals.map(a => a[shtHdrs.indexOf('Provider')]);

  if (arrProviders.indexOf(provider) > -1) {
    return true
  } else {
    return false
  }

}


async function showFile(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
        $('#shtmImgFront').attr('src', e.target.result);

        

    }

    reader.readAsDataURL(input.files[0]);
}
}

async function enc() {

  console.time("enc")
  var img = document.getElementById("shtmImgFront").src;

  var idx = 0
  var encPromiseArr = []

  while (idx < img.length) {

    encPromiseArr.push(encryptMessage(img.substring(idx, idx + 25000)))
    idx = idx+25000

  }

  var encArr = await Promise.all(encPromiseArr)

  console.timeLog("enc")


  var shtTitle = "Sheet10"
  var row = 2
  var rng = calcRngA1(row, 1, 1, encArr.length)

  var params = {
    spreadsheetId: spreadsheetId,
    range: "'" + shtTitle + "'!" + rng,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS'
  };

  var resource = {
    "majorDimension": "ROWS",
    "values": [encArr]    
  }

  await gapi.client.sheets.spreadsheets.values.append(params, resource)
    .then(async function (response) {

      console.log('append successful')
      console.timeEnd("enc")

    },

      function (reason) {

        console.error('error appending sheet "' + shtTitle + '": ' + reason.result.error.message);
        bootbox.alert('error appending sheet "' + shtTitle + '": ' + reason.result.error.message);
        console.timeEnd("enc")

      });



}


async function dec() {
  console.time("dec")

  var shtTitle = "Sheet10"
  var row = await prompt("Enter row nbr to decrypt", "number");
  var rng = calcRngA1(row*1, 1, 1, 1000)

  var params = {
    spreadsheetId: spreadsheetId,
    range: "'" + shtTitle + "'!" + rng
  };

  var vals = await gapi.client.sheets.spreadsheets.values.get(params)
    .then(function(response) {
      
      console.timeLog("dec")
      console.log(response.result);
      return response.result.values

    }, function(reason) {
      console.error('error: ' + reason.result.error.message);
    });


  var decVals = vals[0].map( ele =>  decryptMessage(ele))

  var decArr = await Promise.all(decVals)

  document.getElementById("shtmImgBack").src = decArr.join('')

  console.timeEnd("dec")

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

