module.exports.imgur = /https?:\/\/(?:i\.imgur\.com\/(.*?)\.(?:jpg|png|gifv?)|imgur\.com\/(.*))/i;
module.exports.mal = /http:\/\/myanimelist\.net\/anime\//i;
module.exports.steam = {
    app: /(?:store\.steampowered\.com\/app\/)([0-9]+)/i,
    pkg: /(?:store\.steampowered\.com\/sub\/)([0-9]+)/i
};
module.exports.twitter = /(?:twitter\.com|t\.co)\//i;
module.exports.xkcd = {
    all: /(?:xkcd.com\/?)/i,
    comic: /(?:xkcd.com\/?)([0-9]+)/i,
    homepage: /(?:xkcd.com\/?)$/i
};
module.exports.youtube = /(?:https?:\/\/)?(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/i;
module.exports.weburl = new RegExp(
    // protocol identifier
    "(?:(?:https?)://)" +
    // user:pass authentication
    "(?:\\S+(?::\\S*)?@)?" +
    "(?:" +
      // IP address exclusion
      // private & local networks
      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
    "|" +
      // host name
      "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
      // domain name
      "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
      // TLD identifier
      "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
    ")" +
    // port number
    "(?::\\d{2,5})?" +
    // resource path
    "(?:/\\S*)?", "gi"
);
