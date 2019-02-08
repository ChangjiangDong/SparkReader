import store from '../store'
import { parseFeed } from '../parsers/feed'
import uuid from 'uuid/v4'
import opmlGenerator from 'opml-generator'
import async from 'async'
import faviconoclastpaoxy from '../helper/faviconoclastpaoxy'
import db from './db.js'
import dayjs from 'dayjs'
// import notifier from 'node-notifier'
// import _ from 'lodash'

export default {
  exportOpml () {
    const header = {
      'title': 'RSS Reader',
      'dateCreated': dayjs().unix()
    }
    const outlines = []
    store.state.Feed.feeds.forEach((feed) => {
      outlines.push({
        text: feed.description ? feed.description : '',
        title: feed.title,
        type: 'rss',
        xmlUrl: feed.xmlurl,
        htmlUrl: feed.link
      })
    })

    return opmlGenerator(header, outlines)
  },
  subscribe (feeds, faviconData = null, refresh = false, importData = false) {
    const q = async.queue((task, cb) => {
      if (!refresh) {
        task.feed.meta.favicon = task.favicon
        task.feed.meta.id = uuid()
        store.dispatch('addFeed', task.feed.meta)
      }
      task.feed.posts.forEach((post) => {
        post.feed_id = task.feed.meta.id
        post.meta.favicon = task.favicon
        if (!post.pubdate) {
          post.pubdate = dayjs().valueOf()
          post.pubDate = dayjs().valueOf()
        }
        if (refresh) {
          db.addArticles(post, docs => {
            if (typeof docs !== 'undefined') {
              // notifier.notify({
              //   icon: post.meta.favicon,
              //   title: post.title,
              //   message: _.truncate(post.description.replace(/<(?:.|\n)*?>/gm, '')),
              //   sticky: false,
              //   wait: false,
              //   sound: true
              // })
            }
          })
        } else {
          store.dispatch('addArticle', post)
        }
      })
      cb()
    }, 2)

    q.drain = () => {
      console.log('all feeds are processed')
    }

    feeds.forEach(async function (feed) {
      let faviconUrl
      let url
      if (!importData) {
        url = feed.url
      }

      if (feed.xmlurl) {
        url = feed.xmlurl
      }

      if (feed.feedUrl) {
        url = feed.feedUrl
      }

      const htmlLink = feed.link ? feed.link : feed.url
      const feeditem = await parseFeed(url)
      if (refresh) {
        feeditem.meta.id = feed.id
      }
      if (faviconData) {
        faviconUrl = faviconData
      } else {
        try {
          faviconUrl = await new Promise((resolve, reject) => {
            faviconoclastpaoxy(htmlLink, (err, iconUrl) => {
              if (err) {
                reject(err)
              }
              resolve(iconUrl)
            })
          })
        } catch (error) {
          faviconUrl = ''
          console.log('faviconUrl Promise got err===>')
          console.log(error)
        }
      }
      q.push({ feed: feeditem, favicon: faviconUrl })
    })
  }
}
