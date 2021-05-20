# ladder99-application

this transfers xml/json data from agent to the database

run it separately from the other docker compose apps

    sh/setups/docker start vmc app

it polls json data from the agent at localhost:5000

To test,

    sh/app/test

which runs `npm test`
