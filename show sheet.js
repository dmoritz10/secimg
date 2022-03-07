async function showSheet(idx) {

  if (idx === null) return                  // null is from browseProvider

  var sht = []

  var vals = shtEnc ? await decryptArr(shtVals[idx]) : shtVals[idx]
  
  $("#ssSheet")[0].innerHTML = vals[shtHdrs.indexOf('Provider')]
  $("#ssArrIdx").val(idx)

  for (var i=1; i<shtHdrs.length;i++) {

    var val = vals[i].replace(/\n|\r\n|\r/g, '<br/>');
    var icon = ''

    if (val) {
      if (validateUrl(val)) {

        icon =  '<div class="label cursor-pointer "><a target="_blank"  href=' + val + '><span class="material-icons">open_in_new</span></a></div>'
        val = val.length < 17 ? val : val.substring(0,14) + "..."

      } else {

        icon = '<div class="label cursor-pointer" onClick="copyToClpbrd(' + "'" + val + "'" + ')"><span class="material-icons">content_copy</span></div>'
    
      }
    }

    sht.push([shtHdrs[i], val, icon])

  }
  
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

} 

function browseProvider(dir) {

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