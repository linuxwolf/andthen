# &Then - A Multi-Project Task Runner

&Then ("and then") is yet another a task runner.  It's major difference is awareness of  multi-project setups; you can have tasks in one project that depend on tasks from another.

Key features:
* Specify which task to run using a path-like syntax, with reasonable defaults
* Depend on a task in another project
* Variables with cascading initialization and task updating

## Getting Started  

### Installing

Tee Bee Dee

### Running

Tee Bee Dee

## Defining Project Tasks

A project is defined in a `andthen.yaml` (or `.yml`) file, and consists of (project-level) variables and tasks.

A sample project definition:

```yaml
default: help

vars:
  PROJECT_NAME: "my-project"
  CACHE: ${CACHE:=.cache}

targets:
  -
    name: help
    act: andthen --list
  
  -
    name: clean
    desc: Cleans the project's generated files
    act: git clean -fdx .

  -
    # A hidden task (not listed)
    name: -init-tag
    vars:
      COMMIT: ${COMMIT:=HEAD}
    act: |
      if [[ -n "$TAG" ]]; then
        echo "${TAG}"
      elif [[ -z "$CI" ]] ; then
        git rev-list -n 1 "${COMMIT}" -- .
      else
        echo "latest"
      fi
    output: TAG

  - 
    name: init
    desc: Initializes the build environment for ${PROJECT_NAME}
    deps:
      - ../common-utils:init-cache  # Externl task that uses this project's variable ${CACHE}!
      - -init-tag

  - 
    name: build
    desc: Builds ${PROJECT_NAME}
    deps:
      - init
    act: docker build -t ${TAG} .
```
# Key Concepts

## Variables

&then's parameterization is through variables.  A variable is a string key and string value.  Variables can be defined at the following levels (and in the following precedence order):

* Within a target, accessible within only that target's action
* Within a project, accessible to any target within that project, and overridden if defined on the task
* As an operating system environment variable, accessible to any target in any project in the execution, and overridden if defined in a project or on a task

