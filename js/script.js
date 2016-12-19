// Firebase config
var config = {
	apiKey: "AIzaSyDpcqm16yCXJC26V7LSUk3YKHA8hv-Tt9w",
	authDomain: "hackuci-live.firebaseapp.com",
	databaseURL: "https://hackuci-live.firebaseio.com",
	storageBucket: "hackuci-live.appspot.com",
	messagingSenderId: "137852911349"
};
firebase.initializeApp(config);
var database = firebase.database();

$(function() {
	$(".event-details").hide();

	// Process which tab to show upon launching
	if (window.location.hash[0] === "#") {
		var tab = window.location.hash;

		// Add underline to the tab link
		var btnID = tab + "-btn";
		$(btnID).addClass("active");

		// Display the tab
		$(tab).fadeToggle();
		$(tab).addClass("active-tab");
	} else {
		$("#announcements-btn").addClass("active");
		$("#announcements").fadeToggle();
		$("#announcements").addClass("active-tab");
	}

	// Schedule event hovering animation
	$(".schedule-event").hover(function() {
		$(this).find(".event-details").slideDown();
	}, function() {
		$(this).find(".event-details").slideUp();
	});

	// Schedule event notification event handler
	$(".schedule-event>.event-notification>i").click(function() {
		if ($(this).hasClass("fa-bell-o")) {
			$(this).removeClass("fa-bell-o");
			$(this).addClass("fa-bell");
		} else {
			$(this).removeClass("fa-bell");
			$(this).addClass("fa-bell-o");
		}
	});

	// Menu tabs event handler
	$(".menu>a").click(function() {
		// Switch tabs if it's not Devpost link
		if ($(this).attr('href') !== "http://devpost.com") {
			// Switch underline from active tab to clicked tab
			$(".active").removeClass("active");
			$(this).addClass("active");

			var tab = $(this).attr('href');

			// Hide the current tab and display the new tab
			$(".active-tab").fadeToggle(400, "swing", function() {
				$(".active-tab").removeClass("active-tab");
				$(tab).fadeToggle();
				$(tab).addClass("active-tab");
			})
		}
	});

	listenAnnouncements();
	listenNotifications();
});

// Listen for announcements
var listenAnnouncements = function() {
	var announcementsRef = firebase.database().ref('announcements');
	announcementsRef.on('value', function(snapshot) {
		$("#announcements").empty();
		var counter = 0;
		snapshot.forEach(function(item) {
			counter++;
			var key = item.key;
			var datetimeRef = firebase.database().ref('announcements/' + key + '/datetime');

			datetimeRef.on('value', function(datetimeSnapshot) {
				var datetime = datetimeSnapshot.val();
				var messageRef = firebase.database().ref('announcements/' + key + '/message');

				messageRef.on('value', function(messageSnapshot) {
					var message = messageSnapshot.val();
					pushAnnouncement(datetime, message);
				});
			});
		})
	});
}

// Listen for new announcements
var listenNotifications = function() {
	var notificationRef = firebase.database().ref('notification/message');
	var init = true;
	notificationRef.on('value', function(snapshot) {
		if (init)
			Notification.requestPermission();
		else
			notifyAnnouncement(snapshot.val());
		setTimeout(function() {
			init = false;
		}, 100);
	})
}

// Notification for announcements
var notifyAnnouncement = function(message) {
	console.log(message);
	if (window.Notification && Notification.permission !== "denied") {
		Notification.requestPermission(function(status) {
			var notification = new Notification("HackUCI", {
				body: message,
				icon: 'images/notif-logo.png'
			});
		});
	}
}

var pushAnnouncement = function(datetime, message) {
	var announcementsList = $("#announcements");
	var card = '<div class="card row"><div class="card-timestamp col-md-1">' + datetime + '</div><div class="card-content col-md-11">' + message + '</div></div>';

	announcementsList.prepend(card);
}