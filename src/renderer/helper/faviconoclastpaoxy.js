const url = require('url')
const htmlparser = require('htmlparser2')
const got = require('got')

const validRelValues = [
  'apple-touch-icon',
  'apple-touch-icon-precomposed',
  'icon',
  'shortcut icon',
  'favicon'
]

function extractLinkNodes (text) {
  let linkNodes = []

  const parser = new htmlparser.Parser({
    onopentag: (name, attributes) => {
      if (name !== 'link') {
        return
      }
      // const rel = attributes.rel.toLowerCase();
      const rel = String(attributes.rel).toLowerCase()
      // Only include <link> elements with icon-related "rel" values.
      if (validRelValues.includes(rel)) {
        linkNodes.push(Object.assign(attributes, { rel }))
      }
    }
  })

  parser.write(text)
  parser.end()

  // Sort <link> nodes so that "rel" values are in the same order as the
  // list of desired rel types.
  linkNodes.sort((a, b) => {
    let aRel = validRelValues.indexOf(a.rel)
    let bRel = validRelValues.indexOf(b.rel)
    return aRel - bRel
  })

  return linkNodes.map(link => link.href)
}

function parseResults (pageUrl, cb, response) {
  const baseUrl = `${response.request.gotOptions.protocol}//${response.request.gotOptions.host}`
  let linkNodes = extractLinkNodes(response.body)

  if (linkNodes.length > 0) {
    return cb(null, new url.URL(linkNodes[0], baseUrl).href)
  }

  cb(null, new url.URL('favicon.ico', baseUrl).href)
}

function getHostname (pageUrl) {
  if (!pageUrl.match(/^[a-zA-Z]+:\/\//)) {
    pageUrl = 'http://' + pageUrl
  }

  const urlParts = new url.URL(pageUrl)

  return `${urlParts.protocol}//${urlParts.hostname}`
}

export default (pageUrl, cb) => {
  const homepageUrl = getHostname(pageUrl)
  got(homepageUrl).then(response => {
    if (!response) {
      return cb(null, '')
    }
    parseResults(pageUrl, cb, response)
  }).catch(error => {
    console.log('faviconoclastpaoxy got err 1===>')
    console.log(error)
    cb(null, '')
  })
}
