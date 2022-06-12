import he from 'he';

addEventListener('fetch', event => {
    event.respondWith(main(event.request));
});

async function main(request) {
    // Validate request
    if (request.method !== "GET") {
        return new Response("Only GET is supported", { status: 400 })
    }

    const threadKey = parseThreadKey(request.url)
    if (threadKey == null) {
        return new Response("Unsupported request path, expects valid MusicThread thread path", { status: 404 })
    }

    try {
        // Fetch MusicThread thread
        const response = await fetchThread(threadKey);
        const json = await response.json();

        if (response.status >= 400) {
            const stdErrorResponse = "Failed to fetch response from MusicThread"
            const errorMessage = (json.error != null) ? `${stdErrorResponse} (${json.error})` : stdErrorResponse
            return new Response(errorMessage, { status: response.status });
        }

        // Generate RSS Feed
        const feed = generateRSSFeed(json);

        // Return successful HTTP response
        return new Response(feed, {
            headers: {
                "Content-Type": "application/xml;charset=UTF-8"
            }
        });

    } catch (error) {
        console.error(error)
        return new Response("Failed to generate response from MusicThread", { status: 500 })
    }
};

async function fetchThread(key) {
    const opts = {
        headers: {
            Accept: "application/json;charset=UTF-8"
        }
    }
    return await fetch(`https://musicthread.app/api/v0/thread/${key}`, opts);
}

/**
 * Returns a valid XML string representing the link description or empty string when no
 * description is available.
 *
 * @param  {Object} link The Link object obtained from the MusicThread API
 * @return {String} The summary element or empty string
 */
function generateRSSFeedEntrySummary(link) {
    if (link.description == "") {
        return "";
    }
    return `<summary type="html">${encodeHtml(link.description)}</summary>`
}

/**
 * Returns a valid XML `entry` element representing the given link
 *
 * @param  {Object} link The Link object obtained from the MusicThread API
 * @return {Array<String>} The valid XML element representing the given link
 */
function generateRssFeedEntry(link) {
    const linkURL = `https://musicthread.app/link/${link.key}`

    const summaryContent = generateRSSFeedEntrySummary(link)

    return `
<entry>
    <published>${link.submitted_at}</published>
    <updated>${link.submitted_at}</updated>

    <id>${linkURL}</id>
    <link href="${linkURL}" rel="alternate" title="${encodeHtml(link.title)}" type="text/html" />

    <author>
        <name>${encodeHtml(link.artist)}</name>
    </author>

    <title type="html">${encodeHtml(link.title)}</title>
    <content type="html">${encodeHtml(generateItemContent(link))}</content>
    <media:thumbnail url="${link.thumbnail_url}" xmlns:media="http://search.yahoo.com/mrss/"/>
    <category term="type" label="${link.type.capitalize()}"/>

    ${summaryContent}
</entry>`
}

/**
 * Returns a valid XML string representing the thread description or empty string when no
 * description is available.
 *
 * @param  {Object} thread The Thread object obtained from the MusicThread API
 * @return {String} The subtitle element or empty string
 */
function generateRSSFeedThreadSummary(thread) {
    if (thread.description == "") {
        return ""
    }
    return `<subtitle>${encodeHtml(root.thread.description)}</subtitle>`
}

/**
 * Returns an array of valid XML tags representing the thread tags as `category` elements
 *
 * @param  {Object} thread The Thread object obtained from the MusicThread API
 * @return {Array<String>} The array of valid XML tags representing the thread tags
 */
function generateRSSFeedCategories(thread) {
    return thread.tags.map(tag => {
        return `<category term="${encodeHtml(tag)}" />`
    })
}

/**
 * Returns a valid RSS feed for the provided MusicThread as a String XML.
 *
 * @param  {Object} root The JSON response returned by MusicThread's "Get Thread" API
 * @return {String} The XML RSS Feed for this thread
 */
function generateRSSFeed(root) {
    const feedURL = `https://rss.musicthread.app/thread/${root.thread.key}`;
    const threadURL = `https://musicthread.app/thread/${root.thread.key}`;

    const subtitleContent = generateRSSFeedThreadSummary(root.thread);
    const categoryContentItems = generateRSSFeedCategories(root.thread).join("\n");
    const entryContentItems = root.links.map(link => generateRssFeedEntry(link)).join("\n");

    return `
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <generator uri="https://github.com/brushedtype/musicthread-rss" version="0.9.0">MusicThread RSS</generator>
    <updated>${(new Date()).toISOString()}</updated>

    <id>${feedURL}</id>
    <link href="${feedURL}" rel="self" type="application/atom+xml"/>
    <link href="${threadURL}" rel="alternate" type="text/html"/>

    <author>
        <name>${encodeHtml(root.thread.author.name)}</name>
    </author>

    <title type="html">${root.thread.title}</title>
    ${subtitleContent}
    ${categoryContentItems}

    ${entryContentItems}
</feed>`;
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
    const linkDescription = (link.description == "") ? "" : `<p>${link.description}</p>`

    return `
<img src="${link.thumbnail_url}">
<h1>${encodeHtml(link.title)}</h1>
<h3>by ${encodeHtml(link.artist)}</h3>
${linkDescription}
<p>
    <a href="https://musicthread.app/link/${link.key}">Open in MusicThread</a>
</p>
    `;
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
    return he.encode(text);
}

/**
 * Attempts to extract and return the thread key from the provided URL String.
 *
 * @param {String} url The request's full URL
 * @return {String} The thread key if found, otherwise null (invalid request)
 */
function parseThreadKey(url) {
    const requestURL = new URL(url);
    const pathComponents = requestURL.pathname.substring(1).split("/");

    if (pathComponents.length !== 2) {
        return null;
    }

    if (pathComponents[0] !== "thread") {
        return null;
    }

    if (pathComponents[1].length === 0) {
        return null;
    }

    return pathComponents[1];
}
