

async function getSSId(currUser) {

  // var q = "name = 'secsht - " + currUser +
  var q = "name = '" + currUser +
      "' AND " + "mimeType='application/vnd.google-apps.spreadsheet'" +
      " AND " + "trashed = false"

  var ssId = await gapi.client.drive.files.list({
      q: q,
      fields: 'nextPageToken, files(id, name, ownedByMe)',
      spaces: 'drive'
  }).then(function (response) {

      var files = response.result.files

      // files = files.filter(item => item.ownedByMe);    // remove files that are shared with me
      if (!files || files.length == 0)
          return { fileId: null, msg: "'Secure Sheet' not found" }

      if (files.length > 1)
          return { fileId: null, msg: "'Secure Sheet' not unique" }

      return { fileId: files[0].id, msg: 'ok' }

  })

  return ssId

}

async function initialUI() {
  timerStart = new Date()

    arrShts = await openShts(
      [
        { title: 'Settings', type: "all" }
      ])
    

  console.log('initialUI', arrShts)

  arrOptions    = toObject(arrShts.Settings.vals)
  optionsIdx    = toObjectIdx(arrShts.Settings.vals)

 
};

var confirm = function (msg) {

  return new Promise(resolve => {

    bootbox.confirm({

      closeButton: false,
      // size: "small",
      message: '<h5>' + msg + '</h5>',
      centerVertical: true,


      callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/

        if (result) {

          resolve(true)

        } else {

          resolve(false)

        }
      }
    });
  });
}


var prompt = function (title, inputType) {

  return new Promise(resolve => {

    bootbox.prompt({

      closeButton: false,
      backdrop: true,
      title: '<h5>' + title + '</h5>',
      centerVertical: true,
      inputType: inputType,


      callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/

          resolve(result)

      }
    });
  });
}

var openShts = async function (shts) {


  return new Promise(async resolve => {

    shtRngs = []
    
    for (s in shts) {

      var sheet = shts[s]

      switch (sheet.type) {

        case "headers":
          shtRngs.push("'" + sheet.title + "'!1:1")
          break;

        case "all"  :
          shtRngs.push("'" + sheet.title + "'!A1:ZZ10000")
          break;

      }

    }

  await checkAuth()

  gapi.client.sheets.spreadsheets.values.batchGet({spreadsheetId: spreadsheetId, ranges: shtRngs})

  .then(async function(response) {

    console.log('getresponse', response)
    
    var allShts = response.result.valueRanges

    var arr = []

    for (s in allShts) {
    
      var shtVals = allShts[s].values

      var colHdrs = shtVals[0]
      var vals = shtVals.slice(1)
      var rowCnt = vals ? vals.length : 0

      var shtTitle = allShts[s].range.split('!')[0].replace(/'/g,"")

      arr[shtTitle] =  {  
        colHdrs:      colHdrs,
        vals:         shtVals.slice(1),
        columnCount:  colHdrs.length,
        rowCount:     rowCnt
      }
      
    }

    resolve(arr)
      
  },

    function(response) {

      console.log('Error: ' + shtTitle + ' - ' + response.result.error.message);
          
    });

  })

}




function parseDateISOString(s) {
  let ds = s.split(/\D/).map(s => parseInt(s));
  ds[1] = ds[1] - 1; // adjust month
  return new Date(...ds);
}


function calcRngA1(r, c, nbrRows, nbrCols) {

  var rngA1 = colNbrToLtr(c) + r + ':' + colNbrToLtr(c + nbrCols - 1) + (r + nbrRows - 1)

  return rngA1
 
}

function colNbrToLtr(n){
   if (n < 27){
      return String.fromCharCode(64 + n);
   }
  else {
      var first = Math.round(n / 26);
  var second = n % 26;
  return String.fromCharCode(64 + first) + String.fromCharCode(64 + second);
   }
}

function toObject(arr) {
  var rv = { };
  for (var i = 0; i < arr.length; ++i)
  if (arr[i] !== undefined) rv[arr[i][0]] = arr[i][1];
  return rv;
}

function toObjectIdx(arr) {
  var rv = { };
  for (var i = 0; i < arr.length; ++i)
  if (arr[i] !== undefined) rv[arr[i][0]] = i;
  return rv;
}

function makeObj(courseInfo, cols) {

  var rtnObj = { }
  for (var i = 0; i < courseInfo.length; ++i)
  if (courseInfo[i] !== undefined) rtnObj[cols[i]] = courseInfo[i];

  return rtnObj;

}

function formattime(dte){

   if (isNaN(Date.parse(dte))) return


  var zero = '0', hours, minutes, seconds, time;
  time = new Date(dte);

  var hh = (zero + time.getHours()).slice( - 2);
  var mm = (zero + time.getMinutes()).slice( - 2);
  var ss = (zero + time.getSeconds()).slice( - 2);
  return hh +':' + mm +':' + ss;
}

function formatNumber (str) { 

    if (!str) {return}
  var x = str.toString().split('.');
  var x1 = x[0]; 
    var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2'); 
    }
  return x1 + x2; 

};

function toast(e, delay = 5000) {

  $("#toast-content").html(e)

  $("#myToast").toast({delay: delay});

  $("#myToast").toast('show');

}


function promiseRun (func) {

// this is a trick to convert the arguments array into an array, and drop the first one
  var runArgs = Array.prototype.slice.call(arguments).slice(1);

  return new Promise (function (resolve, reject) {

    google.script.run
      .withSuccessHandler(function (result) {
        resolve(result);
      })
      .withFailureHandler(function (error) {
        reject(error);
      })

    [func].apply(this, runArgs) ;
        
  })
}

function gotoTab(tabName) {

  var $tab = $('#' + tabName )

  $( '.tab-content > div.active' ).removeClass( 'active show' );
  
  $tab.addClass( 'active show' );

}

function formatDate(d) {

  return (d.getMonth()+1)+'/'+ d.getDate()+'/'+d.getFullYear()

}

function setupFormValidation() {

    $.validator.setDefaults({
      highlight: function (element) {
        $(element).parent().addClass('text-danger');
      },
      unhighlight: function (element) {
        $(element).parent().removeClass('text-danger');
      },
      errorElement: 'bold',
      errorClass: 'form-control-feedback d-block',
      errorPlacement: function (error, element) {
        if (element.parent('.input-group').length) {
          error.insertAfter(element.parent());
        } else if (element.prop('type') === 'checkbox') {
          error.appendTo(element.parent().parent().parent());
        } else if (element.prop('type') === 'radio') {
          error.appendTo(element.parent().parent().parent());
        } else {
          error.insertAfter(element);
        }
      },
    });

 
  $("#sheet-form").validate();
 
}

function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}


function readOption(key, defaultReturn = '') {

  if (!arrOptions[key]) return defaultReturn
  if (arrOptions[key] == 'null') return defaultReturn

  try { var rtn = JSON.parse(arrOptions[key]) }
  catch (err) { var rtn = arrOptions[key] }

  return rtn

}

async function updateOption(key, val) {

  if (typeof val === "object") {
    var strVal = JSON.stringify(val)
  } else {
    var strVal = val
  }

  arrOptions[key] = strVal

  var resource = {
    "majorDimension": "ROWS",
    "values": [[
      key,
      strVal
    ]]
  }

  var row = optionsIdx[key] + 2

  var params = {
    spreadsheetId: spreadsheetId,
    range: "'Settings'!A" + row + ":B" + row,
    valueInputOption: 'RAW'
  };

  await checkAuth()

  var gapiResult = await gapi.client.sheets.spreadsheets.values.update(params, resource)

    .then(
      async response => {
        return response
      },

      async reason => {

        console.log('updateOption')
        console.log(reason)

        bootbox.alert('error updating option "' + key + '": ' + reason.result.error.message);

        return null

      }
    );

}

async function checkAuth() {

  var signinStatus = await gapi.auth2.getAuthInstance().isSignedIn.get()
 
   if (!signinStatus) {
     gotoTab('Auth')
     return
   }
  

  var minAuthRemaining = (new Date(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().expires_at) - new Date()) / (1000 * 60)
  if (minAuthRemaining < 10) {
    console.log('auth reload - ' + Math.round(minAuthRemaining));
    // alert('auth reload - ' + Math.round(minAuthRemaining));
    await gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse()
  } else {
    console.log('auth ok - ' + minAuthRemaining);
  }

}

function msToHHMMSS(ms) {

  ms = Math.abs(ms)

  let seconds = Math.floor((ms / 1000) % 60);
  let minutes = Math.floor((ms / 1000 / 60) % 60);
  let hours = Math.floor((ms / 1000 / 3600) % 24)

  if (hours) hours = (hours < 10) ? "0" + hours : hours
  else hours = false
  if (hours) minutes = (minutes < 10) ? "0" + minutes : minutes
  else minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  var hhmmss = []

  if (hours) hhmmss.push(hours)
  hhmmss.push(minutes)
  hhmmss.push(seconds)

  return hhmmss.join(':');

}

function is2dArray(array){

  if(array[0] === undefined){
    return false;
  } else {
    return (array[0].constructor === Array);
  }
}

async function updateSheet(title, vals) {

  await checkAuth()

  var resource = {
    "majorDimension": "ROWS",
    "values": vals   
  }


  var rng = calcRngA1(1, 1, vals.length, vals[0].length)

  var params = {
  spreadsheetId: spreadsheetId,
  range: "'" + title + "'!" + rng,
  valueInputOption: 'RAW'
  };


  await gapi.client.sheets.spreadsheets.values.update(params, resource)
      .then(function (response) {
          console.log('Sheet update successful')
          console.log(response)
      }, function (reason) {
          console.error('error updating sheet "' + title + '": ' + reason.result.error.message);
          alert('error updating sheet "' + title + '": ' + reason.result.error.message);
      });

} 

async function updateSheetRow(vals, shtIdx) {


  await checkAuth()

  var resource = {
    "majorDimension": "ROWS",
    "values": [vals]    
  }

  if (shtIdx > -1) {

    console.log('update', shtIdx)

    var row = shtIdx * 1 + 2
    var rng = calcRngA1(row, 1, 1, shtHdrs.length)

    var params = {
      spreadsheetId: spreadsheetId,
      range: "'" + shtTitle + "'!" + rng,
      valueInputOption: 'RAW'
    };


    await gapi.client.sheets.spreadsheets.values.update(params, resource)
      .then(function (response) {
        console.log('Sheet update successful')
        console.log(response)
      }, function (reason) {
        console.error('error updating sheet "' + row + '": ' + reason.result.error.message);
        alert('error updating sheet "' + row + '": ' + reason.result.error.message);
      });

  } else {

    var row = 2
    var rng = calcRngA1(row, 1, 1, shtHdrs.length)

    var params = {
      spreadsheetId: spreadsheetId,
      range: "'" + shtTitle + "'!" + rng,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS'
    };

    await gapi.client.sheets.spreadsheets.values.append(params, resource)
      .then(async function (response) {

        console.log('sheetId', shtId)
        console.log(secSht)

        // var request = { "requests": 
        //   [{ "sortRange": 
        //     { "range": { 
        //       "sheetId": shtId, 
        //       "startRowIndex": 1, 
        //       "endRowIndex": shtVals.length+2, 
        //       "startColumnIndex": 0, 
        //       "endColumnIndex": shtHdrs.length 
        //     }, 
        //     "sortSpecs": 
        //     [{ "sortOrder": "ASCENDING", "dimensionIndex": 0 }] 
        //     } 
        //   }] 
        // }

        // await gapi.client.sheets.spreadsheets.batchUpdate({
        //   spreadsheetId: spreadsheetId,
        //   resource: request
        // }).then(response => {

        //   console.log('sort complete')
        //   console.log(response)

        // })

      },

        function (reason) {

          console.error('error appending sheet "' + shtTitle + '": ' + reason.result.error.message);
          bootbox.alert('error appending sheet "' + shtTitle + '": ' + reason.result.error.message);

        });

  }

}

function modal(state) {
  if (state) {
    $("#overlay").fadeIn("slow");;

    // $("#overlay").css({"display":"block"});
  } else {
    $("#overlay").fadeOut("slow");;
  }
}