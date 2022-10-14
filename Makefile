.PHONY: test coverage clean

help:
	@echo "test ..................... Tests the project"
	@echo "coverage ................. Tests with coverage reporting"
	@echo "clean .................... Cleans intermediates"

clean:
	git clean -dfx .

test:
	deno test

coverage:
	deno test --coverage=coverage/.profile
	deno coverage --exclude='(test/deps\.ts)|(test\.(js|mjs|ts|jsx|tsx))$$' --lcov --output=coverage/.lcov coverage/.profile
	genhtml --output-directory=coverage coverage/.lcov
