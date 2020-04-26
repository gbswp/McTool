const {BrowserWindow, Menu, app, dialog} = require('electron')
const fs = require('fs-extra')
const path = require('path')

let template = [{
  label: '文件',
  submenu: [{
    label: '打开地图目录',
    accelerator: 'CmdOrCtrl+O',
    click: () => {
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }, openedPath => {
        if (openedPath) {
          openDir(openedPath)
        }
      })
    }
  }, {
    label: '打开地图图片',
    accelerator: 'CmdOrCtrl+Shift+O',
    role: 'openFile',
    click: () => {
      dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{name: '地图图片', extensions: ['png', 'jpg']}]
      }, openedImage => {
        if (openedImage) {
          cropImages(openedImage[0])
        }
      })
    }
  }, {
    type: 'separator'
  }, {
    label: '刷新配置',
    accelerator: 'F5',
    click: () => {
      sendMsg('refreshConfig')
    }
  }, {
    type: 'separator'
  }, {
    label: '关闭',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }]
}, {
  label: '查看',
  submenu: [{
    label: '全屏',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F'
      } else {
        return 'F11'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    }
  }, {
    label: '开发者工具',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I'
      } else {
        return 'F12'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.toggleDevTools()
      }
    }
  }]
}, {
  label: '操作',
  submenu: [{
    label: '笔触大',
    accelerator: 'CmdOrCtrl+3',
    type: 'radio',
    checked: false,
    click: (item) => {
      pickBrush(2)
    }
  }, {
    label: '笔触中',
    accelerator: 'CmdOrCtrl+2',
    type: 'radio',
    checked: false,
    click: () => {
      pickBrush(1)
    }
  }, {
    label: '笔触小',
    accelerator: 'CmdOrCtrl+1',
    type: 'radio',
    checked: true,
    click: () => {
      pickBrush(0)
    }
  }, {
    type: 'separator'
  }, {
    label: '显示路点',
    accelerator: 'F1',
    type: 'checkbox',
    checked: true,
    click: item => {
      showRoadFlags(item.checked)
    }
  }, {
    label: '显示坐标点',
    accelerator: 'F2',
    type: 'checkbox',
    checked: false,
    click: item => {
      showCoordinate(item.checked)
    }
  }, {
    label: '隐藏滚动条',
    accelerator: 'F3',
    type: 'checkbox',
    checked: false,
    click: item => {
      hideScrollBar(item.checked)
    }
  }]
}, {
  label: '帮助',
  submenu: [{
    label: '卓越猫版权所有',
    enabled: false
  }, {
    label: '版本v0.0.1',
    enabled: false
  }]
}]

function sendMsg (msg) {
  BrowserWindow.getAllWindows().forEach(w => {
    w.webContents.send('SERVER-MESSAGE', msg)
  })
}

function cropImages (imagePath) {
  sendMsg(`openImage:${imagePath}`)
}

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  pickBrush(0)
})

app.on('browser-window-created', () => {
})

app.on('window-all-closed', () => {
})

function pickBrush (index) {
  console.log(`brush index: ${index}`)

  sendMsg(`brush:${index}`)
}

function showRoadFlags (checked) {
  sendMsg(`setEditMode:${checked ? 0 : 1}`)
}

function showCoordinate (checked) {
  sendMsg(`showCoordinate:${checked ? 1 : 0}`)
}

function hideScrollBar (checked) {
  sendMsg(`hideScrollBar:${checked ? 1 : 0}`)
}

function openDir (folder) {
  sendMsg(`open:${folder}`)
}
