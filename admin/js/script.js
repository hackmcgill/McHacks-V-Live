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
	// Listen for announcements
	var announcementsRef = firebase.database().ref('announcements');
	announcementsRef.on('value', function(snapshot) {
		$("#announcements-list").empty();
		snapshot.forEach(function(item) {
			var key = item.key;
			var datetimeRef = firebase.database().ref('announcements/' + key + '/datetime');
			datetimeRef.on('value', function(datetimeSnapshot) {
				var datetime = datetimeSnapshot.val();
				var messageRef = firebase.database().ref('announcements/' + key + '/message');
				messageRef.on('value', function(messageSnapshot) {
					var message = messageSnapshot.val();
					pushAnnouncement(key, datetime, message);
				});
			});
		})
	});

	var pushAnnouncement = function(key, datetime, message) {
		var announcementsList = $("#announcements-list");
		var card = '<div class="card row"><div class="card-timestamp col-md-1">' + datetime + '</div><div class="card-content col-md-10">' + message + '</div><div class="card-delete center col-md-1"><a id="' + key + '" href="#"><i class="fa fa-times" aria-hidden="true"></i></a></div></div>';

		announcementsList.prepend(card);
	}

	// Add new announcement
	$("body").on("click", "#announcements button", function() {
		var text = $("textarea").val();
		if (text === "") {
			swal("Error!", "Message is empty.", "error");
		} else {
			firebase.database().ref('announcements').push({
				"datetime": moment().format('h:mm a'),
				"message": text
			})
		}
	});

	// Delete icon event handler
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
			swal("Deleted!");

			var announcementsRef = firebase.database().ref('announcements/' + id);
			announcementsRef.remove();
		});
	});
});