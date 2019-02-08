<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'rss-reader'
}
</script>

<style lang="scss">
@import 'node_modules/bootstrap/scss/bootstrap';

html,
#app,
body {
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0;
  background-color: rgb(248, 247, 245);
}

body {
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: "Helvetica Neue",Helvetica,"Microsoft YaHei","微软雅黑","PingFang SC","Hiragino Sans GB",Arial,sans-serif;
}

.sidebar {
  position: relative;
  font-size: 14px;
  flex-grow: 0;
  width: 220px;
  height: 100%;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);

  .nav-link {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: 220px;
  }
}

.sidebar-sticky {
  position: relative;
  top: 0;
  height: calc(100vh - 48px);
  padding-top: 0.5rem;
  overflow-x: hidden;
  overflow-y: auto;
}

@supports ((position: -webkit-sticky) or (position: sticky)) {
  .sidebar-sticky {
    position: -webkit-sticky;
    position: sticky;
  }
}
.sidebar .nav-link {
  color: #000;
}

.sidebar .nav-link .feather {
  margin-right: 5px;
  color: #999;
}

.sidebar .nav-link:hover .feather{
  color: #007bff !important;
}

.sidebar .nav-link:focus {
  outline: 0;
}

.sidebar-heading {
  font-weight: bold;
  font-size: 12px;
  text-transform: uppercase;
}

.activeSubscri {
  color: #007bff !important;
}

.list-group a {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

.list-group-item:first-of-type {
  border-top: 0;
}

.list-group-item {
  border-left: 0;
  border-right: 0;
  border-radius: 0 !important
}

// 自定义Scrollbar
::-webkit-scrollbar {
	width: 7px;
  height: 7px;
	background-color: #F5F5F5;
}

::-webkit-scrollbar-track {
  border-radius: 7px;
  background: rgba(0,0,0,0.01);
  border: 1px solid #ccc;
}

::-webkit-scrollbar-thumb {
  border-radius: 7px;
  background: linear-gradient(left, #fff, #e4e4e4);
  border: 1px solid #aaa;
}

::-webkit-scrollbar-thumb:hover {
  background: #fff;
}

::-webkit-scrollbar-thumb:active {
  background: linear-gradient(left, #22ADD4, #1E98BA);
}
</style>
