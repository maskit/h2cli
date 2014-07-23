Configuration Reference
=======================

Configurations:

.. toctree::
   :maxdepth: 1

HTTP/2
------

http2.auto_preface
~~~~~~~~~~~~~~~~~~

**Type:** INT

**Default:** 1

+--------+------------------------------------------+
| Value  | Effect                                   |
+========+==========================================+
| 0      | Send HTTP/2 PREFACE automatically.       |
+--------+------------------------------------------+
| 1      | Don't send HTTP/2 PREFACE automatically. |
+--------+------------------------------------------+

http2.auto_ack
~~~~~~~~~~~~~~

**Type:** INT

**Default:** 1

+--------+-------------------------------+
| Value  | Effect                        |
+========+===============================+
| 0      | Send ACK automatically.       |
+--------+-------------------------------+
| 1      | Don't send ACK automatically. |
+--------+-------------------------------+

HPACK
-----

hpack.use_huffman
~~~~~~~~~~~~~~~~~

**Type:** INT

**Default:** 1

+--------+-------------------------------------+
| Value  | Effect                              |
+========+=====================================+
| 0      | Never use huffman encoding.         |
+--------+-------------------------------------+
| 1      | Use huffman encoding appropriately. |
+--------+-------------------------------------+
| 2      | Always use huffman encoding.        |
+--------+-------------------------------------+

Log
---

log.frame_sent
~~~~~~~~~~~~~~

log.frame_received
~~~~~~~~~~~~~~~~~~
