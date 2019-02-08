// import FeedParser from 'feedparser'
// import he from 'he'
import got from 'got'
import md5 from 'md5'
import querystring from 'querystring'
import DB from '../db'
import Store from 'electron-store'
import dayjs from 'dayjs'
import _ from 'lodash'

const store = new Store()
const db = DB.getInstance()
const connect = db.init()
const article = connect.article
const feed = connect.feed
const favicon = connect.favicon

// Do not support group for now, cause it do not necessary for me.
// Fever API key
function getApiKey (config) {
  return md5(config.username + ':' + config.passwd)
}

/**
 * Sync with fever
 */
export async function FeverSync (config) {
  console.log(`======fever sync start ${config.endpoint}======`)
  // url shoud end with /
  if (config.endpoint.charAt(config.endpoint.length - 1) !== '/') {
    config.endpoint = config.endpoint + '/'
  }
  await FetchFeedList(config)
  await FetchNewItems(config)
  await FetchFavicons(config)
  await FetchSavedItems(config)
  await FetchUnreadItems(config)
  console.log(`======fever sync end ${config.endpoint}======`)
}

/**
 * http request
 */
function httpFetch (url, method, params) {
  return new Promise(resolve => {
    got(url, {
      method: method,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify(params)
    }).then(response => {
      if (response) {
        resolve(response.body)
      }
    }).catch(error => {
      console.log('httpFetch got err ===>' + url)
      console.log(error)
    })
  })
}

/**
 * Fetch Group list
 * unused for now
 * https://xxx/fever/?api&groups
 */
export async function FetchGroupList (config) {
  const params = {
    api_key: getApiKey(config)
  }
  const groups = await httpFetch(config.endpoint + '?api&groups', 'POST', params)
  console.log(groups)
  // save to db, do not need group for now
}

/**
 * Fetch Feed list
 * https://xxx/fever/?api&feeds
 */
export async function FetchFeedList (config) {
  const params = {
    api_key: getApiKey(config)
  }
  const feeds = await httpFetch(config.endpoint + '?api&feeds', 'POST', params)
  let feedsItems = JSON.parse(feeds).feeds
  feedsItems.map((item) => {
    item._id = item.id
    return item
  })
  // save to db, clear all first.
  const savedb = new Promise((resolve, reject) => {
    feed.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) {
        console.log('clear feed db error: ' + err)
      }
      feed.save(feedsItems, (err, docs) => {
        if (err) {
          console.error('fever sync: FetchFeedList store err: ' + err)
        }
        resolve(docs)
      })
    })
  })
  await savedb
}

/**
 * Fetch Favico list
 * https://xxx/fever/?api&favicons
 */
export async function FetchFavicons (config) {
  const params = {
    api_key: getApiKey(config)
  }
  const favs = await httpFetch(config.endpoint + '?api&favicons', 'POST', params)
  let favItems = JSON.parse(favs).favicons
  favItems.map((item) => {
    item._id = item.id
    return item
  })
  favItems = _.uniqBy(favItems, '_id')
  // save to db
  const savedb = new Promise((resolve, reject) => {
    favicon.save(favItems, (err, docs) => {
      if (err) {
        console.error('fever sync: FetchFavicons store err: ' + err)
      }
      resolve(docs)
    })
  })
  await savedb
}

/**
 * get max id from article db
 */
export function GetMaxId () {
  return new Promise(resolve => {
    article.find({}).sort({ id: -1 }).limit(1).exec((err, doc) => {
      if (err) {
        console.log('GetMaxId err' + err)
      }
      if (doc.length > 0) {
        resolve(doc[0].id)
      } else {
        resolve(0)
      }
    })
  })
}

/**
 * Fetch latest items
 * https://xxx/fever/?api&items&since_id=xxx
 */
export async function FetchNewItems (config) {
  const params = {
    api_key: getApiKey(config)
  }

  // fetch util items is empty.
  let sinceid = await GetMaxId()
  let newItems
  let jsonObj
  let savedb

  while (true) {
    newItems = await httpFetch(config.endpoint + '?api&items&since_id=' + sinceid, 'POST', params)
    console.log('update sinceid: ' + sinceid)
    jsonObj = JSON.parse(newItems)
    if (jsonObj.items.length === 0) {
      break
    }
    sinceid = jsonObj.items[jsonObj.items.length - 1].id
    jsonObj.items.map((item) => {
      item._id = item.id
      return item
    })
    // save to db
    savedb = new Promise((resolve, reject) => {
      article.save(jsonObj.items, (err, docs) => {
        if (err) {
          console.log('FetchNewItems save db err' + err)
        }
        resolve(docs)
      })
    })
    await savedb
  }

  // save the last fetch item time
  saveLastFetchTime()
}

function saveLastFetchTime () {
  let accounts = store.get('accounts.accounts')
  const active = store.get('accounts.active')
  let account = accounts[active]
  account.lastFetchTime = dayjs().unix()
  accounts[active] = account
  store.set('accounts.accounts', accounts)
}

/**
 * Fetch saved/star items id
 * https://xxx/fever/?api&saved_item_ids
 */
export async function FetchSavedItems (config) {
  const params = {
    api_key: getApiKey(config)
  }
  const savedItems = await httpFetch(config.endpoint + '?api&saved_item_ids', 'POST', params)
  let itemArr = JSON.parse(savedItems).saved_item_ids.split(',')
  // to int array
  itemArr = itemArr.map(data => {
    return +data
  })
  // save to db
  await saveItemsToDb('star', itemArr)
  await saveItemsToDb('unstar', itemArr)
}

/**
 * save star/saved stat to db
 * @param {*} type
 * @param {*} itemArr
 */
function saveItemsToDb (type, itemArr) {
  return new Promise((resolve, reject) => {
    if (type === 'star') {
      article.update({ id: { $in: itemArr } }, { $set: { is_saved: 1 } }, { multi: true }, (err, num) => {
        if (err) {
          console.log('FetchSavedItems set all saved stat init in db err 1' + err)
        }
        console.log(`FetchSavedItems update ${num} docs in db`)
        resolve(num)
      })
    } else {
      article.update({ id: { $nin: itemArr } }, { $set: { is_saved: 0 } }, { multi: true }, (err, num) => {
        if (err) {
          console.log('FetchSavedItems save db err' + err)
        }
        resolve(num)
      })
    }
  })
}

/**
 * Fetch unread items id
 * https://xxx/fever/?api&unread_item_ids
 */
export async function FetchUnreadItems (config) {
  const params = {
    api_key: getApiKey(config)
  }
  const unreadItems = await httpFetch(config.endpoint + '?api&unread_item_ids', 'POST', params)
  let itemArr = JSON.parse(unreadItems).unread_item_ids.split(',')
  // to int array
  itemArr = itemArr.map(data => {
    return +data
  })
  // save to db
  await unreadItemsToDb('read', itemArr)
  await unreadItemsToDb('unread', itemArr)
}

/**
 * save unread stat to db
 * @param {*} type
 * @param {*} itemArr
 */
function unreadItemsToDb (type, itemArr) {
  return new Promise((resolve, reject) => {
    if (type === 'read') {
      article.update({ id: { $nin: itemArr } }, { $set: { is_read: 1 } }, { multi: true }, (err, num) => {
        if (err) {
          console.log('FetchUnreadItems set all unread stat init in db err' + err)
        }
        resolve(num)
      })
    } else {
      article.update({ id: { $in: itemArr } }, { $set: { is_read: 0 } }, { multi: true }, (err, num) => {
        if (err) {
          console.log('FetchUnreadItems save db err' + err)
        }
        console.log(`FetchUnreadItems update ${num} docs in db`)
        resolve(num)
      })
    }
  })
}

/**
 * MarkStat
 * @param {*} config
 * @param {*} marktype item/feed/group
 * @param {*} markas read/unread/saved/unsaved, unread/saved/unsaved only for item
 * @param {*} id itemid/feedid/groupid, groupid=0 means all
 */
export async function MarkStat (config, marktype, markas, id) {
  let params = {
    api_key: getApiKey(config),
    id: id,
    mark: marktype,
    as: markas
  }
  if (marktype === 'group' || marktype === 'feed') {
    // get last time
    let accounts = store.get('accounts.accounts')
    const active = store.get('accounts.active')
    let account = accounts[active]
    params.before = account.lastFetchTime
  }

  // console.log('MarkStat params: ' + JSON.stringify(params))
  await httpFetch(config.endpoint + '?api', 'POST', params)
}
