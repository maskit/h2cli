.PHONY: test

test:
	mocha --require blanket --reporter json-cov 
