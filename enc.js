
async function testEncrypted(title) {

    var objSht = await openShts(
        [
            { title: title, type: "headers" }
        ])

    var shtHdrs = objSht[title].colHdrs

    if (shtHdrs[0] == 'Provider') {

        return {
            enc: false,
            isSecSht: true
        }

    }

    if (await decryptMessage(shtHdrs[0]) == "Provider") {

        return {
            enc: true,
            isSecSht: true
        }

    }

    return {
        enc: null,
        isSecSht: false
    }

}

async function encryptSheet(title) {

    // var ts = new Date()

    modal(true)

    toast("Encrypting sheet " + title, 5000)

    var objSht = await openShts(
        [
            { title: title, type: "all" }
        ])

    var shtHdrs = objSht[title].colHdrs
    var shtArr = [shtHdrs].concat(objSht[title].vals)

    var decHdrs = await decryptMessage(shtHdrs[0])

    if (decHdrs == "Provider") {
        bootbox.alert('Sheet "' + shtTitle + '" is already encrypted.');
        return
    }

    if (shtHdrs[0] != 'Provider') {
        bootbox.alert('Sheet "' + shtTitle + '" not a valid Secure Sheet.');
        return
    }

    var encShtArr = await encryptArr(shtArr)

    await updateSheet(title, encShtArr)

    secSht.enc = false

    // var et = ts - new Date()
    // alert(et)

    toast("Encryption complete", 0)

    modal(false)

    loadSheets()

    

}

async function decryptSheet(title) {

    // var ts = new Date()

    var confirmOK = await confirm("Warning !  Decrypting sheet can expose passwords and other sensitive data to others with access to your account.")
    if (!confirmOK) return
  
    modal(true)

    toast("Decrypting sheet " + title, 5000)

    var objSht = await openShts(
        [
            { title: title, type: "all" }
        ])

    var shtHdrs = objSht[title].colHdrs
    var shtArr = [shtHdrs].concat(objSht[title].vals)

    var decHdrs = await decryptMessage(shtHdrs[0])

    console.log('decHdrs', decHdrs)

    if (decHdrs != "Provider") {
        bootbox.alert('Sheet "' + shtTitle + '" is not an encrtpted Secure Sheet.');
        return
    }

    var decShtArr = await decryptArr(shtArr)

    await updateSheet(title, decShtArr)

    secSht.enc = false

    // var et = ts - new Date()
    // alert(et)
    
    toast("Decryption complete", 3000)

    loadSheets()

    modal(false)

}


async function encryptArr(msg, pwd = currUser.pwd) {

    var rtn = []

    if (is2dArray(msg)) {

        console.log('msg 2d', msg)

        for (var i = 0; i < msg.length; i++) {
            var r = msg[i]
            var row = []
            for (var j = 0; j < r.length; j++) {
                row.push(await encryptMessage(r[j], pwd))
            }
            rtn.push(row)
        }

    } else {
        console.log('msg 1d', msg)

        for (var i = 0; i < msg.length; i++) {
            rtn.push(await encryptMessage(msg[i], pwd))
        }

    }

    return rtn

}

async function decryptArr(msg, pwd = currUser.pwd) {

    var rtn = []

    if (is2dArray(msg)) {

        console.log('msg', msg)

        for (var i = 0; i < msg.length; i++) {
            var r = msg[i]
            var row = []
            for (var j = 0; j < r.length; j++) {
                row.push(await decryptMessage(r[j], pwd))
            }
            rtn.push(row)
        }

    } else {

        for (var i = 0; i < msg.length; i++) {
            rtn.push(await decryptMessage(msg[i], pwd))
        }

    }

    return rtn

}

async function encryptMessage(msg, password = currUser.pwd) {

    const encoder = new TextEncoder();

    const toBase64 = buffer =>
        btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const PBKDF2 = async (
        password, salt, iterations,
        length, hash, algorithm = 'AES-CBC') => {

        keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );


        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations,
                hash
            },
            keyMaterial,
            { name: algorithm, length },
            false, // we don't need to export our key!!!
            ['encrypt', 'decrypt']
        );
    }


    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const plain_text = encoder.encode(msg);
    const key = await PBKDF2(password, salt, 100000, 256, 'SHA-256');

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        key,
        plain_text
    );

    var ciphertext = toBase64([
        ...salt,
        ...iv,
        ...new Uint8Array(encrypted)
    ])

    // console.log({
    //     salt: toBase64(salt),
    //     iv: toBase64(iv),
    //     encrypted: toBase64(encrypted),
    //     concatennated: ciphertext
    // });

    return ciphertext

}

async function decryptMessage(ciphertext, password = currUser.pwd) {

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const fromBase64 = buffer =>
        Uint8Array.from(atob(buffer), c => c.charCodeAt(0));

    const PBKDF2 = async (
        password, salt, iterations,
        length, hash, algorithm = 'AES-CBC') => {

        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations,
                hash
            },
            keyMaterial,
            { name: algorithm, length },
            false, // we don't need to export our key!!!
            ['encrypt', 'decrypt']
        );
    };


    const salt_len = iv_len = 16;

    const encrypted = fromBase64(ciphertext);

    const salt = encrypted.slice(0, salt_len);
    const iv = encrypted.slice(0 + salt_len, salt_len + iv_len);
    const key = await PBKDF2(password, salt, 100000, 256, 'SHA-256');

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        key,
        encrypted.slice(salt_len + iv_len)
    )
        .then(function (decrypted) {
            // console.log('deecrypted', decoder.decode(decrypted));
            return decoder.decode(decrypted);
        })
        .catch(function (err) {
            console.log(err)

            // console.error(err);
            return err.toString()
        });

    return decrypted

}

