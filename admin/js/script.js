// Firebase config
var config = {
	apiKey: "AIzaSyDpcqm16yCXJC26V7LSUk3YKHA8hv-Tt9w",
	authDomain: "hackuci-live.firebaseapp.com",
	databaseURL: "https://hackuci-live.firebaseio.com",
	storageBucket: "hackuci-live.appspot.com",
	messagingSenderId: "137852911349"
};
firebase.initializeApp(config);

$(function() {
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
					firebase.database().ref('announcements').push({
						"datetime": moment().format('h:mm a'),
						"message": text
					});

					firebase.database().ref('notification').set({
						"message": text
					});
				}
			});

			// Delete announcement icon event handler
			$("body").on("click", ".card-delete a", function () {
				var id = $(this).attr('id');
				swal({
					title: "Are you sure?",
					text: "You will not be able to recover this announcement!",
					type: "warning",
					showCancelButton: true,
					confirmButtonColor: "#DD6B55",
					confirmButtonText: "Yes, delete it!",
					closeOnConfirm: false,
					html: false
				}, function(){
					swal("Announcement Deleted!", "It will be removed from every user's feed automatically.", "success");

					var announcementsRef = firebase.database().ref('announcements/' + id);
					announcementsRef.remove();
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
		});
	} else {
		login();
	}
});

// Listen for announcements
var listenAnnouncements = function() {
	var announcementsRef = firebase.database().ref('announcements');
	announcementsRef.on('value', function(snapshot) {
		$("#announcements-list").empty();
		snapshot.forEach(function(item) {
			var key = item.key;
			var itemRef = firebase.database().ref('announcements/' + key);
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
	var mentorRef = firebase.database().ref('mentor');
	mentorRef.on('value', function(snapshot) {
		$("#mentor-list").empty();
		snapshot.forEach(function(item) {
			var key = item.key;
			var itemRef = firebase.database().ref('mentor/' + key);
			itemRef.once('value').then(function(itemSnapshot) {
				var datetime = itemSnapshot.val().datetime;
				var message = itemSnapshot.val().message;
				var table = itemSnapshot.val().table;
				var tech = itemSnapshot.val().tech;
				pushMentor(key, datetime, message, table, tech);
			});
		})
	});
}

// Display admin's email
var displayAdminInfo = function() {
	var user = firebase.auth().currentUser;
	$("#admin-email").text(user.email);
}

// Push announcement card
var pushAnnouncement = function(key, datetime, message) {
	var announcementsList = $("#announcements-list");
	var card = '<div class="card row"><div class="card-timestamp col-md-1">' + datetime + '</div><div class="card-content col-md-10">' + message + '</div><div class="card-delete center col-md-1"><a id="' + key + '" href="#"><i class="fa fa-times" aria-hidden="true"></i></a></div></div>';

	announcementsList.prepend(card);
}

// Push mentor requests card
var pushMentor = function(key, datetime, message, table, tech) {
	var mentorList = $("#mentor-list");
	var card = '<div class="card row"><div class="card-timestamp col-md-1">' + datetime + '<br>' + tech + '</div><div class="card-content col-md-10"><b>Table ' + table + ': </b>' + message + '</div><div class="card-delete center col-md-1"><a href="#"><i class="fa fa-check" aria-hidden="true"></i></a></div></div>';

	mentorList.prepend(card);
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
		inputPlaceholder: "hack@uci.edu"
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
					confirmButtonColor: "#DD6B55",
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