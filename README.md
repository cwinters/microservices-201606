# Flow:

## Extra stuff

- Context + biases (self indulgent?)
- Describe the app (necessary?)
- What parts need to be replaceable?
    - Version control
    - Language
    - Database
    - Storage
    - Cache
    - Frameworks
    - CI/CD pipeline
    - Deployment granularity
    - Testing
    - Logging
    - Monitoring

## Actual

- What are we going to do here?
    - Talk about the moving parts behind microservices
    - Why are we using microservices, and what are our plans?
    - How do they help and hinder?

- Initial questions
    - Back-end focused, not going to dig into front-end stuff in any
      of this (build, deploy, etc)
    - How many people have used Docker? In production?
    - How many people are using microservices? Planning to?

- Where we started (graphically)
    - Single app taking all requests; one per EC2
    - Single worker taking all async jobs; one per EC2
- Where are we now (graphically)
    - Move app and worker into Docker containers
    - Created separate part of the app, served by microservices
      and their own tables
- Where we want to be (graphically)
    - Pulling more pieces of the single app out into services

- Why would we not want to do this?
    - Operating a single app is way easier
    - Easier to propagate patterns within single codebase
    - Reaching into another table for a join, or a single piece of data, is easy
    - No network call boundaries (latency)
    - Everything is in one place, both code and things like admin tools (Django)
- Why would we want to do this?
    - Independence (concurrent projects)
    - Keep a thing in your head
    - Speed (small things easier to test in full)
    - Disentangle via forced separation
    - Make side-effects explicit
    - Small vectors for experimenting (framework, language, database,
      design patterns)
    - Scale at more granular level
    - Conway's law not as big a deal for Turnitin Pittsburgh (since we're so
      small); sidenote, "Team per service" is bunk, and sometimes I wonder if
      that stops people from trying things
- Well that's all great, but I can do that now!
    - Are microservices the only way to get these things? Nope. But many (all?)
      of the other ways require a discipline I've seen few teams exhibit.
    - Provide constraints in areas where you know your team (or teams in
      general) are prone to get things wrong...
    - ...and provide freedom to experiment with new things

@@@ this might go away, control vs constraint seems like a distinction without
a difference
- Lots of choices about what to control and what to constrain
    - Create a constraint (the what) to incentivize the behavior you want to
      see (or avoid) and let teams find the best way to do it
    - Create a control if you want to specify both the what and the how
    - Constraint: Bezos telling Amazon that services must not access other
      services' data directly. (Yegge post) This frees up the service to
      use whatever datastore it wants - NoSQL, key/value, relational,
      filesystem.
    - Control: You must use version x of database y. All tables must be fully
      normalized and all references must be backed by foreign keys. (Or you
      must use language x with framework y version z)


- What are the moving parts? (list for now)
    - See also Casey MVP presentation
    - Deployment and configuration: how do I get it out there and working?
    - Recovery from failure: how do I replace it when it craps out?
    - Routing and load balancing: how does my service send messages to other services?
    - Monitoring: how do I know how my service is performing?
    - Logging: how do I get log messages from my service?


- These echo the 12 Factor app
    - Smart people have already thought about this design: 12factor.net
    - You really need to internalize this document and goals.
    - Focuses:
    3. Config: Store config in the environment
    4. Backing services: Treat backing services as attached resources
    10. Dev/prod parity: Keep development, staging, and production as similar as possible
    11. Logs: Treat logs as event streams

@@@All, but probbly won't discuss or mention others
    1. Codebase: One codebase tracked in revision control, many deploys
    2. Dependencies: Explicitly declare and isolate dependencies
    3. Config: Store config in the environment
    4. Backing services: Treat backing services as attached resources
    5. Build, release, run: Strictly separate build and run stages
    6. Processes: Execute the app as one or more stateless processes
    7. Port binding: Export services via port binding
    8. Concurrency: Scale out via the process model
    9. Disposability: Maximize robustness with fast startup and graceful shutdown
    10. Dev/prod parity: Keep development, staging, and production as similar as possible
    11. Logs: Treat logs as event streams
    12. Admin processes: Run admin/management tasks as one-off processes


- How does ECS deployment work?
    - Define a named "cluster" of EC2 instances onto which you'll deploy
      containers. This is your available compute.
    - "Task definition" tells ECS how to run a container:
        - Memory/CPU constraints (memory over will kill container, CPU is hint)
        - Configuration via environment variables
        - Docker image name (registry + path + tag)
    - Task definition is immutable -- once you publish you cannot change
    - Two ways to run containers:
    - 1. Run task with definition + number of containers
    - 2. Service with definition and stable number of containers; "deploy"
         means update the definition.
    - Difference: once run task finishes it's done; service maintains the
      container count and on update does rolling deployment
    - Automate this with rake: create task definition as JSON from templates,
      publish to ECS with API calls


- How do we use ECS (and other) deployment when developing a feature?
    - feature branch: work work work, push
    - slack: make me a color environment
    - slack: run end-to-end-tests
    - slack: make me some classes
    - test test test
    - :thumbsup:
    - PR to staging, merge => deploys
    - test test test (maybe)
    - PR to production, merge => deploys
    - Slightly different for front-end and services

- Sidebar - One factor that's missing: documentation
    - How would you implement?
    - Your first thought may be to have one document with all the API (control)
        - effect: nobody will remember to update
    - What do you *really* want?
        - one place to *read*, which is different than one place to *write*
    - You're controlling at the wrong level, the one you're comfortable with
        - need to be comfortable with giving this up for a while while you get
          comfortable with this system
    - Solve *that* problem instead:
            - control the format (swagger)
            - control API for collecting (`/service/docs`)
            - create tool to collect and merge (`spider-doc`)
            - make it part of the same system as everything else (everything is a container)
    - The control we're exerting is allowing other parts of the system to
      leverage our work *without knowing what they want ahead of time*
        - hey, that sounds like good design!


- Types of environments; all use Docker:
    - Local + Color
        - Local: deployed via rake; Color: deployed via slack
        - all containers on one host
        - front-end deployed to S3
        - extra containers for router, API docs (more later), mail catcher
    - Production + Staging
        - AWS + ECS
        - Databases managed by AWS (RDS, Elasticache)
        - ELB talks to nginx router/load-balancer that does some other work with Lua
        - Every host has a client-side router/load-balancer
        - Every host has a logging container
        - Consul watches for Docker events and updates nginx
    - Staging also has:
        - End-to-end API testing container

- Color environment
    - Entire system on a single host, datastores and all
    - Deployable with slack, and you can specify different branches for
      different apps to be deployed
    - This goes against Factor 10, but that "as possible" gives us some wiggle
      room :-)
    - We're deciding to constrain at the Docker level and are assuming the
      other constraints (like configuration) minimize other differences

- Types of services, build up the image one at a time:
    - 0. ELB
        - Only thing that the outside world talks to, besides static assets on
          S3
    - Routers
        - Only service that talks to the ELB, balanced across AZs
        - Internet-facing: Gateway for internet to talk to edge services
        - Via Consul/Consul Template gets docker events updating services
        - Has Lua to allow some logic (Request ID, Identity lookup, JWT unpacking)
    - "Edge"
        - What the front-end talks to (through the router)
        - Deals with authz
        - May talk to multiple persistence services
    - "Persistence" (back-back-end?)
        - Front-end CANNOT talk to it
        - Does not do authen/authz (though may record)
        - Talks to datastore directly
    - Datastore
        - Postgres and S3 are long-term storage, and should be the only places
          we're storing state
        - Redis is used for cache and queue; future may use SQS for queues
          instead
        - Configured with environment variables containing connnection string
    - Worker (process async jobs)
        - Pulls jobs off Redis/SQS
        - May talk to datastore but through shared persistence code
        - Single codebase (and Dockerfile) for worker/server combo
    - Others on dev/staging:
        - docs
        - testing
        - data generation
        - load testing
    - Helpers (database, cache, POS tagger, log)

- What does a typical feature look like?
    - Admin feature to remove a student from a school and undo that removal
    - Front- and back-end developers get together and decide on an API
    - Front-end can develop independently with a mock-backend
    - Back-end needs to implement feature in edge service rac-admin (to answer the front-end)
    - Back-end also needs to implement features in persistence service to
      cascade delete a school membership ending to all its contained classes,
      as well as undo that

- Implementation typically goes bottom-up at a fairly granular level:
     - Persistence first to cascade delete; can PR and deploy
     - Edge next to trigger cascade delete; can deploy feature branch with
       front-end feature branch to color environment to test

- Rules and guides
    - You must never break backward compatibility. There's some leeway when a
      service is still new and getting its legs, and there's only one thing
      depending on it.
    - Forcing absolute zero peeking into other services' databases can be
      difficult, particularly for reporting. You can get around some of these
      things with denormalization but then you set yourself up for data drift.
      So we have the idea of "data affinity" -- a service can join into another
      service's tables for read access, and only in well-marked areas, with the
      understanding that if things change in the future we'll work to remove
      those. It's *never* supposed to replace service calls for speed or simplicity.

- Left to do:
    - Per-persistence service clients. Persistence services will only be called
      by other services, and those services are ours so we control both ends of
      the conversation. Why not make a client that includes: objects to fill and
      validate (and then serialize) instead of building up raw HTTP payloads?
      methods to invoke instead of URL paths to type in? different HTTP results
      (status, errors) being represented as exceptions/objects instead of forcing all
      the service users to re-invent. (Adrian Cockroft mentions this in a
      number of his presentations.)
    - Testing. We have an end-to-end API testing service that works pretty
      well. But we haven't implemented anything like Pact/Pacto, or consumer
      driven testing.
    - Feature flags. (@@DOES it belong here?) May seem like it doesn't belong
      here, but it can help with decoupling and getting features moving through
      the system faster.



# Ideas

Possible themes:

- What level of control do you need?

- Constraints and their side-effects (Conway's law, blah blah)

- Entire product development timeline, how do you affect it?

(Control, Constraints, and Collaboration - probably too cutesy)

## Context and caveats

Open about context

https://twitter.com/mipsytipsy/status/732307148655362048

    "i wish that more people who give {technical,cultural} talks would spend time
    describing the context in which a solution worked for them."
    -- @mipsytipsy (Charity Majors)

Trade-offs (kinda framed as constraints):

https://twitter.com/testobsessed/status/595949729898319873

    I prefer:
    - Recovery over Perfection
    - Predictability over Commitment
    - Safety Nets over Change Control
    - Collaboration over Handoffs
    -- @testobsessed (Elisabeth Hendrickson)

Ideas:

- Constraints are good, even if artificial

- Team structure and health informs project

- Small things are easier to manage people and technology wise

- "Team per service" is bunk

- Control is illusory... except where it's not


- Avoid binding with control

    - Example - what you want: one document with all the API
        - effect: nobody will remember to update
        - what do you *really* want?
        - one place to read
        - solve *that* problem instead:
            - control the format (swagger)
            - control API for collecting (`/service/docs`)
            - create tool to collect and merge (`spider-doc`)
        - the control we're exerting is allowing other parts of the system to
          leverage our work *without knowing what they want ahead of time*
        - hey, that sounds like good design!

- Similar things:

    - Where is your healthcheck url?
    - What's your agreed-upon name for certain env? (`DATABASE_URL` is a common one)
    - What are common names for groups of 'things'? routes, models, queries, etc.
    - How do I build your service?
    - How do I run tests for your service?

- Binding with frameworks

    - IMO: Frameworks generally don't do a good job of balancing cognitive load
      what they provide (to lessen code you need to write) vs number of layers
      you have to know about.
        - Example: ORMs (I know, I know) - Relating models, writing queries
        - Example: validation
    - Different measure than how little code: how much do I need to understand
      to read this code? How many different files do I need to read?
    - Example: What are your framework's assumptions about things not in its
      direct control? Is it lowest-common-denominator (like most frameworks
      relating to databases)?
        - What do these assumptions remove from you permanently, and what
          do they remove that can only be regained with a good amount of
          effort?
    - This is a trade-off that can be worth it! There is no silver bullet or
      one answer.
    - In fact, it's a constraint -- they're betting that you won't need the
      control of a database. Or that you should have a model for every table.
    - But when there's friction it's really bad
    - Example: Is controlling your transactions really that gross? How many
      abstractions have you dealt with in your career to deal with this?
      (Autocommit? Hibernate open session in view?)
        - We have been trained to get rid of DRY at all costs -- put all the
          transaction handling stuff over HERE so I don't have to deal with it
          over THERE -- but the cost at separating them is one we rarely acknowledge
    - How little can you get away with?
    - This will change over time, and that's okay
    - Normal process of expansion and contraction.
    - When you learn a new domain you read lots of maybe-useful stuff with the
      goal of learning what the words and references mean. And only then do you
      know enough to be able to pick and choose among the things that are
      important.

- What do you want to optimize for?

    - speed
    - independence

- Control things that allow your team to work independently:

    - documentation (woo swagger)
    - client library per internal service
    - logging context
    - Backwards compatibility

- Without automation this is not possible

- AWS high points (for us)
    - Terraform
    - All the things (S3, SQS, SES, RDS, ElastiCache, EC2, ECS, ELB, VPC, ASG, security groups, Lambda)
    - Mature and multi-language libraries
    - IAM enables granular permissions on individual services and actions
      (e.g., the only thing the deployment queue process invoked by CI/CD can
      do is add messages to a particular queue)
    - RDS (managed database, but it's still just postgres)

- The technical things you need:
    - Continuous integration
    - Central logging
    - Transaction tracing
    - Per-service monitoring
    - Service discovery and routing

- The technical things you'd like:
    - Continuous deployment
    - Per-service clients
    - Consistent health checks
    - Consistent automated documentation

- Things we're still working on:
    - Testing
    - Backend service clients
    - All-in on AWS/ECS? (Autoscaling, ELBs)
    - Portability to other providers/systems (nomad/consul)


## Timeline of work

    <----------------------------------------------------------->
      1.          2.          3.          4.         5.

    1. Identify customers and pain
    2. Determine what can ease their pain
    3. Implement and test
    4. Deploy and operate
    5. Measure and evaluate
    6. Maintain and improve

We focus so much of our efforts on 3. We design our organizations around it. We
design our processes around it. (What's your "definition of done"? Does it have
the words "in production"?)

We need to make ALL 1-6 better, not just 3 (and 4)

## Constraint: data

Microservices are a [useful] set of *constraints* to control how your data are
accessed

- Gets you away from integrating at the data level (...because your data live
  forever, and if everyone can reach in and muck with tables controls your
  ability to change by increasing the cost due to unforeseen side-effects)

- Naturally restrict the way your data are accessed -- arbitrary queries can
  kill your DB (yes, even your NoSQL DB), and wrapping an API around it goes a
  long way to ensuring that doesn't happen. Because your API will tend toward
  smaller since maintaining a large API is so painful. (But you'll probably do
  it anyway.)

- Restricting the access to data also has side-effect of lowering the amount
  you have to keep in your head (easier maintenance).

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">
how much code exists simply to protect developers from relational algebra?
</p>&mdash; Andrew Clay Shafer (@littleidea)
<a href="https://twitter.com/littleidea/status/737007479129673728">May 29, 2016</a>
</blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

## Control

https://www.youtube.com/watch?v=nuYxp7-Au4E ("Stop trying to control everything and just let go... LET GO!")

Illusory if you're not doing it at the right level. And you'll probably do it
at the wrong level when you're doing something new -- you try to control the
things you know how to do and measure. So if you have a development background
you'll come up with coding standards, module layout, etc.

But these are about implementation, and the point of microservices is that you
don't care about them.

**What do you actually care about?**

What should they be able to do and respond to in the flow of deployment and
runtime?

Think about Heroku. (How many people here have used Heroku?) One of the
standards it defines is a buildpack, which winds up being a lifecycle
standardization. It's a contract between Heroku and your code about how your
application will be started, what it needs to provide to the runtime, and what
events it'll get during that process so it knows when it's safe to perform
certain actions.

More concretely, think about how you do migrations.

- How will that change if you have multiple applications starting up at once?
- Should you create guarantees in the system that migrations can't run twice?
  Or should your migrations be idempotent so that running them again won't
  cause an error? Which of these is a hard distributed systems problem?

[[I'm not sure if this is a good example, but maybe it's a good demonstration
of when it's okay to dictate implementation details...]]

Alternatively, think about how you do logging. Should you enforce that everyone
uses the same logging code? Or should you create a contract for logging
messages and provide parameters for that? Say, "an rsyslog service will be
available on every host with a max message size of 4k, and you can send
structured JSON with the following fields...".


Dan North presentation "Pimp my architecture" has line about 33:00: "You get
these emergent simplicities when the thing starts to take shape..." -- as you
small systems out of larger systems, keep your eye open for commonalities or
things to eliminate.

Example: ORMs. If you're not trying to manage many entity interrelationships, and
each service only manages a small handful of entities, then what is an ORM
actually giving you? (Venn diagram of features in ORMs that are useful in large
systems, then the systems that are actually useful in small systems.)


### Other quotes

"Good judgement comes from experience, experience comes from bad judgement. Bad
judgement is okay as long as you're learning while you do it."
(Dan North, https://www.infoq.com/presentations/north-pimp-my-architecture)

"The problem with having a ten-parameter function call is that you've probably
missed a couple"
(Dan North quoting Perlis (?), https://www.infoq.com/presentations/microservices-replaceability-consistency)

"The work of implementing a feature initially is often a tiny fraction of the
work to support that feature over the lifetime of a product, and yes, we can
"just" code any logic someone dreams up. What might take two weeks right now
adds a marginal cost to every engineering project we'll take on in this product
in the future. In fact, I'd argue that the initial time spent implementing a
feature is one of the least interesting data points to consider when weighing
the cost and benefit of a feature."
(Kris Gale, http://firstround.com/review/The-one-cost-engineers-and-product-managers-dont-consider/)

