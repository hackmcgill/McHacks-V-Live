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

	// Event reminder hovering animation
	$(".schedule-event").hover(function() {
		$(this).find(".event-details").slideDown();
	}, function() {
		$(this).find(".event-details").slideUp();
	});

	// Event reminder event handler
	$(".schedule-event>.event-reminder>i").click(function() {
		if ($(this).hasClass("fa-bell-o")) {
			$(this).removeClass("fa-bell-o");
			$(this).addClass("fa-bell");

			var day = $(this).parent().parent().find(".event-time").attr("date");
			var time = $(this).parent().parent().find(".event-time").text();
			var event = $(this).parent().parent().find(".event-name").text();
			var timeToNotify = moment(day + " " + time, "YYYY-MM-DD HH:mm").subtract(15, "minutes");

			var eventReminder = JSON.parse(localStorage.getItem("EventReminder"));
			eventReminder[timeToNotify] = event;
			localStorage.setItem("EventReminder", JSON.stringify(eventReminder));
		} else {
			$(this).removeClass("fa-bell");
			$(this).addClass("fa-bell-o");

			var day = $(this).parent().parent().find(".event-time").attr("date");
			var time = $(this).parent().parent().find(".event-time").text();
			var timeToNotify = moment(day + " " + time, "YYYY-MM-DD HH:mm").subtract(15, "minutes");

			var eventReminder = JSON.parse(localStorage.getItem("EventReminder"));
			delete eventReminder[timeToNotify];
			localStorage.setItem("EventReminder", JSON.stringify(eventReminder));
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

	setInterval(listenEventReminder, 60000);
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
			database.ref('mentor').push({
				"datetime": moment().format('h:mm a'),
				"table": table,
				"tech": tech,
				"message": text
			});

			swal("Submitted!", "A mentor will drop by shortly.", "success");
		}
	});
});

// Change bell icon for reminders that are already set
var initNotifier = function() {
	if (localStorage.getItem("EventReminder")) {
		var eventReminder = JSON.parse(localStorage.getItem("EventReminder"));

		for (var key in eventReminder) {
			if (eventReminder.hasOwnProperty(key)) {
				var datetime = moment(key, "ddd MMM DD YYYY HH:mm:ss GMTZ");
				var date = datetime.format("YYYY-MM-DD");
				var time = datetime.add(15, 'minutes').format("HH:mm");
				var bell = $(".event-time[date='" + date + "']:contains('" + time + "')").parent().find("i");
				bell.removeClass("fa-bell-o");
				bell.addClass("fa-bell");
			}
		}
	} else {
		// Otherwise, initialize empty object in localStorage
		localStorage.setItem("EventReminder", "{}");
	}
}

// Event reminder tracker
var listenEventReminder = function() {
	var now = moment().set('second', 0);
	var eventReminder = JSON.parse(localStorage.getItem("EventReminder"));
	if (eventReminder[now]) {
		var event = eventReminder[now];
		notify(event + " is starting in 15 minutes!");
		delete eventReminder[now];
		localStorage.setItem("EventReminder", JSON.stringify(eventReminder));
	}
}

// Listen for announcements
var listenAnnouncements = function() {
	var announcementsRef = database.ref('announcements');
	announcementsRef.on('value', function(snapshot) {
		$("#announcements").empty();
		snapshot.forEach(function(item) {
			var key = item.key;
			var itemRef = database.ref('announcements/' + key);
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
	var notificationRef = database.ref('notification/message');
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