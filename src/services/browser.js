import { urls } from '@/services/constants'
const CONTENT_SCRIPT_PATH = 'js/content-script.js'

export default {
  getActiveTab() {
    return new Promise(function(resolve) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => resolve(tab))
    })
  },

  async sendTabMessage({ action, value, clean } = {}) {
    const tab = await this.getActiveTab()
    chrome.tabs.sendMessage(tab.id, { action, value, clean })
  },

  injectContentScript() {
    return new Promise(function(resolve) {
      chrome.tabs.executeScript({ file: CONTENT_SCRIPT_PATH, allFrames: false }, res =>
        resolve(res)
      )
    })
  },

  copyToClipboard(text) {
    return navigator.permissions.query({ name: 'clipboard-write' }).then(result => {
      if (result.state !== 'granted' && result.state !== 'prompt') {
        return Promise.reject()
      }

      navigator.clipboard.writeText(text)
    })
  },

  getChecklyCookie() {
    return new Promise(function(resolve) {
      chrome.cookies.getAll({}, res =>
        resolve(res.find(cookie => cookie.name.startsWith('checkly_has_account')))
      )
    })
  },

  getBackgroundBus() {
    return chrome.extension.connect({ name: 'recordControls' })
  },

  openOptionsPage() {
    chrome.runtime.openOptionsPage?.()
  },

  openHelpPage() {
    chrome.tabs.create({ url: urls.DOCS_URL })
  },

  openChecklyRunner({ code, runner }) {
    const script = encodeURIComponent(btoa(code))
    const url = `${urls.RUN_URL}?framework=${runner}&script=${script}`
    chrome.tabs.create({ url })
  },
}
