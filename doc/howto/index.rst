How-To
=======

How to send a GET/HEAD request
------------------------------

You can send a GET request with :command:`get` command.
You can also specify a authority.

Samples:
* :command:`get /`
* :command:`get /index.html`
* :command:`get //example.com/`
* :command:`get //example.com/index.html`

How to send a POST request
--------------------------

You can send a POST request with :command:`post` command.

Samples:
* :command:`post / xxx`
* :command:`post /comment xxx`
* :command:`post //example.com/ xxx`
* :command:`post //example.com/comment xxx`

How to configure default settings
---------------------------------

h2cli reads settings from ~/.h2cli/config .

::

  {
    "log.frame_sent": 1
  }

How to create a prepared frame data
-----------------------------------

You can create a frame data with Node.js' REPL. It's not so difficult.

May the tab completion be with you.

::

  $ node
  > h2cli = require('h2cli');
  > frame = new h2cli.frame.Http2SettingsFrame();
  { buf: <Buffer 00 00 04 00 00 00 00 00> }
  > frame.setParam(h2cli.frame.Http2SettingsFrame.PARAM_SETTINGS_ENABLE_PUSH, 1);
  undefined
  > h2cli.util.saveFrame(frame, 'somewhere/foo.frame');
  undefined

How to add a custom command
------------------------------

h2cli reads commands from ~/.h2cli/cmd/ .

