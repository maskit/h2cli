.PHONY: test

test:
	mocha --reporter list

test-coverage:
	mocha --require blanket --reporter html-cov 

test-coveralls:
	mocha --require blanket --reporter mocha-lcov-reporter | coveralls
