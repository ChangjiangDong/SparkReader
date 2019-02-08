import Vue from 'vue'
import axios from 'axios'
import Toast from 'vue-easy-toast'
import BootstrapVue from 'bootstrap-vue'
import Register from './components/register'

import App from './App'
import router from './router'
import store from './store'
import EStore from 'electron-store'

import './helper/external_links.js'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import hljs from 'highlight.js'
import 'highlight.js/styles/monokai.css'
import vcolorpicker from 'vcolorpicker'

// nodejs global proxy
const eStore = new EStore()
const proxy = eStore.get('settings.proxy') ? eStore.get('settings.proxy') : null
if (proxy) {
  if (proxy.http) {
    process.env.http_proxy = proxy.http
  }
  if (proxy.https) {
    process.env.https_proxy = proxy.https
  }
  var globalTunnel = require('global-tunnel-ng')
  globalTunnel.initialize()
}

// ignore ssl error
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

Vue.use(BootstrapVue)
Vue.use(Toast)
Vue.use(vcolorpicker)

Register.registerComponents()

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')

Vue.directive('highlight', function (el) {
  let blocks = el.querySelectorAll('pre')
  blocks.forEach((block) => {
    hljs.highlightBlock(block)
  })
})
