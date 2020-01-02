<script>
	import { writable } from 'svelte/store'

	let gameStatus = 'WELCOME'
	let players = [
		{
			name: 'PLAYER1',
			score: 0,
		},
		{
			name: 'PLAYER2',
			score: 0,
		},
		{
			name: 'PLAYER3',
			score: 0,
		},
		{
			name: 'PLAYER4',
			score: 0,
		},
	]

	let events = writable([]);
	events.subscribe(events =>
			events.map((event) => event.deltas)
					.reduce(([a, b, c, d], [dA, dB, dC, dD]) => [a + dA, b + dB, c + dC, d + dD], [0, 0, 0, 0])
					.forEach((score, index) => {
						players[index].score = score
					}))

	const changeStatus = (statusChange) => () => {
		gameStatus = statusChange
	}

	let winnerIndex = null
	let points = 0
	let loserIndex = null

	const setWinner = (index) => () => {
		winnerIndex = index
	}

	const setPoints = (pts) => () => {
		points = pts
	}

	const setLoser = (index) => () => {
		if (loserIndex == index) {
			loserIndex = null
		} else {
			loserIndex = index
		}
	}

	const computeResult = () => {
		let score = 100 * Math.pow(2, points - 1)
		let deltas = [0, 0, 0, 0]


		for (let i = 0; i < 4; i++) {
			if (i === winnerIndex) {
				deltas[i] += 3 * score
			} else {
				deltas[i] -= score
			}
		}

		if (loserIndex === null) {
			for (let i = 0; i < 4; i++) {
				if (i === winnerIndex) {
					deltas[i] += 3 * score
				} else {
					deltas[i] -= score
				}

			}
		} else {
			deltas[winnerIndex] += score
			deltas[loserIndex] -= score
		}

		let description = `${players[winnerIndex].name} wins ${points} ${points === 1 ? 'point' : 'points'}`;
		if (loserIndex === null) {
			description += ' by own draw'
		} else {
			description += ` from ${players[loserIndex].name}`
		}
		events.update(events => {
			events.push({description, deltas})
			return events
		})
		winnerIndex = null
		points = 0
		loserIndex = null
		gameStatus = "GAME_START"
	}

	const computeInstantPayment = () => {
		let score = 100 * Math.pow(2, points - 1)
		let deltas = [0, 0, 0, 0]

		deltas[winnerIndex] += 4 * score
		deltas.map(delta => delta - score)

		let description = `${players[winnerIndex].name} gets an instant payment worth ${points} ${points === 1 ? 'point' : 'points'}`
		events.update(events => {
			events.push({description, deltas})
			return events
		})
		winnerIndex = null
		points = 0
		loserIndex = null
		gameStatus = "GAME_START"
	}
</script>

<main>
	{#if gameStatus == 'WELCOME'}
		<h1>Mahjong Scores</h1>
		<button on:click={changeStatus('GAME_INTIALISED')}>
			New Game
		</button>
	{/if}
	{#if gameStatus == 'GAME_INTIALISED'}
		<h1>NEW GAME</h1>
		{#each players as player}
			<div>
				<input class="player-name" bind:value={player.name}>
			</div>
		{/each}
		<button on:click={changeStatus('GAME_START')}>GO</button>
	{/if}
	{#if gameStatus == 'GAME_START'}
		{#each players as player}
			<div class="player-score">
				<div>{player.name}</div>
				<div style="font-size: 40px;">{player.score}</div>
			</div>
		{/each}
		<button on:click={changeStatus('GAME_ADD_RESULT')}>ADD RESULT</button>
		<button on:click={changeStatus('GAME_INSTANT_PAYMENT')}>INSTANT PAYMENT</button>
		{#each $events as event}
			<div>{event.description}</div>
		{/each}
	{/if}
	{#if gameStatus == 'GAME_ADD_RESULT'}
		<h3>Winner</h3>
		<div class="button-group winner">
			{#each players as player, i}
				<button on:click={setWinner(i)} style="background-color: {winnerIndex === i ? 'gold' : '#f4f4f4'}">{player.name}</button>
			{/each}
		</div>
		<h3>Points</h3>
		<div class="button-group points">
			<button on:click={setPoints(1)} style="background-color: {points === 1 ? 'gold' : '#f4f4f4'}">1</button>
			<button on:click={setPoints(2)} style="background-color: {points === 2 ? 'gold' : '#f4f4f4'}">2</button>
			<button on:click={setPoints(3)} style="background-color: {points === 3 ? 'gold' : '#f4f4f4'}">3</button>
			<button on:click={setPoints(4)} style="background-color: {points === 4 ? 'gold' : '#f4f4f4'}">4</button>
			<button on:click={setPoints(5)} style="background-color: {points === 5 ? 'gold' : '#f4f4f4'}">5</button>
		</div>
		<h3>Loser</h3>
		<div class="button-group loser">
			{#each players as player, i}
				<button
					on:click={setLoser(i)}
					style="background-color: {loserIndex === i ? 'gold' : '#f4f4f4'}"
					disabled={winnerIndex === i}
				>
					{player.name}
				</button>
			{/each}
		</div>
		<button on:click={computeResult}>NEXT ROUND</button>
	{/if}
	{#if gameStatus == 'GAME_INSTANT_PAYMENT'}
		<h3>Winner</h3>
		<div class="button-group winner">
			{#each players as player, i}
				<button on:click={setWinner(i)} style="background-color: {winnerIndex === i ? 'gold' : '#f4f4f4'}">{player.name}</button>
			{/each}
		</div>
		<h3>Points</h3>
		<div class="button-group points">
			<button on:click={setPoints(1)} style="background-color: {points === 1 ? 'gold' : '#f4f4f4'}">1</button>
			<button on:click={setPoints(2)} style="background-color: {points === 2 ? 'gold' : '#f4f4f4'}">2</button>
		</div>
		<button on:click={computeInstantPayment}>NEXT ROUND</button>
	{/if}
</main>

<style>
	@import url('https://fonts.googleapis.com/css?family=Rubik');

	main {
		padding: 1em;
		width: 70%;
		font-family: 'Rubik';
	}

	h1 {
		text-transform: uppercase;
		font-size: 40px;
		text-align: left;
	}

	.player-score {
		margin-bottom: 15px;
	}

	button {
		padding: 10px 20px;
		border-radius: 10px;
		background-color: gold;
		font-size: 20px;
		text-transform: uppercase;
		width: 100%;
		margin: 10px 0;
		border: none;
		text-overflow: ellipsis;
	}

	input.player-name{
		width: 100%;
		border-radius: 10px;
		padding: 10px 15px;
	}

	.button-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.button-group.loser {
		margin-bottom: 20px;
	}

	.button-group.points {
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
	}

	.button-group button {
		margin: 0;
		height: 100%;
		border-radius: 0;
		padding: 10px;
	}
	h3 {
		margin-top: 20px;
		margin-bottom: 10px;
	}
</style>