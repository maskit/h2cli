h2cli
=====

A command line interface for HTTP/2

How to use
----------
[npm package](https://www.npmjs.org/package/h2cli) is available.
```
$ npm  install h2cli
$ h2cli
```


Documents
---------

The [documents](http://h2cli.readthedocs.org/en/latest/) are on Read the Docs.


Status
------

[![Build Status](https://travis-ci.org/maskit/h2cli.svg?branch=master)](https://travis-ci.org/maskit/h2cli)
[![Coverage Status](https://coveralls.io/repos/maskit/h2cli/badge.svg?branch=master&service=github)](https://coveralls.io/github/maskit/h2cli?branch=master)
[![Code Climate](https://codeclimate.com/github/maskit/h2cli.png)](https://codeclimate.com/github/maskit/h2cli)

- HTTP/2
    - Stream priority is not implemented yet.
    - No error handlings.
- Source code
    - Smells bad.


What is this for?
-----------------

I developed it just for fun, but it would be useful for debugging your HTTP/2 implementation, for understanding HTTP/2 protocols, etc.

It works like this.

```
$ h2cli
h2> connect https://twitter.com/
Connecting to twitter.com:443
NPN Protocol: h2-13
h2> send settings
SEND[0]: [Lenght: 0, Type: SETTINGS(4), Flags: 0, StreamID: 0]
RECV[0]: [Lenght: 0, Type: SETTINGS(4), Flags: 1, StreamID: 0]
 Flags: ACK
RECV[0]: [Lenght: 6, Type: SETTINGS(4), Flags: 0, StreamID: 0]
 Params:
  SETTINGS_MAX_CONCURRENT_STREAMS: 100
SEND[0]: [Lenght: 0, Type: SETTINGS(4), Flags: 1, StreamID: 0]
 Flags: ACK

h2> head /
SEND[1]: [Lenght: 35, Type: HEADERS(1), Flags: 5, StreamID: 1]
 Flags: END_STREAM | END_HEADERS
STATE CHANGE[1]: IDLE -> HARF CLOSED (LOCAL)
RECV[1]: [Lenght: 679, Type: HEADERS(1), Flags: 5, StreamID: 1]
 Flags: END_STREAM | END_HEADERS
STATE CHANGE[1]: HARF CLOSED (LOCAL) -> CLOSED
[ [ ':status', '200' ],
  [ 'cache-control',
    'no-cache, no-store, must-revalidate, pre-check=0, post-check=0' ],
  [ 'content-length', '54506' ],
  [ 'content-type', 'text/html;charset=utf-8' ],
  [ 'date', 'Sun, 13 Jul 2014 06:33:46 GMT' ],
  [ 'expires', 'Tue, 31 Mar 1981 05:00:00 GMT' ],
  [ 'last-modified', 'Sun, 13 Jul 2014 06:33:46 GMT' ],
  [ 'ms', 'S' ],
  [ 'pragma', 'no-cache' ],
  [ 'server', 'tfe' ],
  [ 'set-cookie',
    'goth=1\u0000_twitter_sess=BAh7CSIKZmxhc2hJQzonQWN0aW9uQ29udHJvbGxlcjo6Rmxhc2g6OkZsYXNo%250ASGFzaHsABjoKQHVzZWR7ADoPY3JlYXRlZF9hdGwrCN9kbS5HAToMY3NyZl9p%250AZCIlMDM1NjdiNmI1OGRlOTEyYWUzYWU0NmE5OWVhZGU0ZmE6B2lkIiVlZjgy%250ANGNjN2QwM2QwMDcyZDA2ZTk5MDg4MzhmOWFiOA%253D%253D--64b935a3b1fa311d4a231a03b19a9c407d6d9669; Path=/; Domain=.twitter.com; Secure; HTTPOnly\u0000guest_id=v1%3A140523322695692534; Domain=.twitter.com; Path=/; Expires=Tue, 12-Jul-2016 06:33:46 UTC' ],
  [ 'status', '200 OK' ],
  [ 'strict-transport-security', 'max-age=631138519' ],
  [ 'x-content-type-options', 'nosniff' ],
  [ 'x-frame-options', 'SAMEORIGIN' ],
  [ 'x-transaction', '3f579f2a1c22c94b' ],
  [ 'x-ua-compatible', 'IE=edge,chrome=1' ],
  [ 'x-xss-protection', '1; mode=block' ] ]
h2> show s
settings  streams

h2> show streams
Stream #0, State: IDLE, Bytes Sent: 16, Bytes Received: 22
Stream #1, State: CLOSED, Bytes Sent: 43, Bytes Received: 687
h2> 
```
