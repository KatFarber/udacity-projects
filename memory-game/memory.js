/* Store our current game properties */
const currentGame = {
	turns:	0,
	timer:	0,
	score:	10,
	totalCards: 16,
	timerInterval: null
};

/* What icons will we use?
	@see https://fontawesome.com/cheatsheet */
var icons = [ 'balance-scale', 'biohazard', 'car', 'coffee', 'flag', 'igloo', 'poo', 'robot' ];

/**
 * Wrapper for initial page initialization
 */
function pageInitialization()
{
	/* Start game */
    initialize();

	/* Event handler for the reset button shown in the modal */
	document.getElementById('resetGame').addEventListener( 'click', function() {
		initialize();
	});

	document.getElementById('mybutton').addEventListener( 'click', function() {
		clearInterval( currentGame.timerInterval );
		currentGame.timerInterval = null;
		initialize();
	});
}

/**
 * Initialize the board by doing the following:
 * - Make sure our turn count is 0
 * - Make sure our timer is reset to 0 (it won't start until the first click from the user)
 * - Randomly assign the matched patterns to the cards (16 cards / 2 = 8 patterns)
 */
function initialize()
{
	/* Reset our counters */
	currentGame.turns	= 0;
	currentGame.timer	= 0;
	currentGame.score	= 10;

	document.getElementById('turns-counter').innerHTML = '0';
	document.getElementById('timer-counter').innerHTML = '0';
	document.getElementById('score-counter').innerHTML = '10';

	/* Make sure the modal is not shown if we are starting a new game */
	document.getElementById('modal').style.display = 'none';

	/* Loop over each card */
	document.querySelectorAll('.card').forEach( function( element ) {
		/* Make sure cards are "hidden" */
		element.setAttribute('data-visible', 'false');

		/* Make sure cards are flagged as "not matched" */
		element.setAttribute('data-matched', 'false');

		/* Add an event listener to toggle the card */
		element.addEventListener( 'click', flipCard );
	});

	/* Loop over the icons, and assign to cards */
	let allCards = shuffleArray( [...Array(currentGame.totalCards).keys()] );

	for( let icon of icons )
	{
		/* Get a card id and apply this icon */
		let cardId = allCards.shift() + 1;
		document.querySelector("#card" + cardId).querySelectorAll('.fas').forEach( function( element ) {
			for( let icon of icons )
			{
				element.classList.remove( 'fa-' + icon );
			}
			element.classList.add( 'fa-' + icon );
			element.setAttribute( 'data-card', icon );
		});

		/* Then do it again - the icon needs to be present twice */
		cardId = allCards.shift() + 1;
		document.querySelector("#card" + cardId).querySelectorAll('.fas').forEach( function( element ) {
			for( let icon of icons )
			{
				element.classList.remove( 'fa-' + icon );
			}
			element.classList.add( 'fa-' + icon );
			element.setAttribute( 'data-card', icon );
		});
	}
}

/**
 * The actual flip card function.
 * Keeps track of whether we've flipped 0, 1 or 2 cards, and if the cards are matched.
 * If we have flipped 2 cards and they match, sets the data-matched property.
 */
function flipCard( event )
{
	/* Make sure the event target is actually our card */
	var matches = event.target.className.match( /^fas\s/g );
	var target	= event.target;

	if( matches && matches.length )
	{
		target = event.target.parentElement;
	}

	/* Ignore duplicate clicks */
	if( target.getAttribute('data-visible') == 'true' )
	{
		return;
	}

	/* Flip the card */
	target.setAttribute( 'data-visible', 'true' );

	/* First, update our counter */
	currentGame.turns++;
	document.getElementById('turns-counter').innerHTML = currentGame.turns;

	/* Start our game timer too if it hasn't been started yet */
	if( currentGame.timerInterval === null )
	{
		document.getElementById('timer-counter').innerHTML = 1;

		currentGame.timerInterval = setInterval( function() {
			document.getElementById('timer-counter').innerHTML = parseInt( document.getElementById('timer-counter').innerHTML ) + 1;
		}, 1000 );
	}

	/* Get a query selector representing the flipped cards */
	let flippedCards = document.querySelectorAll('[data-visible="true"][data-matched="false"]');

	/* If we have two flipped cards, determine if they match */
	let cardsMatch = false;
	if( flippedCards.length == 2 )
	{
		if( flippedCards[0].querySelectorAll('i')[0].getAttribute('data-card') == flippedCards[1].querySelectorAll('i')[0].getAttribute('data-card') )
		{
			cardsMatch = true;
		}

		/* If the cards don't match, we need to flip them back over in a few secs */
		if( cardsMatch )
		{
			flippedCards.forEach( function( element ) {
				element.setAttribute( 'data-matched', 'true' );
			});
		}
		else
		{
			/* Set a timer */
			setTimeout( function() {
				flippedCards.forEach( function( element ) {
					element.setAttribute( 'data-visible', false );
				});
			}, 800);
		}
	}

	/* Recalculate the score */
	recalculateScore();

	/* If ALL of our cards are matched now, we should show a modal with the score and a reset button */
	if( document.querySelectorAll('[data-matched="true"]').length == currentGame.totalCards )
	{
		showGameCompleteModal();
	}
}

/**
 * Recalculate the score and update the scoreboard if needed
 */
function recalculateScore()
{
	/* We will remove the shake class if it exists, in case we need to add it again */
	document.getElementById('score-counter').classList.remove('shake');

	/* Figure out our score. We will start at 10. */
	let ourScore = 10;

	/* We take off 1 point for every 15 seconds */
	let timerPointsOff	= Math.floor( parseInt( document.getElementById('timer-counter').innerHTML ) / 15 );

	/* OR we will take off 1 point after double the turns for as many cards as we have, and then 1 point for every 6 turns there-after */
	let turnsRemainder	= currentGame.turns;
	let turnsPointsOff	= 0;

	if( turnsRemainder > ( currentGame.totalCards * 2 ) )
	{
		turnsRemainder -= ( currentGame.totalCards * 2 );
		turnsPointsOff++;

		if( turnsRemainder )
		{
			turnsPointsOff += Math.floor( turnsRemainder / 6 );
		}
	}

	/* Take the most points off between the two determiners, but always show a score of 1 or higher */
	ourScore -= Math.max( turnsPointsOff, timerPointsOff );

	if( ourScore < 1 )
	{
		ourScore = 1;
	}

	currentGame.score = ourScore;
	if( parseInt( document.getElementById('score-counter').innerHTML ) != currentGame.score )
	{
		document.getElementById('score-counter').innerHTML = currentGame.score;
		document.getElementById('score-counter').classList.add( 'shake' );
	}
}

/**
 * Show a modal to denote that the game is complete, with the user's score and a reset button
 */
function showGameCompleteModal()
{
	/* Stop our counter */
	clearInterval( currentGame.timerInterval );
	currentGame.timerInterval = null;

	/* Show the stats and score */
	document.querySelectorAll('.score')[0].innerHTML = currentGame.score;
	document.querySelectorAll('.turns')[0].innerHTML = currentGame.turns;
	document.querySelectorAll('.time')[0].innerHTML = document.getElementById('timer-counter').innerHTML;

	/* Show the modal */
	document.getElementById('modal').style.display = 'block';
}


/**
 * Simple function to randomize our card array
 */
function shuffleArray( array )
{
	var currentIndex = array.length, temporaryValue, randomIndex;

	while ( 0 !== currentIndex )
	{
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}


if (document.readyState === "loading")
{
    document.addEventListener( 'DOMContentLoaded', pageInitialization );
}
else
{
    pageInitialization();
}