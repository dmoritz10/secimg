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
        
  imgs[0] ? val = '<span><img class="showImg" src=' + imgs[0] + "></embed></span>" : val=''
  icon = '<div class="label cursor-pointer" onClick="openImg(' + "'" + imgs[0] + "'" + ')"><span class="material-icons">open_in_new</span></div>'
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

function openImg(img) {

  var newTab = window.open("", "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=400");
  newTab.document.body.innerHTML = '<img src=' + img + '>'

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