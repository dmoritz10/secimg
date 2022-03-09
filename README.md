# sceimg

Todo;  
    include display support for .pdf
    <!-- use PromiseAll to enc -->


Add New Document:

    Create new ss in img folder
    Change name of ss to its sheetId
    Make sheetId part of Doc entry

Edit Doc

    If Front or Back changes
    Chunk, Enc and update SS:
        Row 1 for Front
        Row 2 for Back

        Can't support arbitrary nbr of images per doc because ss will fail at ~> 15Mb

Delete Doc

    Remove corresponding img file

