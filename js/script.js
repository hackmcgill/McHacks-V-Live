$(function() {
	$("#mentor").hide();

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