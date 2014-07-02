/* global App:false, FeedItem:false, google:false */

var Feed = function(){

	'use strict';

	var properties = {
		feedItems: {
			value: [],
			writable: true,
			enumerable: true
		}
	};

	Object.defineProperties(this, properties);

	this.loadFeeds = function(feeds, format) {

		var result,
			self = this;

		var callback = function(result){
			if (!result.error && result.status.code === 200) {
				self.processFeed(result);
				return true;
			}else{
				console.error('Failed to load feed', result);
				return false;
			}
		};

		for (var i = 0; i < feeds.length; i++) {
			var feed = new google.feeds.Feed(feeds[i].url);

			if(format === 'xml'){
				feed.setResultFormat(google.feeds.Feed.XML_FORMAT);
			}

			feed.load(callback, result);
		}

		return this;
	};

	this.findImage = function(nodes){
		var image = '';

		$(nodes).each(function(index, item){
			if($(item)[0].nodeName === 'itunes:image'){
				image = $(item)[0].getAttribute('href');
			}
		});

		return image;
	};

	// TODO: Re-write this method based on some kind of RSS & Atom feed standard
	this.processFeed = function(data){

		/**
		 * Set channel defaults, maybe overridden by feed item
		 */
		var _channelDefaults = function(channel){

			var defaults = {
				title: '',
				image: ''
			};

			var nodes = channel[0].childNodes;

			$(nodes).each(function(index, item){
				if($(item)[0].nodeName === 'itunes:image'){
					defaults.image = $(item)[0].getAttribute('href');
				}
			});

			return defaults;
		};

		var entries = data.xmlDocument.getElementsByTagName('item'),
			channel = data.xmlDocument.getElementsByTagName('channel'),
			defaults = _channelDefaults(channel),
			feedItems = [];

		// Create feed container
		var feedID = 1;
		var $feedsContainer = $('<div id="'+ feedID +'" class="feed-items"></div>').appendTo('#feed .inner');


		 // Loop through and create feed items
		for (var i = 0; i < entries.length; i++) {

			var entry = entries[i],
				entryTitle = entry.getElementsByTagName('title')[0].innerHTML,
				entryEnclosure = entry.getElementsByTagName('enclosure')[0],
				entryImage = this.findImage(entry.childNodes),
				entryPublishDate = entry.getElementsByTagName('pubDate')[0].innerHTML;

			if(!entryImage){
				entryImage = defaults.image;
			}

			// Publish new feed item
			App.mediator.publish('newFeedItem', {
				$feedsContainer: $feedsContainer,
				feeditem: {
					title: entryTitle,
					enclosure: entryEnclosure,
					image: entryImage,
					src: (entryEnclosure) ? entryEnclosure.getAttribute('url') : '',
					publishDate: entryPublishDate
				}
			});

		}

		return feedItems;
	};
};
