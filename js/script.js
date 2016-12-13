$(function() {
	$("#mentor").hide();
	$(".event-details").hide();

	$(".schedule-event").hover(function() {
		$(this).find(".event-details").slideDown();
	}, function() {
		$(this).find(".event-details").slideUp();
	});

	$(".schedule-event>.event-notification>i").click(function() {
		if ($(this).hasClass("fa-bell-o")) {
			$(this).removeClass("fa-bell-o");
			$(this).addClass("fa-bell");
		} else {
			$(this).removeClass("fa-bell");
			$(this).addClass("fa-bell-o");
		}
	});

	$(".menu>a").click(function() {
		$(".active").removeClass("active");
		$(this).addClass("active");

		var tab = $(this).attr('href');

		$(".active-tab").fadeToggle(400, "swing", function() {
			$(".active-tab").removeClass("active-tab");
			$(tab).fadeToggle();
			$(tab).addClass("active-tab");
		})
	});
});