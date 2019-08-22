"""
Simple logging :class:`logging.Handler` which buffers the last `tail_size` entries into a globally
accessible location so that the logging API can access and send it to clients easily. This works because
our server is supposed to run on a single process.
"""
from logging import Handler

_buffer = []
_index = 0


class TailHandler(Handler):
    def __init__(self, tail_size):
        super().__init__()
        self.tail_size = tail_size

    def emit(self, record):
        try:
            global _index
            msg = self.format(record)
            if len(_buffer) < self.tail_size:
                _buffer.append(msg)
            else:
                _buffer[_index] = msg
            _index = (_index + 1) % self.tail_size
        except Exception:
            self.handleError(record)


def tail():
    return _buffer[_index:-1] + _buffer[0:_index]
