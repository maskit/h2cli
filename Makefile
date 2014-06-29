.PHONY: test

test:
	mocha --reporter list

test-coverage: test
	mocha --require blanket --reporter html-cov > coverage.html

test-coveralls: test
	mocha --require blanket --reporter mocha-lcov-reporter | coveralls
