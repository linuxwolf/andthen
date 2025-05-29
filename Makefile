SOURCES=$(shell find src -type f -name '*.ts')
TESTS=$(shell find test -type f -name '*.ts')
CONFIGS=deno.json deno.lock

BINARY_ENTRYPOINT=src/main.ts
BINARY_PERMISSIONS=--allow-read \
	--allow-write \
	--allow-env \
	--allow-run

.PHONY: help test coverage checks check-fmt check-lint compile clean

help:
	@echo "Available targets"
	@echo "  checks ............ run coding checks"
	@echo "   +- check-fmt ..... run code formatting checks"
	@echo "   +- check-lint .... run code linting checks"
	@echo "  test .............. run unit tests"
	@echo "   +- coverage ...... generate coverage reports"
	@echo "  compile ........... compile all binaries"
	@echo "  clean ............. clean up generated outputs"

##### TESTING & COVERAGE #####
test: coverage/report.xml

coverage/report.xml:  $(SOURCES) $(TESTS) $(CONFIGS)
	deno test --clean --junit-path $@ --coverage=coverage test

coverage: coverage/lcov coverage/html
	deno coverage --exclude=test coverage

coverage/lcov: coverage/report.xml
	deno coverage --exclude=test --lcov --output=coverage/lcov coverage

coverage/html: coverage/report.xml
	deno coverage --exclude=test --html coverage

##### CHECKS #####

checks: check-format check-lint

check-fmt:
	deno fmt --check

check-lint:
	deno lint

##### BINARIES #####

compile: target/darwin-aarch64/andthen target/darwin-x86_64/andthen target/linux-aarch64/andthen target/linux-x86_64/andthen

target/darwin-aarch64/andthen: PLATFORM=aarch64-apple-darwin

target/darwin-x86_64/andthen: PLATFORM=x86_64-apple-darwin

target/linux-aarch64/andthen: PLATFORM=aarch64-unknown-linux-gnu

target/linux-x86_64/andthen: PLATFORM=x86_64-unknown-linux-gnu

target/%/andthen: $(SOURCES) $(CONFIGS)
	deno compile $(BINARY_PERMISSIONS) --target=$(PLATFORM) --output=$@ $(BINARY_ENTRYPOINT)

target/andthen: $(SOURCES) $(CONFIGS)
	deno compile $(BINARY_PERMISSIONS) --output=$@ $(BINARY_ENTRYPOINT)

##### CLEANUP #####

clean:
	git clean -dfx .
