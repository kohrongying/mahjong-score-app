<script>
	export let name;
	let gameStatus = 'WELCOME';
	let players = [
		{
			name: 'PLAYER1',
			score: 20000,
		},
		{
			name: 'PLAYER2',
			score: 20000,
		},
		{
			name: 'PLAYER3',
			score: 20000,
		},
		{
			name: 'PLAYER4',
			score: 20000,
		},
	]

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
		loserIndex = index
	}

	const computeResult = () => {
		let score = 100 * Math.pow(2, points - 1)

		players.forEach((player, i) => {
			if (i === winnerIndex) {
				player.score += 3 * score
			} else {
				player.score -= score
			}
		})

		if (loserIndex === null) {
			players.forEach((player, i) => {
				if (i === winnerIndex) {
					player.score += 3 * score
				} else {
					player.score -= score
				}
			})
		} else {
			players[winnerIndex].score += score
			players[loserIndex].score -= score
		}

		winnerIndex = null
		points = 0
		loserIndex = null
		gameStatus = "GAME_START"
	}
</script>

<main>
	{#if gameStatus == 'WELCOME'}
		<button on:click={changeStatus('GAME_INTIALISED')}>
			New Game
		</button>
	{/if}
	{#if gameStatus == 'GAME_INTIALISED'}
		<h1>NEW GAME</h1>
		{#each players as player}
			<div>
				<input bind:value={player.name}>
			</div>
		{/each}
		<button on:click={changeStatus('GAME_START')}>GO</button>
	{/if}
	{#if gameStatus == 'GAME_START'}
		{#each players as player}
			<div class="player-score">
				<p>{player.name}</p>
				<p>{player.score}</p>
			</div>
		{/each}
		<button on:click={changeStatus('GAME_ADD_RESULT')}>ADD RESULT</button>
	{/if}
	{#if gameStatus == 'GAME_ADD_RESULT'}
		<h3>Winner</h3>
		<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;">
			{#each players as player, i}
				<button on:click={setWinner(i)} style="background-color: {winnerIndex === i ? "yellow" : "#f4f4f4"}">{player.name}</button>
			{/each}
		</div>
		<h3>Points</h3>
		<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr;">
			<button on:click={setPoints(1)} style="background-color: {points === 1 ? "yellow" : "#f4f4f4"}">1</button>
			<button on:click={setPoints(2)} style="background-color: {points === 2 ? "yellow" : "#f4f4f4"}">2</button>
			<button on:click={setPoints(3)} style="background-color: {points === 3 ? "yellow" : "#f4f4f4"}">3</button>
			<button on:click={setPoints(4)} style="background-color: {points === 4 ? "yellow" : "#f4f4f4"}">4</button>
			<button on:click={setPoints(5)} style="background-color: {points === 5 ? "yellow" : "#f4f4f4"}">5</button>
		</div>
		<h3>Loser</h3>
		<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;">
			{#each players as player, i}
				<button
					on:click={setLoser(i)}
					style="background-color: {loserIndex === i ? "red" : "#f4f4f4"}"
					disabled={winnerIndex === i}
				>
					{player.name}
				</button>
			{/each}
		</div>
		<button on:click={computeResult}>NEXT ROUND</button>
	{/if}

</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 50vw;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.player-score {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

</style>