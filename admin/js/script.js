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
	// Process which tab to show upon launching
	if ($(window).width() < 992) {
		$("#announcements").addClass("active-tab");
		$("#announcements").css("display", "block");
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

	// Mobile hamburger event handler
	$("#mobile-menu-bar i").click(function() {
		$("#mobile-menu").modal("show");
	})

	// Mobile menu event handler
	$("#mobile-menu a").click(function() {
		var tab = $(this).attr('href');

		// Hide the current tab and display the new tab
		$(".active-tab").fadeToggle(400, "swing", function() {
			$(".active-tab").removeClass("active-tab");
			$(tab).fadeToggle();
			$(tab).addClass("active-tab");
		})

		$("#mobile-menu").modal("hide");
	})
})

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		$(function() {
			// Show "Login Successful" message if user just logged in
			if (!localStorage.getItem("shownLoggedInMessage")) {
				swal("Success!", "Login Successful!", "success");
				localStorage.setItem("shownLoggedInMessage", "true");
			}

			// Menu tabs event handler
			$("#admin-menu>ul>li>a").click(function() {
				// Switch underline from active tab to clicked tab
				$(".active").removeClass("active");
				$(this).parent().addClass("active");

				var tab = $(this).attr('href');

				// Hide the current tab and display the new tab
				$(".active-tab").fadeToggle(400, "swing", function() {
					$(".active-tab").removeClass("active-tab");
					$(tab).fadeToggle();
					$(tab).addClass("active-tab");
				})
			});

			displayAdminInfo();

			listenAnnouncements();

			listenMentor();

			// Add new announcement
			$("body").on("click", "#announcements button", function() {
				var text = $("textarea").val();
				if (text === "") {
					swal("Error!", "Message is empty.", "error");
				} else {
					database.ref('announcements').push({
						"datetime": moment().format('h:mm a'),
						"message": text
					});

					database.ref('notification').set({
						"message": text
					});
				}

				return false;
			});

			// Delete announcement icon event handler
			$("body").on("click", "#announcements .card-delete a", function () {
				var id = $(this).attr('id');
				swal({
					title: "Are you sure?",
					text: "You will not be able to recover this announcement!",
					type: "warning",
					showCancelButton: true,
					confirmButtonColor: "#f07c74",
					confirmButtonText: "Yes, delete it!",
					closeOnConfirm: false,
					html: false
				}, function(){
					swal("Announcement Deleted!", "It will be removed from every user's feed automatically.", "success");

					var announcementsRef = database.ref('announcements/' + id);
					announcementsRef.remove();
				});
			});

			// Archive mentor ticket event handler
			$("body").on("click", "#mentor .card-delete a", function () {
				var id = $(this).attr('id');
				swal({
					title: "Are you sure?",
					text: "This mentor request will be archived!",
					type: "warning",
					showCancelButton: true,
					confirmButtonColor: "#f07c74",
					confirmButtonText: "Yes, archive it!",
					closeOnConfirm: false,
					html: false
				}, function(){
					swal("Mentor request archived!", "Please don't forget to assign a mentor to the table.", "success");

					var mentorRef = database.ref('mentor/' + id);
					mentorRef.remove();
				});
			});

			// Sign out event handler
			$("body").on("click", "#signout-btn", function () {
				firebase.auth().signOut().then(function() {
					localStorage.removeItem("shownLoggedInMessage");
					swal("Success!", "You have signed out", "success");
				}, function(error) {
					swal("Error!", error.code + ": " + error.message, "error");
				});
			});

			// Force refresh event handler
			$("body").on("click", "#refresh-btn", function () {
				var refreshRef = database.ref('version/version');
				refreshRef.once('value').then(function(snapshot) {
					var version = snapshot.val() + 1;
					var versionRef = database.ref('version');
					versionRef.update({
						"version": version
					})
				})
			});
		});
	} else {
		login();
	}
});

// Listen for announcements
var listenAnnouncements = function() {
	var announcementsRef = database.ref('announcements');
	announcementsRef.on('value', function(snapshot) {
		$("#announcements-list").empty();
		snapshot.forEach(function(item) {
			var key = item.key;
			var itemRef = database.ref('announcements/' + key);
			itemRef.once('value').then(function(itemSnapshot) {
				var datetime = itemSnapshot.val().datetime;
				var message = itemSnapshot.val().message;
				pushAnnouncement(key, datetime, message);
			});
		})
	});
}

// Listen for mentor requests
var listenMentor = function() {
	var mentorRef = database.ref('mentor');
	mentorRef.on('value', function(snapshot) {
		$("#mentor-list").empty();
		snapshot.forEach(function(item) {
			var key = item.key;
			var itemRef = database.ref('mentor/' + key);
			itemRef.once('value').then(function(itemSnapshot) {
				var datetime = itemSnapshot.val().datetime;
				var message = itemSnapshot.val().message;
				var table = itemSnapshot.val().table;
				var tech = itemSnapshot.val().tech;
				// var sponsor = itemSnapshot.val().sponsor;
				pushMentor(key, datetime, message, table, tech);
			});
		})
	});

	var notificationRef = database.ref('mentor-notification/message');
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

// Display admin's email
var displayAdminInfo = function() {
	var user = firebase.auth().currentUser;
	$("#admin-email").text(user.email);
}

// Push announcement card
var pushAnnouncement = function(key, datetime, message) {
	var announcementsList = $("#announcements-list");
	var card = '<div class="card row"><div class="card-timestamp col-md-1">' + datetime + '</div><div class="card-content col-xs-10 col-sm-10 col-md-10">' + message + '</div><div class="card-delete center col-md-1"><a id="' + key + '" href="#"><i class="fa fa-times" aria-hidden="true"></i></a></div></div>';

	announcementsList.prepend(card);
}

// Push mentor requests card
var pushMentor = function(key, datetime, message, table, tech) { // sponsor,
	// if (sponsor === "none")
	// 	sponsor = "";
	// else
	// 	sponsor = "[" + sponsor + "] ";

	var mentorList = $("#mentor-list");
	var card = '<div class="card row"><div class="card-timestamp col-md-1">' + datetime + '<br>' + tech + '</div><div class="card-content col-xs-11 col-sm-11 col-md-10"><b>' + 'Table ' + table + ': </b>' + message + '</div><div class="card-delete center col-md-1"><a id="' + key + '" href="#"><i class="fa fa-check" aria-hidden="true"></i></a></div></div>'; //sponsor +

	mentorList.prepend(card);
}

// Notification function
var notify = function(message) {
	if (window.Notification && Notification.permission !== "denied") {
		Notification.requestPermission(function(status) {
			var notification = new Notification("McHacks Mentor Request", {
				body: message,
				icon: '../images/assets_gradient.png'
			});
		});
	}
}

// Login popup
var login = function() {
	swal({
		title: "Login",
		text: "Email:",
		type: "input",
		inputType: "email",
		closeOnConfirm: false,
		confirmButtonText: "Next",
		animation: "slide-from-top",
		inputPlaceholder: "john.do@mail.mcgill.ca"
	},
	function(email){
		// Prompt for password
		swal({
			title: "Login",
			text: "Password:",
			type: "input",
			inputType: "password",
			closeOnConfirm: false,
			confirmButtonText: "Next",
			animation: "slide-from-top"
		},
		function(password){
			// Show error if authentication fails
			firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
				swal({
					title: "Error!",
					text: error.code + ": " + error.message,
					type: "error",
					confirmButtonColor: "#f07c74",
					confirmButtonText: "Try Again",
					closeOnConfirm: false
				},
				function(){
					login();
				});
			});
		});
	});
}