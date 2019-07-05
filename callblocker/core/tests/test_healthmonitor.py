import asyncio
from threading import Thread

from callblocker.core.healthmonitor import HealthMonitor


def test_notifies_thread_death():
    mon = HealthMonitor()

    def bad_code():
        raise Exception('Oops, I am dead!')

    def good_code():
        pass

    ts = [
        mon.thread(name='bad 1', target=bad_code),
        mon.thread(name='good 1', target=good_code),
        mon.thread(name='bad 2', target=bad_code)
    ]

    for t in ts:
        t.start()

    for t in ts:
        t.join()

    reference = [
        True, False, True
    ]

    for t, r in zip(ts, reference):
        status = mon.status[id(t)]
        assert (status.exception is not None) == r, status.name
        if status.exception:
            assert status.exception.args[0] == 'Oops, I am dead!'


def test_notifies_coroutine_death():
    mon = HealthMonitor()
    loop = asyncio.new_event_loop()

    async def bad_code():
        await asyncio.sleep(1)
        raise Exception('Oops, I am dead!')

    async def good_code():
        await asyncio.sleep(1)

    fs = [
        mon.run_coroutine_threadsafe(bad_code(), 'bad 1', loop),
        mon.run_coroutine_threadsafe(good_code(), 'bad 2', loop),
        mon.run_coroutine_threadsafe(bad_code(), 'bad 1', loop)
    ]

    t = Thread(target=loop.run_forever, daemon=True)
    t.start()

    for f in fs:
        try:
            f.result()
        except Exception as ex:
            assert ex.args[0] == 'Oops, I am dead!'

    reference = [
        True, False, True
    ]

    for f, r in zip(fs, reference):
        status = mon.status[id(f)]
        assert (status.exception is not None) == r, status.name
