import * as Gateway from 'ipfs'

Gateway

function serve(socket: number, handler: () => void) {
  ;(chrome as any).sockets.tcpServer.listen(socket, 0, 4567, code => {
    if (code < 0) {
      console.log('Error listening:' + chrome.runtime.lastError.message)
      return
    }

    ;(chrome as any).sockets.tcpServer.onAccept.addListener(function onAccept(
      info,
    ) {
      if (info.socketId != socket) return

      // A new TCP connection has been established.
      ;(chrome as any).sockets.tcp.send(info.clientSocketId, data, function(
        resultCode,
      ) {
        console.log('Data sent to new TCP client connection.')
      })
      // Start receiving data.
      ;(chrome as any).sockets.tcp.onReceive.addListener(function(recvInfo) {
        if (recvInfo.socketId != info.clientSocketId) return
        // recvInfo.data is an arrayBuffer.
      })
      ;(chrome as any).sockets.tcp.setPaused(false)
    })
  })
}
