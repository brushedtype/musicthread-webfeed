addEventListener('fetch', event => {
    event.respondWith(main(event.request));
});
async function main(request) {
    // Validate request
    if (request.method !== "GET") {
        return new Response("Only GET is supported", { status: 400 })
    }
    let threadKey = extractThreadKey(request.url)
    if (threadKey == null) {
        return new Response("Invalid request path, expects valid MusicThread thread path", { status: 400 })
    }

    // Fetch MusicThread thread
    let thread;
    try {
        const response = await fetch("https://musicthread.app/api/v0/thread/"+threadKey, {
            headers: {
                Accept: "application/json;charset=UTF-8"
            }
        });
        thread = await response.json();
    } catch (exception) {
        return new Response("Failed to fetch response from MusicThread", { status: 500 })
    }

    // Generate & return RSS Feed
    let feed = generateRssFeed(thread);
    return new Response(feed, {
        headers: {
            "Content-Type": "application/xml;charset=UTF-8"
        }
    });
};

/**
 * Returns a valid RSS feed for the provied MusicThread as a String XML.
 * 
 * @param  {Object} root The JSON response returned by MusicThread's "Get Thread" API
 * @return {String} The XML RSS Feed for this thread
 */
function generateRssFeed(root) {
    let rssFeed = `<?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
            <generator uri="https://github.com/brushedtype/musicthread-rss" version="0.9.0">MusicThread RSS</generator>
            <updated>` + new Date().toISOString() + `</updated>
            <author>
              <name>` + encodeHtml(root.thread.author.name) + `</name>
            </author>
            <link href="https://feed.musicthread.app/thread/` + root.thread.key + `" rel="self" type="application/atom+xml"/>
            <link href="https://musicthread.app/thread/` + root.thread.key + `" rel="alternate" type="text/html"/>
            <id>https://feed.musicthread.app/thread/` + root.thread.key + `</id>
            <title type="html">` + root.thread.title + `</title>`
            + (root.thread.description?.length > 0 ? (`<subtitle>` + encodeHtml(root.thread.description) + `</subtitle>`) : ``)
            + root.thread.tags.forEach(tag => feedCategories += "<category term=\"" + encodeHtml(tag) + "\"/>");
    root.links.forEach(link => {
        rssFeed += `<entry>
            <title type="html">` + encodeHtml(link.title) + `</title>
            <link href="https://musicthread.app/link/` + link.key + `" rel="alternate" title="` + encodeHtml(link.title) + `" type="text/html"/>
            <published>` + link.submitted_at + `</published>
            <updated>` + link.submitted_at + `</updated>
            <id>https://musicthread.app/link/` + link.key + `</id>
            <author>
                <name>` + encodeHtml(link.artist) + `</name>
            </author>
            <category term="type" label="` + link.type.capitalize() + `"/>`
            + (link.description?.length > 0 ? (`<summary type="html">` + encodeHtml(link.description) + `</summary>`) : ``) +
            `<media:thumbnail url="` + link.thumbnail_url + `" xmlns:media="http://search.yahoo.com/mrss/"/>
            <content type="html">` + encodeHtml(generateItemContent(link)) + `</content>
        </entry>`;
    });
    rssFeed += "</feed>";
    return rssFeed;
}

/**
 * Teeny utility method added to the String prototype that:
 *   - Converts all text to lower case, then...
 *   - Capitalizes the first letter of the String
 *
 * Approach snagged from Flavio Copes
 * https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
 */
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

/**
 * Generates the content body for a given thread "link". This is what's
 * displayed in RSS readers when you select a particular entry.
 * 
 * @param  {Object} link The MusicThread link object
 * @return {String} An HTML String for the provided MusicThread link
 */
function generateItemContent(link) {
    return `<img src="` + link.thumbnail_url + `">
    <h1>` + encodeHtml(link.title) + `</h1>
    <h3>by `+ encodeHtml(link.artist) + `</h3>`
    + (link.description?.length > 0 ? (`<p>` + link.description + `</p>`) : ``);
}

/**
 * Returns an HTML-encoded copy of the provided text.
 *
 * Approach snagged from deftstack's HTML Encoding guide.
 * https://www.delftstack.com/howto/javascript/htmlencode-javascript/
 * 
 * @param  {String} text The string to encode
 * @return {String} The encoded String ready to use as HTML values
 */
function encodeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&#34;')
        .replace(/\//, '&#x2F;');
}

/**
 * Attempts to extract and return the thread key from the provided URL String.
 * 
 * @param {String} url The request's full URL 
 * @return {String} The thread key if found, otherwise null (invalid request)
 */
function extractThreadKey(url) {
    let urlTokens = url.split("/")
    if (urlTokens.length < 5) {
        return null;
    }
    if (urlTokens[4].length !== 27) {
        return null;
    }
    return urlTokens[4];
}