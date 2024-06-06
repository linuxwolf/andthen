# Usage

## Getting Started

### Simple Project

Create a file called `andthen.yaml` in the root directory for your [project](#projects). The `tasks` object defines the [tasks](#tasks) that `andthen` can perform, and the `acts` within a Task defines what happens when that task is invoked:

```yaml
version: "1"

tasks:
  :test:
    acts:
      - deno test -A test
  :build:
    acts:
      - deno compile -o dist/myapp src/main.ts
```
To perform all the actions for the `build` task above;

```bash
$ andthen run :build
```

### Second Project

If `myapp` above is the server portion, with a distinct-but-related client subproject, then organized as such:

```
myapp
+-- client
    +-- src
        +-- ...
    +-- test
        +-- ...
    +-- assets
        +-- ...
    +-- andthen.yaml    # new manifest
+-- server
    +-- src
        +-- ...
    +-- test
        +-- ...
    +-- andthen.yaml    # from above
+-- .gitignore
+-- andthen.yaml        # root manifest
```

Then create a second `andthen.yaml` in the `client` directory:

```yaml
version: "1"

tasks:
  :test:
    acts:
      - npx mocha test
  :build:
    acts:
      - esbuild app.jsx src --outfile=${ANDTHEN_ROOT_DIR}/dist/app.js
```

Update the original `andthen.yaml` (now in the `server` directory):

```yaml
version: "1"

tasks:
  :test:
    acts:
      - deno test -A test
  :build:
    acts:
      - deno compile -o ${ANDTHEN_ROOT_DIR}/dist/myapp src/main.ts
```

Then finally tie them together with a root `andthen.yaml`:

```yaml
version: "1"
root: true

tasks:
  :test:
    deps:
      - server:test
      - client:test
  :build:
    deps:
      - server:test
      - client:test
```

Notice the root tasks have [dependencies](#dependencies) onto the tasks in the `client` and `server` sub-projects.

Now to test and build everything:

```bash
$ andthen run :test :build
```

## Operations

When running `andthen`, one of the following commands must be specified:

* `run`
* `find`
* `help`

The `help` command (without any other options) prints information about `andthen` generally, including availble commands.  Running `andthen help` followed by a command prints information about that specific command, including availble options.

### Executing Tasks (`run`)

The `run` command performs the actions for the specified task or tasks (and all of their dependencies). Tasks are performed in the order listed.

### Finding Tasks (`find`)

The `find` command can locate the rooted path to any and all tasks that can be used with `run`. Tasks are sorted lexigraphically, and each is printed on its own line.

The description for each task (if specified) can be included in the output with `--describe`.  The description is printed on the next line and indented.

#### Filtering by Task Name

To return all the tasks that have a given task-name, specify `--task <NAME>`:

```
andthen find --task :build
```

Every project that defines a task with the provided name is included in the output.  The option can be specified multiple times; the resulting output includes every task that matches at least one of the specified task names.

#### Finding Dependents

To return all the tasks that depend on _any_ task for a given project (by directory path), specify `--depends-on <PATH>`:

```
andthen find --depends-on server
```

Every task that has a [dependency](#dependencies) on the given project is included in the output.

The `--depends-on` path is walked upward until a project is located.  For example, if `--depends-on server/src/main.ts` is provided, it will result in:

1. ignoring `server/src/main.ts` (actually a file)
2. ignoring `server/src` (no project manifest found in this directory)
3. using `server` (project manifest found in this directory)

The option can be specified multiple times; the resulting output includes every tatsk that has a dependncy on at least one task in any of the specified `--depends-on` paths.

To specify several paths at once within a file, specify `--depend-on-file <FILE>`.  Each line is treated as `--depends-on` path.  Each line can end in a comment, which is preceded by `#`:

```
doc
server/doc # this is a comment
# this is a also a comment
client/doc
```

To specify several paths at once via `stdin` (e.g., piping from another program, like `git`), specify `--depends-on-stdin`.  The processing on `stdin` is the as for `--depends-on-file`.

All of the above options can be combined, and any duplicates found removed.  All of the above can be combined with [task name filtering](#filtering-by-task-name) to further filter the resulting paths to any task that depends on a `--depends-on` project that defines the named task(s).

### Finding Manifests

A project's manifest file can be one of the following (in order of preference):

* `andthen.yaml`
* `andthen.yml`
* `.andthen.yaml`
* `.andthen.yml`

If a manifest is not found in the current directory. it will walk up the filesystem tree until one of the above manifest files is found. The working directory for a task's actions is the directory its project's manifest is located in.

Since `andthen` is designed for multiple projects, it will then walk up the filesystem until a manifest with `root: true` is found (i.e., the "root manifest"). If an explicit root manifest is not found, then the manifest found closest to the filesystem root directory is treated as the root manifest.

## Projects

### Defaults

## Tasks

### Paths

### Dependencies

### Inheritance

### Caching

### File Inputs/Outputs

## Actions

### Shell (`shell:`)

### Inherited Actions (`super:`)

## Variables

### Precedence

### Substitution and Interopation

### Special Variables
