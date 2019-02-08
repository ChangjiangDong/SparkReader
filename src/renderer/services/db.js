import DB from '../db'
import _ from 'lodash'

let db = DB.getInstance()
const connect = db.init()
let article = connect.article
let feed = connect.feed
let type = db.type
const favicon = connect.favicon

export default {
  ensureIndex (db, field) {
    db.ensureIndex({ fieldName: field, unique: true }, (err) => {
      if (err) {}
    })
  },
  fetchFeeds (cb) {
    return feed.find({}, (err, docs) => {
      if (err) {}
      return cb(docs)
    })
  },
  fetchFavs (cb) {
    return favicon.find({}).exec((err, docs) => {
      if (err) {}
      cb(docs)
    })
  },
  fetchArticles (cb) {
    return article.find({}).sort({ pubDate: -1 }).exec((err, docs) => {
      if (err) {}
      cb(docs)
    })
  },
  fetchArticle (id, cb) {
    return article.findOne({ _id: id }, (err, doc) => {
      if (err) {}
      return cb(doc)
    })
  },
  addFeed (data, cb) {
    this.ensureIndex(feed, 'xmlurl')
    return feed.insert(data, (err, docs) => {
      if (err) {}
      return cb(docs)
    })
  },
  deleteFeed (id) {
    feed.remove({ id: id }, {}, (err, numRemoved) => {
      if (err) {}
    })
  },
  addArticles (data, cb) {
    this.ensureIndex(article, 'guid')
    return article.insert(data, (err, docs) => {
      if (err) {}
      return cb(docs)
    })
  },
  deleteArticles (id, cb) {
    return article.remove({ feed_id: id }, { multi: true }, (err, numRemoved) => {
      if (err) {}
      return cb(numRemoved)
    })
  },
  cleanArticles (time, cb) {
    if (type === 'fever') {
      // do not clean stared articles
      return article.remove({ $and: [ { is_saved: 0 }, { created_on_time: { $lte: time } } ] }, { multi: true }, (err, numRemoved) => {
        if (err) {}
        return cb(numRemoved)
      })
    } else {
      return article.remove({ $and: [ { favourite: false }, { pubDate: { $lte: time } } ] }, { multi: true }, (err, numRemoved) => {
        if (err) {}
        return cb(numRemoved)
      })
    }
  },
  markOffline (id) {
    article.update({ _id: id }, { $set: { offline: true } }, {}, (err, num) => {
      if (err) {}
    })
  },
  markOnline (id) {
    article.update({ _id: id }, { $set: { offline: false } }, {}, (err, num) => {
      if (err) {}
    })
  },
  markFavourite (id) {
    if (type === 'fever') {
      article.update({ _id: _.toInteger(id) }, { $set: { is_saved: 1 } }, {}, (err, num) => {
        if (err) {}
      })
    } else {
      article.update({ _id: id }, { $set: { favourite: true } }, {}, (err, num) => {
        if (err) {}
      })
    }
  },
  markUnfavourite (id) {
    if (type === 'fever') {
      article.update({ _id: _.toInteger(id) }, { $set: { is_saved: 0 } }, {}, (err, num) => {
        if (err) {}
      })
    } else {
      article.update({ _id: id }, { $set: { favourite: false } }, {}, (err, num) => {
        if (err) {}
      })
    }
  },
  markFeedRead (id) {
    if (type === 'fever') {
      article.update({ feed_id: _.toInteger(id) }, { $set: { is_read: 1 } }, { multi: true }, (err, num) => {
        if (err) {}
      })
    } else {
      article.update({ feed_id: id }, { $set: { read: true } }, { multi: true }, (err, num) => {
        if (err) {}
      })
    }
  },
  markAllRead (id) {
    if (type === 'fever') {
      article.update({}, { $set: { is_read: 1 } }, { multi: true }, (err, num) => {
        if (err) {}
      })
    } else {
      article.update({}, { $set: { read: true } }, { multi: true }, (err, num) => {
        if (err) {}
      })
    }
  },
  markRead (id) {
    if (type === 'fever') {
      article.update({ _id: _.toInteger(id) }, { $set: { is_read: 1 } }, {}, (err, num) => {
        if (err) {}
      })
    } else {
      article.update({ _id: id }, { $set: { read: true } }, {}, (err, num) => {
        if (err) {}
      })
    }
  },
  markUnread (id) {
    if (type === 'fever') {
      article.update({ _id: _.toInteger(id) }, { $set: { is_read: 0 } }, {}, (err, num) => {
        if (err) {}
      })
    } else {
      article.update({ _id: id }, { $set: { read: false } }, {}, (err, num) => {
        if (err) {}
      })
    }
  }
}
