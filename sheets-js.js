
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

  $('#btnDeleteSheet').removeClass('d-none')

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


  var img = document.getElementById("shtmImgFront").src;

  var pimg = img.substring(0,100000)
  var rimg = img.substring(100001)


  alert (img)

  var encimg = await encryptMessage(pimg)
  var rencimg = await encryptMessage(rimg)
  console.log(encimg)
  console.log(rencimg)
alert('1')
  // document.getElementById("shtmImgFront").src = encimg
  alert('2')
  // document.getElementById("shtmImgBack").src = rencimg

  front = encimg
  back = rencimg
  alert('3')

}
async function dec() {

  alert('1')
  // var decimg = await decryptMessage(document.getElementById("shtmImgFront"))
  var decimg = await decryptMessage(front)

  alert('2')
  // var rdecimg = await decryptMessage(document.getElementById("shtmImgBack"))
  var rdecimg = await decryptMessage(back)
  alert('3')
  document.getElementById("shtmImgBack").src = decimg 
  alert('4')

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

  } else {

    if (dupProvider($('#shtmProvider').val())) {
      toast("Provider already exists")
      return
    }

    var vals = []

    vals[shtHdrs.indexOf("Provider")] = $('#shtmProvider').val()
    vals[shtHdrs.indexOf("Expiry")] = $('#shtmExpiry').val()
    vals[shtHdrs.indexOf("Img Front")] = $('#shtmImgFront').val()
    vals[shtHdrs.indexOf("Img Back")] = $('#shtmImgBack').val()
    vals[shtHdrs.indexOf("Notes")] = $('#shtmNotes').val()
    vals[shtHdrs.indexOf("Last Change")] = formatDate(new Date())
    vals[shtHdrs.indexOf("Favorite")] = $('#shtmFavorite').val()

  }

  var shtIdx = arrIdx == -1 ? -1 : shtIdxArr[arrIdx]  // get the row nbr on the sheet from shtIdxArr

  var valsEnc = shtEnc ? await encryptArr(vals) : vals

  await updateSheetRow(valsEnc, shtIdx)

  $("#sheet-modal").modal('hide');

  updateUI(valsEnc, arrIdx)

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

  // try {
  // 	var clipboardItems = await navigator.clipboard.read();
  //   console.log(clipboardItems);
  // 	var blobOutput = await clipboardItems[0].getType('image/png');
  //   console.log(blobOutput)
  //   document.getElementById('shtmImgFront').src =
  //     window.URL.createObjectURL(blobOutput);
  //   console.log('Image pasted.');
  // } catch(e) {
  // 	console.log('Failed to read clipboard', e);
  // }
  // return


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
