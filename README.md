h2cli
=====

Command line interface for HTTP/2


Status
------
- h2-13 and hpack-08.
- HTTP/2
    - Stream priority is not implemented yet.
    - Server push is not supported yet.
    - No error handlings.
- HPACK
    - Passes all (#00 to 32) test stories in [http2/hpack-test-case](https://github.com/http2jp/hpack-test-case/) with default size of the header table.
    - Maximum Header Table Size Change is not implemented yet.


What is this for?
-----------------

I developed it just for fun, but it would be useful for debugging your HTTP/2 implementation, for understanding HTTP/2 protocols, etc.

It works like this.

```
$ node h2cli.js
h2> connect https://twitter.com/
Connecting to twitter.com:443
NPN Protocol: h2-13
h2> send settings
SEND: [Lenght: 0, Type: SETTINGS(4), Flags: 0, StreamID: 0]
RECV: [Lenght: 0, Type: SETTINGS(4), Flags: 1, StreamID: 0]
 Flags: ACK
RECV: [Lenght: 6, Type: SETTINGS(4), Flags: 0, StreamID: 0]
 Params:
  SETTINGS_MAX_CONCURRENT_STREAMS: 100
SEND: [Lenght: 0, Type: SETTINGS(4), Flags: 1, StreamID: 0]
 Flags: ACK

h2> head /
SEND: [Lenght: 0, Type: HEADERS(1), Flags: 5, StreamID: 1]
 Flags: END_STREAM | END_HEADERS
RECV: [Lenght: 675, Type: HEADERS(1), Flags: 5, StreamID: 1]
 Flags: END_STREAM | END_HEADERS
{ ':status': '200',
  'cache-control': 'no-cache, no-store, must-revalidate, pre-check=0, post-check=0',
  'content-length': '52088',
  'content-type': 'text/html;charset=utf-8',
  date: 'Sun, 22 Jun 2014 08:28:16 GMT',
  expires: 'Tue, 31 Mar 1981 05:00:00 GMT',
  'last-modified': 'Sun, 22 Jun 2014 08:28:16 GMT',
  ms: 'S',
  pragma: 'no-cache',
  server: 'tfe',
  'set-cookie': 'goth=1\u0000_twitter_sess=BAh7CSIKZmxhc2hJQzonQWN0aW9uQ29udHJvbGxlcjo6Rmxhc2g6OkZsYXNo%250ASGFzaHsABjoKQHVzZWR7ADoHaWQiJTM5MTQ4YmZmNWY0NzJjOTI1YTQxM2My%250AOGNlOTE3OWQzOgxjc3JmX2lkIiU0MWQ0Zjc2NzNiMWVhMDNiZDhkYzI1Yzc4%250AMTFiNzg4YjoPY3JlYXRlZF9hdGwrCESssMJGAQ%253D%253D--233322864639b2628e149ee41aa9677cbd5c1165; Path=/; Domain=.twitter.com; Secure; HTTPOnly\u0000guest_id=v1%3A140342569683588235; Domain=.twitter.com; Path=/; Expires=Tue, 21-Jun-2016 08:28:16 ',
  status: '200 OK',
  'strict-transport-security': 'max-age=631138519',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'x-transaction': 'c2d27dc9faf1cb0b',
  'x-ua-compatible': 'IE=edge,chrome=1',
  'x-xss-protection': '1; mode=block' }
h2>
```
