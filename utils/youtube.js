/**
 * Fetches the content from a URL, parses it as HTML, and returns the document
 *
 * @param {string} url - The URL to fetch content from
 * @return {Promise<Object>} The DOM document, or null on error
 */
async function fetchUrl(url) {
    try {
        const htmlContent = await request(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");
        return s => doc.querySelector(s);
    } catch (error) {
        console.error("Error fetching or parsing the page:", error.stack);
        return null;
    }
}

/**
 * Gets the Open Graph description from a query selector.
 *
 * @param {Object} querySelector - Query selector to find og:description meta tag
 * @return {string}
 */
function getOgDescription(querySelector) {
    const $ = querySelector;
    return $("meta[property='og:description']").content;
}

/**
 * Gets the Open Graph description from a query selector.
 *
 * @param {Object} querySelector - Query selector to find og:image meta tag
 * @return {string}
 */
function getOgImage(querySelector) {
    const $ = querySelector;
    return $("meta[property='og:image']").content;
}

/**
 * Gets the Open Graph description from a query selector.
 *
 * @param {Object} querySelector - Query selector to find og:title meta tag
 * @return {string}
 */
function getOgTitle(querySelector) {
    const $ = querySelector;
    return $("meta[property='og:title']").content;
}

/**
 * Gets the Open Graph description from a query selector.
 *
 * @param {Object} querySelector - Query selector to find og:url meta tag
 * @return {string}
 */
function getOgUrl(querySelector) {
    const $ = querySelector;
    return $("meta[property='og:url']").content.split("&")[0];
}

/**
 * Gets the Open Graph description from a query selector.
 *
 * @param {Object} querySelector - Query selector to find og:site_name meta tag
 * @return {string}
 */
function getOgSiteName(querySelector) {
    const $ = querySelector;
    return $("meta[property='og:site_name']").content;
}

/**
 * Gets the Open Graph description from a query selector.
 *
 * @param {Object} querySelector - Query selector to find og:title meta tag
 * @return {string}
 */
function getTitle(querySelector) {
    const $ = querySelector;
    return $("meta[property='og:title']").content;
}

/**
 * Gets the channel name from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The channel name
 */
function getChannel(querySelector) {
    const $ = querySelector;
    return $("link[itemprop='name']").getAttribute("content");
}

/**
 * Gets the thumbnail url from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The thumbnail url
 */
function getThumbnailUrl(querySelector) {
    const $ = querySelector;
    return $("link[itemprop='thumbnailUrl']").href;
}

/**
 * Gets the genre from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The genre
 */
function getGenre(querySelector) {
    const $ = querySelector;
    return $("meta[itemprop='genre']").content;
}

/**
 * Gets the video upload date from a query selector.
 *
 * @param {Object} querySelector - Query selector to find uploadDate meta tag
 * @return {Moment} Moment object for video upload date
 */
function getUploadDate(querySelector) {
    const $ = querySelector;
    return moment($("meta[itemprop='uploadDate']").content);
}

/**
 * Gets the video publish date from a query selector.
 *
 * @param {Object} querySelector - Query selector to find uploadDate meta tag
 * @return {Moment} Moment object for video upload date
 */
function getDatePublished(querySelector) {
    const $ = querySelector;
    return moment($("meta[itemprop='datePublished']").content);
}

/**
 * Gets the author name from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The author name
 */
function getAuthorName(querySelector) {
    const $ = querySelector;
    // Dot notation doesn't work here
    return $("span[itemprop='author'] > link[itemprop='name']").getAttribute("content");
}

/**
 * Gets the author url from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The author url
 */
function getAuthorUrl(querySelector) {
    const $ = querySelector;
    return $("span[itemprop='author'] > link[itemprop='url']").href;
}

/**
 * Gets the image source from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The image source
 */
function getImageSrc(querySelector) {
    const $ = querySelector;
    return $("link[rel='image_src']").href;
}

/**
 * Gets the shortlink url from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The shortlink url
 */
function getShorlinkUrl(querySelector) {
    const $ = querySelector;
    return $("link[rel='shortlinkUrl']").href.split("?")[0];
}

/**
 * Gets the keywords from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The keywords
 */
function getKeywords(querySelector) {
    const $ = querySelector;
    return $("meta[name='keywords']").content;
}

/**
 * Gets the description from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The description
 */
function getDescription(querySelector) {
    const $ = querySelector;
    return $("meta[name='description']").content;
}

/**
 * Gets the canonical url from a YouTube video page query selector.
 *
 * @param {Object} querySelector - Query selector for the YouTube video page DOM
 * @return {string} The canonical url
 */
function getCanonical(querySelector) {
    const $ = querySelector;
    return $("link[rel='canonical']").href.split("&")[0];
}


/**
 * Gets the video duration from a query selector.
 *
 * @param {Object} querySelector - Query selector to find duration meta tag
 * @return {string} Duration in HH:MM:SS format
 */
function getDuration(querySelector) {
    const $ = querySelector;
    let duration = $("meta[itemprop='duration']").content.slice(2, -1);
    const timeStr = time => time.toString().padStart(2, "0");
    let [minutes, seconds] = duration.split("M");
    const hours = Math.floor(Number(minutes) / 60);
    minutes = (Number(minutes) % 60);
    duration = `${timeStr(minutes)}:${timeStr(seconds)}`;
    if (hours > 0)
        duration = `${timeStr(hours)}:` + duration;
    return duration;
}

module.exports = {
    fetchUrl,
    getOgDescription,
    getOgImage,
    getOgTitle,
    getOgUrl,
    getOgSiteName,
    getTitle,
    getChannel,
    getThumbnailUrl,
    getGenre,
    getUploadDate,
    getDatePublished,
    getAuthorName,
    getAuthorUrl,
    getImageSrc,
    getShorlinkUrl,
    getKeywords,
    getDescription,
    getCanonical,
    getDuration,
};
