import App from './App.svelte'
// import 'dotenv/config'

const app = new App({
  target: document.body,
  props: {
    name: 'world',
  },
})

export default app
