import Store from 'electron-store'

const state = {
  accounts: {
    'default': 'rss',
    'active': 'rss',
    'accounts': {
      'rss': {
        'name': 'rss',
        'type': 'local',
        'username': '',
        'passwd': '',
        'endpoint': '',
        'lastFetchTime': 0
      }
    }
  },
  type: ''
}

const store = new Store()

const mutations = {
  LOAD_ACCOUNTS (state) {
    if (store.get('accounts')) {
      state.accounts = store.get('accounts')
    }
    state.type = state.accounts.accounts[state.accounts.active].type
    // console.log(state.accounts)
  },
  SET_ACCOUNT (state, data) {
    // change account
    state.accounts.active = data
    state.type = state.accounts.accounts[state.accounts.active].type
    console.log('change account to: ' + data)
  }
}

const actions = {
  loadAccounts ({ commit }) {
    commit('LOAD_ACCOUNTS')
  },
  setAccount ({ commit }, data) {
    commit('SET_ACCOUNT', data)
  }
}

export default {
  state,
  mutations,
  actions
}
