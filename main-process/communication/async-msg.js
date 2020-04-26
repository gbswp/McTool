const {ipcMain} = require('electron')
const fs = require('fs-extra')
const path = require('path')

ipcMain.on('CLIENT-MESSAGE', (event, arg) => {
  let msg = '' + arg
  let splitIndex = msg.indexOf(':')
  let cmd = msg.substr(0, splitIndex)
  let content = msg.substr(splitIndex + 1)
  // console.log(cmd, content)
  switch (cmd) {
    case 'test':
      console.log(`received from client: ${content}`)
      break
  }
})
