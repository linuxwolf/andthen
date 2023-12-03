---
title: Usage
---

# Getting Started

In your server project's directory, create a file named `andthen.yaml`:

```
version: "1"

vars:
  PROJECT_BINARY: server
  PROJECT_NAME: ${PROJECT_NAME:-myservice}
  PROJECT_VERSION: ${PROJECT_VERSION:-latest}

tasks:
  build:
    steps:
      - deno compile -o ${PROJECT_BINARY} main.ts

  package:
    deps:
      - :build
    steps:
      - docker build -t ${PROJECT_NAME}:${PROJECT_VERSION} .

  clean:
    steps:
      - git clean -dfx .

```

The "build" step can be run with:

```
$ andthen :build
```

A similar `andthen.yaml` could exist in your client project's directory.  In the root directory for your client and server, add a `andthen.yaml`:

```
version: "1"
root: true

vars:
  PROJECT_NAME: myapp
  PROJECT_VERSION: ${PROJECT_VERSION:-latest}

tasks:
  build:
    deps:
      - ./server:build
      - ./client:build

  clean:
    steps:
      - ./server:clean
      - ./client:clean


```

To build both client and server from the root directory:

```
$ andthen :build
```

To build just the client from the root directory:

```
$ andthen ./client:build
```

# Paths to Projects and Tasks {#paths}

Whether on the command-line or as a depednecy, a task has a path based on the project directory it is located in and its name.  For consistency, the task name is separated from its location using `:`, and location segments are separated solely with '/'.

What "location" means depends on the context.  From the command-line, the current location is the current working directory.  Within a task's `deps` or elsewhere, the current location is the project directory it is defined in.

There are two kinds of these task paths:

* **Root** — the path is based on the root project location; starts with `//` (e.g., `//server:build`)
* **Relative** — the path based on the current location; usually starts with `.` or `..` (e.g., `../client:build`)

## Short Paths {#paths-short}

Some shorter syntaxes are allowed:

* If the path starts with something other than `.`, `..`, or `/`, it is treated as a relative path starting in the current location
* If the path starts with `:`, it is treated as a task for the project at the current location

# Projects (`ProjectConfig`) {#projects}

A project is any directory with a `andthen.yaml` configuration file.

```
version: "1"

vars:
  PROJECT_BINARY: mybinary
  PROJECT_VERSION: ${PROJECT_VERSION:-latest}

tasks:
  build:
    steps:
      - deno compile -o ${PROJECT_BINARY} main.ts

  clean:
    steps:
      - git clean -dfx .

```

A project can have the following, all optional:

* **`version`** (`string`) _[`"1"`]_ — the version of this project
* **`root`** (`boolean`) _[`false`]_ — if the current project is the root project
* **`default`** (`string`) _[`"default`]_ — the default task for this project
* **`vars`** (`Map<string, string>`) — the project-level variables
* **`tasks`** (`TaskConfig[]`) — the tasks available in this project

## Configuration Files

Any of the following are considered project files; the first found in a directory is used:

* `andthen.yaml`
* `andthen.yml`
* `.andthen.yaml`
* `.andthen.yml`

# Tasks (`TaskConfig`) {#tasks}

A project can define zero or more tasks via the `tasks` block:

```
tasks:
  build:
    vars:
      PROJECT_BINARY: ${PROJECT_BINARY:-defaut-binary}
    steps:
      - echo building the ${PROJECT_BINARY} thing
```

A task's configuration consists of the following, which are all optional:

* **`desc`** (`string`) — a description sentence, displayed when calling with `--list`
* **`internal`** (`boolean`) _[`false`]_ — if the task is internal only, and cannot be invoked from the command-line
* **`extends`** (`string`) — the task this task extends, if it extends another task
* **`deps`** (`string[]`) — the list of dependency tasks (if any) that must complete successfully before this task
* **`vars`** (`Map<string, string>`) — the [variables](#vars) defined in this task
* **`steps`** (`ActionConfig[]`) — the ordered list of steps this task executes when run

## Dependencies and Execution

Some tasks may require other tasks to be completed before running, which is declared using `deps`.  A task will only run its steps after all of its dependencies have run successfully.  Dependencies are declared as a list of strings, where each string is the path to the dependent task.  Relative task paths are based on the task's project location.

Generally, tasks are only run once; even if multiple tasks depend on some common task, it still only runs a single time.

# Variables (`Map<string, string>`) {#vars}

A variable is a name/value pair, allowing for some parameterization and customization.  They can be defined in each task or for an entire project, and referenced within a task's steps as environment variables.

To conform to shell expectations, a valid variable name consists of any number of ASCII letters (`a`-`z`, `A`-`Z`), digits (`0`-`9`), and the underscore(`_`), and cannot start with a digit.  The value can be a string, potentially with [interpolation](#vars-sub).

## Precedence {#vars-order}

A variable's value is the first occurence from the following:

1. the Task's `vars`
2. the Task caller's `vars` (either as `deps` or in `steps`)
3. any exported variables from previously-run Tasks
4. the owning Project's `vars`
5. the ancestor (parent, grandparent, etc) Project's `vars`
6. from a `--var` command-line argument (in the order declared)
7. within a dotenv file referenced from a `--var-file` command-line argument (in the order declared)
8. The empty string (`""`)

## Interpolation {#vars-sub}

A variable's value can incorporate other variables via a limited interpolation:

```
vars:
  PROJECT_VERSION: ${PROJECT_VERSION}
  PROJECT_TAG: v${PROJECT_VERSION}
```

The value of another variable is included using `${VAR_NAME}`.  Note the leading `${` and `}` are **REQUIRED**; the `$VAR_NAME` syntax is not supported.  A variable's value can consist solely of this interpolation, or can be only a part of the variable's value.

To have `${VAR_NAME}` as the literal value, precede it with `$` (e.g., "`$${VAR_NAME}`).

### Siblings

Interpolation can use variables within the same `vars` block, as long as it has been defined before it's interpolated.  Given the following:

```
vars:
  PROJECT_VERSION: 1.2.3
  PROJECT_TAG: v${PROJECT_VERSION}
```

The value of `PROJECT_TAG` is `v1.2.3`; however with the following:

```
vars:
  PROJECT_TAG: v${PROJECT_VERSION}
  PROJECT_VERSION: 1.2.3
```

The value of `PROJECT_TAG` would likely be `v` (unless `PROJECT_VERSION` is defined elsewhere in the precedence order).

### Default values

Interpolation can use a default value with `${VAR_NAME:-default value}`.  In this example, if `VAR_NAME` is undefined or the empty string (`""`) the value is then `default value`; otherwise it is the value of `VAR_NAME`.
