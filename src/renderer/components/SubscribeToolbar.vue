<template>
  <div class="subscribe-toolbar">
    <div class="logo">
      <img id="logo-image" src="../../../static/raven-logo.svg" />
      <span class="logo-title">Spark Reader</span>
    </div>
    <div class="btn-subscribe" v-if="accountType != 'fever'" >
      <button class="btn" v-b-modal.addfeed>
        <div>
          <feather-icon name="plus"></feather-icon> Add
        </div>
      </button>
    </div>
    <subscribe-modal></subscribe-modal>
  </div>
</template>

<script>
export default {
  props: {
    accountType: {
      accountType: String,
      default: ''
    }
  }
}
</script>
<style lang="scss">
.subscribe-toolbar {
  display: flex;
  height: 41px;
  border-bottom: 1px solid #e3e3e3;
}

#logo-name {
  fill: #000;
}

.app-darkmode {
  #logo-name {
    fill: #fff;
  }
}

.logo {
  line-height: 40px;
  align-items: center;
  margin-left: 15px;
  #logo-image {
    width: 25px;
    height: auto;
  }

  .logo-title {
    font-size: 16px;
    font-weight: normal;
    font-family: 'Lobster';
    color: black;
  }
}

.btn-subscribe {
  border-radius: 0;
  user-select: none;
  line-height: 40px;
  cursor: pointer;
  position: relative;
  text-align: left !important;
  background: transparent;
  color: #3399FF;
  align-items: center;

  .btn {
    font-weight: 700 !important;
    font-size: 16px;
  }

  .btn:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  .btn:active {
    outline: none !important;
    box-shadow: none !important;
  }

  .feather {    
    margin-right: 5px;
  }
}
</style>
