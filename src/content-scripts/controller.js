import { uiActions, isDarkMode, controlMessages } from '@/services/constants'

import storage from '@/services/storage'
import browser from '@/services/browser'

import Shooter from '@/modules/shooter'

export default class HeadlessController {
  constructor({ overlay, recorder, store }) {
    this.backgroundListener = null

    this.store = store
    this.shooter = null
    this.overlay = overlay
    this.recorder = recorder
  }

  async init() {
    const { options } = await storage.get(['options'])

    const darkMode = options && options.extension ? options.extension.darkMode : isDarkMode()
    const { dataAttribute } = options ? options.code : {}

    this.store.commit('setDarkMode', darkMode)
    this.store.commit('setDataAttribute', dataAttribute)

    this.recorder.init(() => this.listenBackgroundMessages())
  }

  listenBackgroundMessages() {
    this.backgroundListener = this.backgroundListener || this.handleBackgroundMessages.bind(this)
    chrome.runtime.onMessage.addListener(this.backgroundListener)
  }

  async handleBackgroundMessages(msg) {
    if (!msg?.action) {
      return
    }

    switch (msg.action) {
      case uiActions.TOGGLE_SCREENSHOT_MODE:
        this.handleScreenshot(false)
        break

      case uiActions.TOGGLE_SCREENSHOT_CLIPPED_MODE:
        this.handleScreenshot(true)
        break

      case uiActions.CLOSE_SCREENSHOT_MODE:
        this.cancelScreenshot()
        break

      case uiActions.TOGGLE_OVERLAY:
        msg?.value?.open ? this.overlay.mount(msg.value) : this.overlay.unmount()
        break

      case uiActions.STOP:
        this.store.commit('close')
        break

      case uiActions.PAUSE:
        this.store.commit('pause')
        break

      case uiActions.UN_PAUSE:
        this.store.commit('unpause')
        break

      case 'CODE':
        await browser.copyToClipboard(msg.value)
        this.store.commit('showCopy')
        break
    }
  }

  handleScreenshot(isClipped) {
    this.recorder.disableClickRecording()
    this.shooter = new Shooter({ isClipped })

    this.shooter.addCameraIcon()

    this.store.state.screenshotMode
      ? this.shooter.startScreenshotMode()
      : this.shooter.stopScreenshotMode()

    this.shooter.on('click', ({ clip }) => {
      this.store.commit('stopScreenshotMode')

      this.shooter.showScreenshotEffect()
      this.recorder._sendMessage({ control: controlMessages.GET_SCREENSHOT, value: clip })
      this.recorder.enableClickRecording()
    })
  }

  cancelScreenshot() {
    if (!this.store.state.screenshotMode) {
      return
    }

    this.store.commit('stopScreenshotMode')
    this.shooter.removeCameraIcon()
    this.shooter.stopScreenshotMode()
    this.recorder.enableClickRecording()
  }
}
