---
title: Specification
---

# Projects (`ProjectConfig`) {#projects}

A project is defined by the `andthen.yaml` configuration file.

```
root: true

vars:
  PROJECT_BINARY: the-project-output

tasks:
  build:
    steps:
      - type: shell
        cmd: echo building the ${PROJECT_BINARY} thing

```

A project's configuration consists of the following, which are all optional:

* `root` (**`boolean`**) _[false]_ — if this project is the root-level
* `default` (**`string`**) _["default"]_ — the name of the default task
* `vars` (**`Record<string, string>`**) — the [variables](#vars) defined in this project
* `tasks` (**`Record<string, TaskConfig>`**) — the tasks available in this project

# Tasks (`TaskConfig`) {#tasks}

Tasks are defined within a project's `tasks` block, as a mapping from a task name to its config:

```
tasks:
  build:
    vars:
      PROJECT_BINARY: ${PROJECT_BINARY:-defaut-binary}
    steps:
      - type: shell
        cmd: echo building the ${PROJECT_BINARY} thing
```

A task's configuration consists of the following, which are all optional:

* `desc` (**`string`**) — a description sentence, displayed with `--list`
* `internal` (**`boolean`**) _[false]_ — if the task is internal only, and cannot be invoked from the command-line
* `deps` (**`TaskCallConfig[]`**) — the dependency tasks (if any) that must be run before this task
* `vars` (**`Record<string, string>`**) — the [variables](#vars) defined in this task
* `steps` (**`StepConfig[]`**) — the steps this task executes when run

# Variables (`Record<string, string>`) {#vars}

Variables are a collection of name/value pairs, allowing for some parameterization and customization.  They can be defined in each task or for an entire project, and referenced within a task's steps as environment variables.

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
