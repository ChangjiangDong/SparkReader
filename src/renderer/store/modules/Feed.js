import db from '../../services/db'
import _ from 'lodash'

const state = {
  feeds: []
}

const mutations = {
  LOAD_FEEDS (state, payload) {
    state.feeds = payload.feeds.map((item) => {
      item.title = _.truncate(item.title, { length: 22 })
      if (payload.favicos) {
        // fever type use favico from db
        const favicon = _.find(payload.favicos, { id: item.favicon_id })
        if (favicon) {
          item.favicon = 'data:' + favicon.data
        }
      }
      if (!item.favicon) {
        // add default favico
        item.favicon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADhUlEQVRYR8VXgVHbQBDcowGggjwVBCoAKghpIJEqACoIVBCnApkKYiqIqQBTQZ4KQgqAz+zd//stS5YI8eRngEG2dHt7e3snQTyuCScQnAM4S9e29HeGgG++ljmfL/zlmlBB0GwpYPdjA2pfy1Ri5j/0WwG3ACYJ3b8GpLGACwg+xHinBDDTCwG3vpZt069xy5jipiEkNGXmrgmH2MExgD0ATxAs8IwHX8vTW5kpWc8AfCWqh4jwCoIvPYE8gHkU0uJvwaTE1wBo5oJ7BPzWQMYAD6/vtgJ6CK78Z7l5LZBNACz7Dk24JhAMdcIftm0CtEDA5WvEuwnAGQTfAWh2EHg849HXQurziWAuoqoNiLFxPYaNXgBRAwsI3nc8iNeneNGOUUCuCY6tm1sLoNGwxzeKdQgAqa4i1Q6Cdx1gpgi4LoCUZsaSnG4CsRFAF4UxUxoJS2RGYmfiK7mMbPBz+gpLMvOVfOwrxygArHNXFhHMFKI+wZNpbzkrGbrqTCj6T58PsOUoRNY3HWY2xwtuEiidIVZ/ZpxpX5ktVgodPOXZ1AWs+X3R/+176YqTpHb1DfpFi/Zst8DCV3L0GgAmpoAH9jqzjZSz9/lZ6o4y4yUIG7UX8R52zW7siulYBpKaO5Xcov0JAQcR5LIL7Jp3TUiW7n0lB2MBsO6G3A77nf/PkuXG7KgJspEpdk1gKY4RVCeVmpXglz4l4MjXkmfHkA+QUgZo9z9ZocksWhSr2vWa4GcMmFhI415BJRZGt6EOIfq+LRJkhbRT2QSRaC9LkQJyNkyK76yUYRSAlZrZICLFbdrNtuOKVQTU0rTKsJ9beMAH9rCDcwTN3CfLjQOIQyor2zWBzHxN07MsQ9oxXBPYurwne8KQBtrDiBRTRFQ2jYfgdIXL+wORxqWm2LI040Kcuoiqbfcx4Jpg4zjgUV3OvL9UNvcALrG5pulhRcZk6V3KuACQrXn0QlJQfOdrOWkpfV91ElutAJDaUTMullAV5hADtpJR7baSsQtc3Hjs5iZYhvQHO4dkzNeis6M0oPgd27YLLxjSwOpSWthyDFD6Px/M/ZG2rYCiWFPHGETbHfJkXANQKrQIol3ga5mtDZPlfsiPZj1jm5mTlfmKC9proL4MLV9MBhaINoC3/L/6YlKgUfvdwcR/kru3BOi7d+0FOOD0/7+c5uHQfnHcBgUmxpUX4D9Xrb3nHKG41AAAAABJRU5ErkJggg=='
      }
      return item
    })
  },
  ADD_FEED (state, docs) {
    if (docs) {
      docs.title = _.truncate(docs.title, { length: 22 })
      state.feeds.unshift(docs)
    }
  },
  DELETE_FEED (state, id) {
    const index = _.findIndex(state.feeds, { 'id': id })
    db.deleteFeed(id)
    state.feeds.splice(index, 1)
  },
  ORDER_FEEDS (state, feeds) {
    state.feeds = feeds
  }
}

const actions = {
  loadFeeds ({ dispatch, commit }, type) {
    if (type === 'fever') {
      db.fetchFavs(favs => {
        db.fetchFeeds(docs => {
          commit('LOAD_FEEDS', {
            feeds: docs,
            favicos: favs
          })
          dispatch('loadArticles', docs)
        })
      })
    } else {
      db.fetchFeeds(docs => {
        commit('LOAD_FEEDS', {
          feeds: docs,
          favicos: null
        })
        dispatch('loadArticles', docs)
      })
    }
  },
  addFeed ({ commit }, feed) {
    db.addFeed(feed, docs => {
      commit('ADD_FEED', docs)
    })
  },
  async deleteFeed ({ dispatch, commit }, id) {
    await dispatch('deleteArticle', id)
    commit('DELETE_FEED', id)
  },
  orderFeeds ({ commit }, feeds) {
    commit('ORDER_FEEDS', feeds)
  }
}

export default {
  state,
  mutations,
  actions
}
