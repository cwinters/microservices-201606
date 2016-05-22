# Ideas and flow

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

- Control is illusory

- Without automation this is not possible

- AWS high points (for us)
    - Terraform
    - All the things (S3, SQS, SES, RDS, ElastiCache, EC2, ECS, ELB, VPC, ASG, security groups, Lambda)
    - Mature and multi-language libraries
    - IAM enables granular permissions on individual services and actions
      (e.g., the only thing the deployment queue process invoked by CI/CD can
      do is add messages to a particular queue)
    - RDS (managed database, but it's still just postgres)

- Constraints you should enforce:
    - 12 Factor App (you must internalize this)
    - Ones I'll focus on:
    3. Config: Store config in the environment
    4. Backing services: Treat backing services as attached resources
    6. Processes: Execute the app as one or more stateless processes
    8. Concurrency: Scale out via the process model
    10. Dev/prod parity: Keep development, staging, and production as similar as possible
    11. Logs: Treat logs as event streams
    - Ones I'll touch on:
    1. Codebase: One codebase tracked in revision control, many deploys
    2. Dependencies: Explicitly declare and isolate dependencies
    5. Build, release, run: Strictly separate build and run stages
    7. Port binding: Export services via port binding
    9. Disposability: Maximize robustness with fast startup and graceful shutdown
    12. Admin processes: Run admin/management tasks as one-off processes

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

    1. Identity customers and pain
    2. Figure out what can ease their pain
    3. Implement and test
    4. Deploy and operate
    5. Measure and evaluate
    6. Maintain and improve

We focus so much of our efforts on 3. We design our organizations around it. We
design our processes around it. (What's your "definition of done"? Does it have
the words "in production"?)

We need to make ALL 1-5 better.

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




