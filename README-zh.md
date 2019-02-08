# SparkReader

SparkReader是一个基于Raven reader的RSS阅读器，国内网络原因取消了mecury全文抓取（建议由服务端采集输出全文RSS），关键增强/修改：

- [x] 支持Fever API，支持与miniflux、Tiny Tiny RSS等自建RSS服务端进行同步
- [x] 支持全局代理
- [x] 数据库使用linvodb3(leveldb)，更好的性能
- [x] 快捷键支持，阅读更高效
- [x] 多账户支持(本地、Fever)
- [x] 一系列健壮性和交互细节改进（参考了MacOS Reeder）

界面截图：

![SparkReader-screenshot](./.img/SparkReader-screenshot.png)

## 使用方法

首次安装默认是本地账户，当前可以手工添加fever server配置。

以Windows为例，编辑配置文件 `C:\Users\[用户名]\AppData\Roaming\sparkreader\config.json`，参考配置：

```json
{
	"settings": {
		"cronjob": "*/10 * * * *"
	},
	"accounts": {
		"default": "rss",
		"active": "miniflux",
		"accounts": {
			"rss": {
				"name": "rss",
				"type": "local",
				"username": "",
				"passwd": "",
				"endpoint": "",
				"lastFetchTime": 0
			},
			"miniflux": {
				"name": "miniflux",
				"type": "fever",
				"username": "xxx",
				"passwd": "xxx",
				"endpoint": "https://xxx",
				"lastFetchTime": 1549619407
			}
		}
	}
}
```

## 快捷键

`Space` 空格键是打开阅读列表第一个，配合默认的未读筛选，可以高效标记未读

`a` 标记当前列表中所有文章为已读状态

`m` 标记当前文章已读/未读

`s` 收藏/去收藏当前文章

`o` 浏览器打开当前文章原链接

`n` 切换到下一个源

`p` 切换到上一个源

## TODO

非刚需，有空再说

- [ ] 主题切换
- [ ] 多账户界面配置切换
- [ ] 正文字体大小调节

## PS

二次开发此应用的主要原因：

- MacOS下的Reeder是很好的选择，但是Reeder没有win版
- Win下的FeedDemon也很不错，但是不支持Fever API与Miniflux同步，也时长出现乱码，而且实在是太久没更新了
- Miniflux的网页版实在太简单，不过这个可以自己定制，比如添加侧边分类等，但是，远程网页访问，页面刷起来实在是太慢了，没有本地应用畅快的感觉