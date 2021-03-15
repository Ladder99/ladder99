# Data diode

The data diode uses RabbitMQ and a Java application to transfer data via a one-way UDP connection. 

RabbitMQ uses a protocol called AMQP (Advanced Message Queuing Protocol), which is similar to MQTT, but allows different topologies:

![rabbitmq](docs/rabbitmq.png)

UDP has limited packet size (standard is 1500 bytes), so data must be chopped up by a cutter and reassembled on the other side:

![diode1](docs/diode1.jpg)

Data can also be encrypted before being cut up:

![diode2](docs/diode2.jpg)

The complete pipeline - the X's are exchanges (input ports) - the green X is an unencrypted exchange:

![diode3](docs/diode3.png)

[2016 paper](https://arxiv.org/abs/1602.07467) and [original source code](https://github.com/marcelmaatkamp/rabbitmq-applications/tree/master/application/datadiode)


## Running the diode

Edit your `/etc/hosts` with `sudo nano /etc/hosts`, and add the line:

    127.0.0.1 rabbitred rabbitblack nodered

Bring up the RabbitMQ queues -

    cd src/diode/application/datadiode/contrib/docker
    docker-compose up

Visit the RabbitMQ management consoles here (user guest, pw guest) - http://rabbitblack/#/exchanges and http://rabbitred/#/exchanges.

Publish and receive some data -

    cd src/diode/application/datadiode/contrib/nodejs
    npm install  # just need to do once
    node src/send.js

You can see the message go by in the RabbitMQ console - http://rabbitblack/#/queues/%2F/hello. 

It's not yet setup to pass through the diode though.

Node-red

    http://localhost:1880

LDAP

    https://rabbitblack/#/
    https://rabbitred/#/


Run black and red Java applications - these listen to the RabbitMQ queues and manipulate the data - 

    $ cd src/diode
    $ docker build -t diode .

    Sending build context to Docker daemon  729.5MB
    Step 1/4 : FROM bivas/gradle:8-onbuild
    # Executing 5 build triggers
    ---> Using cache
    ---> Using cache
    ---> Using cache
    ---> Using cache
    ---> Using cache
    ---> e673a2bc5c7d
    Step 2/4 : WORKDIR /home/app
    ---> Using cache
    ---> bf4e856c0246
    Step 3/4 : COPY . .
    ---> 406589beb9ea
    Step 4/4 : RUN ./gradlew
    ---> Running in 1796ba9cd902
    Downloading https://services.gradle.org/distributions/gradle-2.8-bin.zip
    .............................................................................................................................................................................................................

    BUILD SUCCESSFUL
    Total time: 43.475 secs
    Removing intermediate container 1796ba9cd902
    ---> 8791a6794a69
    Successfully built 8791a6794a69
    Successfully tagged diode:latest

---

    $ docker run diode ./gradlew tasks

    Starting a new Gradle Daemon for this build (subsequent builds will be faster).
    :tasks

    ------------------------------------------------------------
    All tasks runnable from root project
    ------------------------------------------------------------

    Application tasks
    -----------------
    bootRun - Run the project with support for auto-detecting main class and reloading static resources
    installApp - Installs the project as a JVM application along with libs and OS specific scripts.
    run - Runs this project as a JVM application

    Build tasks
    -----------
    assemble - Assembles the outputs of this project.
    bootRepackage - Repackage existing JAR and WAR archives so that they can be executed from the command line using 'java -jar'
    build - Assembles and tests this project.
    buildDependents - Assembles and tests this project and all projects that depend on it.
    buildNeeded - Assembles and tests this project and all projects it depends on.
    classes - Assembles main classes.
    clean - Deletes the build directory.
    jar - Assembles a jar archive containing the main classes.
    testClasses - Assembles test classes.

    Build Setup tasks
    -----------------
    init - Initializes a new Gradle build. [incubating]

    Distribution tasks
    ------------------
    assembleDist - Assembles the main distributions
    distTar - Bundles the project as a distribution.
    distZip - Bundles the project as a distribution.
    installDist - Installs the project as a distribution as-is.

    Docker tasks
    ------------
    distDocker - Packs the project's JVM application as a Docker image.

    Documentation tasks
    -------------------
    javadoc - Generates Javadoc API documentation for the main source code.

    Help tasks
    ----------
    components - Displays the components produced by root project 'app'. [incubating]
    dependencies - Displays all dependencies declared in root project 'app'.
    dependencyInsight - Displays the insight into a specific dependency in root project 'app'.
    help - Displays a help message.
    model - Displays the configuration model of root project 'app'. [incubating]
    projects - Displays the sub-projects of root project 'app'.
    properties - Displays the properties of root project 'app'.
    tasks - Displays the tasks runnable from root project 'app' (some of the displayed tasks may belong to subprojects).

    Other tasks
    -----------
    cleanIdeaWorkspace
    dependencyManagement
    runClient
    runFastRabbitServer
    runRabbitServer
    runServer
    wrapper

    Rules
    -----
    Pattern: clean<TaskName>: Cleans the output files of a task.
    Pattern: build<ConfigurationName>: Assembles the artifacts of a configuration.
    Pattern: upload<ConfigurationName>: Assembles and uploads the artifacts belonging to a configuration.

    To see all tasks and more detail, run gradlew tasks --all

    To see more detail about a task, run gradlew help --task <task>

    BUILD SUCCESSFUL

    Total time: 10.782 secs

----

Run the Java code (black side) - 

    $ docker run diode /bin/bash -c "cd application/datadiode/black && gradle run"
    Starting a new Gradle Daemon for this build (subsequent builds will be faster).
    ...

get error - 

> Factory method 'declaredExchanges' threw exception; nested exception is org.springframework.web.client.
> ResourceAccessException: I/O error on GET request for "http://rabbitblack:80/api/exchanges/":
> Connect to rabbitblack:80 [rabbitblack/127.0.0.1] failed: 
> Connection refused; nested exception is org.apache.http.conn.HttpHostConnectException: 
> Connect to rabbitblack:80 [rabbitblack/127.0.0.1] failed: 
> Connection refused


