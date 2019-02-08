<template>
  <div class="app-wrapper" :class="{ 'app-darkmode': $store.state.Setting.darkMode === 'on' }">
    <nav class="bg-light sidebar" v-if="true" ref="sidebar">
      <subscribe-toolbar :accountType="accountType"></subscribe-toolbar>
      <div class="sidebar-sticky">
        <ul class="nav flex-column">
          <li class="nav-item" @click="setAll()">
            <router-link class="nav-link" to="/all" active-class="active">
              <feather-icon name="list"></feather-icon>All Feeds
              <span class="sr-only">(current)</span>
              <span class="items-counter">{{ getArticlesCount('', '')}}</span>
            </router-link>
          </li>
          <li class="nav-item" @click="setAll()">
            <router-link class="nav-link" to="/favourites" active-class="active">
              <feather-icon name="star"></feather-icon>Favourites
              <span class="items-counter">{{ getArticlesCount('favourites', '')}}</span>
            </router-link>
          </li>
          <li class="nav-item" @click="setAll()">
            <router-link class="nav-link" to="/unread" active-class="active">
              <feather-icon name="circle"></feather-icon>Unread Articles
              <span class="items-counter">{{ getArticlesCount('unread', '')}}</span>
            </router-link>
          </li>
          <li class="nav-item" @click="setAll()">
            <router-link class="nav-link" to="/read" active-class="active">
              <feather-icon name="circle" filled></feather-icon>Recently Read
              <span class="items-counter">{{ getArticlesCount('read', '')}}</span>
            </router-link>
          </li>
          <li class="nav-item" v-if="accountType != 'fever'" @click="setAll()">
            <router-link class="nav-link" to="/saved" active-class="active">
              <feather-icon name="wifi-off"></feather-icon>Saved articles
              <span class="items-counter">{{ getArticlesCount('saved', '')}}</span>
            </router-link>
          </li>
          <li class="nav-item" v-if="accountType != 'fever'">
            <a class="nav-link" href="#" @click="exportOpml">
              <feather-icon name="external-link"></feather-icon>Export Subscriptions
            </a>
          </li>
          <li class="nav-item" v-if="accountType != 'fever'">
            <a class="nav-link" href="#" v-b-modal.importfeed>
              <feather-icon name="upload"></feather-icon>Import Subscriptions
            </a>
          </li>
          <li class="nav-item" v-if="accountType != 'fever'">
            <a class="nav-link" href="#" v-b-modal.markallread>
              <feather-icon name="check-square"></feather-icon>Mark all as read
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#" v-b-modal.settings>
              <feather-icon name="settings"></feather-icon>Settings
            </a>
          </li>
          <li class="nav-item" v-if="accountType != 'fever'">
            <a class="nav-link" href="#" v-b-modal.integrations>
              <feather-icon name="package"></feather-icon>Integrations
            </a>
          </li>
        </ul>
        <h6
          class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted"
        >
          <span>Subscriptions</span>
        </h6>
        <ul class="nav flex-column">
          <li
            v-for="feed in feeds"
            class="nav-item d-flex justify-content-between align-items-center"
            v-bind:key="feed.id"
          >
            <router-link v-if="feed" class="nav-link" :to="`/feed/${feed.id}`" active-class="activeSubscri">
              <img v-if="feed.favicon" :src="feed.favicon" height="16" width="16" class="mr-1">
              {{ feed.title }}
            </router-link>
            <span class="items-counter-feed">{{ getArticlesCount('unread', feed.id)}}</span>
            <button v-if="accountType != 'fever'" @click="unsubscribeFeed(feed.id)" class="btn btn-link">
              <feather-icon name="x-circle"></feather-icon>
            </button>
          </li>
        </ul>
      </div>
    </nav>
    <article-list :type="articleType" :feed="feed" @type-change="updateType" ref="articleList" id="articlesBox"></article-list>
    <div class="drag-btn" id="dragBtn" @mousedown.stop.prevent="mouseDown"></div>
    <article-detail
      :id="$route.params.id"
      :article="articleData"
      :emptyState="empty"
      :loading="loading"
      ref="articleDetail"
    ></article-detail>
    <import-modal></import-modal>
    <settings-modal></settings-modal>
    <markallread-modal></markallread-modal>
    <sync-settings></sync-settings>
  </div>
</template>
<script>
// import db from '../services/db'
// import { parseArticle } from '../parsers/article'
import cheerio from 'cheerio'
import dayjs from 'dayjs'
import stat from 'reading-time'
import scheduler from 'node-schedule'
import log from 'electron-log'
import helper from '../services/helpers'
import notifier from 'node-notifier'
import fs from 'fs'
import path from 'path'
import * as Mousetrap from 'Mousetrap'
// import cacheService from '../services/cacheArticle'
import _ from 'lodash'

export default {
  data () {
    return {
      articleData: null,
      articleType: 'all',
      empty: null,
      feed: null,
      loading: false,
      accountType: '',
      nIndex: 0,
      pIndex: 0
    }
  },
  beforeMount () {
    // shotcuts
    Mousetrap.bind('m', evt => {
      // mark one as read/unread
      if (this.$route.params.id) {
        this.$refs.articleDetail.$refs.articleToolbar.markRead()
      }
    })
    Mousetrap.bind('s', evt => {
      // star/unstar one
      if (this.$route.params.id) {
        this.$refs.articleDetail.$refs.articleToolbar.markFavourite()
      }
    })
    Mousetrap.bind('o', evt => {
      // open link
      if (this.$route.params.id) {
        this.$refs.articleDetail.$refs.articleToolbar.$refs.openlink.click()
      }
    })
    Mousetrap.bind('space', evt => {
      // first item(for mark unread quickly)
      if (this.$refs.articleList.$store.getters.filteredArticles.length > 0) {
        this.$router.push({ name: 'article-page', params: { id: _.toString(this.$refs.articleList.$store.getters.filteredArticles[0]._id) } })
        return false
      }
    })
    Mousetrap.bind('n', evt => {
      // next feed
      if (this.feeds.length <= 0 || !this.feed) {
        return
      }
      this.nIndex = _.findIndex(this.feeds, { 'id': this.feed })
      if (this.nIndex < 0) {
        this.nIndex = _.findIndex(this.feeds, { 'id': _.toInteger(this.feed) })
      }
      if (this.nIndex < 0) {
        return
      }
      this.nIndex++
      if (this.nIndex < this.feeds.length) {
        this.$router.push({ name: 'feed-page', params: { feedid: _.toString(this.feeds[this.nIndex]._id) } })
      }
    })
    Mousetrap.bind('p', evt => {
      // prev feed
      if (this.feeds.length <= 0 || !this.feed) {
        return
      }
      this.pIndex = _.findIndex(this.feeds, { 'id': this.feed })
      if (this.pIndex < 0) {
        this.pIndex = _.findIndex(this.feeds, { 'id': _.toInteger(this.feed) })
      }
      if (this.pIndex < 0) {
        return
      }
      this.pIndex--

      if (this.pIndex >= 0) {
        this.$router.push({ name: 'feed-page', params: { feedid: _.toString(this.feeds[this.pIndex]._id) } })
      }
    })
    Mousetrap.bind('a', evt => {
      // mark all as read
      this.$refs.articleList.$refs.markAll.click()
    })
  },
  beforeDestroy () {
    Mousetrap.unbind('m')
    Mousetrap.unbind('s')
    Mousetrap.unbind('o')
    Mousetrap.unbind('space')
    Mousetrap.unbind('n')
    Mousetrap.unbind('p')
    Mousetrap.unbind('a')
  },
  mounted () {
    const self = this
    this.$refs.articleList.$refs.statusMsg.innerText = 'Syncing...'
    this.$store.dispatch('loadAccounts')
    this.$store.dispatch('loadFeeds', self.$store.state.Accounts.type)
    self.accountType = self.$store.state.Accounts.type
    this.$store.dispatch('refreshFeeds', self.$store.state.Accounts.accounts)
    this.unreadChange()
    this.$store.dispatch('checkOffline')

    this.$electron.ipcRenderer.on('onlinestatus', (event, status) => {
      self.$store.dispatch('setOffline', status)
    })

    // Feed Crawling
    const job = scheduler.scheduleJob(self.$store.state.Setting.cronSettings, () => {
      console.log('scheduler update starting...')
      this.$refs.articleList.$refs.statusMsg.innerText = 'Syncing...'
      const type = self.$store.state.Accounts.type
      if (type === 'fever') {
        // refresh
        this.$store.dispatch('refreshFeeds', self.$store.state.Accounts.accounts)
      } else {
        const feeds = self.$store.state.Feed.feeds
        if (feeds.length === 0) {
          log.info('No feeds to process')
        } else {
          log.info(`Processing ${feeds.length} feeds`)
          helper.subscribe(feeds, null, true, false)
          self.$store.dispatch('loadArticles')
        }
      }
      this.unreadChange()
    })

    // old articles clean
    // every hour clean 3 days before articles
    scheduler.scheduleJob('8 */1 * * *', () => {
      this.$refs.articleList.$refs.statusMsg.innerText = 'Cleaning...'
      console.log('scheduler clean old articles starting...')
      this.$store.dispatch('cleanArticles', self.$store.state.Accounts.accounts)
      this.unreadChange()
    })

    if (this.$store.state.Setting.offline) {
      job.cancel()
    }
    // On delete stop Crawler Job
    this.$on('delete', (msg) => {
      if (msg === 'yes') {
        log.info('Job is cancelled')
        job.cancel()
      }
    })
  },
  watch: {
    // call again the method if the route changes
    '$route.params.feedid': 'feedChange',
    '$route.params.type': 'typeChange',
    '$route.params.id': 'fetchData',
    allUnread: 'unreadChange'
  },
  computed: {
    feeds () {
      return this.$store.state.Feed.feeds
    },
    allUnread () {
      return this.getArticlesCount('unread', '')
    }
  },
  methods: {
    mouse_move (ev) {
      if (this.resizing === 'left') {
        const articlesBox = document.getElementById('articlesBox')
        const iEvent = ev || event
        articlesBox.style.width = `${this.dw + (iEvent.clientX - this.dx)}px`
        // dragBtn.style.left = `${this.dw + (iEvent.clientX - this.dx) - 4}px`;
        if (articlesBox.offsetWidth <= 300) {
          articlesBox.style.width = '300px'
        }
      }
    },
    mouse_up (ev) {
      document.documentElement.removeEventListener('mousemove', this.mouse_move, true)
    },
    mouseDown (ev) {
      const articlesBox = document.getElementById('articlesBox')
      const iEvent = ev || event
      this.dx = iEvent.clientX
      this.dw = articlesBox.offsetWidth
      this.disright = articlesBox.offsetLeft + articlesBox.offsetWidth
      if (iEvent.clientX > articlesBox.offsetLeft + 10) {
        this.resizing = 'left'
      }
      document.documentElement.addEventListener('mousemove', this.mouse_move, true)
      document.documentElement.addEventListener('mouseup', this.mouse_up, true)
    },
    getArticlesCount (type, feedid) {
      let articles = this.$store.state.Article.articles
      if (feedid !== '') {
        articles = articles.filter(article => article.feed_id === feedid)
      }
      if (type === 'read') {
        return articles.filter(article => article.read).length
      } else if (type === 'unread') {
        return articles.filter(article => !article.read).length
      } else if (type === 'favourites') {
        return articles.filter(article => article.favourite).length
      } else if (type === 'saved') {
        return articles.filter(article => article.offline).length
      } else {
        // all
        return articles.length
      }
    },
    exportOpml () {
      const xmlData = helper.exportOpml()
      const self = this
      fs.unlink(`${self.$electron.remote.app.getPath('downloads')}/subscriptions.xml`, (err) => {
        if (err && err.code !== 'ENOENT') throw err
        fs.writeFile(`${self.$electron.remote.app.getPath('downloads')}/subscriptions.xml`, xmlData, { flag: 'w', encoding: 'utf8' }, (err) => {
          if (err) throw err
          console.log('XML Saved')
        })
      })
      notifier.notify({
        icon: path.join(__static, '/logo_icon.png'),
        title: 'Feeds exported',
        message: `All feeds are exported as opml in downloads folder.`,
        sound: true
      })
    },
    setAll (newVal) {
      this.$store.dispatch('setFeed', null)
    },
    updateType (newVal) {
      this.articleType = newVal
    },
    typeChange () {
      if (this.$route.params.type) {
        this.articleType = this.$route.params.type
        this.$store.dispatch('changeType', this.$route.params.type)
        this.$refs.articleList.scrollTop()
        this.articleData = null
      }
    },
    feedChange () {
      if (this.$route.params.feedid) {
        this.articleType = 'feed'
        this.$store.dispatch('setFeed', this.$route.params.feedid)
        this.$store.dispatch('changeType', 'feed')
        this.$refs.articleList.scrollTop()
        this.articleData = null
        this.feed = this.$route.params.feedid
      }
    },
    unsubscribeFeed (id) {
      this.$emit('delete', 'yes')
      this.$store.dispatch('deleteFeed', id)
      this.articleData = null
    },
    prepareArticleData (data, article) {
      const self = this
      self.empty = false
      const $ = cheerio.load(data.content)
      $('a').addClass('js-external-link')
      data.content = $.html()
      data.date_published = data.date_published ? data.date_published : null
      data.favicon = article.meta.favicon
      data.sitetitle = article.meta.title
      data.sitelink = article.meta.link
      data._id = article._id
      data.favourite = article.favourite
      data.read = article.read
      data.offline = article.offline
      data.readtime = stat(data.content).text
      self.articleData = data
      self.loading = false
    },
    fetchData () {
      const self = this
      if (this.$route.params.id) {
        self.articleData = null
        self.loading = true
        const articles = this.$store.state.Article.articles
        let index = _.findIndex(articles, { '_id': this.$route.params.id })
        if (index < 0) {
          // fever compat
          index = _.findIndex(articles, { '_id': _.toInteger(this.$route.params.id) })
        }
        const article = articles[index]
        const link = article.origlink !== null ? article.origlink : article.link
        let data = article
        data.content = article.description
        data.date_published = dayjs(article.pubDate).format('YYYY-MM-DD HH:mm:ss')
        data.url = link
        self.prepareArticleData(data, article)
        this.$refs.articleDetail.scrollTop()
        this.$store.dispatch('markAction', {
          type: 'READ',
          id: this.$route.params.id,
          accounts: this.$store.state.Accounts.accounts
        })
      }
    },
    unreadChange () {
      // unread changed, sort feeds by unread count
      if (!this.feeds) {
        return
      }
      let feedsCopy = this.feeds.map((item) => {
        item.unread = this.getArticlesCount('unread', item.id)
        return item
      })
      feedsCopy = _.orderBy(feedsCopy, ['unread'], ['desc'])
      this.$store.dispatch('orderFeeds', feedsCopy)
    }
  }
}
</script>
<style lang="scss">
.drag-btn {
    position: absolate;
    width: 3px;
    height: 100%;
    opacity: 0;
    z-index: 10; 
}

.drag-btn:hover {
      cursor: ew-resize;
}

.items-counter {
  float:right;
}

.items-counter-feed {
  padding-right: 10px;
}

.app-wrapper {
  display: flex;
  height: 100%;
  align-items: flex-start;
}

.app-darkmode {
  .sidebar {
    background: #373737 !important;
    border-right: 1px solid black;
    box-shadow: none;

    .btn-subscribe {
      color: white;
    }

    .subscribe-toolbar {
      border-bottom-color: #000;
    }

    .nav-link {
      color: #fff !important;
    }

    .sidebar-heading {
      color: #979797 !important;
    }

    &::after {
      background: none;
    }
  }

  .article-read {
    opacity: 0.3;
    h6 {
      font-weight: normal !important;
    }
  }

  .articles-list {
    border-right-color: #000;

    .search-form {
      border-bottom-color: #000;
      .feathre {
        color: #c8cacc;
      }

      .form-control {
        background: #373737 !important;
        color: #c8cacc !important;
      }
    }
    .articles-inner .search-form,
    .articles-inner .articles,
    .articles-inner .list-group-item {
      background: #373737 !important;
      color: white;
    }
    .articles-inner .list-group-item {
      background: #373737 !important;
      border-bottom-color: #000;
    }

    &::after {
      background: none;
    }
  }

  .article-detail {
    background: #373737 !important;
  }

  .article-toolbar {
    background: #373737 !important;
    border-bottom-color: #000;

    .article-buttons,
    .site-info {
      background: #373737 !important;
      span {
        color: white;
      }
      .feather {
        color: white;
      }

      .feather-filled {
        fill: #fff;
      }

      .feather-success {
        color: green;
      }
    }
  }

  .article-inner {
    color: white;
  }

  .article-contentarea {
    background: #373737 !important;
    h1,
    h2 {
      color: white;
      small {
        color: #c8cacc;
      }
    }

    ul {
      color: white;
    }

    address,
    figure,
    blockquote,
    h3,
    h4 {
      color: white;
    }
    b {
      color: white;
    }
    p {
      color: #c8cacc;
    }
  }

  .feather-filled {
    fill: #fff;
  }
}
</style>
