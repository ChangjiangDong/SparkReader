<template>
  <div class="article-detail">
    <div class="content-wrapper">
      <article-toolbar :article="article" ref="articleToolbar"></article-toolbar>
      <div class="article-contentarea  px-4" v-if="article !== null && article.content !== null && !emptyState"  ref="contentContainer">
        <h2>
          <strong>{{ article.title }}</strong><br/>
          <small><span v-if="article.date_published">{{ article.date_published }} </span> <span v-if="article.author">by {{ article.author }}</span>  <strong v-if="article.date_published || article.date_published">&#183;</strong> {{ article.readtime }}</small>
        </h2>
        <div class="article-detail" v-html="article.content" v-highlight></div>
      </div>
      <div class="article-contentarea  px-4" v-if="article !== null && article.content === null && emptyState">
        <div class="article-detail d-flex flex-column justify-content-center align-items-center
">
          <h3 class="mb-4">Whoops! not able to load content.</h3>
          <a :href="article.url" class="btn btn-primary btn-outline-primary js-external-link">
            View it on web
          </a>
        </div>
      </div>
      <div class="article-contentarea loading-state px-4" v-if="loading">
        <loader v-if="loading"></loader>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    id: {
      type: String
    },
    article: {
      type: Object
    },
    emptyState: {
      type: Boolean
    },
    loading: {
      type: Boolean
    }
  },
  methods: {
    scrollTop () {
      if (this.$refs.contentContainer) {
        this.$refs.contentContainer.scrollTop = 0
      }
    }
  }
}
</script>
<style lang="scss">
.article-detail {
  position: relative;
  flex-grow: 1;
  height: 100%;
  // font-size: 14px;
  color: black;
}

.article-detail img{
  // margin-bottom: 15px;
  width: auto;
	height: auto;
	max-width: 100%;
	max-height: 100%;
  display: block !important;
}

.favicon-wrap img {
  margin-bottom: 18px;
}

.content-wrapper {
  // background-color: rgb(248, 247, 245);
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.article-contentarea {
  display: block;
  position: absolute;
  height: auto;
  bottom: 0;
  left: 0;
  right: 0;
  top: 41px;
  margin: 0;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 2;
  padding: 15px;
  
  h2 {
    small {
      font-size: 14px;
    }
  }
}

.article-detail {
  font-size: 14px;
  line-height: 1.5;
  color: black;

  img {
    display: block;
    max-width: 100%;
    height: auto;
    width: auto;
  }

  .lead {
    font-size: 14px;
    font-weight: 300;
  }

  .off-screen {
    display: none;
  }
  
  .story-image-copyright {
    display: none
  }

  h1 {
    padding-bottom: 10px;
    font-size: 24px;
    line-height: 1.2;
    border-bottom: 1px solid #eee;
    font-weight: bold;
  }

  h2 {
    padding-bottom: 10px;
    font-size: 20px;
    line-height: 1.2;
    border-bottom: 1px solid #eee;
    font-weight: bold;
  }
  
  h3 {
    font-size: 18px;
    line-height: 1.2;
    font-weight: bold;
  }

  h4 {
    font-size: 16px;
    font-weight: bold;
  }

  h5 {
    font-size: 14px;
    font-weight: bold;
  }

  h6 {
    font-size: 14px;
    color: #777;
    font-weight: bold;
  }
  table {
    padding: 0;
    word-break: initial;
  }
  table tr {
      border-top: 1px solid #dfe2e5;
      margin: 0;
      padding: 0;
  }
  table tr:nth-child(2n),
  thead {
      background-color: #f8f8f8;
  }
  table tr th {
      font-weight: bold;
      border: 1px solid #dfe2e5;
      border-bottom: 0;
      text-align: left;
      margin: 0;
      padding: 6px 13px;
  }
  table tr td {
      border: 1px solid #dfe2e5;
      text-align: left;
      margin: 0;
      padding: 6px 13px;
  }
  table tr th:first-child,
  table tr td:first-child {
      margin-top: 0;
  }
  table tr th:last-child,
  table tr td:last-child {
      margin-bottom: 0;
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
