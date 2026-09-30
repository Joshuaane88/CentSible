def calc_set_aside(gross, rate):
    """Return how much of gross pay to set aside for taxes.

    rate is a decimal, so 15% is 0.15.
    """
    if gross <= 0:
        return 0
    return round(gross * rate, 2)
