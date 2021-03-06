
async function testEncrypted(title) {

    var objSht = await openShts(
        [
            { title: title, type: "headers" }
        ])

    var shtHdrs = objSht[title].colHdrs

    if (shtHdrs[0] == 'Document') {

        return {
            enc: false,
            isSecSht: true
        }

    }

    if (await decryptMessage(shtHdrs[0]) == "Document") {

        console.log('dec', await decryptMessage(shtHdrs[0]))

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

async function encryptSheet(title, pwd = currUser.pwd, called = false) {

    console.log('encryptSheet')

    if (!called) modal(true)

    toast("Encrypting sheet " + title, 5000)

    var objSht = await openShts(
        [
            { title: title, type: "all" }
        ])

    var shtHdrs = objSht[title].colHdrs
    var shtArr = [shtHdrs].concat(objSht[title].vals)

    var decHdrs = await decryptMessage(shtHdrs[0], pwd)

    if (decHdrs == "Document") {
        bootbox.alert('Sheet "' + shtTitle + '" is already encrypted.');
        return
    }

    if (shtHdrs[0] != 'Document') {
        bootbox.alert('Sheet "' + shtTitle + '" not a valid Sheet.');
        return
    }

    var encShtArr = await encryptArr(shtArr, pwd)

    console.log('encShtArr', encShtArr)

    await updateSheet(title, encShtArr)

    await encryptImageSheets(objSht[title], pwd)

    secSht.enc = true
    shtEnc = true

    // var et = ts - new Date()
    // alert(et)

    toast("Encryption complete", 0)

    if (!called) modal(false)


    await loadSheets()

    

}

async function decryptSheet(title, pwd = currUser.pwd, called = false) {

    if (!called) {

        var confirmOK = await confirm("Warning !  Decrypting sheet can expose passwords and other sensitive data to others with access to your account.")
        if (!confirmOK) return
        modal(true)

    }
  

    toast("Decrypting sheet " + title, 5000)

    var objSht = await openShts(
        [
            { title: title, type: "all" }
        ])


    var shtHdrs = objSht[title].colHdrs
    var shtArr = [shtHdrs].concat(objSht[title].vals)

    var decHdrs = await decryptMessage(shtHdrs[0], pwd)

    console.log('decHdrs', decHdrs)

    if (decHdrs != "Document") {
        bootbox.alert('Sheet "' + shtTitle + '" is not an encrtpted Sheet.');
        return
    }

    var decShtArr = await decryptArr(shtArr, pwd)

    await updateSheet(title, decShtArr)

    var decHdrs = decShtArr.shift()

    var decObjSht = {

        colHdrs:    decHdrs,
        vals:       decShtArr

    }

    console.log('decObjSht', decObjSht)

    await decryptImageSheets(decObjSht, pwd)

    secSht.enc = false
    shtEnc = false

    
    toast("Decryption complete", 3000)

    await loadSheets()

    if (!called) modal(false)


}

async function encryptImageSheets(objSht, pwd = currUser.pwd) {

    console.log('encryptImageSheets')

    var vals = objSht.vals

    console.log(vals)

    for (var i in vals) {

        var val = vals[i]

        console.log('for in')
        console.log(val)

        var shtObj = makeObj(val, objSht.colHdrs)

        var fileId = shtObj['File Id']

        var imgs = await fetchImages(false, fileId, pwd) 

        await postImages(true, fileId, imgs, [null, null], pwd)

    }
}

async function decryptImageSheets(objSht, pwd = currUser.pwd) {

    console.log('decryptImageSheets')

    var vals = objSht.vals

    console.log('decryptImageSheets', vals)



    for (var i in vals) {

        var val = vals[i]

    console.log('decryptImageSheets for in', val)


        var shtObj = makeObj(val, objSht.colHdrs)

        var fileId = shtObj['File Id']

        console.log('fileid', fileId)

        var imgs = await fetchImages(true, fileId, pwd) 

        console.log('decrupt imgs', imgs.length)

        await postImages(false, fileId, imgs, [null, null], pwd)

    }
}

async function encryptArr(msg, pwd = currUser.pwd) {

    var rtn = []

    if (is2dArray(msg)) {

        console.log('msg 2d', msg)

        for (var i = 0; i < msg.length; i++) {
            var r = msg[i]
            var row = []
            for (var j = 0; j < r.length; j++) {
                var m = await encryptMessage(r[j], pwd)
                row.push(m)
            }
            rtn.push(row)
        }

    } else {
        console.log('msg 1d', msg)

        for (var i = 0; i < msg.length; i++) {
            var m = await encryptMessage(msg[i], pwd)
            rtn.push(m)
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
                var m = await decryptMessage(r[j], pwd)
                row.push(m)
            }
            rtn.push(row)
        }

    } else {

        for (var i = 0; i < msg.length; i++) {
            var m = await decryptMessage(msg[i], pwd)
            rtn.push(m)
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

