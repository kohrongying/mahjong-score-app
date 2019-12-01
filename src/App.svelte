<script>
	export let name;
	let gameStatus = 'WELCOME';
	let players = [
		{
			name: 'PLAYER1',
			score: 2000,
			dealer: true,
		},
		{
			name: 'PLAYER2',
			score: 2000,
			dealer: false,
		},
		{
			name: 'PLAYER3',
			score: 2000,
			dealer: false,
		},
		{
			name: 'PLAYER4',
			score: 2000,
			dealer: false,
		},
	]
	
	const changeStatus = (statusChange) => () => {
		gameStatus = statusChange
	}

	let winnerIndex = ""
	let points = 0
	let loserIndex = ""

	const setWinner = (index) => () => {
		winnerIndex = index
	}

	const setPoints = (pts) => () => {
		points = pts
	}

	const setLoser = (index) => () => {
		loserIndex = index;
	}

	const computeResult = () => {
		if (loserIndex === 4) {
			points += 100
		}
		players.forEach((player, i) => {
			if (i !== winnerIndex && i !== loserIndex) {
				player.score -= points
			}
			if (i === loserIndex) {
				player.score -= (points + 100)
			}
			if (i === winnerIndex) {
				player.score += points * 3
				if (loserIndex !== 4) {
					player.score += 100
				}
			}
		})
		
		winnerIndex = ""
		points = 0
		loserIndex = ""
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
			<button on:click={setPoints(100)} style="background-color: {points === 100 ? "yellow" : "#f4f4f4"}">1</button>
			<button on:click={setPoints(200)} style="background-color: {points === 200 ? "yellow" : "#f4f4f4"}">2</button>
			<button on:click={setPoints(300)} style="background-color: {points === 300 ? "yellow" : "#f4f4f4"}">3</button>
			<button on:click={setPoints(400)} style="background-color: {points === 400 ? "yellow" : "#f4f4f4"}">4</button>
			<button on:click={setPoints(500)} style="background-color: {points === 500 ? "yellow" : "#f4f4f4"}">5</button>
		</div>
		<h3>Loser</h3>
		<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr;">
			{#each players as player, i}
				<button
					on:click={setLoser(i)}
					style="background-color: {loserIndex === i ? "red" : "#f4f4f4"}"
					disabled={winnerIndex === i}
				>
					{player.name}
				</button>
			{/each}
			<button on:click={setLoser(4)}>OWN TOUCH</button>
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