import pytest

from callblocker.blocker.telcos import Vivo


@pytest.mark.django_db
def test_parses_vivo_callerid():

    # Area code and number
    provider = Vivo()
    fixed = provider.parse_cid('1131457681')

    assert fixed.area_code == '11'
    assert fixed.number == '31457681'

    mobile = provider.parse_cid('1199627477')

    assert mobile.area_code == '11'
    assert mobile.number == '99627477'

    # Area code, number and provider
    mobile_w_provider = provider.parse_cid('211199627477')

    assert mobile_w_provider.area_code == '11'
    assert mobile_w_provider.number == '99627477'

    fixed_w_provider = provider.parse_cid('211131457681')

    assert fixed_w_provider.area_code == '11'
    assert fixed_w_provider.number == '31457681'

    # Weird provider lengths
    mobile_w_weird_provider = provider.parse_cid('22211199627477')

    assert mobile_w_weird_provider.area_code == '11'
    assert mobile_w_weird_provider.number == '99627477'

    fixed_w_weird_provider = provider.parse_cid('55211131457681')

    assert fixed_w_weird_provider.area_code == '11'
    assert fixed_w_weird_provider.number == '31457681'
