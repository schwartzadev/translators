{
    "translatorID": "12c55893-43cc-4c35-be58-8e17a06bdcbf",
    "label": "Britannica",
    "creator": "Andrew Schwartz",
    "target": "^https?://(www\\.)?britannica\\.com/",
    "minVersion": "3.0",
    "maxVersion": "",
    "priority": 100,
    "inRepository": true,
    "translatorType": 4,
    "browserSupport": "gcsibv",
    "lastUpdated": "2019-12-19 06:29:41"
}

/*
    ***** BEGIN LICENSE BLOCK *****

    Copyright © 2019 Andrew Schwartz
    
    This file is part of Zotero.

    Zotero is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Zotero is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with Zotero. If not, see <http://www.gnu.org/licenses/>.

    ***** END LICENSE BLOCK *****
*/


function getArticleDetails(doc) {
  var topicJson = JSON.parse(
    ZU.xpathText(doc, '//script[@class="topic-json"][@type="application/json"]')
  );
  var articleId = Object.keys(topicJson)[0];
  var articleDetails = topicJson[articleId];

  return {
    'articleId': articleId,
    'url': articleDetails['shareUrl'],
    'title': articleDetails['title']
  }
}

function detectWeb(doc, url) {
  if (url.includes('/search?')) {
    return "multiple";
  } else if (url.includes("/biography/") || url.includes("/topic/") || url.includes('/science/')) {
      // todo complete this list
    return "encylopediaArticle";
  }
  return false;
}

function getSearchResults(doc, checkOnly) {  // todo remove/update this method
  var items = {};
  var found = false;
  // TODO: adjust the CSS selector
  var rows = doc.querySelectorAll('h2>a.title[href*="/article/"]');
  for (let row of rows) {
    // TODO: check and maybe adjust
    let href = row.href;
    // TODO: check and maybe adjust
    let title = ZU.trimInternal(row.textContent);
    if (!href || !title) continue;
    if (checkOnly) return true;
    found = true;
    items[href] = title;
  }
  return found ? items : false;
}

function doWeb(doc, url) {
  if (detectWeb(doc, url) == "multiple") {
    Zotero.selectItems(getSearchResults(doc, false), function (items) {
      if (items) ZU.processDocuments(Object.keys(items), scrape);
    });
  } else
  {
    scrape(doc, url);
  }
}

function getCreators(doc) {
  var creators = [];

  var creatorString = ZU.xpathText(doc, '//div[@class="written-by"]/ul//li');
  var detectedCreators = creatorString.split(", ")

  for (var i = detectedCreators.length - 1; i >= 0; i--) {
    creators.push(ZU.cleanAuthor(detectedCreators[i], "author", false));
  }
  
  return creators
}

function getTags(doc) {
    var tagsAsString = ZU.xpathText(doc, '//meta[@name="keywords"]/@content');
    var tags = tagsAsString.split(", ");
    return tags;
}

function scrape(doc, url) {
  var articleDetails = getArticleDetails(doc);

  var newItem = new Zotero.Item("encyclopediaArticle");
  newItem.title = articleDetails['title'];
  newItem.url = articleDetails['url'];

  newItem.creators = getCreators(doc);

  newItem.tags = getTags(doc);
  newItem.encyclopediaTitle = "Encyclopædia Britannica";
  newItem.date = ZU.xpathText(doc, '//div[@class="last-updated"]/time/@datetime')
  newItem.publisher = "Encyclopædia Britannica, inc.";

  newItem.complete();
}
