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

	initNotifier();

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

			var day = $(this).parent().parent().find(".event-time").attr("date");
			var time = $(this).parent().parent().find(".event-time").text();
			var event = $(this).parent().parent().find(".event-name").text();
			var timeToNotify = moment(day + " " + time, "YYYY-MM-DD HH:mm").subtract(15, "minutes");

			var scheduleNotifier = JSON.parse(localStorage.getItem("ScheduleNotifier"));
			scheduleNotifier[timeToNotify] = event;
			localStorage.setItem("ScheduleNotifier", JSON.stringify(scheduleNotifier));
		} else {
			$(this).removeClass("fa-bell");
			$(this).addClass("fa-bell-o");

			var day = $(this).parent().parent().find(".event-time").attr("date");
			var time = $(this).parent().parent().find(".event-time").text();
			var timeToNotify = moment(day + " " + time, "YYYY-MM-DD HH:mm").subtract(15, "minutes");

			var scheduleNotifier = JSON.parse(localStorage.getItem("ScheduleNotifier"));
			delete scheduleNotifier[timeToNotify];
			localStorage.setItem("ScheduleNotifier", JSON.stringify(scheduleNotifier));
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

	setInterval(listenEventNotification(), 60000);
	listenAnnouncements();
	listenNotifications();

	// Request mentor
	$("body").on("click", "#mentor button", function() {
		var table = $("#tableNumber").val();
		var tech = $("input[name=mentorTechOption]:checked").val();
		var text = $("textarea").val();
		if (table === "") {
			swal("Error!", "Please enter table number.", "error");
		} else if (tech === undefined) {
			swal("Error!", "Please select a technology.", "error");
		} else if (text === "") {
			swal("Error!", "Message is empty.", "error");
		} else {
			firebase.database().ref('mentor').push({
				"datetime": moment().format('h:mm a'),
				"table": table,
				"tech": tech,
				"message": text
			});

			swal("Submitted!", "A mentor will drop by shortly.", "success");
		}
	});
});

var initNotifier = function() {
	if (localStorage.getItem("ScheduleNotifier")) {
		// TODO: Change bell icon for notifications that are already set
	} else {
		// Otherwise, initialize empty object in localStorage
		localStorage.setItem("ScheduleNotifier", "{}");
	}
}

// Schedule event notification tracker
var listenEventNotification = function() {
	var now = moment();
	var scheduleNotifier = JSON.parse(localStorage.getItem("ScheduleNotifier"));
	if (scheduleNotifier[now]) {
		var event = scheduleNotifier[now];
		notify(event + " is starting in 15 minutes!");
		delete scheduleNotifier[now];
		localStorage.setItem("ScheduleNotifier", JSON.stringify(scheduleNotifier));
	}
}

// Listen for announcements
var listenAnnouncements = function() {
	var announcementsRef = firebase.database().ref('announcements');
	announcementsRef.on('value', function(snapshot) {
		$("#announcements").empty();
		snapshot.forEach(function(item) {
			var key = item.key;
			var itemRef = firebase.database().ref('announcements/' + key);
			itemRef.once('value').then(function(itemSnapshot) {
				var datetime = itemSnapshot.val().datetime;
				var message = itemSnapshot.val().message;
				pushAnnouncement(datetime, message);
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
			notify(snapshot.val());
		setTimeout(function() {
			init = false;
		}, 100);
	})
}

// Notification function
var notify = function(message) {
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