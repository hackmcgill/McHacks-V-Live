$(function() {
	$("#mentor").hide();
	$(".event-details").hide();

	$(".schedule-event").hover(function() {
		$(this).find(".event-details").slideDown();
	}, function() {
		$(this).find(".event-details").slideUp();
	});

	$(".menu>a").click(function() {
		$(".active").removeClass("active");
		$(this).addClass("active");
	});

	$("#announcements-btn").click(function() {
		$(".active-tab").fadeToggle(400, "swing", function() {
			$(".active-tab").removeClass("active-tab");
			$("#announcements").fadeToggle();
			$("#announcements").addClass("active-tab");
		});
	});

	$("#mentor-btn").click(function() {
		$(".active-tab").fadeToggle(400, "swing", function() {
			$(".active-tab").removeClass("active-tab");
			$("#mentor").addClass("active-tab");
			$("#mentor").fadeToggle();
		});
	});
});