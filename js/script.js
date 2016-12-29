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
	loadSchedule();

	// Process which tab to show upon launching
	if ($(window).width() < 992) {
		$("#sidebar").addClass("active-tab");
	} else if (window.location.hash[0] === "#") {
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
	// $(".schedule-event").hover(function() {
	$("body").on("mouseenter", ".schedule-event", function() {
		$(this).find(".event-details").slideDown();
	});

	$("body").on("mouseleave", ".schedule-event", function() {
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
		// Switch tabs if it's not Devpost or GDocs link
		if ($(this).attr('href') !== "https://hackatuci.devpost.com/" && $(this).attr('href') !== "https://docs.google.com/a/uci.edu/forms/d/e/1FAIpQLSc5ZSS16q5BbrDJThbzh7aqLP2T8JODVZ6s4hJKmln-F84AyQ/viewform") {
			var tab = $(this).attr('href');

			// Hide the current tab and display the new tab
			$(".active-tab").fadeToggle(400, "swing", function() {
				$(".active-tab").removeClass("active-tab");
				$(tab).fadeToggle();
				$(tab).addClass("active-tab");
			})
		}
	});

	// Mobile hamburger event handler
	$("#mobile-menu-bar i").click(function() {
		$("#mobile-menu").modal("show");
	})

	// Mobile menu event handler
	$("#mobile-menu a").click(function() {
		// Switch tabs if it's not Devpost or GDocs link
		if ($(this).attr('href') !== "https://hackatuci.devpost.com/" && $(this).attr('href') !== "https://docs.google.com/a/uci.edu/forms/d/e/1FAIpQLSc5ZSS16q5BbrDJThbzh7aqLP2T8JODVZ6s4hJKmln-F84AyQ/viewform") {
			var tab = $(this).attr('href');

			// Hide the current tab and display the new tab
			$(".active-tab").fadeToggle(400, "swing", function() {
				$(".active-tab").removeClass("active-tab");
				$(tab).fadeToggle();
				$(tab).addClass("active-tab");
			})
		}

		if (tab === "#announcements")
			$("#mobile-menu-bar-title").text("Announcements");
		else if (tab === "#map")
			$("#mobile-menu-bar-title").text("Map");
		else if (tab === "#mentor")
			$("#mobile-menu-bar-title").text("Mentor Request");

		$("#mobile-menu").modal("hide");
	})

	setInterval(listenEventReminder, 60000);
	listenAnnouncements();
	listenNotifications();
	listenRefresh();

	// Request mentor
	$("body").on("click", "#mentor button", function() {
		var table = $("#tableNumber").val();
		var tech = $("input[name=mentorTechOption]:checked").val();
		var text = $("textarea").val();
		if (table === "") {
			swal("Error!", "Please enter table number.", "error");
		} else if (table < 1 || table > 68) {
			swal("Error!", "Please enter a valid table number.", "error");
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
		return false;
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

// Load schedule from JSON file
var loadSchedule = function() {
	$.getJSON("/schedule.json", function(data) {
		$.each(data, function(key, val) {
			var event = '<div class="schedule-event row"><div class="event-time col-md-2" date="' + val.date + '">' + val.time + '</div><div class="event-name col-md-8">' + val.name + '</div><div class="event-reminder col-md-1"><i class="fa fa-bell-o" aria-hidden="true"></i></div><div class="event-details col-md-offset-2 col-md-10">' + val.description + '</div></div>';
			$("#schedule-feed").append(event);
		})
	});
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

// Listen for schedule updates
var listenRefresh = function() {
	var refreshRef = database.ref('version/version');
	var init = true;
	var currentVersion;
	// refreshRef.once('value').then(function(snapshot) {
	// 	currentVersion = snapshot.val();
	// 	console.log(currentVersion)
	// })

	refreshRef.on('value', function(snapshot) {
		if (init) {
			init = false;
			currentVersion = snapshot.val();
		} else if (snapshot.val() !== currentVersion) {
			currentVersion = snapshot.val();
			location.reload();
		}
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