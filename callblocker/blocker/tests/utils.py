import os


def read_data(name) -> bytes:
    with open(os.path.join(os.path.dirname(__file__), name), 'rb') as infile:
        return infile.read()
