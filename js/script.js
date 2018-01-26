// Firebase config
var config = {
	apiKey: "AIzaSyAOnVh1njYjjcksq5mtAarI8vfMPckY6q0",
	authDomain: "mchacks-v-live-832b3.firebaseapp.com",
	databaseURL: "https://mchacks-v-live-832b3.firebaseio.com/",
	storageBucket: "mchacks-v-live-832b3.appspot.com",
	messagingSenderId: "137852911349"
};
firebase.initializeApp(config);
var database = firebase.database();

$(function() {
	$(".event-details").hide();

	initNotifier();

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

	$("#live-circle").click(function() {
		anteaster();
	})

	// Event reminder event handler
	$(".schedule-event i").click(function() {
		if ($(this).hasClass("fa-bell-o")) {
			$(this).removeClass("fa-bell-o");
			$(this).addClass("fa-bell");

			var day = $(this).parent().parent().attr("date");
			var time = $(this).parent().parent().attr("time");
			var event = $(this).parent().text().substr(1);
			var timeToNotify = moment(day + " " + time, "YYYY-MM-DD h:mm A").subtract(15, "minutes");

			var eventReminder = JSON.parse(localStorage.getItem("EventReminder"));
			eventReminder[timeToNotify] = event;
			localStorage.setItem("EventReminder", JSON.stringify(eventReminder));
		} else {
			$(this).removeClass("fa-bell");
			$(this).addClass("fa-bell-o");

			var day = $(this).parent().parent().attr("date");
			var time = $(this).parent().parent().attr("time");
			var timeToNotify = moment(day + " " + time, "YYYY-MM-DD h:mm A").subtract(15, "minutes");

			var eventReminder = JSON.parse(localStorage.getItem("EventReminder"));
			delete eventReminder[timeToNotify];
			localStorage.setItem("EventReminder", JSON.stringify(eventReminder));
		}
	});

	// Menu tabs event handler
	$(".menu>a").click(function() {
		// Switch tabs if it's not Devpost or GDocs link
		if ($(this).attr('href') !== "https://goo.gl/forms/9hVhn9cFJKGHNtej1" && $(this).attr('href') !== "https://hackatuci.devpost.com/" && $(this).attr('href') !== "https://docs.google.com/a/uci.edu/forms/d/e/1FAIpQLSc5ZSS16q5BbrDJThbzh7aqLP2T8JODVZ6s4hJKmln-F84AyQ/viewform") {
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

	// Mobile hamburger event handler
	$("#mobile-menu-bar i").click(function() {
		$("#mobile-menu").modal("show");
	})

	// Mobile menu event handler
	$("#mobile-menu a").click(function() {
		// Switch tabs if it's not Devpost or GDocs link
		if ($(this).attr('href') !== "https://goo.gl/forms/9hVhn9cFJKGHNtej1" && $(this).attr('href') !== "https://hackatuci.devpost.com/" && $(this).attr('href') !== "https://docs.google.com/a/uci.edu/forms/d/e/1FAIpQLSc5ZSS16q5BbrDJThbzh7aqLP2T8JODVZ6s4hJKmln-F84AyQ/viewform") {
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
		// var sponsor = $("input[name=mentorSponsorOption]:checked").val();
		var text = $("textarea").val();
		if (table === "") {
			swal("Error!", "Please enter table number.", "error");
		} else if (table < 1 || table > 68) {
			swal("Error!", "Please enter a valid table number.", "error");
		} else if (tech === undefined) {
			swal("Error!", "Please select an option.", "error");
		} else if (text === "") {
			swal("Error!", "Message is empty.", "error");
		} else {
			database.ref('mentor').push({
				"datetime": moment().format('h:mm a'),
				"table": table,
				"tech": tech,
				// "sponsor": sponsor,
				"message": text
			});

			database.ref('mentor-notification').set({
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
				var time = datetime.add(15, 'minutes').format("h:mm A");
				var bell = $(".schedule-event[date='" + date + "'][time='" + time + "'").find("i");
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

// Listen for schedule updates
var listenRefresh = function() {
	var refreshRef = database.ref('version/version');
	var init = true;
	var currentVersion;

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
	if (window.Notification && Notification.permission !== "denied") {
		Notification.requestPermission(function(status) {
			var notification = new Notification("McHacks", {
				body: message,
				icon: 'images/assets_gradient.png'
			});
		});
	}
}

var pushAnnouncement = function(datetime, message) {
	var announcementsList = $("#announcements");
	var card = '<div class="card row"><div class="card-timestamp col-md-1">' + datetime + '</div><div class="card-content col-md-11">' + message + '</div></div>';

	announcementsList.prepend(card);
}

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

var iHour = 8;
var iDay = 'Sat';

var lastHour = 16;
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
		if (iDay === 'Sat') {
			iDay = 'Sun';
		}

		iHour = 0;
	} else {
		iHour += 1;
	}
}

// var iHour = 19;
// var iDay = 'Fri';

// var lastHour = 16;
// var lastDay = 'Sun';

// var cachedDay = '';
// while ((iHour !== lastHour) || (iDay !== lastDay)) {
// 	if (cachedDay !== iDay) {
// 		createScheduleHour(iDay + ', ' + numToHour(iHour))
// 		cachedDay = iDay;
// 	} else {
// 		createScheduleHour(numToHour(iHour))
// 	}

// 	// Iterate
// 	if (iHour === 23) {
// 		if (iDay === 'Fri') {
// 			iDay = 'Sat';
// 		} else if (iDay === 'Sat') {
// 			iDay = 'Sun';
// 		}

// 		iHour = 0;
// 	} else {
// 		iHour += 1;
// 	}
// }

var $scheduleFeed = $('#schedule-feed');

schedule.forEach(function(event) {
	var $scheduleEvent = $('<div class="schedule-event"><h3><i class="fa fa-bell-o" aria-hidden="true"></i> ' + event.title + '</h3></div>');

	// Calculate top
	var dayMargin = 0;
	if (event.day === 'Sat') {
		dayMargin = -8 * 150;
	} else if (event.day === 'Sun') {
		dayMargin = 16 * 150;
	}

	var pmMargin = 0;
	// Calculate PM Margin
	if (event.starts.substr(-2, 2) === 'PM' && event.day !== 'Fri') {
		pmMargin = 12 * 150;
	}

	// // Calculate top
	// var dayMargin = 0;
	// if (event.day === 'Sat') {
	// 	dayMargin = 5 * 150;
	// } else if (event.day === 'Sun') {
	// 	dayMargin = 29 * 150;
	// }

	// var pmMargin = 0;
	// // Calculate PM Margin
	// if (event.starts.substr(-2, 2) === 'PM' && event.day !== 'Fri') {
	// 	pmMargin = 12 * 150;
	// }


	var hourMargin = 0;
	var hour = parseInt(event.starts.substr(0, 2));
	if (hour !== 12) {
		if (event.day !== 'Fri') {
			hourMargin = 150 * hour;
		} else {
			hourMargin = 150 * (hour - 7);
		}
	}

	var minuteStr = event.starts.substr(2, 3);

	if (minuteStr[0] === ':') {
		minuteStr = minuteStr.slice(1);
	}
	var minute = parseInt(minuteStr);

	var minuteMargin = minute * 75 / 30;

	var top = dayMargin + pmMargin + hourMargin + minuteMargin;
	$scheduleEvent.css('top', top);

	// Calculate height
	var height = 75 * (event.duration / 30);
	$scheduleEvent.css('height', height);

	if (event.duration === 0) {
		$scheduleEvent.css('height', '75px');
		$scheduleEvent.css('border-top', '#e74c3c 7px solid');
	}

	if (event.title === 'From Montreal Check-In' || event.title === 'Hacking Starts') {
		$scheduleEvent.css('width', '35%');
	} else if (event.title === 'HTC Vive Demo' || event.title === 'Opening Ceramonies') {
		$scheduleEvent.css('width', '35%');
		$scheduleEvent.css('right', '0');
	}

	if (event.day === 'Fri')
		$scheduleEvent.attr('date', '2018-02-02');
	else if (event.day === 'Sat')
		$scheduleEvent.attr('date', '2018-02-03');
	else if (event.day === 'Sun')
		$scheduleEvent.attr('date', '2018-02-04');

	$scheduleEvent.attr('time', event.starts);

	$scheduleFeed.append($scheduleEvent);
});

function anteaster() {
	$('body').html('<div id="anteater-arena" tabindex="0"></div>');

	if (!localStorage.getItem("anteaster-username")) {
		swal({
			title: "Enter Email",
			text: "Email:",
			type: "input",
			inputType: "email",
			closeOnConfirm: false,
			confirmButtonText: "Continue",
			animation: "slide-from-top",
			inputPlaceholder: "hack@uci.edu"
		},
		function(email){
			localStorage.setItem("anteaster-username", email);
			swal("Success!", "Enjoy the game!", "success");
		});
	}

	var mySnakeBoard = new SNAKE.Board({
		boardContainer: "anteater-arena",
		fullScreen: true
	});
}