var HACKING_BEGINS = 'January 13, 2017 23:00:00 PST';
var HACKING_ENDS = 'January 15, 2017 11:00:00 PST';

var hackingBegins = Date.parse(HACKING_BEGINS);
var hackingEnds = Date.parse(HACKING_ENDS);

var SECOND = 1000;
var MINUTE = SECOND * 60;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;

// Cache the jQuery lookups
var $days;
var $hours;
var $minutes;
var $seconds;

var $timerContainer;

$(document).ready(function() {
  $days = $('#days');
  $hours = $('#hours');
  $minutes = $('#minutes');
  $seconds = $('#seconds');

  $timerContainer = $('#timer-container');

  timer();
});

function timer() {
  // Grab the date and time that is current when
  // the function runs
  var curDate = new Date();

  var countdownDate = (curDate < hackingBegins ? hackingBegins : hackingEnds);

  // Get the timeleft until HackUCI by taking the date
  // of the hackathon and subtracting it by the current date
  var timeLeft = countdownDate - curDate;

  // If current time is less than the hacking ends time, then
  // set everything to 0 and stop the timer
  if (timeLeft <= 0 && countdownDate !== hackingBegins) {
    // $timerContainer.text('HackUCI is LIVE!');
    $days.text(0);
    $hours.text(0);
    $minutes.text(0);
    $seconds.text(0);

    return;
  }

  var daysLeft = Math.floor(timeLeft / DAY);
  var hoursLeft = Math.floor(timeLeft % DAY / HOUR);
  var minutesLeft = Math.floor(timeLeft % HOUR / MINUTE);
  var secondsLeft = Math.floor(timeLeft % MINUTE / SECOND);

  // Set the values using jQuery
  $days.text(daysLeft);
  $hours.text(hoursLeft);
  $minutes.text(minutesLeft);
  $seconds.text(secondsLeft);

  // Run the function again after 1 second
  setTimeout(timer, 1000);
}