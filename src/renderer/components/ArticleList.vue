<template>
  <div class="articles-list">
    <div class="articles-inner">
      <form class="search-form">
        <div class="search-input input-group mb-0">
          <div class="input-group-prepend">
            <span class="input-group-text">
              <feather-icon name="search"></feather-icon>
            </span>
          </div>
          <input type="text" class="form-control" placeholder="Search" aria-label="Search" v-model="search">          
        </div>
      </form>
      <div class="toolsbar">
            <div class="tool">
              <button class="btn btn-toolbar" @click="sync" v-b-tooltip.hover title="Sync">
                <feather-icon name="refresh-cw"></feather-icon>
              </button>
            </div>
            <div class="tool">
              <button class="btn btn-toolbar" @click="markTypeAll" v-b-tooltip.hover title="Mark all as read" ref="markAll">
                <feather-icon name="check-circle"></feather-icon>
              </button>
            </div>
            <div class="tool">
              <router-link to="/all#" active-class="active">
                <button class="btn btn-toolbar" v-b-tooltip.hover title="All">
                  <feather-icon name="list"></feather-icon>
                </button>
              </router-link>
            </div>
            <div class="tool">
              <router-link to="/unread" active-class="active">
                <button class="btn btn-toolbar" v-b-tooltip.hover title="Unread">
                  <feather-icon name="circle"></feather-icon>
                </button>
              </router-link>
            </div>
            <div class="tool">
              <router-link to="/favourites" active-class="active">
                <button class="btn btn-toolbar" v-b-tooltip.hover title="Favorites">
                  <feather-icon name="star" class="fill"></feather-icon>
                </button>
              </router-link>
            </div>
      </div>
      <div class="articles"  ref="container">
        <div class="list-group" v-if="filteredArticles.length > 0">
          <article-item :article="article" v-for="article in filteredArticles" :key="article._id"></article-item>
          <div class="no-articles" v-if="filteredArticles.length === 0">
            No articles available
          </div>
        </div>
      </div>
      <div class="statusBar" ref="statusBar">
        <button @click="fold" class="btn foldBtn">
          <feather-icon :name="featherIcon"></feather-icon>
        </button>
        <span ref="statusMsg" class="statusMsg"></span>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      search: null,
      resizing: '',
      dw: 0,
      dx: 0,
      featherIcon: 'chevron-left'
    }
  },
  props: {
    type: {
      type: String,
      default: 'all'
    },
    feed: {
      type: String
    }
  },
  watch: {
    search (val) {
      this.$store.dispatch('changeType', 'search')
      this.$store.dispatch('setSearch', val)
    },
    filteredArticles: 'itemsChange'
  },
  computed: {
    ...mapGetters([
      'filteredArticles'
    ])
  },
  methods: {
    itemsChange () {
      this.$refs.statusMsg.innerText = `${this.filteredArticles.length} items`
    },
    fold () {
      this.$parent.$refs.sidebar.hidden = !this.$parent.$refs.sidebar.hidden
      if (this.$parent.$refs.sidebar.hidden) {
        this.featherIcon = 'chevron-right'
      } else {
        this.featherIcon = 'chevron-left'
      }
    },
    scrollTop () {
      if (this.$refs.container) {
        this.$refs.container.scrollTop = 0
      }
    },
    sync () {
      this.$refs.statusMsg.innerText = 'Syncing...'
      this.$store.dispatch('refreshFeeds', this.$store.state.Accounts.accounts)
    },
    markTypeAll () {
      if (this.$store.state.Article.feed) {
        // mark feed as read
        this.$store.dispatch('markAction', {
          type: 'READ',
          id: this.$route.params.id,
          feed_id: this.$store.state.Article.feed,
          accounts: this.$store.state.Accounts.accounts
        })
      } else {
        // mark all as read
        this.$store.dispatch('markAllRead', {
          accounts: this.$store.state.Accounts.accounts
        })
      }
    }
  }
}
</script>
<style lang="scss">
.articles-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow:hidden;
}

.articles-list {
  position: relative;
  flex-grow: 0;
  width: 350px;
  min-width: 300px;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  height: 100%;
  .mb-3 {
    margin-bottom: 5px !important;
  }
  .list-group-item {
    background-color: rgb(248, 247, 245);
    padding: 5px 15px;
    h6 {
      font-weight: bold;
    }
  }
}

.articles-list:after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 25px;
  // background: linear-gradient(rgba(255, 255, 255, 0.001), white ); /* transparent keyword is broken in Safari */
  pointer-events: none;
}

.articles {  
  position: absolute;
  top: 41px;
  bottom: 29px;
  left: 0;
  right: 0;
  overflow-y: auto;
  // background: #fff;
  background-color: rgb(248, 247, 245) !important;
  overflow-x: hidden;
  h6 {
    font-size: 14px;
  }
}

.no-articles {
  display: flex;
  height: 90vh;
  justify-content: center;
  align-items: center;
}

.article-read {
  opacity: 0.6;
  h6 {
    font-weight: normal !important;
  }
}

.search-input {
  position: absolute;
  top: 0;
  bottom: 0;

  .input-group-text {
    background: none;
    border: 0;
  }
}

.search-form {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  margin: 0;
  border-bottom: 1px solid transparent;
  border-color: #dcdee0;
  background-color: rgb(248, 247, 245);
  height: 41px;

  .form-control {
    background-color: rgb(248, 247, 245);
    border-radius: 0;
    border: 0;
    padding-left: 0px;

    &:focus {
      background-color: rgb(248, 247, 245);
      box-shadow: none;
      outline: 0;
    }
  }
}

.toolsbar {
  position: absolute;
  right: 0;
  top: 0;
  margin: 0;
  height: 41px;
  display: flex;
  z-index: 10;
  align-items: center;
  
  .btn {
      color: rgb(65, 65, 65);
      margin-right: 2px;
      padding: 0 !important;
      width: 28px;
      border: 1px solid #dcdee0;
      height: 28px;

      .fill {
        fill: rgb(65, 65, 65);
      }
  }

  .btn:hover {
    color: #007bff;
    .fill {
      fill: #007bff;
    }
  }
}

.statusBar {
  height: 30px;
  line-height: 30px;
  width: 100%;
  position: absolute;
  background-image: linear-gradient(135deg, #f8f4f0 0%, #faf5f1 100%);
  bottom: 0;
  border-top: 1px solid #dcdee0;
  display: flex;
  align-items: center;
  z-index: 20;
}

.statusMsg {
  line-height: 30px;
  width: 100%;
  font-size: 12px;
  text-align: center;
}

.foldBtn {
  left: 0;
  margin: 0 !important;
  padding: 0 !important;
}

.foldBtn:hover {
  color: #3399FF !important;
}

.foldBtn:focus {
  outline: none !important;
  box-shadow: none !important;
}

.foldBtn:active {
  outline: none !important;
  box-shadow: none !important;
}
</style>
