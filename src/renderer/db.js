import DataStore from 'linvodb3'
import Store from 'electron-store'

const store = new Store()

export default class DBConnection {
  constructor () {
    this.db = null
    this.instance = null
    this.accountName = 'default'
    this.type = 'local'
    if (store.get('accounts')) {
      const accounts = store.get('accounts')
      this.accountName = accounts.default
      this.type = accounts.accounts[this.accountName].type
    }
  }

  static getInstance () {
    if (!this.instance) {
      this.instance = new DBConnection()
    }

    let acctName = 'default'
    let accounts
    if (store.get('accounts')) {
      accounts = store.get('accounts')
      acctName = accounts.active
    }
    if (acctName) {
      if (acctName !== this.instance.accountName) {
        // acount changed, close old db
        if (this.instance.db) {
          this.instance.db.article.close()
          this.instance.db.feed.close()
          this.instance.db.favicon.close()
          this.instance.db = null
        }
        this.instance.accountName = acctName
        this.instance.type = accounts.accounts[acctName].type
      }
    }

    return this.instance
  }

  createOrReadDatabase (db) {
    let database = {}
    DataStore.dbPath = process.cwd()
    database.article = new DataStore('article', {
      filename: `./db/${this.accountName}/${db.article}`
    })

    database.feed = new DataStore('feed', {
      filename: `./db/${this.accountName}/${db.feed}`
    })

    database.favicon = new DataStore('favicon', {
      filename: `./db/${this.accountName}/${db.favicon}`
    })

    return database
  }

  init () {
    if (this.db) {
      return this.db
    }
    this.db = this.createOrReadDatabase({
      article: 'articles.db',
      feed: 'feeds.db',
      favicon: 'favicon.db'
    })

    return this.db
  }
}
