import db from '../../services/db'
import helper from '../../services/helpers'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import _ from 'lodash'
import Fuse from 'fuse.js'
import cacheService from '../../services/cacheArticle'
import { FeverSync, MarkStat } from '../../fever/feverapi'

dayjs.extend(relativeTime)

const state = {
  articles: [],
  type: 'unread',
  search: '',
  feed: ''
}

const filters = {
  search: (articles, search) => articles.filter(article => article.title.match(search)),
  unread: articles => articles.filter(article => !article.read),
  read: articles => articles.filter(article => article.read),
  favourites: articles => articles.filter(article => article.favourite),
  feed: (articles, feed) => articles.filter(article => article.feed_id === feed || article.feed_id === _.toInteger(feed)),
  saved: articles => articles.filter(article => article.offline),
  all: articles => articles
}

const searchOption = {
  caseSensitive: true,
  shouldSort: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 100,
  minMatchCharLength: 1,
  keys: ['title']
}

const getters = {
  filteredArticles: state => {
    let orderedArticles
    if (state.feed) {
      // feed filter toolbar
      orderedArticles = _.orderBy(state.articles, ['pubDate'], ['desc'])
      orderedArticles = filters['feed'](orderedArticles, state.feed)
      if (state.type === 'feed') {
        // default set to unread
        return filters['unread'](orderedArticles, state.feed)
      }
    } else {
      // all filter
      orderedArticles = _.orderBy(state.articles, ['pubDate'], ['desc'])
    }
    if (state.type !== 'feed' && state.type !== 'search') {
      return filters[state.type](orderedArticles)
    }
    if (state.type === 'search') {
      const fuse = new Fuse(state.articles, searchOption)
      if (state.search !== '') {
        return fuse.search(state.search)
      }
      return filters['all'](orderedArticles)
    }
    return filters[state.type](orderedArticles, state.feed)
  }
}

const mutations = {
  LOAD_ARTICLES (state, payload) {
    state.articles = payload.articles.map((item) => {
      if (item.created_on_time) {
        // fever compatible
        const feed = _.find(payload.feeds, { _id: item.feed_id })
        item.created_on_time = item.created_on_time * 1000
        item.pubdate = item.created_on_time
        item.pubDate = item.created_on_time
        item.description = item.html
        item.origlink = item.url
        item.favourite = item.is_saved !== 0
        item.read = item.is_read !== 0
        if (feed) {
          item.meta = {
            title: feed.title,
            link: feed.site_url,
            favicon: feed.favicon
          }
        }
        if (!item.meta) {
          item.meta = {
            title: item.title,
            link: '',
            favicon: undefined
          }
        }
      }
      item.meta.title = _.truncate(item.meta.title, { length: 20 })
      if (!item.meta.favicon) {
        // default icon
        item.meta.favicon = item.favicon
      }
      item.pubdate = dayjs(item.pubdate).fromNow()
      if (!('offline' in item)) {
        item.offline = false
      }
      return item
    })
  },
  ADD_ARTICLES (state, articles) {
    if (articles) {
      articles.meta.title = _.truncate(articles.meta.title, { length: 20 })
      articles.pubdate = dayjs(articles.pubdate).fromNow()
      state.articles.unshift(articles)
    }
  },
  MARK_ACTION (state, data) {
    if (data.feed_id) {
      // mark feed as read
      state.articles.map((item) => {
        if (item.feed_id === data.feed_id || item.feed_id === _.toInteger(data.feed_id)) {
          item.read = true
        }
        return item
      })
      return
    }
    let index = _.findIndex(state.articles, { '_id': data.id })
    if (index < 0) {
      // fever compat
      index = _.findIndex(state.articles, { '_id': _.toInteger(data.id) })
    }
    if (data.type === 'FAVOURITE') {
      state.articles[index].favourite = true
    }

    if (data.type === 'UNFAVOURITE') {
      state.articles[index].favourite = false
    }
    if (data.type === 'READ') {
      state.articles[index].read = true
    }

    if (data.type === 'UNREAD') {
      state.articles[index].read = false
    }
  },
  MARK_ALL_READ (state, data) {
    // fever api
    if (data.accounts.accounts[data.accounts.active].type === 'fever') {
      let config = data.accounts.accounts[data.accounts.active]
      MarkStat(config, 'group', 'read', 0)
    }
    for (let i = 0; i < state.articles.length; i++) {
      state.articles[i].read = true
    }
    db.markAllRead()
  },
  DELETE_ARTICLES (state, id) {
    const articles = _.filter(state.articles, { feed_id: id })
    articles.forEach(async (article) => {
      await cacheService.uncache(`raven-${article._id}`)
    })
  },
  REFRESH_FEEDS (state, feeds) {
    if (feeds.length > 0) {
      helper.subscribe(feeds, null, true)
    }
  },
  CHANGE_TYPE (state, type) {
    state.type = type
  },
  SET_SEARCH_TERM (state, search) {
    state.search = search
  },
  SET_FEED_ID (state, feed) {
    state.feed = feed
  },
  SAVE_ARTICLE (state, data) {
    const index = _.findIndex(state.articles, { '_id': data.article._id })
    state.articles[index].offline = data.type === 'CACHE'
  }
}

const actions = {
  cleanArticles ({ dispatch, commit }, accounts) {
    let time = dayjs().subtract(3, 'day').unix()
    if (accounts.accounts[accounts.active].type !== 'fever') {
      time = dayjs().subtract(3, 'day').valueOf()
    }
    db.cleanArticles(time, numRemoved => {
      console.log(`clean ${numRemoved} old articles`)
      dispatch('refreshFeeds', accounts)
    })
  },
  loadArticles ({ commit }, feeds) {
    db.fetchArticles(docs => {
      commit('LOAD_ARTICLES', {
        articles: docs,
        feeds: feeds })
    })
  },
  addArticle ({ commit }, article) {
    db.addArticles(article, docs => {
      commit('ADD_ARTICLES', docs)
    })
  },
  markAction ({ commit }, data) {
    switch (data.type) {
      case 'FAVOURITE':
        db.markFavourite(data.id)
        break
      case 'UNFAVOURITE':
        db.markUnfavourite(data.id)
        break
      case 'READ':
        if (data.feed_id) {
          // mark feed as read
          db.markFeedRead(data.feed_id)
        } else {
          db.markRead(data.id)
        }
        break
      case 'UNREAD':
        db.markUnread(data.id)
        break
    }
    // fever api
    if (data.accounts.accounts[data.accounts.active].type === 'fever') {
      let config = data.accounts.accounts[data.accounts.active]
      switch (data.type) {
        case 'FAVOURITE':
          MarkStat(config, 'item', 'saved', _.toInteger(data.id))
          break
        case 'UNFAVOURITE':
          MarkStat(config, 'item', 'unsaved', _.toInteger(data.id))
          break
        case 'READ':
          if (data.feed_id) {
            MarkStat(config, 'feed', 'read', _.toInteger(data.feed_id))
          } else {
            MarkStat(config, 'item', 'read', _.toInteger(data.id))
          }
          break
        case 'UNREAD':
          MarkStat(config, 'item', 'unread', _.toInteger(data.id))
          break
      }
    }
    commit('MARK_ACTION', data)
  },
  saveArticle ({ commit }, data) {
    switch (data.type) {
      case 'CACHE':
        db.markOffline(data.article._id)
        break
      case 'UNCACHE':
        db.markOnline(data.article._id)
        break
    }
    commit('SAVE_ARTICLE', data)
  },
  markAllRead ({ commit }, data) {
    commit('MARK_ALL_READ', data)
  },
  async deleteArticle ({ dispatch, commit }, id) {
    commit('DELETE_ARTICLES', id)
    db.deleteArticles(id, numRemoved => {
      console.log('del articles: ' + numRemoved)
      dispatch('loadArticles')
    })
  },
  async refreshFeeds ({ dispatch, commit }, accounts) {
    // for fever sync
    if (accounts.accounts[accounts.active].type === 'fever') {
      // on start refresh
      let account = accounts.accounts[accounts.active]
      await FeverSync(account)
    } else {
      db.fetchFeeds(docs => {
        commit('REFRESH_FEEDS', docs)
      })
    }
    dispatch('loadFeeds', accounts.accounts[accounts.active].type)
  },
  changeType ({ commit }, type) {
    commit('CHANGE_TYPE', type)
  },
  setSearch ({ commit }, search) {
    commit('SET_SEARCH_TERM', search)
  },
  setFeed ({ commit }, feed) {
    commit('SET_FEED_ID', feed)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
