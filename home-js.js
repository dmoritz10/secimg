
async function loadSheets() {

    await checkAuth()

    var sheets = await gapi.client.sheets.spreadsheets.get({
        
        spreadsheetId: spreadsheetId
      
      }).then(function(response) {
        
        return response.result.sheets
      
      }, function(response) {
        console.log('Error: ' + response.result.error.message);
        return null
    
      });

    console.log('loadSheets', sheets)


    if (sheets) {

      var $tblSheets = $("#hmContainer > .d-none")

      var x = $tblSheets.clone();
      $("#hmContainer").empty();
      x.appendTo("#hmContainer");

      var nbrSheets = 0
      var nbrProviders = 0

    
      for (var j = 0; j < sheets.length; j++) {

        var sht = sheets[j].properties

        if (sht.title == 'template') templateSheetId = sht.sheetId

          secSht[sht.title] = {
            id:   sht.sheetId,
            cols: sht.gridProperties.columnCount,
            rows: sht.gridProperties.rowCount,
            enc:  false
          }

        var ele = $tblSheets.clone();

        if (sht.gridProperties.columnCount == arrOptions['Nbr Columns per Sheet']
              && sht.title != 'template'
            ) {

          var enc = await testEncrypted(sht.title)

          secSht[sht.title].enc = enc.enc
          secSht[sht.title].isSecSht = enc.isSecSht


          if (enc.isSecSht) {

            ele.find('#hmSheet')[0].innerHTML = sht.title

            if (enc.enc) {
              ele.find('#btnCrypt')[0].innerHTML = "decrypt"
              ele.find('#btnCrypt').addClass('btn-success')
              ele.find('#btnCrypt').removeClass('btn-danger')
              ele.find('#btnCrypt')[0].setAttribute("onclick", "decryptSheet('" + sht.title + "')");

            } else {
              ele.find('#btnCrypt')[0].innerHTML = "encrypt"
              ele.find('#btnCrypt').removeClass('btn-success')
              ele.find('#btnCrypt').addClass('btn-danger')
              ele.find('#btnCrypt')[0].setAttribute("onclick", "encryptSheet('" + sht.title + "')");
            }

            ele.find('#hmShowSheet')[0].setAttribute("onclick", "listSheet('" + sht.title + "')");

            ele.removeClass('d-none')

            ele.appendTo("#hmContainer");

            nbrSheets++
            nbrProviders += sht.gridProperties.rowCount - 1

          }

        }
    
      }

      $('#hmNbrSheets').html(nbrSheets)
      $('#hmNbrProviders').html(nbrProviders)

      console.log('secSht', secSht)

      if (secSht.length == 0) toast("There are no Secure Sheets to display")

    }

}


async function goHome() {

  var signinStatus = await gapi.auth2.getAuthInstance().isSignedIn.get()
   if (!signinStatus) {
     gotoTab('Auth')
     return
   }
  
  gotoTab('Home')

}

async function btnHMChangePwdHtml() {

  var pwdText = 'The quick brown fox jumped over the lazy dog'

  var cPwd = await verifyCurrPwd(pwdText, "Enter Current Password")
  if (!cPwd) return

  var nPwd = await requestNewPwd("Enter New Password")
  if (!nPwd) return

  modal(true)

  var encShts = []

  for (const sht in secSht) {

    if (secSht[sht].enc) {

      var objSht = await openShts(
        [
          { title: sht, type: "all" }
        ])
    
      toast("Decrypting sheet " + sht, 5000)
      var shtHdrs = objSht[sht].colHdrs
      var shtArr = [shtHdrs].concat(objSht[sht].vals)
      var decSht = await decryptArr(shtArr, cPwd)

      toast("Updating sheet " + sht, 5000)
      await updateSheet(sht, decSht)

      encShts.push(sht)

      secSht[sht].enc = false

    }

  }

  currUser.pwd = nPwd
  var encPwd = await encryptMessage(pwdText, nPwd)
  await updateOption('shtList', encPwd)
  toast("New Password now in effet " + sht, 5000)

  console.log('encShts', encShts)

  for (const s in encShts) {

      var sht =  encShts[s]

    console.log('sht', sht)

      var objSht = await openShts(
        [
          { title: sht, type: "all" }
        ])
    
      toast("Encrypting sheet " + sht, 5000)
      var shtHdrs = objSht[sht].colHdrs
      var shtArr = [shtHdrs].concat(objSht[sht].vals)
      var encSht = await encryptArr(shtArr, nPwd)

      toast("Updating sheet " + sht, 5000)
      await updateSheet(sht, encSht)

      secSht[sht].enc = true

  }


  toast("Finalizing ...", 5000)


  modal(false)

  toast("Change of password is complete", 3000)

}

async function verifyCurrPwd(pwdText, prmpt = '') {
  
  var pwdEnc = arrOptions.shtList

  var pwd = await prompt(prmpt, "password");

  var dx = await decryptMessage(pwdEnc, pwd)

  if (dx != pwdText) {await confirm("Invalid password");return null}

  return pwd

}


async function requestNewPwd(prmpt) {
  
  var pwd = await prompt(prmpt, "password");

  if (!strongRegex.test(pwd)) {
    var confirmOK = await confirm(invalidPwdMsg)
    return null
  }

  var pdrcnfrm = await prompt("Confirm Password", "password");

  if (pwd != pdrcnfrm) {
    var confirmOK = await confirm("Passwords don't match.")
    return null
  }

  return pwd

}

async function btnNewSheetHtml() {

  var title = await prompt('Enter name for new sheet', "text");

  if (!title) return

  var exists = false
  for (let x in secSht) {
    console.log(x)
    if (x.toLowerCase() == title.toLowerCase()) {
      exists = true
      break;
    }
  }

  if (exists) {
    await confirm('A Sheet with that name already exists')
    return
  }

  // create new sheet by copying template sheet.  It has exactly 11 columns and 1 row.
  var params = {
    spreadsheetId: spreadsheetId,  
    sheetId: secSht['template'].id,  
  };

  var copySheetToAnotherSpreadsheetRequestBody = {
    destinationSpreadsheetId: spreadsheetId
  };

  var sht = await gapi.client.sheets.spreadsheets.sheets.copyTo(params, copySheetToAnotherSpreadsheetRequestBody)
  
    .then(function(response) {
      console.log(response.result);
      return response.result
      }, function(reason) {
        console.error('error: ' + reason.result.error.message);
        return null
      })


  // rename sheet to that provided by user

  const rq = {"requests" : [
    {
     updateSheetProperties: {
      properties: {
       sheetId: sht.sheetId,
       title: title,
      },
      fields: 'title'
      }
     }]}
   ;
   
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: rq})

    .then(response => {

      console.log('rename complete')
      console.log(response)

    }, function (reason) {
      console.error('error updating sheet "' + "title" + '": ' + reason.result.error.message);
      alert('error updating sheet "' + 'title' + '": ' + reason.result.error.message);
    });

  // Put encrypted header row in new sheet
  
  var hdrs = ['Provider','Login','Password','Account Nbr','Pin Nbr','Login Url','Security Q/A','Notes','Auto Pay','Favorite','Last Change']
  var encHdrs = await encryptArr(hdrs)
  var resource = {
    "majorDimension": "ROWS",
    "values": [encHdrs]
  }

  var rng = calcRngA1(1, 1, 1, 11)

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
      console.error('error updating sheet "' + "1" + '": ' + reason.result.error.message);
      alert('error updating sheet "' + '1' + '": ' + reason.result.error.message);
    });

  secSht[title] = {
    id:   sht.sheetId,
    cols: sht.gridProperties.columnCount,
    rows: sht.gridProperties.rowCount,
    enc:  true
  }
    

  loadSheets()

}