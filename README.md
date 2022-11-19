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
root: true      # denotes this as the "root" in a multi-project layout
default: help   # the default target if none is specified

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
* Within a project, accessible to any target within that project
* Within a project's parent/ancestor, accessible to any target within the current project
* As an operating system environment variable, accessible to any target in any project in the execution

Considerations:
* Variables are only resolved within a target's action; they do not apply to any other properties of a target (e.g., dependencies)
* Variables are resolved at the moment a target is executed; if any previous target modifies a variable before the current target is executed, that variable's new value is used

# How it Works

1. Initialize
    1. capture environment variables
    2. Read project configuration from current directory ("current project")
        * if not found; ascend directories until a project configuration is found
    3. ascend directories until "root" project configuration is found ("root project")
        * if no explicit root is found; treat "highest" found project configuration as root
2. Resolve
    1. Build execution chain from requested target(s)
        * if no explicit targets requested, use "default"
        * recursively walk targets' and their dependencies, depth-first in order
    2. remove duplicates
3. Execute
    1. Walk resolved execution chain in-order
        1. Wait for Target's dependencies to complete (if any)
        2. Evaluate variables in target's action
        3. execute action within platform's default shell
            * `stderr` is logged
            * `stdout` is captured and logged
        4. record results
            1. if non-zero (0), treat target as failed and end execution
            2. if `output` is specified, update target's owning project's variable with `stdout` contents
4. Report
