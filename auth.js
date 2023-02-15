

const API_KEY   = 'AIzaSyA47A-jDhu3jOQZqo6OYOV4aGsCIY0YT4M'
const CLI_ID    = '806474795673-vcajgv4ncv6rq09j4o01d8tg7f487smm.apps.googleusercontent.com'  
const SCOPES    = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive';
const DISCOVERY = ['https://sheets.googleapis.com/$discovery/rest?version=v4', 
                  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
                  ];

/**
 * The google libraries are loaded, and ready for action!
 */
function proceedAsLoaded() {
  if (Goth.recognize()) {
    Goth.onetap();
  } else {
    gotoTab('Auth')
    forceSignin();
  }
}

/**
 * They have to correctly get through the button click / sign up flow to proceed.
 */
function forceSignin() {
  Goth.button('signin', {type: 'square', size: 'large', text: 'signup_with'});
}

function signoutEvent() {
  document.getElementById('signin').style.display = 'block';
  gotoTab('Auth')
  forceSignin();
}

function revokeEvent() {
  document.getElementById('signin').style.display = 'block';
  Goth.revoke()
  gotoTab('Auth')
  forceSignin();
}

function proceedAsSignedIn() {
  document.getElementById('signin').style.display = 'none';
  runApp();
}

/**
 * Handle the lifecycle of authenticated status
 */
function gothWatch(event) {
  switch (event) {
    case 'signin':
      proceedAsSignedIn();
      break;
    case 'revoke':
    case 'signout': 
      signoutEvent();
      break;
    case 'loaded':
      proceedAsLoaded();
      break;
    case 'onetap_suppressed':
      forceSignin();  // If a user bypasses onetap flows, we land them with a button.
      break;
    default: 
      console.log("Well, this is a surprise!");
      console.log(event);
  }
}

/**
 * Wire up the main ux machinery.
 */
function authorize() {
  Goth.observe(gothWatch);
  Goth.load(CLI_ID, API_KEY, SCOPES, DISCOVERY);
}

async function runApp() {

  $("#login-form")[0].reset();
  $('#liMsg').html("&nbsp;")
  $("#login-modal").modal('show');

}

async function submitLogin() {

  user = Goth.user()

  var cfrmPwdMode = !$("#liDisplayConfirmPassword").hasClass('d-none')
  $('#liMsg').html("&nbsp;")

  var usr     = $('#liUser').val()
  var pwd     = $('#liPassword').val()
  var pwdCfrm = $('#liConfirmPassword').val()
  
  var rtn = await getSSId(usr);

  if (rtn.fileId) {spreadsheetId = rtn.fileId}
  else {
    await confirm('getSSId error: ' + rtn.msg);
    window.close()
  }

  var ui = await initialUI();
  var x = arrOptions.shtList

  var t = "The quick brown fox jumped over the lazy dog"

  if (x == t && !cfrmPwdMode) {
    $("#liDisplayConfirmPassword").removeClass('d-none')
    $('#liMsg').html("Confirm password")
    return
  }

  if (cfrmPwdMode && pwd != pwdCfrm && pwd !='') {
    $('#liMsg').html("Passwords do not match")
    return
  } 
  
  if (cfrmPwdMode && !strongRegex.test(pwd)) {
    $('#liMsg').html(invalidPwdMsg)
    return
  } 

  currUser.pwd = pwd

  if (cfrmPwdMode) {
    var encPwd = await encryptMessage(t, pwd)
    await updateOption('shtList', encPwd)
    var x = arrOptions.shtList
  }

  var dx = await decryptMessage(x, pwd)
  if (dx != t) {
    $('#liMsg').html("Invalid Login")
    currUser.pwd = null
    return
  }

  await loadSheets()

  $("#login-modal").modal('hide');
  $("#liDisplayConfirmPassword").addClass('d-none')

  console.log('post loadsheets')

  goHome()    

    
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
