<script>
  import { onMount } from 'svelte'
  import { Client } from 'pg'

  // const password = process.env.POSTGRES_PASSWORD
  const password = 'postgres'

  let data = []

  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password,
    database: 'postgres',
  })

  async function fetchData() {
    // fetch data from database or API and store in `data` variable
    // const res = await fetch('/api/data')
    // data = await res.json()
    // data = [{ name: 'Jumbo', setup_allowance_mins: 30 }]
    // const client = new Client()
    await client.connect()
    const res = await client.query('SELECT * FROM setup.devices')
    data = res.rows
    await client.end()
  }

  onMount(fetchData)
</script>

<main>
  <h1>Setup Allowances</h1>

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Setup Allowance (minutes)</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each data as item}
        <tr>
          <td>
            {item.name}
            <!-- <input type="text" bind:value={item.name} /> -->
          </td>
          <td>
            <input type="text" bind:value={item.setup_allowance_mins} />
          </td>
          <td>
            <!-- <button on:click={updateItem(item)}>Save</button> -->
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style>
  :global(body) {
    background: black;
    color: #555;
  }
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
