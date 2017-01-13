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
	listenRefresh();

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

// Load schedule from JSON file
var loadSchedule = function() {
	/*$.getJSON("/schedule.json", function(data) {
		$.each(data, function(key, val) {
			var event = '<div class="schedule-event row"><div class="event-time col-md-2" date="' + val.date + '">' + val.time + '</div><div class="event-name col-md-8">' + val.name + '</div><div class="event-reminder col-md-1"><i class="fa fa-bell-o" aria-hidden="true"></i></div><div class="event-details col-md-offset-2 col-md-10">' + val.description + '</div></div>';
			$("#schedule-feed").append(event);
		})
	});*/
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

// TESTING

var $scheduleBackground = $('#schedule-background');

function createScheduleHour(label) {
	$scheduleBackground.append($('<div class="schedule-hour"><span class="schedule-hour-label">' + label + '</span></div>'));
}

function numToHour(num) {
	var suffix = '';
	var hour = num;
	if (hour < 12) {
		suffix = 'AM';
	} else {
		suffix = 'PM';
		hour -= 12;
	}

	if (hour === 0) {
		hour = 12;
	}

	return hour + ' ' + suffix;
}


var iHour = 18;
var iDay = 'Fri';

var lastHour = 18;
var lastDay = 'Sun';

var cachedDay = '';
while ((iHour !== lastHour) || (iDay !== lastDay)) {
	if (cachedDay !== iDay) {
		createScheduleHour(iDay + ', ' + numToHour(iHour))
		cachedDay = iDay;
	} else {
		createScheduleHour(numToHour(iHour))
	}

	// Iterate
	if (iHour === 23) {
		if (iDay === 'Fri') {
			iDay = 'Sat';
		} else if (iDay === 'Sat') {
			iDay = 'Sun';
		}

		iHour = 0;
	} else {
		iHour += 1;
	}
}

var $scheduleFeed = $('#schedule-feed');


schedule.forEach(function(event) {
	var $scheduleEvent = $('<div class="schedule-event"><h3>' + event.title + '</h3></div>');

	// Calculate top
	var dayMargin = 0;
	if (event.day === 'Sat') {
		dayMargin = 6 * 150;
	} else if (event.day === 'Sun') {
		dayMargin = 30 * 150;
	}

	var pmMargin = 0;
	// Calculate PM Margin
	if (event.starts.substr(-2, 2) === 'PM' && event.day !== 'Fri') {
		pmMargin = 12 * 150;
	}

	var hourMargin = 0;
	var hour = parseInt(event.starts.substr(0, 2));
	if (hour !== 12) {
		if (event.day !== 'Fri') {
			hourMargin = 150 * hour;
		} else {
			hourMargin = 150 * (hour - 5);
		}
	}

	var minute = parseInt(event.starts.substr(3, 3));
	var minuteMargin = minute * 75 / 30;

	// console.log(dayMargin, pmMargin, hourMargin)

	var top = dayMargin + pmMargin + hourMargin + minuteMargin;
	$scheduleEvent.css('top', top);

	// Calculate height
	var height = 75 * (event.duration / 30);
	$scheduleEvent.css('height', height);

	$scheduleFeed.append($scheduleEvent);

});

