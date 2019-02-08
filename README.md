# SparkReader

[中文版](./README-zh.md)

SparkReader is an RSS reader based on Raven reader. For China GFW reason, it cancelled the full-text grab of Mecury api (it is recommended use the full-text RSS on server side) .
Key Enhancements / Modifications:

- [ x ] supports the Fever API and syncing with self-host RSS servers like minilux and Tiny Tiny RSS
- [ X ] supports global proxies
- [ x ] uses linvodb3(leveldb) database for better performance
- [ x ] keyboard shortcuts support, reading more efficient
- [ X ] multi-account support (local, Fever)
- [ x ] a series of robustness and interaction details improvements (refer to MacOS Reeder)

SCREENSHOT：

![SparkReader-screenshot](./.img/SparkReader-screenshot.png)

## HOW TO USE

The first installation defaults to a local account, and you can  manually add the fever server configuration for now.

For example, on Windows, edit the configuration file `C:\Users\[USERNAME]\AppData\Roaming\sparkreader\config.json`, reference configuration：

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

## Keyboard shortcuts

`Space` will open first article in articles list, and with the default unread filter, you can efficiently mark articles read

`a` mark all articles in the current articles list as read

`m` mark the current article as read/unread

`s` bookmark/unbookmark current article

`o` open the current article's original link in browser

`n` switch to the next feed

`p` switch to the previous feed

## TODO

Not MUST requirement, only when I have time.

- [ ] theme switch
- [ ] multi-account configuration and switch through GUI
- [ ] text size switch

## PS

The main reason development of this application:
- Reeder from MacOS is a good choice, but Reeder doesn't have a windows version
- Feeddemon on windows is great, too, but it doesn't support  Fever API
- Miniflux's web ui is too simple, and the page loading is not so fast, unlike the local application