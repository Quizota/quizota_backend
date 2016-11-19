
let $ = require('jquery')


let io = require('socket.io-client')
let socket = io('http://127.0.0.1:8000')

// ESNext in the browser!!!
socket.on('connect', () => {
    console.log('connected')

    let displayName = 'phuong_' + Date.now()
    let data = JSON.stringify({cmd: 'autoRegister', data: {displayName: displayName}})
    socket.emit('data', data)
})



// Enable the form now that our code has loaded
$('#send').removeAttr('disabled')


let $template = $('#template')

socket.on('im', res => {
    let $li = $template.clone().show()
    let dataJson = ''
    if(res.data) {
        dataJson = res.data
    }

    $li.children('span').text(res.code + ', ' + res.msg + ', ')
    $('#messages').append($li)
})

socket.on('data', res => {
    let $li = $template.clone().show()
    let dataJson = ''
    if('data' in res) {
        dataJson = JSON.stringify(res.data)
    }

    $li.children('span').text(res.code + ', ' + res.msg + ', ' + dataJson)
    $('#messages').append($li)
})

$('form').submit(() => {
    //socket.emit('im', $('#m').val())
    socket.emit('data', $('#m').val())
    $('#m').val('')
    return false
})